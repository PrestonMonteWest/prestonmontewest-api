import 'reflect-metadata';
import { createConnection, getConnectionOptions } from 'typeorm';
import { Post } from './entities';
import { initServer } from './init-server';

const envNames: string[] = [
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'AWS_REGION',
  'AWS_S3_BUCKET'
];

(async () => {
  if (process.env.NODE_ENV !== 'production') {
    (await import('dotenv')).config();
  }

  envNames.forEach((envName) => {
    if (!process.env[envName]) {
      throw new Error(`${envName} environment variable required`);
    }
  });

  const baseOptions = await getConnectionOptions();
  await createConnection({
    ...baseOptions,
    "entities": [
      Post
    ],
  });

  initServer([
    {
      url: '/post',
      router: (await import('./routes/post')).router
    }
  ]);
})();
