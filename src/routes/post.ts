import {
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

export const router: Router = Router();

router.get('/:postTitle', async (req: Request, res: Response): Promise<void> => {
  try {
    const postTitle: string = urlDecode(req.params.postTitle);
    const params: GetItemInput = {
      Key: {
        title: (postTitle as AttributeValue)
      },
      TableName: tableName
    };
    const data: GetItemOutput = await docClient.get(params).promise();
    if (isUndefined(data.Item)) {
      throw new HttpError('no post found with that title', 404);
    }

    res.send(data.Item);
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
    body.title = body.title.trim();
    body.content = body.content.trim();
    if (!isString(body.title) || body.title.length === 0) {
      throw new HttpError('title must be a nonempty string', 400);
    }
    if (!isString(body.content) || body.content.length === 0) {
      throw new HttpError('content must be a nonempty string', 400);
    }
    // Store in DynamoDB as title case
    body.title = titleCase(body.title);

    const post: any = {
      title: body.title,
      searchTitle: body.title.toLowerCase(),
      publishDate: moment().toISOString(),
      content: body.content
    };
    if (body.image) {
      post.image = body.image;
    }

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
