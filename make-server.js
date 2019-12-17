const morgan = require('morgan');

function makeServer(middleware) {
  const express = require('express');
  const app = express();
  const port = 3000;

  app.use(morgan('tiny'));
  app.use(express.json());

  for (let tuple of middleware) {
    app.use(...tuple);
  }

  app.listen(port, () => console.log(`DynamoDB API listening on port ${port}`));
  return app;
}

module.exports = makeServer;
