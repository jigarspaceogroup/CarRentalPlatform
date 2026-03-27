import { Router } from 'express';
import { asyncHandler } from '../utils/async-handler';
import { validate } from '../middleware/validate';
import { requireAuth } from '../middleware/auth';
import {
  createBookingSchema,
  listBookingsQuerySchema,
  bookingIdParamSchema,
  cancelBookingSchema,
  applyDiscountSchema,
} from '../validation/booking.schema';
import * as bookingController from '../controllers/booking.controller';

export const bookingRouter = Router();

// All customer booking routes require authentication
bookingRouter.use(requireAuth);

// ---------------------------------------------------------------------------
// Booking CRUD
// ---------------------------------------------------------------------------

/**
 * @openapi
 * /bookings:
 *   post:
 *     tags:
 *       - Bookings
 *     summary: Create a booking
 *     description: Create a new vehicle rental booking. Validates vehicle availability, calculates pricing, and applies discount if provided.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vehicleId
 *               - pickupBranchId
 *               - dropoffBranchId
 *               - pickupDate
 *               - dropoffDate
 *               - termsAccepted
 *             properties:
 *               vehicleId:
 *                 type: string
 *                 format: uuid
 *               pickupBranchId:
 *                 type: string
 *                 format: uuid
 *               dropoffBranchId:
 *                 type: string
 *                 format: uuid
 *               pickupDate:
 *                 type: string
 *                 format: date-time
 *               dropoffDate:
 *                 type: string
 *                 format: date-time
 *               rentalPlan:
 *                 type: string
 *                 enum: [daily, weekly, monthly, long_term]
 *                 default: daily
 *               extras:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - nameEn
 *                     - nameAr
 *                     - price
 *                   properties:
 *                     nameEn:
 *                       type: string
 *                     nameAr:
 *                       type: string
 *                     price:
 *                       type: number
 *                     quantity:
 *                       type: integer
 *                       default: 1
 *               discountCode:
 *                 type: string
 *               termsAccepted:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Booking created
 *       400:
 *         description: Validation error or vehicle unavailable
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Vehicle or branch not found
 *       409:
 *         description: Vehicle not available for selected dates
 */
bookingRouter.post(
  '/',
  validate(createBookingSchema),
  asyncHandler(bookingController.createBooking),
);

/**
 * @openapi
 * /bookings:
 *   get:
 *     tags:
 *       - Bookings
 *     summary: List my bookings
 *     description: List all bookings for the authenticated customer, with optional status filter and pagination.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, CONFIRMED, VEHICLE_PREPARING, READY_FOR_PICKUP, ACTIVE_RENTAL, RETURN_PENDING, COMPLETED, CANCELLED, REJECTED]
 *     responses:
 *       200:
 *         description: Paginated list of bookings
 *       401:
 *         description: Unauthorized
 */
bookingRouter.get(
  '/',
  validate(listBookingsQuerySchema, 'query'),
  asyncHandler(bookingController.listUserBookings),
);

/**
 * @openapi
 * /bookings/{id}:
 *   get:
 *     tags:
 *       - Bookings
 *     summary: Get booking detail
 *     description: Get detailed information about a specific booking owned by the authenticated customer.
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
 *         description: Booking detail with vehicle, branches, extras, and status history
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Booking not found
 */
bookingRouter.get(
  '/:id',
  validate(bookingIdParamSchema, 'params'),
  asyncHandler(bookingController.getBookingById),
);

/**
 * @openapi
 * /bookings/{id}/cancel:
 *   post:
 *     tags:
 *       - Bookings
 *     summary: Cancel a booking
 *     description: Cancel a booking. Only allowed for PENDING or CONFIRMED bookings.
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
 *               reason:
 *                 type: string
 *                 maxLength: 500
 *     responses:
 *       200:
 *         description: Booking cancelled
 *       400:
 *         description: Booking cannot be cancelled in current status
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Booking not found
 */
bookingRouter.post(
  '/:id/cancel',
  validate(bookingIdParamSchema, 'params'),
  validate(cancelBookingSchema),
  asyncHandler(bookingController.cancelBooking),
);

/**
 * @openapi
 * /bookings/{id}/apply-discount:
 *   post:
 *     tags:
 *       - Bookings
 *     summary: Apply discount code
 *     description: Validate and preview a discount code against an existing booking.
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
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *             properties:
 *               code:
 *                 type: string
 *     responses:
 *       200:
 *         description: Discount validation result with calculated amount
 *       400:
 *         description: Invalid or inapplicable discount code
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Booking or discount code not found
 */
bookingRouter.post(
  '/:id/apply-discount',
  validate(bookingIdParamSchema, 'params'),
  validate(applyDiscountSchema),
  asyncHandler(bookingController.applyDiscount),
);

/**
 * @openapi
 * /bookings/{id}/price-breakdown:
 *   get:
 *     tags:
 *       - Bookings
 *     summary: Get price breakdown
 *     description: Get a detailed pricing breakdown for a booking (base, extras, discount, tax, service fee, total).
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
 *         description: Pricing breakdown
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Booking not found
 */
bookingRouter.get(
  '/:id/price-breakdown',
  validate(bookingIdParamSchema, 'params'),
  asyncHandler(bookingController.getPriceBreakdown),
);
