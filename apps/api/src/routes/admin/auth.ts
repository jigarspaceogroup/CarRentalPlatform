import { Router } from 'express';
import { asyncHandler } from '../../utils/async-handler';
import { validate } from '../../middleware/validate';
import { requireAuth, requireStaff } from '../../middleware/auth';
import { authRateLimiter } from '../../middleware/rate-limit';
import {
  staffLoginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '@crp/shared';
import * as staffAuthController from '../../controllers/staff-auth.controller';

export const adminAuthRouter = Router();

/**
 * @openapi
 * /admin/auth/login:
 *   post:
 *     tags:
 *       - Staff Auth
 *     summary: Staff login
 *     description: Authenticate a staff member with email and password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@carrental.com
 *               password:
 *                 type: string
 *                 example: Password123
 *     responses:
 *       200:
 *         description: Login successful
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
 *                     staff:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         email:
 *                           type: string
 *                         fullName:
 *                           type: string
 *                         role:
 *                           type: string
 *                           enum: [ADMIN, MANAGER, OPERATOR, SUPPORT]
 *                         status:
 *                           type: string
 *                     accessToken:
 *                       type: string
 *                     refreshToken:
 *                       type: string
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: Account inactive
 *       429:
 *         description: Too many attempts
 */
adminAuthRouter.post(
  '/login',
  authRateLimiter,
  validate(staffLoginSchema),
  asyncHandler(staffAuthController.login),
);

/**
 * @openapi
 * /admin/auth/refresh:
 *   post:
 *     tags:
 *       - Staff Auth
 *     summary: Refresh access token
 *     description: Get a new access token using a valid refresh token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token refreshed
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
 *                     accessToken:
 *                       type: string
 *                     refreshToken:
 *                       type: string
 *       401:
 *         description: Invalid or expired refresh token
 */
adminAuthRouter.post(
  '/refresh',
  validate(refreshTokenSchema),
  asyncHandler(staffAuthController.refreshToken),
);

/**
 * @openapi
 * /admin/auth/logout:
 *   post:
 *     tags:
 *       - Staff Auth
 *     summary: Staff logout
 *     description: Invalidate the current staff session
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Logged out successfully
 *       401:
 *         description: Unauthorized
 */
adminAuthRouter.post(
  '/logout',
  requireAuth,
  requireStaff,
  asyncHandler(staffAuthController.logout),
);

/**
 * @openapi
 * /admin/auth/forgot-password:
 *   post:
 *     tags:
 *       - Staff Auth
 *     summary: Forgot password
 *     description: Send a password reset link to the staff member's email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Reset link sent (always returns success to prevent enumeration)
 *       429:
 *         description: Too many attempts
 */
adminAuthRouter.post(
  '/forgot-password',
  authRateLimiter,
  validate(forgotPasswordSchema),
  asyncHandler(staffAuthController.forgotPassword),
);

/**
 * @openapi
 * /admin/auth/reset-password:
 *   post:
 *     tags:
 *       - Staff Auth
 *     summary: Reset password
 *     description: Reset staff password using a valid reset token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - password
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
adminAuthRouter.post(
  '/reset-password',
  validate(resetPasswordSchema),
  asyncHandler(staffAuthController.resetPassword),
);
