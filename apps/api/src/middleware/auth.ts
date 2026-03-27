import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from '../utils/app-error';
import type { StaffRole } from '@crp/shared';

export interface AuthPayload {
  userId: string;
  type: 'customer' | 'staff';
  role?: StaffRole;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = extractToken(req);
    if (!token) {
      throw AppError.unauthorized('Access token is required');
    }

    const payload = jwt.verify(token, env.JWT_SECRET) as AuthPayload;
    req.user = payload;
    next();
  } catch (err) {
    if (err instanceof AppError) {
      next(err);
      return;
    }
    next(AppError.unauthorized('Invalid or expired token'));
  }
}

export function requireStaff(req: Request, _res: Response, next: NextFunction) {
  if (!req.user || req.user.type !== 'staff') {
    next(AppError.forbidden('Staff access required'));
    return;
  }
  next();
}

export function requireRole(...roles: StaffRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || req.user.type !== 'staff' || !req.user.role) {
      next(AppError.forbidden('Staff access required'));
      return;
    }
    if (!roles.includes(req.user.role)) {
      next(AppError.forbidden(`Required role: ${roles.join(' or ')}`));
      return;
    }
    next();
  };
}

function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  return null;
}
