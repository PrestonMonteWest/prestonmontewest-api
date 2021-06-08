import express, { Express, NextFunction, Request, Response, Router } from 'express';
import morgan from 'morgan';

export interface RouterItem {
  url: string;
  router: Router;
}

export async function initServer(routerItems: RouterItem[]): Promise<Express> {
  const app: Express = express();

  app.use(morgan('tiny'));
  app.use(express.json());

  for (const item of routerItems) {
    app.use(item.url, item.router);
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
