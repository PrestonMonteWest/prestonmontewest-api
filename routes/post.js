const express = require('express');
const router = express.Router();

const _ = require('lodash');
const moment = require('moment');
const AWS = require('aws-sdk');

const docClient = new AWS.DynamoDB.DocumentClient();
const tableName = 'Post';


router.get('/', (req, res) => {
  // TODO: add filtering capabilities.
  const params = {
    TableName: tableName
  };
  docClient.scan(params, (err, data, next) => {
    if (err) {
      next(err);
      return;
    }
    res.send(data.Items);
  });
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
