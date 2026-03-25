import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import {
  ACCESS_TOKEN_EXPIRY,
  REFRESH_TOKEN_EXPIRY,
  STAFF_ACCESS_TOKEN_EXPIRY,
  STAFF_REFRESH_TOKEN_EXPIRY,
} from '@crp/shared';
import type { AuthPayload } from '../middleware/auth';

export function generateAccessToken(payload: AuthPayload): string {
  const expiry = payload.type === 'staff' ? STAFF_ACCESS_TOKEN_EXPIRY : ACCESS_TOKEN_EXPIRY;
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: expiry });
}

export function generateRefreshToken(payload: AuthPayload): string {
  const expiry = payload.type === 'staff' ? STAFF_REFRESH_TOKEN_EXPIRY : REFRESH_TOKEN_EXPIRY;
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: expiry });
}

export function verifyAccessToken(token: string): AuthPayload {
  return jwt.verify(token, env.JWT_SECRET) as AuthPayload;
}

export function verifyRefreshToken(token: string): AuthPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as AuthPayload;
}

export function generateTokenPair(payload: AuthPayload) {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
}
