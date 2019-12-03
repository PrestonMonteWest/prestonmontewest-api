const express = require('express');
const router = express.Router();

const AWS = require('aws-sdk');
const fs = require('fs');
let credentials = fs.readFileSync('credentials.json').toString('utf-8');
credentials = JSON.parse(credentials);

AWS.config.update(credentials);
const docClient = new AWS.DynamoDB.DocumentClient();
const tableName = 'Post';


router.get('/', (req, res) => {
  const params = {
    TableName: tableName
  };

  docClient.scan(params, (err, data) => {
    if (err) {
      console.error(err);
      res.status(500).send(err);
      return;
    }

    res.send(data.Items);
  });
});

router.put('/', (req, res) => {
  // TODO: Get actual datetime.
  const post = {
    Title: req.body.title,
    PublishDate: '2019-12-03T14:48:32.000Z',
    Content: req.body.content
  };

  const params = {
    TableName: tableName,
    Item: post
  };

  docClient.put(params, (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).send(err);
      return;
    }

    res.send(post);
  });
});


module.exports = router;
