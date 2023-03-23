import express, {
  Express,
  NextFunction,
  Request,
  Response,
  Router,
} from 'express';
import morgan from 'morgan';

import { HttpError } from './classes/http-error.js';

export interface RouterItem {
  url: string;
  router: Router;
}

export function createServer(routerItems: RouterItem[]): Express {
  const server = express();

  server.use(morgan('tiny'));
  server.use(express.json());

  for (const item of routerItems) {
    server.use(item.url, item.router);
  }

  server.use(
    // Need to provide 4 arguments to make this an error handler
    (err: HttpError, req: Request, res: Response, next: NextFunction) => {
      res.header('Content-Type', 'application/json');

      // Handle auth middleware error status
      if (err.name === 'UnauthorizedError') {
        res = res.status(401);
      } else {
        res = res.status(err.status || 500);
      }

      res.json({
        ...err,
        message: err.message,
      });
    }
  );

  return server;
}
