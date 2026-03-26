import { Router } from 'express';
import { asyncHandler } from '../utils/async-handler';
import { validate } from '../middleware/validate';
import { requireAuth } from '../middleware/auth';
import {
  checkAvailabilityParamsSchema,
  checkAvailabilityQuerySchema,
} from '../validation/booking.schema';
import * as bookingController from '../controllers/booking.controller';

export const vehicleAvailabilityRouter = Router();

/**
 * @openapi
 * /vehicles/{vehicleId}/availability:
 *   get:
 *     tags:
 *       - Vehicles
 *     summary: Check vehicle availability
 *     description: Check whether a vehicle is available for the specified date range. Returns availability status and any conflicting bookings.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: vehicleId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start of the desired rental period
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End of the desired rental period
 *     responses:
 *       200:
 *         description: Availability check result
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
 *                     available:
 *                       type: boolean
 *                     conflicts:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           pickupDate:
 *                             type: string
 *                             format: date-time
 *                           dropoffDate:
 *                             type: string
 *                             format: date-time
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Vehicle not found
 */
vehicleAvailabilityRouter.get(
  '/:vehicleId/availability',
  requireAuth,
  validate(checkAvailabilityParamsSchema, 'params'),
  validate(checkAvailabilityQuerySchema, 'query'),
  asyncHandler(bookingController.checkAvailability),
);
