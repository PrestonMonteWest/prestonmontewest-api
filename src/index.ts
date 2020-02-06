import { config } from 'dotenv';

import initServer from './init-server';
import postRouter from './routes/post';

if (process.env.NODE_ENV !== 'production') config();

// Possibly load env vars manually

if (!process.env.AWS_ACCESS_KEY_ID) {
  throw new Error('AWS_ACCESS_KEY_ID environment variable required');
}

if (!process.env.AWS_SECRET_ACCESS_KEY) {
  throw new Error('AWS_SECRET_ACCESS_KEY environment variable required');
}

if (!process.env.AWS_REGION) {
  throw new Error('AWS_REGION environment variable required');
}

initServer([
  {
    url: '/post',
    router: postRouter
  }
]);
