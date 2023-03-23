import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Request, Router } from 'express';
import multer from 'multer';
import {
  CreatePostRequestBody,
  PgCreatePostRequest,
  Post,
  PostCategory,
} from 'prestonmontewest-entities';

import { HttpError } from '../classes/http-error.js';
import { jwtCheck } from '../middleware/auth.js';
import { PgRepo } from '../repos/pg.repo.js';

const s3Region = process.env.AWS_REGION;
const s3Client = new S3Client({ region: s3Region });
const s3Bucket = process.env.AWS_S3_BUCKET;
const s3PostFolder = process.env.AWS_S3_POST_FOLDER;
const s3HostnamePostPath = `https://${s3Bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3PostFolder}`;

export const router = Router();
const fileUpload = multer();
const pgRepo = PgRepo.instance;

function urlDecode(value: string): string {
  return titleCase(value.replace(/-/g, ' '));
}

function titleCase(value: string): string {
  const values = value.toLowerCase().split(' ');
  for (let i = 0; i < values.length; i++) {
    values[i] = values[i].charAt(0).toUpperCase() + values[i].slice(1);
  }
  return values.join(' ');
}

async function getPost(
  title: string,
  decode = true
): Promise<Post | undefined> {
  if (decode) {
    title = urlDecode(title);
  }
  const result = await pgRepo.pool.query(
    'select * from post where title = $1;',
    [title]
  );
  return result.rows[0] && pgRepo.map<Post>(result.rows[0]);
}

router.get('/:postTitle', async (req, res, next) => {
  try {
    const post = await getPost(req.params.postTitle);
    if (!post) {
      throw new HttpError('No post found with that title', 404);
    }
    res.send(post);
  } catch (err) {
    next(err);
  }
});

router.get('/', async (req, res, next) => {
  try {
    let statement = 'select * from post';
    const params: (string | number)[] = [];
    const title = req.query.title;
    if (title !== undefined) {
      if (typeof title !== 'string' || !title) {
        throw new HttpError('Title must be a nonempty string', 400);
      }

      params.push(`%${title}%`);
      statement += ' where title ilike $1';
    }

    const limit = Number(req.query.limit);
    if (req.query.limit !== undefined) {
      if (!Number.isInteger(limit) || limit <= 0) {
        throw new HttpError('Limit must be a positive integer', 400);
      }

      params.push(limit);
      statement += ' limit $2';
    }

    statement += ';';

    const result = await pgRepo.pool.query(statement, params);
    const posts = result.rows.map((row) => pgRepo.map<Post>(row));
    res.send(posts);
  } catch (err) {
    next(err);
  }
});

async function validatePost(
  req: Request
): Promise<[CreatePostRequestBody, Express.Multer.File]> {
  if (!req.file) {
    throw new HttpError('File is required', 400);
  }

  const file = req.file;
  const body = req.body;

  body.title = typeof body.title === 'string' ? body.title.trim() : '';
  if (!body.title) {
    throw new HttpError('Title must be a nonempty string', 400);
  }
  // Store in database as title case
  body.title = titleCase(body.title);
  // Error out if post already exists
  const existingPost = await getPost(body.title, false);
  if (existingPost) {
    throw new HttpError('Post already exists', 400);
  }

  body.summary = typeof body.summary === 'string' ? body.summary.trim() : '';
  if (!body.summary) {
    throw new HttpError('Summary must be a nonempty string', 400);
  }

  body.content = typeof body.content === 'string' ? body.content.trim() : '';
  if (!body.content) {
    throw new HttpError('Content must be a nonempty string', 400);
  }

  if (file.mimetype.split('/')[0] !== 'image') {
    throw new HttpError('File must be an image', 400);
  }

  return [body, file];
}

const singleImage = fileUpload.single('image');
router.post('/', jwtCheck, singleImage, async (req, res, next) => {
  try {
    if (!req.auth?.payload?.sub) {
      throw new HttpError('Unauthorized', 401);
    }

    const [body, file] = await validatePost(req);

    await s3Client.send(
      new PutObjectCommand({
        Bucket: s3Bucket,
        Key: `${s3PostFolder}/${file.originalname}`,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'public-read',
      })
    );

    const post: PgCreatePostRequest = {
      title: body.title,
      summary: body.summary,
      content: body.content,
      category: PostCategory.programming,
      image_url: `${s3HostnamePostPath}/${file.originalname}`,
      created_by: req.auth.payload.sub,
    };

    const createdPost = await pgRepo.callFunction<PgCreatePostRequest, Post>(
      'create_post',
      post
    );

    res.send(createdPost);
  } catch (err) {
    next(err);
  }
});
