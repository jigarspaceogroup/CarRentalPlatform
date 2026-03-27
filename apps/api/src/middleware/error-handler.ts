import type { Request, Response, NextFunction } from 'express';
import { errorResponse } from '../utils/response';
import { AppError } from '../utils/app-error';
import { env } from '../config/env';

export function globalErrorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof AppError) {
    res.status(err.statusCode).json(
      errorResponse(err.code, err.message, err.details),
    );
    return;
  }

  // Log unexpected errors
  console.error('Unhandled error:', err);

  const message = env.NODE_ENV === 'production'
    ? 'Internal server error'
    : err.message;

  res.status(500).json(
    errorResponse('INTERNAL_ERROR', message),
  );
}
