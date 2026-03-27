import { Router } from 'express';
import {
  emailRegisterSchema,
  phoneRegisterSchema,
  emailLoginSchema,
  phoneLoginSchema,
  socialAuthSchema,
  verifyOtpSchema,
  verifyEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshTokenSchema,
  updateProfileSchema,
} from '@crp/shared';
import { validate } from '../middleware/validate';
import { requireAuth } from '../middleware/auth';
import { authRateLimiter } from '../middleware/rate-limit';
import * as authController from '../controllers/auth.controller';

export const authRouter = Router();

// ---------------------------------------------------------------------------
// Validation middleware that detects email vs phone registration / login
// ---------------------------------------------------------------------------

function validateRegister(req: import('express').Request, res: import('express').Response, next: import('express').NextFunction) {
  const body = req.body as Record<string, unknown>;
  if (body.email) {
    return validate(emailRegisterSchema)(req, res, next);
  }
  return validate(phoneRegisterSchema)(req, res, next);
}

function validateLogin(req: import('express').Request, res: import('express').Response, next: import('express').NextFunction) {
  const body = req.body as Record<string, unknown>;
  if (body.email) {
    return validate(emailLoginSchema)(req, res, next);
  }
  return validate(phoneLoginSchema)(req, res, next);
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags:
 *       - Customer Auth
 *     summary: Register a new customer account
 *     description: |
 *       Register with email + password or phone number.
 *       Phone registration triggers an OTP that must be verified via /auth/verify-otp.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - type: object
 *                 required: [email, password, fullName]
 *                 properties:
 *                   email:
 *                     type: string
 *                     format: email
 *                   password:
 *                     type: string
 *                     minLength: 8
 *                   fullName:
 *                     type: string
 *                     minLength: 2
 *               - type: object
 *                 required: [phone, fullName]
 *                 properties:
 *                   phone:
 *                     type: string
 *                   fullName:
 *                     type: string
 *                     minLength: 2
 *     responses:
 *       201:
 *         description: Registration successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                     tokens:
 *                       type: object
 *                       properties:
 *                         accessToken:
 *                           type: string
 *                         refreshToken:
 *                           type: string
 *       400:
 *         description: Validation error
 *       409:
 *         description: Email or phone already exists
 *       429:
 *         description: Too many requests
 */
authRouter.post('/register', authRateLimiter, validateRegister, authController.register);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags:
 *       - Customer Auth
 *     summary: Login to an existing account
 *     description: |
 *       Login with email + password or phone number.
 *       Phone login triggers an OTP that must be verified via /auth/verify-otp.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - type: object
 *                 required: [email, password]
 *                 properties:
 *                   email:
 *                     type: string
 *                     format: email
 *                   password:
 *                     type: string
 *               - type: object
 *                 required: [phone]
 *                 properties:
 *                   phone:
 *                     type: string
 *     responses:
 *       200:
 *         description: Login successful (email) or OTP sent (phone)
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: Account suspended or deactivated
 *       429:
 *         description: Too many requests
 */
authRouter.post('/login', authRateLimiter, validateLogin, authController.login);

/**
 * @openapi
 * /auth/social:
 *   post:
 *     tags:
 *       - Customer Auth
 *     summary: Social authentication
 *     description: Authenticate using Google, Apple, or Facebook OAuth token.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [provider, token]
 *             properties:
 *               provider:
 *                 type: string
 *                 enum: [GOOGLE, APPLE, FACEBOOK]
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Authentication successful
 *       403:
 *         description: Account suspended
 *       429:
 *         description: Too many requests
 */
authRouter.post('/social', authRateLimiter, validate(socialAuthSchema), authController.socialAuth);

/**
 * @openapi
 * /auth/verify-otp:
 *   post:
 *     tags:
 *       - Customer Auth
 *     summary: Verify phone OTP
 *     description: Verify the 6-digit OTP sent to the phone number.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phone, code]
 *             properties:
 *               phone:
 *                 type: string
 *               code:
 *                 type: string
 *                 minLength: 6
 *                 maxLength: 6
 *     responses:
 *       200:
 *         description: OTP verified, tokens returned
 *       400:
 *         description: Invalid or expired OTP
 *       429:
 *         description: Too many requests
 */
authRouter.post('/verify-otp', authRateLimiter, validate(verifyOtpSchema), authController.verifyOtp);

/**
 * @openapi
 * /auth/verify-email:
 *   post:
 *     tags:
 *       - Customer Auth
 *     summary: Verify email address
 *     description: Verify a user's email address using the token sent via email.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token]
 *             properties:
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Invalid or expired token
 */
authRouter.post('/verify-email', validate(verifyEmailSchema), authController.verifyEmail);

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     tags:
 *       - Customer Auth
 *     summary: Refresh access token
 *     description: Exchange a valid refresh token for a new access + refresh token pair.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: New token pair issued
 *       401:
 *         description: Invalid or expired refresh token
 */
authRouter.post('/refresh', validate(refreshTokenSchema), authController.refreshToken);

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     tags:
 *       - Customer Auth
 *     summary: Logout
 *     description: Revoke the current session by deleting the refresh token.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Logged out successfully
 *       401:
 *         description: Unauthorized
 */
authRouter.post('/logout', requireAuth, authController.logout);

/**
 * @openapi
 * /auth/forgot-password:
 *   post:
 *     tags:
 *       - Customer Auth
 *     summary: Request password reset
 *     description: Sends a password reset link to the provided email address (if it exists).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: If account exists, reset email sent
 *       429:
 *         description: Too many requests
 */
authRouter.post('/forgot-password', authRateLimiter, validate(forgotPasswordSchema), authController.forgotPassword);

/**
 * @openapi
 * /auth/reset-password:
 *   post:
 *     tags:
 *       - Customer Auth
 *     summary: Reset password
 *     description: Reset the user's password using a valid reset token.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, password]
 *             properties:
 *               token:
 *                 type: string
 *               password:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Invalid or expired token
 */
authRouter.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);

/**
 * @openapi
 * /auth/profile:
 *   get:
 *     tags:
 *       - Customer Auth
 *     summary: Get current user profile
 *     description: Returns the authenticated user's profile data.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 *       401:
 *         description: Unauthorized
 */
authRouter.get('/profile', requireAuth, authController.getProfile);

/**
 * @openapi
 * /auth/profile:
 *   put:
 *     tags:
 *       - Customer Auth
 *     summary: Update user profile
 *     description: Update the authenticated user's profile fields.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *                 minLength: 2
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               drivingLicenseNumber:
 *                 type: string
 *               preferredLanguage:
 *                 type: string
 *                 enum: [en, ar]
 *     responses:
 *       200:
 *         description: Profile updated
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: Email or phone already in use
 */
authRouter.put('/profile', requireAuth, validate(updateProfileSchema), authController.updateProfile);
