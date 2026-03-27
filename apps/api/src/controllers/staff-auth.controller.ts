import type { Request, Response } from 'express';
import * as staffAuthService from '../services/staff-auth.service';
import { successResponse } from '../utils/response';

/**
 * POST /admin/auth/login
 * Staff login with email and password.
 */
export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body;
  const result = await staffAuthService.login(email, password, {
    userAgent: req.headers['user-agent'],
    ipAddress: req.ip ?? req.socket.remoteAddress,
  });

  res.json(successResponse(result));
}

/**
 * POST /admin/auth/refresh
 * Refresh access token using refresh token.
 */
export async function refreshToken(req: Request, res: Response): Promise<void> {
  const { refreshToken } = req.body;
  const tokens = await staffAuthService.refreshToken(refreshToken);

  res.json(successResponse(tokens));
}

/**
 * POST /admin/auth/logout
 * Invalidate the current staff session.
 */
export async function logout(req: Request, res: Response): Promise<void> {
  const staffId = req.user!.userId;
  const { refreshToken } = req.body;
  await staffAuthService.logout(staffId, refreshToken);

  res.json(successResponse({ message: 'Logged out successfully' }));
}

/**
 * POST /admin/auth/forgot-password
 * Send password reset link to staff email.
 */
export async function forgotPassword(req: Request, res: Response): Promise<void> {
  const { email } = req.body;
  await staffAuthService.forgotPassword(email);

  // Always return success to prevent email enumeration
  res.json(
    successResponse({
      message: 'If the email exists, a password reset link has been sent.',
    }),
  );
}

/**
 * POST /admin/auth/reset-password
 * Reset staff password using a valid reset token.
 */
export async function resetPassword(req: Request, res: Response): Promise<void> {
  const { token, password } = req.body;
  await staffAuthService.resetPassword(token, password);

  res.json(successResponse({ message: 'Password reset successfully' }));
}
