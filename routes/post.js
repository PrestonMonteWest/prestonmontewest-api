const express = require('express');
const router = express.Router();

const _ = require('lodash');
const moment = require('moment');
const AWS = require('aws-sdk');

const docClient = new AWS.DynamoDB.DocumentClient();
const tableName = 'Post';


router.get('/', async (req, res) => {
  const posts = [];
  const limit = req.query.limit;
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
});

router.put('/', (req, res, next) => {
  const body = req.body;
  if (!_.isString(body.title)) {
    throw new Error('title must be a string');
  }
  if (!_.isString(body.content)) {
    throw new Error('content must be a string');
  }

  const post = {
    Title: body.title,
    PublishDate: moment().toISOString(),
    Content: body.content
  };
  const params = {
    TableName: tableName,
    Item: post
  };
  docClient.put(params, (err) => {
    if (err) {
      next(err);
      return;
    }
    res.send(post);
  });
});


module.exports = router;
