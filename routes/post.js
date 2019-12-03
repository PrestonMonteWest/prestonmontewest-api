const express = require('express');
const router = express.Router();

const AWS = require('aws-sdk');
const fs = require('fs');
let credentials = fs.readFileSync('credentials.json').toString('utf-8');
credentials = JSON.parse(credentials);

AWS.config.update(credentials);

router.get('/', function(req, res, next) {
  const docClient = new AWS.DynamoDB.DocumentClient();
  const params = {
    TableName: 'Post'
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

module.exports = router;
