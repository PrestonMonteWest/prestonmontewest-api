require('dotenv').config();

if (!process.env.AWS_ACCESS_KEY_ID) {
  throw new Error('access key Id required');
}

if (!process.env.AWS_SECRET_ACCESS_KEY) {
  throw new Error('secret access key required');
}

if (!process.env.AWS_REGION) {
  throw new Error('region required');
}

const postRouter = require('./routes/post');
require('./make-server')([
  ['/post', postRouter]
]);
