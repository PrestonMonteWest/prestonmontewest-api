import S3 from 'aws-sdk/clients/s3';
import { Router } from 'express';
import { isString, isUndefined } from 'lodash';
import multer from 'multer';
import { Connection, FindManyOptions } from 'typeorm';
import { HttpError } from '../classes';
import { CreatePostRequest, Post } from '../entities';
import { checkJwt } from '../middleware';

const s3Client: S3 = new S3();
const s3Bucket: string = process.env.AWS_S3_BUCKET as string;
const s3BucketPostPath: string = `${s3Bucket}/post`;
const awsRegion: string = process.env.AWS_REGION as string;
const s3Hostname: string = `https://${s3Bucket}.s3.${awsRegion}.amazonaws.com`;
const s3HostnamePostPath: string = `${s3Hostname}/post`;

const router: Router = Router();
let connection: Connection;
export default function(conn: Connection) {
  connection = conn;
  return router;
}

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
): Promise<Post | undefined> {
  if (decode) {
    title = urlDecode(title);
  }
  return connection.getRepository(Post).findOne({ title });
}

router.get('/:postTitle', async (req, res, next) => {
  try {
    const post = await getPost(req.params.postTitle);
    if (isUndefined(post)) {
      throw new HttpError('No post found with that title', 404);
    }
    res.send(post);
  } catch (err) {
    next(err);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const limit = Number(req?.query?.limit);
    if (req?.query?.limit && (!Number.isInteger(limit) || limit <= 0)) {
      throw new HttpError('Limit must be a positive integer', 400);
    }
    const title = req.query.title as string | undefined;
    const options: FindManyOptions = {};
    if (!Number.isNaN(limit)) {
      options.take = limit;
    }
    if (title) {
      // todo: impl better searching
      options.where = { title };
    }
    const posts = await connection.getRepository(Post).find(options);
    res.send(posts);
  } catch (err) {
    next(err);
  }
});

async function validatePost(post: CreatePostRequest) {
  post.title = isString(post.title) ? post.title.trim() : '';
  if (!post.title) {
    throw new HttpError('Title must be a nonempty string', 400);
  }
  // store in database as title case
  post.title = titleCase(post.title);
  // error out if post already exists
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

const singleImage = fileUpload.single('image');
router.post('/', checkJwt, singleImage, async (req, res, next) => {
  try {
    const body: CreatePostRequest = req.body;
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
    let post: Post | undefined = new Post();
    post.title = body.title;
    post.summary = body.summary;
    post.content = body.content;
    post.image = imageUrl;

    post = await connection.getRepository(Post).save(post);
    res.send(post);
  } catch (err) {
    next(err);
  }
});

// router.patch('/:postTitle/view-count/increment', async (req, res, next) => {
//   try {
//     const existingPost = await getPost(req.params.postTitle);
//     if (isUndefined(existingPost)) {
//       throw new HttpError('No post found with that title', 404);
//     }

//     const params: UpdateItemInput = {
//       TableName: tableName,
//       Key: {
//         title: (existingPost.title as AttributeValue)
//       },
//       UpdateExpression: 'set viewCount = viewCount + :one',
//       ExpressionAttributeValues: {
//         ':one': (1 as AttributeValue)
//       },
//       ReturnValues: 'UPDATED_NEW'
//     };
//     const result = await docClient.update(params).promise();

//     res.send({
//       viewCount: result.Attributes?.viewCount
//     });
//   } catch (err) {
//     next(err);
//   }
// });
