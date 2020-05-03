import {
  AttributeMap,
  AttributeValue,
  DocumentClient,
  GetItemInput,
  GetItemOutput,
  Key,
  PutItemInput,
  ScanInput,
  ScanOutput
} from 'aws-sdk/clients/dynamodb';
import S3 from 'aws-sdk/clients/s3';
import { Request, Response, Router } from 'express';
import jwtAuthz from 'express-jwt-authz';
import { isString, isUndefined } from 'lodash';
import moment from 'moment';
import multer from 'multer';
import { Post, HttpError } from '../classes';
import { checkJwt } from '../middleware';

const docClient: DocumentClient = new DocumentClient();
const tableName: string = process.env.AWS_DYNAMODB_TABLE as string;

const s3Client: S3 = new S3();
const s3Bucket: string = process.env.AWS_S3_BUCKET as string;
const s3BucketPostPath: string = `${s3Bucket}/post`;
const awsRegion: string = process.env.AWS_REGION as string;
const s3Hostname: string = `https://${s3Bucket}.s3.${awsRegion}.amazonaws.com`;
const s3HostnamePostPath: string = `${s3Hostname}/post`;

const fileUpload = multer();

function urlDecode(value: string): string {
  return titleCase(value.replace(/-/g, ' '));
}

function titleCase(value: string): string {
  const values: string[] = value.toLowerCase().split(' ');
  for (let i: number = 0; i < values.length; i++) {
    values[i] = values[i].charAt(0).toUpperCase() + values[i].slice(1);
  }
  return values.join(' ');
}

async function getPost(
  title: string,
  decode: boolean = true
): Promise<AttributeMap | undefined> {
  if (decode) {
    title = urlDecode(title);
  }
  const params: GetItemInput = {
    Key: {
      title: (title as AttributeValue)
    },
    TableName: tableName
  };
  const data: GetItemOutput = await docClient.get(params).promise();
  return data.Item;
}

export const router: Router = Router();

router.get('/:postTitle', async (req: Request, res: Response) => {
  const post = await getPost(req.params.postTitle);
  if (isUndefined(post)) {
    throw new HttpError('No post found with that title', 404);
  }
  res.send(post);
});

router.get('/', async (req: Request, res: Response) => {
  const posts: any[] = [];
  const limit: number = +req.query.limit;
  if (req.query.limit && (!Number.isInteger(limit) || limit <= 0)) {
    throw new HttpError('Limit must be a positive integer', 400);
  }
  const params: ScanInput = { TableName: tableName };
  const title: string = req.query.title as string;
  if (title) {
    params.ExpressionAttributeValues = {
      ':t': (titleCase(title) as AttributeValue)
    };
    params.FilterExpression = 'contains(title, :t)';
  }
  if (limit) params.Limit = limit;

  let data: ScanOutput = await docClient.scan(params).promise();
  let lastKey: Key | undefined = data.LastEvaluatedKey;
  posts.push(...(data.Items as any[]));
  while ((limit && posts.length < limit && lastKey) || (!limit && lastKey)) {
    if (limit) params.Limit = limit - posts.length;
    params.ExclusiveStartKey = lastKey;
    data = await docClient.scan(params).promise();
    lastKey = data.LastEvaluatedKey;
    posts.push(...(data.Items as any[]));
  }

  res.send(posts);
});

async function validatePost(post: Post) {
  post.title = isString(post.title) ? post.title.trim() : '';
  if (!post.title) {
    throw new HttpError('Title must be a nonempty string', 400);
  }
  // Store in DynamoDB as title case
  post.title = titleCase(post.title);
  // Error out if post already exists
  const existingPost = await getPost(post.title, false);
  if (existingPost) {
    throw new HttpError('Post already exists', 400);
  }

  post.summary = isString(post.summary) ? post.summary.trim() : '';
  if (!post.summary) {
    throw new HttpError('Summary must be a nonempty string', 400);
  }

  post.content = isString(post.content) ? post.content.trim() : '';
  if (!post.content) {
    throw new HttpError('Content must be a nonempty string', 400);
  }

  if (post.image.mimetype.split('/')[0] !== 'image') {
    throw new HttpError('File must be an image', 400);
  }
}

const checkCreate = jwtAuthz([ 'create:post' ]);
const singleImage = fileUpload.single('image');
router.post(
  '/',
  checkJwt,
  checkCreate,
  singleImage,
  async (req: Request, res: Response) => {
    const body: Post = req.body;
    body.image = req.file;
    await validatePost(body);

    await s3Client.putObject({
      Bucket: s3BucketPostPath,
      Key: body.image.originalname,
      Body: body.image.buffer,
      ContentType: body.image.mimetype,
      ACL: 'public-read'
    }).promise();

    const imageUrl = `${s3HostnamePostPath}/${body.image.originalname}`;
    const post: any = {
      title: body.title,
      publishDate: moment().toISOString(),
      content: body.content,
      summary: body.summary,
      image: imageUrl
    };
    const params: PutItemInput = {
      TableName: tableName,
      Item: post
    };
    await docClient.put(params).promise();
    res.send(post);
  }
);
