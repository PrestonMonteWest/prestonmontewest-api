import express, { Express, NextFunction, Request, Response, Router } from 'express';
import morgan from 'morgan';
import { Connection, createConnection } from "typeorm";
import { Post } from './entities';

export type RouterFn = (conn: Connection) => Router;

export interface RouterItem {
  url: string;
  getRouter: RouterFn;
}

export async function initServer(routerItems: RouterItem[]): Promise<Express> {
  const app: Express = express();

  app.use(morgan('tiny'));
  app.use(express.json());

  app.get('/authorized', function (req, res) {
    res.send('Secured Resource');
  });

  const conn = await createConnection({
    "type": "postgres",
    "host": "localhost",
    "port": 5432,
    "username": "preston",
    "password": "247Pmw918?!2157",
    "database": "prestonmontewest",
    "entities": [
      Post
    ],
    "synchronize": true,
    "logging": false,
  });

  for (const item of routerItems) {
    app.use(item.url, item.getRouter(conn));
  }

  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(err);
    // Handle auth middleware error status
    if (err.name === 'UnauthorizedError') {
      res = res.status(401);
    } else {
      res = res.status(err.status || 500);
    }

    res.json(err);
  });

  const port = +(process.env.PORT || 3000);
  app.listen(port, () => console.log(`API server listening on port ${port}`));
  return app;
}
