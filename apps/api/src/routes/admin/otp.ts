import { Router } from 'express';
import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/async-handler';
import { validate } from '../../middleware/validate';
import { requireAuth, requireStaff } from '../../middleware/auth';
import { successResponse } from '../../utils/response';
import {
  otpBookingIdParamSchema,
  generateOtpBodySchema,
} from '../../validation/otp.schema';
import * as otpService from '../../services/otp.service';

export const adminOtpRouter = Router();

// All admin OTP routes require staff authentication
adminOtpRouter.use(requireAuth, requireStaff);

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

/**
 * @openapi
 * /admin/bookings/{id}/otp/generate:
 *   post:
 *     tags:
 *       - Admin - OTP
 *     summary: Generate OTP for a booking
 *     description: Generate a new 6-digit OTP for a booking. Invalidates all previous active OTPs.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               channel:
 *                 type: string
 *                 enum: [SMS, PUSH, BOTH]
 *                 default: BOTH
 *     responses:
 *       201:
 *         description: OTP generated
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Staff access required
 *       404:
 *         description: Booking not found
 */
adminOtpRouter.post(
  '/:id/otp/generate',
  validate(otpBookingIdParamSchema, 'params'),
  validate(generateOtpBodySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const otp = await otpService.generateOtp(
      req.params.id as string,
      req.user!.userId,
      req.body.channel,
    );
    res.status(201).json(successResponse(otp));
  }),
);

/**
 * @openapi
 * /admin/bookings/{id}/otp:
 *   get:
 *     tags:
 *       - Admin - OTP
 *     summary: Get OTP status and audit log
 *     description: Get the current active OTP and full audit log for a booking.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: OTP status with audit log
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Staff access required
 *       404:
 *         description: Booking not found
 */
adminOtpRouter.get(
  '/:id/otp',
  validate(otpBookingIdParamSchema, 'params'),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await otpService.getOtpStatus(req.params.id as string);
    res.json(successResponse(result));
  }),
);
