import type { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Wraps an async route handler to properly catch and forward errors
 * to the Express error-handling middleware.
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}
