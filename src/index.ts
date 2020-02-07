import { config } from 'dotenv';
if (process.env.NODE_ENV !== 'production') config();
if (!process.env.AWS_ACCESS_KEY_ID) {
  throw new Error('AWS_ACCESS_KEY_ID environment variable required');
}
if (!process.env.AWS_SECRET_ACCESS_KEY) {
  throw new Error('AWS_SECRET_ACCESS_KEY environment variable required');
}
if (!process.env.AWS_REGION) {
  throw new Error('AWS_REGION environment variable required');
}

import postRouter from './routes/post';
import initServer from './init-server';
initServer([{ url: '/post', router: postRouter }]);
