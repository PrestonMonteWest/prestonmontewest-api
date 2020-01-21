const morgan = require('morgan');

function makeServer(middleware) {
  const express = require('express');
  const app = express();

  app.use(morgan('tiny'));
  app.use(express.json());
  for (let tuple of middleware) {
    app.use(...tuple);
  }

  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`API server listening on port ${port}`));
  return app;
}

module.exports = makeServer;
