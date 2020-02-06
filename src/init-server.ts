import morgan from 'morgan';
import express, { Express, Router } from 'express';

interface RouterItem {
  url: string;
  router: Router;
}

export default function initServer(routerItems: RouterItem[]): Express {
  const app: Express = express();

  app.use(morgan('tiny'));
  app.use(express.json());
  for (const item of routerItems) {
    app.use(item.url, item.router);
  }

  const port: number = +process.env.PORT || 3000;
  app.listen(port, () => console.log(`API server listening on port ${port}`));
  return app;
}
