import 'reflect-metadata';
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

  initServer([
    {
      url: '/post',
      getRouter: (await import('./routes/post')).default
    }
  ]);
})();
