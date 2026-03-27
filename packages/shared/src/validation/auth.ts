import { z } from 'zod';
import { PASSWORD_MIN_LENGTH, PASSWORD_REGEX } from '../constants/app';

/** Password schema with requirements */
export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
  .regex(PASSWORD_REGEX, 'Password must contain at least one uppercase, one lowercase, and one number');

/** Email registration schema */
export const emailRegisterSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: passwordSchema,
  fullName: z.string().trim().min(2, 'Full name must be at least 2 characters').max(255),
});

/** Phone registration schema */
export const phoneRegisterSchema = z.object({
  phone: z.string().min(8, 'Invalid phone number').max(20),
  fullName: z.string().trim().min(2, 'Full name must be at least 2 characters').max(255),
});

/** Email login schema */
export const emailLoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

/** Phone login schema */
export const phoneLoginSchema = z.object({
  phone: z.string().min(8, 'Invalid phone number').max(20),
});

/** Social auth schema */
export const socialAuthSchema = z.object({
  provider: z.enum(['GOOGLE', 'APPLE', 'FACEBOOK']),
  token: z.string().min(1, 'Token is required'),
});

/** OTP verification schema */
export const verifyOtpSchema = z.object({
  phone: z.string().min(8).max(20),
  code: z.string().length(6, 'OTP must be 6 digits'),
});

/** Email verification schema */
export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

/** Forgot password schema */
export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

/** Reset password schema */
export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: passwordSchema,
});

/** Refresh token schema */
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

/** Update profile schema */
export const updateProfileSchema = z.object({
  fullName: z.string().trim().min(2).max(255).optional(),
  phone: z.string().min(8).max(20).optional(),
  email: z.string().email().optional(),
  drivingLicenseNumber: z.string().max(100).optional(),
  preferredLanguage: z.enum(['en', 'ar']).optional(),
});

/** Staff login schema */
export const staffLoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});
