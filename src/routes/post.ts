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
import { parse, UrlWithParsedQuery } from 'url';
import { request } from 'http';

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

router.put('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const body: any = req.body;
    body.title = isString(body.title) ? body.title.trim() : '';
    if (body.title.length === 0) {
      throw new HttpError('title must be a nonempty string', 400);
    }
    body.content = isString(body.content) ? body.content.trim() : '';
    if (body.content.length === 0) {
      throw new HttpError('content must be a nonempty string', 400);
    }

    if (!isString(body.image)) {
      throw new HttpError('image must be a nonempty url', 400);
    }
    const url: UrlWithParsedQuery = parse(body.image, true);

    // Store in DynamoDB as title case
    body.title = titleCase(body.title);
    // Error out if post already exists
    const existingPost = await getPost(body.title, false);
    if (existingPost) {
      throw new HttpError('post already exists', 400);
    }

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
