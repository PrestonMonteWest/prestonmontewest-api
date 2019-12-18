require('dotenv').config();

if (!process.env.AWS_ACCESS_KEY_ID) {
  throw new Error('AWS_ACCESS_KEY_ID environment variable required');
}

if (!process.env.AWS_SECRET_ACCESS_KEY) {
  throw new Error('AWS_SECRET_ACCESS_KEY environment variable required');
}

if (!process.env.AWS_REGION) {
  throw new Error('AWS_REGION environment variable required');
}

const postRouter = require('./routes/post');
require('./make-server')([
  ['/post', postRouter]
]);
