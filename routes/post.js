const express = require('express');
const router = express.Router();

const _ = require('lodash');
const moment = require('moment');
const AWS = require('aws-sdk');

const docClient = new AWS.DynamoDB.DocumentClient();
const tableName = 'Post';


class HttpError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.name = HttpError.name;
    this.status = status;
  }
}

function sendError(res, err) {
  console.error(err);
  res.status(err.status).json({
    name: err.name,
    message: err.message,
    status: err.status,
  });
}

router.get('/:postTitle', async (req, res) => {
  try {
    const postTitle = req.params.postTitle;
    const params = {
      Key: {
        Title: postTitle,
      },
      TableName: tableName,
    };

    const data = await docClient.get(params).promise();

    res.send(data.Item);
  } catch (err) {
    sendError(res, err);
  }
});

router.get('/', async (req, res) => {
  try {
    const posts = [];
    const limit = req.query.limit;
    if (limit && (!Number.isInteger(+limit) || limit <= 0)) {
      throw new HttpError('limit must be a positive integer', 400);
    }
    const params = {
      TableName: tableName,
    };
    if (limit) params.Limit = limit;

    let data = await docClient.scan(params).promise();
    let lastKey = data.LastEvaluatedKey;
    posts.push(...data.Items);
    while ((limit && posts.length < limit && lastKey) || (!limit && lastKey)) {
      if (limit) params.Limit = limit - posts.length;
      params.ExclusiveStartKey = lastKey;
      data = await docClient.scan(params).promise();
      lastKey = data.LastEvaluatedKey;
      posts.push(...data.Items)
    }

    res.send(posts);
  } catch (err) {
    sendError(res, err);
  }
});

router.put('/', async (req, res, next) => {
  try {
    const body = req.body;
    if (!_.isString(body.title)) {
      throw new HttpError('title must be a string', 400);
    }
    if (!_.isString(body.content)) {
      throw new HttpError('content must be a string', 400);
    }

    const post = {
      title: body.title,
      publishDate: moment().toISOString(),
      content: body.content
    };
    const params = {
      TableName: tableName,
      Item: post
    };

    await docClient.put(params).promise();

    res.send(post);
  } catch (err) {
    sendError(res, err);
  }
});


module.exports = router;
