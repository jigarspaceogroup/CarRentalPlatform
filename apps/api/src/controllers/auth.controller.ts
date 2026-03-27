import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/async-handler';
import { successResponse } from '../utils/response';
import { authService } from '../services/auth.service';
import { AppError } from '../utils/app-error';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function extractSessionMeta(req: Request) {
  return {
    userAgent: req.headers['user-agent'] ?? 'unknown',
    ipAddress: req.ip ?? req.socket.remoteAddress ?? 'unknown',
  };
}

// ---------------------------------------------------------------------------
// Controllers
// ---------------------------------------------------------------------------

/**
 * POST /auth/register
 * Register a new customer with email+password or phone.
 */
export const register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const body = req.body as Record<string, unknown>;
  const meta = extractSessionMeta(req);

  if (body.email) {
    const result = await authService.registerWithEmail(
      {
        email: body.email as string,
        password: body.password as string,
        fullName: body.fullName as string,
      },
      meta,
    );
    res.status(201).json(successResponse(result));
    return;
  }

  if (body.phone) {
    const result = await authService.registerWithPhone({
      phone: body.phone as string,
      fullName: body.fullName as string,
    });
    res.status(201).json(successResponse(result));
    return;
  }

  throw AppError.badRequest('Either email or phone is required for registration');
});

/**
 * POST /auth/login
 * Login with email+password or phone (OTP flow).
 */
export const login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const body = req.body as Record<string, unknown>;
  const meta = extractSessionMeta(req);

  if (body.email) {
    const result = await authService.loginWithEmail(
      {
        email: body.email as string,
        password: body.password as string,
      },
      meta,
    );
    res.status(200).json(successResponse(result));
    return;
  }

  if (body.phone) {
    const result = await authService.loginWithPhone({
      phone: body.phone as string,
    });
    res.status(200).json(successResponse(result));
    return;
  }

  throw AppError.badRequest('Either email or phone is required for login');
});

/**
 * POST /auth/social
 * Authenticate via social provider (Google, Apple, Facebook).
 */
export const socialAuth = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { provider, token } = req.body as { provider: 'GOOGLE' | 'APPLE' | 'FACEBOOK'; token: string };
  const meta = extractSessionMeta(req);

  const result = await authService.loginWithSocial({ provider, token }, meta);
  res.status(200).json(successResponse(result));
});

/**
 * POST /auth/verify-otp
 * Verify a phone OTP code to complete phone login/registration.
 */
export const verifyOtp = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { phone, code } = req.body as { phone: string; code: string };
  const meta = extractSessionMeta(req);

  const result = await authService.verifyOtp({ phone, code }, meta);
  res.status(200).json(successResponse(result));
});

/**
 * POST /auth/verify-email
 * Verify email address using a JWT token sent via email.
 */
export const verifyEmail = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { token } = req.body as { token: string };

  const result = await authService.verifyEmail(token);
  res.status(200).json(successResponse(result));
});

/**
 * POST /auth/refresh
 * Exchange a refresh token for a new access + refresh token pair.
 */
export const refreshToken = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { refreshToken: token } = req.body as { refreshToken: string };
  const meta = extractSessionMeta(req);

  const result = await authService.refreshToken(token, meta);
  res.status(200).json(successResponse(result));
});

/**
 * POST /auth/logout
 * Revoke the current session (delete the refresh token).
 */
export const logout = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = req.user;
  if (!user) {
    throw AppError.unauthorized('Authentication required');
  }

  const { refreshToken: token } = req.body as { refreshToken: string };
  if (!token) {
    throw AppError.badRequest('Refresh token is required');
  }

  const result = await authService.logout(user.userId, token);
  res.status(200).json(successResponse(result));
});

/**
 * POST /auth/forgot-password
 * Request a password reset email.
 */
export const forgotPassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body as { email: string };

  const result = await authService.forgotPassword(email);
  res.status(200).json(successResponse(result));
});

/**
 * POST /auth/reset-password
 * Reset password using a valid reset token.
 */
export const resetPassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { token, password } = req.body as { token: string; password: string };

  const result = await authService.resetPassword(token, password);
  res.status(200).json(successResponse(result));
});

/**
 * GET /auth/profile
 * Get the authenticated user's profile.
 */
export const getProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = req.user;
  if (!user) {
    throw AppError.unauthorized('Authentication required');
  }

  const profile = await authService.getProfile(user.userId);
  res.status(200).json(successResponse(profile));
});

/**
 * PUT /auth/profile
 * Update the authenticated user's profile.
 */
export const updateProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = req.user;
  if (!user) {
    throw AppError.unauthorized('Authentication required');
  }

  const profile = await authService.updateProfile(user.userId, req.body as {
    fullName?: string;
    phone?: string;
    email?: string;
    drivingLicenseNumber?: string;
    preferredLanguage?: 'en' | 'ar';
  });
  res.status(200).json(successResponse(profile));
});
