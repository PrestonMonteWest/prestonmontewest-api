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
  res.status(err.status || 500).json({
    name: err.name,
    message: err.message,
    status: err.status,
  });
}

function urlDecode(value) {
  return titleCase(value.replace(/-/g, ' '));
}

function titleCase(value) {
  const values = value.toLowerCase().split(' ');
  for (var i = 0; i < values.length; i++) {
    values[i] = values[i].charAt(0).toUpperCase() + values[i].slice(1);
  }
  return values.join(' ');
}

router.get('/:postTitle', async (req, res) => {
  try {
    const postTitle = urlDecode(req.params.postTitle);
    const params = {
      Key: {
        title: postTitle,
      },
      TableName: tableName,
    };

    const data = await docClient.get(params).promise();
    if (_.isUndefined(data.Item)) {
      sendError(res, new HttpError('no post found with that title', 404))
    }

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
    const params = { TableName: tableName };
    const title = req.query.title;
    if (title) {
      params.ExpressionAttributeValues = { ':t': title.toLowerCase() };
      params.FilterExpression = 'contains(searchTitle, :t)';
    }
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
    body.title = body.title.trim();
    body.content = body.content.trim();
    if (!_.isString(body.title) || body.title.length === 0) {
      throw new HttpError('title must be a nonempty string', 400);
    }
    if (!_.isString(body.content) || body.content.length === 0) {
      throw new HttpError('content must be a nonempty string', 400);
    }
    // Store in DynamoDB as title case.
    body.title = titleCase(body.title);

    const post = {
      title: body.title,
      searchTitle: body.title.toLowerCase(),
      publishDate: moment().toISOString(),
      content: body.content,
    };
    if (body.image) {
      post.image = body.image;
    }

    const params = {
      TableName: tableName,
      Item: post,
    };

    await docClient.put(params).promise();

    res.send(post);
  } catch (err) {
    sendError(res, err);
  }
});

module.exports = router;
