const express = require('express');
const app = express();
const port = 3000;

const postRouter = require('./routes/post');
app.use('/post', postRouter);

app.listen(port, () => console.log(`DynamoDB API listening on port ${port}`));
