import { createServer } from './server.js';

const envNames = [
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'AWS_REGION',
  'AWS_S3_BUCKET',
];

if (process.env.NODE_ENV !== 'production') {
  (await import('dotenv')).config();
}

envNames.forEach((envName) => {
  if (!process.env[envName]) {
    throw new Error(`${envName} environment variable required`);
  }
});

const server = createServer([
  {
    url: '/posts',
    router: (await import('./routes/post.js')).router,
  },
]);

const port = +(process.env.PORT || 3000);
server.listen(port, () => console.log(`API server listening on port ${port}`));
