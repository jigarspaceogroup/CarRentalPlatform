import type { Request, Response } from 'express';
import * as bookingService from '../services/booking.service';
import { successResponse, paginationMeta } from '../utils/response';

// ---------------------------------------------------------------------------
// Customer endpoints
// ---------------------------------------------------------------------------

/**
 * GET /vehicles/:vehicleId/availability
 * Check if a vehicle is available for the specified date range.
 */
export async function checkAvailability(req: Request, res: Response): Promise<void> {
  const vehicleId = req.params.vehicleId as string;
  const { startDate, endDate } = req.query as unknown as {
    startDate: Date;
    endDate: Date;
  };
  const result = await bookingService.checkAvailability(vehicleId, startDate, endDate);
  res.json(successResponse(result));
}

/**
 * POST /bookings
 * Create a new booking.
 */
export async function createBooking(req: Request, res: Response): Promise<void> {
  const booking = await bookingService.createBooking(req.user!.userId, req.body);
  res.status(201).json(successResponse(booking));
}

/**
 * GET /bookings
 * List current user's bookings.
 */
export async function listUserBookings(req: Request, res: Response): Promise<void> {
  const result = await bookingService.listUserBookings(
    req.user!.userId,
    req.query as any,
  );
  res.json(
    successResponse(
      result.bookings,
      paginationMeta(result.page, result.limit, result.total),
    ),
  );
}

/**
 * GET /bookings/:id
 * Get booking detail for the current user.
 */
export async function getBookingById(req: Request, res: Response): Promise<void> {
  const booking = await bookingService.getBookingById(
    req.params.id as string,
    req.user!.userId,
  );
  res.json(successResponse(booking));
}

/**
 * POST /bookings/:id/cancel
 * Cancel a booking (customer-initiated).
 */
export async function cancelBooking(req: Request, res: Response): Promise<void> {
  const booking = await bookingService.cancelBooking(
    req.params.id as string,
    req.user!.userId,
    req.body.reason,
  );
  res.json(successResponse(booking));
}

/**
 * POST /bookings/:id/apply-discount
 * Validate and preview a discount code for an existing booking.
 */
export async function applyDiscount(req: Request, res: Response): Promise<void> {
  const booking = await bookingService.getBookingById(
    req.params.id as string,
    req.user!.userId,
  );

  const result = await bookingService.validateDiscount(
    req.body.code,
    req.user!.userId,
    booking.vehicleId,
    booking.vehicle.id,
    Number(booking.baseAmount) + Number(booking.extrasAmount),
  );

  res.json(successResponse(result));
}

/**
 * GET /bookings/:id/price-breakdown
 * Get pricing breakdown for a booking.
 */
export async function getPriceBreakdown(req: Request, res: Response): Promise<void> {
  const breakdown = await bookingService.getPriceBreakdown(
    req.params.id as string,
    req.user!.userId,
  );
  res.json(successResponse(breakdown));
}

// ---------------------------------------------------------------------------
// Admin endpoints
// ---------------------------------------------------------------------------

/**
 * GET /admin/bookings
 * List all bookings with filters.
 */
export async function adminListBookings(req: Request, res: Response): Promise<void> {
  const result = await bookingService.adminListBookings(req.query as any);
  res.json(
    successResponse(
      result.bookings,
      paginationMeta(result.page, result.limit, result.total),
    ),
  );
}

/**
 * GET /admin/bookings/export
 * Export bookings as CSV.
 */
export async function exportBookings(req: Request, res: Response): Promise<void> {
  const csv = await bookingService.exportBookings(req.query as any);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="bookings-export.csv"');
  res.send(csv);
}

/**
 * GET /admin/bookings/:id
 * Get full booking detail.
 */
export async function adminGetBooking(req: Request, res: Response): Promise<void> {
  const booking = await bookingService.adminGetBooking(req.params.id as string);
  res.json(successResponse(booking));
}

/**
 * POST /admin/bookings/:id/accept
 * Accept (confirm) a pending booking.
 */
export async function acceptBooking(req: Request, res: Response): Promise<void> {
  const booking = await bookingService.acceptBooking(
    req.params.id as string,
    req.user!.userId,
    req.body.note,
  );
  res.json(successResponse(booking));
}

/**
 * POST /admin/bookings/:id/reject
 * Reject a pending booking.
 */
export async function rejectBooking(req: Request, res: Response): Promise<void> {
  const booking = await bookingService.rejectBooking(
    req.params.id as string,
    req.user!.userId,
    req.body.reason,
    req.body.note,
  );
  res.json(successResponse(booking));
}

/**
 * PUT /admin/bookings/:id/status
 * Advance booking to a new status.
 */
export async function advanceStatus(req: Request, res: Response): Promise<void> {
  const booking = await bookingService.advanceStatus(
    req.params.id as string,
    req.user!.userId,
    req.body.status,
  );
  res.json(successResponse(booking));
}

/**
 * POST /admin/bookings/:id/cancel
 * Admin cancels a booking.
 */
export async function adminCancelBooking(req: Request, res: Response): Promise<void> {
  const booking = await bookingService.adminCancelBooking(
    req.params.id as string,
    req.user!.userId,
    req.body.reason,
  );
  res.json(successResponse(booking));
}

/**
 * POST /admin/bookings/:id/notes
 * Add a note to a booking.
 */
export async function addNote(req: Request, res: Response): Promise<void> {
  const note = await bookingService.addNote(
    req.params.id as string,
    req.user!.userId,
    req.body.content,
  );
  res.status(201).json(successResponse(note));
}
