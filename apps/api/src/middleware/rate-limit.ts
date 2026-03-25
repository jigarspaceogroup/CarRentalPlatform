import rateLimit from 'express-rate-limit';
import { AUTH_RATE_LIMIT_MAX, AUTH_RATE_LIMIT_WINDOW_MS } from '@crp/shared';
import { errorResponse } from '../utils/response';

export const authRateLimiter = rateLimit({
  windowMs: AUTH_RATE_LIMIT_WINDOW_MS,
  max: AUTH_RATE_LIMIT_MAX,
  message: errorResponse(
    'TOO_MANY_REQUESTS',
    'Too many attempts. Please try again in 15 minutes.',
  ),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.ip || req.headers['x-forwarded-for']?.toString() || 'unknown';
  },
});

export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: errorResponse(
    'TOO_MANY_REQUESTS',
    'Too many requests. Please slow down.',
  ),
  standardHeaders: true,
  legacyHeaders: false,
});
