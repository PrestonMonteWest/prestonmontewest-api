import pg, { QueryResult } from 'pg';

import { HttpError } from '../classes/http-error.js';
import { genericErrorMessage, pgParamPrefix } from '../constants.js';

export class PgRepo {
  private static _instance: PgRepo;
  pool: pg.Pool;

  static get instance() {
    if (!this._instance) {
      this._instance = new PgRepo();
    }

    return this._instance;
  }

  private constructor() {
    this.pool = new pg.Pool();
  }

  async callFunction<T extends Record<string, any>, V>(
    fName: string,
    params: T,
    composite = true,
    nullable = false
  ): Promise<V | undefined> {
    const paramNames = Object.keys(params);
    let result: QueryResult;
    try {
      result = await this.pool.query(
        `select ${composite ? '* from ' : ''}${fName}(${paramNames
          .map(
            (paramName, index) =>
              `${pgParamPrefix}${paramName} := $${index + 1}`
          )
          .join(', ')});`,
        paramNames.map((paramName) => params[paramName])
      );
    } catch (err) {
      console.error(err);
      throw new HttpError(genericErrorMessage, 500);
    }

    if (composite) {
      return this.map<V>(result.rows[0], nullable);
    }

    return result.rows[0][fName] as V;
  }

  map<V>(obj: any, nullable = false) {
    const newObj: Record<string, any> = {};

    for (const key of Object.keys(obj).filter(
      (key) => nullable || obj[key] !== null
    )) {
      newObj[this.convertToCamelCase(key)] = obj[key];
    }
    return newObj as V;
  }

  protected convertToCamelCase(columnName: string) {
    return columnName
      .split(/_+/)
      .map((part, index) =>
        index && part[0] ? part[0].toUpperCase() + part.substring(1) : part
      )
      .join('');
  }
}
