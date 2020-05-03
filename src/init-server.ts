import morgan from 'morgan';
import express, { Express, Router, Request, Response, NextFunction } from 'express';

export interface RouterItem {
  url: string;
  router: Router;
}

export function initServer(routerItems: RouterItem[]): Express {
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

    const responseJson: any = {
        name: err.name,
        message: err.message
    }

    if (err.status) {
      responseJson.status = err.status;
    }

    res.json(responseJson);
  });

  const port: number = +(process.env.PORT || 3000);
  app.listen(port, () => console.log(`API server listening on port ${port}`));
  return app;
}
