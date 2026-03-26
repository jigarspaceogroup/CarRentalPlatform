import { Router } from 'express';
import { asyncHandler } from '../../utils/async-handler';
import { validate } from '../../middleware/validate';
import { requireAuth, requireStaff } from '../../middleware/auth';
import {
  adminListBookingsQuerySchema,
  bookingIdParamSchema,
  acceptBookingSchema,
  rejectBookingSchema,
  changeBookingStatusSchema,
  cancelBookingSchema,
  addNoteSchema,
  exportBookingsQuerySchema,
} from '../../validation/booking.schema';
import * as bookingController from '../../controllers/booking.controller';

export const adminBookingRouter = Router();

// All admin booking routes require staff authentication
adminBookingRouter.use(requireAuth, requireStaff);

// ---------------------------------------------------------------------------
// Collection routes
// ---------------------------------------------------------------------------

/**
 * @openapi
 * /admin/bookings:
 *   get:
 *     tags:
 *       - Admin - Bookings
 *     summary: List all bookings
 *     description: List all bookings with filtering, search, pagination, and sorting.
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
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by reference number, customer name, or vehicle
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, pickupDate, dropoffDate, totalAmount]
 *           default: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: Paginated list of bookings
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Staff access required
 */
adminBookingRouter.get(
  '/',
  validate(adminListBookingsQuerySchema, 'query'),
  asyncHandler(bookingController.adminListBookings),
);

/**
 * @openapi
 * /admin/bookings/export:
 *   get:
 *     tags:
 *       - Admin - Bookings
 *     summary: Export bookings as CSV
 *     description: Export filtered bookings as a CSV file download.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, CONFIRMED, VEHICLE_PREPARING, READY_FOR_PICKUP, ACTIVE_RENTAL, RETURN_PENDING, COMPLETED, CANCELLED, REJECTED]
 *     responses:
 *       200:
 *         description: CSV file download
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Staff access required
 */
adminBookingRouter.get(
  '/export',
  validate(exportBookingsQuerySchema, 'query'),
  asyncHandler(bookingController.exportBookings),
);

// ---------------------------------------------------------------------------
// Single booking routes
// ---------------------------------------------------------------------------

/**
 * @openapi
 * /admin/bookings/{id}:
 *   get:
 *     tags:
 *       - Admin - Bookings
 *     summary: Get booking detail
 *     description: Get full booking detail including status history, notes, payments, and OTPs.
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
 *         description: Full booking detail
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Staff access required
 *       404:
 *         description: Booking not found
 */
adminBookingRouter.get(
  '/:id',
  validate(bookingIdParamSchema, 'params'),
  asyncHandler(bookingController.adminGetBooking),
);

/**
 * @openapi
 * /admin/bookings/{id}/accept:
 *   post:
 *     tags:
 *       - Admin - Bookings
 *     summary: Accept a booking
 *     description: Accept (confirm) a pending booking. Optionally add a note.
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
 *               note:
 *                 type: string
 *                 maxLength: 1000
 *     responses:
 *       200:
 *         description: Booking accepted (confirmed)
 *       400:
 *         description: Booking is not in PENDING status
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Staff access required
 *       404:
 *         description: Booking not found
 */
adminBookingRouter.post(
  '/:id/accept',
  validate(bookingIdParamSchema, 'params'),
  validate(acceptBookingSchema),
  asyncHandler(bookingController.acceptBooking),
);

/**
 * @openapi
 * /admin/bookings/{id}/reject:
 *   post:
 *     tags:
 *       - Admin - Bookings
 *     summary: Reject a booking
 *     description: Reject a pending booking with a mandatory reason.
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
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *                 maxLength: 500
 *               note:
 *                 type: string
 *                 maxLength: 1000
 *     responses:
 *       200:
 *         description: Booking rejected
 *       400:
 *         description: Booking is not in PENDING status
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Staff access required
 *       404:
 *         description: Booking not found
 */
adminBookingRouter.post(
  '/:id/reject',
  validate(bookingIdParamSchema, 'params'),
  validate(rejectBookingSchema),
  asyncHandler(bookingController.rejectBooking),
);

/**
 * @openapi
 * /admin/bookings/{id}/status:
 *   put:
 *     tags:
 *       - Admin - Bookings
 *     summary: Advance booking status
 *     description: Transition a booking to a new status. Only valid transitions are allowed.
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
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDING, CONFIRMED, VEHICLE_PREPARING, READY_FOR_PICKUP, ACTIVE_RENTAL, RETURN_PENDING, COMPLETED, CANCELLED, REJECTED]
 *     responses:
 *       200:
 *         description: Status updated
 *       400:
 *         description: Invalid status transition
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Staff access required
 *       404:
 *         description: Booking not found
 */
adminBookingRouter.put(
  '/:id/status',
  validate(bookingIdParamSchema, 'params'),
  validate(changeBookingStatusSchema),
  asyncHandler(bookingController.advanceStatus),
);

/**
 * @openapi
 * /admin/bookings/{id}/cancel:
 *   post:
 *     tags:
 *       - Admin - Bookings
 *     summary: Cancel a booking (admin)
 *     description: Admin cancels a booking. Allowed for PENDING, CONFIRMED, VEHICLE_PREPARING, and READY_FOR_PICKUP statuses.
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
 *       403:
 *         description: Staff access required
 *       404:
 *         description: Booking not found
 */
adminBookingRouter.post(
  '/:id/cancel',
  validate(bookingIdParamSchema, 'params'),
  validate(cancelBookingSchema),
  asyncHandler(bookingController.adminCancelBooking),
);

/**
 * @openapi
 * /admin/bookings/{id}/notes:
 *   post:
 *     tags:
 *       - Admin - Bookings
 *     summary: Add a note
 *     description: Add an internal note to a booking.
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
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 maxLength: 2000
 *     responses:
 *       201:
 *         description: Note added
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Staff access required
 *       404:
 *         description: Booking not found
 */
adminBookingRouter.post(
  '/:id/notes',
  validate(bookingIdParamSchema, 'params'),
  validate(addNoteSchema),
  asyncHandler(bookingController.addNote),
);
