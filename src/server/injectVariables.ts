import { parseStatements } from '@/middleware/statement-parsers.js';
import type { RequestHandler, Response, Request } from 'express';

export type Send<ResBody = any, T = Response<ResBody>> = (body?: ResBody) => T;

const sanitize = (body: string) => body.replace(/{{.*?}}/g, '');

type VariablesFunction<T> = (req: Request) => T | ((req: Request) => Promise<T>);
type Variables<T> = T | VariablesFunction<T>;
type VariableDictionary = Variables<Record<string, any>>;

/**
 * Middleware to inject variables into the response body.
 * @param path - The path to inject the variables into
 * @param variables - The variables to inject
 */
export const injectVariables = (
  path: string, 
  _variables: VariableDictionary
): RequestHandler => {
  return async (req, res, next) => {
    const originalSend = res.send.bind(res);
    
    res.send = (async (body: any) => {
      const pathToCheck = req.route?.path || req.path;
      if (path !== pathToCheck || typeof body !== 'string') {
        return originalSend.call(this, sanitize(body));
      }

      let bodyString = body;
      let variables: Record<string, any> | undefined;

      if (typeof _variables === 'function') {
        variables = _variables(req);
      }

      if (variables instanceof Promise) {
        variables = await variables;
      }

      if (variables === undefined) {
        variables = _variables;
      }

      for (const key in variables) {
        const keyRegex = new RegExp(`{{\\s+${key}(:?(number|string|boolean))?\\s+}}`, 'g');

        bodyString = bodyString.replace(keyRegex, variables[key]);
      }

      bodyString = parseStatements(bodyString, variables);

      return originalSend.call(this, sanitize(bodyString));
    }) as unknown as Send<any, Response>;

    next();
  };
};
