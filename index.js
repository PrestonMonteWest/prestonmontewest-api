require('dotenv').config();
const postRouter = require('./routes/post');
require('./make-server')([
  ['/post', postRouter]
]);
