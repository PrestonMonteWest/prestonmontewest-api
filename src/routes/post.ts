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
import { Request, Response, Router } from 'express';
import { isString, isUndefined } from 'lodash';
import moment from 'moment';
import { OptionsWithUri } from 'request';
import { default as rp } from 'request-promise';
import { Post } from '../classes/post';

const docClient: DocumentClient = new DocumentClient();
const tableName: string = 'Post';

class HttpError extends Error {
  constructor(message: string, public status: number = 500) {
    super(message);
    this.name = HttpError.name;
  }
}

function sendError(res: Response, err: HttpError): void {
  console.error(err);
  res.status(err.status || 500).json({
    name: err.name,
    message: err.message,
    status: err.status
  });
}

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
): Promise<AttributeMap> {
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

router.get('/:postTitle', async (req: Request, res: Response): Promise<void> => {
  try {
    const post = await getPost(req.params.postTitle);
    if (isUndefined(post)) {
      throw new HttpError('no post found with that title', 404);
    }
    res.send(post);
  } catch (err) {
    sendError(res, err);
  }
});

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const posts: any[] = [];
    const limit: number = +req.query.limit;
    if (req.query.limit && (!Number.isInteger(limit) || limit <= 0)) {
      throw new HttpError('limit must be a positive integer', 400);
    }
    const params: ScanInput = { TableName: tableName };
    const title: string = req.query.title;
    if (title) {
      params.ExpressionAttributeValues = {
        ':t': (title.toLowerCase() as AttributeValue)
      };
      params.FilterExpression = 'contains(searchTitle, :t)';
    }
    if (limit) params.Limit = limit;

    let data: ScanOutput = await docClient.scan(params).promise();
    let lastKey: Key = data.LastEvaluatedKey;
    posts.push(...(data.Items as any[]));
    while ((limit && posts.length < limit && lastKey) || (!limit && lastKey)) {
      if (limit) params.Limit = limit - posts.length;
      params.ExclusiveStartKey = lastKey;
      data = await docClient.scan(params).promise();
      lastKey = data.LastEvaluatedKey;
      posts.push(...(data.Items as any[]));
    }

    res.send(posts);
  } catch (err) {
    sendError(res, err);
  }
});

async function validatePost(post: Post): Promise<void> {
  post.title = isString(post.title) ? post.title.trim() : '';
  if (!post.title) {
    throw new HttpError('title must be a nonempty string', 400);
  }
  // Store in DynamoDB as title case
  post.title = titleCase(post.title);
  // Error out if post already exists
  const existingPost = await getPost(post.title, false);
  if (existingPost) {
    throw new HttpError('post already exists', 400);
  }

  post.summary = isString(post.summary) ? post.summary.trim() : '';
  if (!post.summary) {
    throw new HttpError('summary must be a nonempty string', 400);
  }

  post.content = isString(post.content) ? post.content.trim() : '';
  if (!post.content) {
    throw new HttpError('content must be a nonempty string', 400);
  }

  post.image = isString(post.image) ? post.image.trim() : '';
  if (!post.image) {
    throw new HttpError('image must be a nonempty url', 400);
  }
  const options: OptionsWithUri = {
    uri: post.image,
    method: 'HEAD'
  };
  let response;
  try {
    response = await rp(options);
  } catch (err) {
    throw new HttpError('image url is invalid', 400);
  }
  const mimeType = response['content-type'].split('/')[0];
  if (mimeType !== 'image') {
    throw new HttpError('url does not point to an image', 400);
  }
}

router.put('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const body: Post = req.body;
    await validatePost(body);
    const post: any = {
      title: body.title,
      searchTitle: body.title.toLowerCase(),
      publishDate: moment().toISOString(),
      content: body.content,
      summary: body.summary,
      image: body.image
    };

    const params: PutItemInput = {
      TableName: tableName,
      Item: post
    };

    await docClient.put(params).promise();
    res.send(post);
  } catch (err) {
    sendError(res, err);
  }
});
