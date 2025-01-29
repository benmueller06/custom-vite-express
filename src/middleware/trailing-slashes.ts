import { NextFunction, Request, Response } from "express";

/**
 * Middleware to add trailing slashes to the URL by redirecting to the same URL with a trailing slash. Required by Vite for nested routes.
 * @param req - Request object
 * @param res - Response object
 * @param next - Next function
 */
export const addTrailingSlashes = (req: Request, res: Response, next: NextFunction) => {
  if (
    req.path === '/'
    || req.path.endsWith('/')
    || req.path.includes('@vite')
    || req.path.includes('node_modules')
    || req.path.includes('src')
    || req.path.includes('.')
  ) {
    return next();
  }

  const queryString = req.url.slice(req.path.length);
  const urlWithSlash = `${req.path}/${queryString}`;
  return res.redirect(302, urlWithSlash);
}
