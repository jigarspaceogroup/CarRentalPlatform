import { z } from 'zod';
import { uuidSchema } from '@crp/shared';
import { RENTAL_PLANS } from '@crp/shared';

/** Booking status enum values */
const bookingStatusEnum = z.enum([
  'PENDING',
  'CONFIRMED',
  'VEHICLE_PREPARING',
  'READY_FOR_PICKUP',
  'ACTIVE_RENTAL',
  'RETURN_PENDING',
  'COMPLETED',
  'CANCELLED',
  'REJECTED',
]);

// ---------------------------------------------------------------------------
// Customer schemas
// ---------------------------------------------------------------------------

/** Check vehicle availability query (dates as query params) */
export const checkAvailabilityParamsSchema = z.object({
  vehicleId: uuidSchema,
});

export const checkAvailabilityQuerySchema = z.object({
  startDate: z.coerce.date({ required_error: 'Start date is required' }),
  endDate: z.coerce.date({ required_error: 'End date is required' }),
}).refine((data) => data.endDate > data.startDate, {
  message: 'End date must be after start date',
  path: ['endDate'],
});

/** Booking extra item schema */
const bookingExtraSchema = z.object({
  nameEn: z.string().trim().min(1, 'English name is required').max(100),
  nameAr: z.string().trim().min(1, 'Arabic name is required').max(100),
  price: z.number().positive('Price must be positive'),
  quantity: z.number().int().min(1).default(1),
});

/** Create booking input */
export const createBookingSchema = z.object({
  vehicleId: uuidSchema,
  pickupBranchId: uuidSchema,
  dropoffBranchId: uuidSchema,
  pickupDate: z.coerce.date({ required_error: 'Pickup date is required' }),
  dropoffDate: z.coerce.date({ required_error: 'Dropoff date is required' }),
  rentalPlan: z.enum(RENTAL_PLANS).default('daily'),
  extras: z.array(bookingExtraSchema).default([]),
  discountCode: z.string().trim().max(50).optional(),
  termsAccepted: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the terms and conditions' }),
  }),
}).refine((data) => data.dropoffDate > data.pickupDate, {
  message: 'Dropoff date must be after pickup date',
  path: ['dropoffDate'],
});

/** List user bookings query */
export const listBookingsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: bookingStatusEnum.optional(),
});

/** Booking ID param */
export const bookingIdParamSchema = z.object({
  id: uuidSchema,
});

/** Cancel booking input */
export const cancelBookingSchema = z.object({
  reason: z.string().trim().max(500).optional(),
});

/** Apply discount input */
export const applyDiscountSchema = z.object({
  code: z.string().trim().min(1, 'Discount code is required').max(50),
});

// ---------------------------------------------------------------------------
// Admin schemas
// ---------------------------------------------------------------------------

/** Admin list bookings query */
export const adminListBookingsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: bookingStatusEnum.optional(),
  search: z.string().trim().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  sortBy: z.enum(['createdAt', 'pickupDate', 'dropoffDate', 'totalAmount']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

/** Accept booking input */
export const acceptBookingSchema = z.object({
  note: z.string().trim().max(1000).optional(),
});

/** Reject booking input */
export const rejectBookingSchema = z.object({
  reason: z.string().trim().min(1, 'Rejection reason is required').max(500),
  note: z.string().trim().max(1000).optional(),
});

/** Change booking status input */
export const changeBookingStatusSchema = z.object({
  status: bookingStatusEnum,
});

/** Add note input */
export const addNoteSchema = z.object({
  content: z.string().trim().min(1, 'Note content is required').max(2000),
});

/** Export bookings query */
export const exportBookingsQuerySchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  status: bookingStatusEnum.optional(),
});

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------

export type CheckAvailabilityParams = z.infer<typeof checkAvailabilityParamsSchema>;
export type CheckAvailabilityQuery = z.infer<typeof checkAvailabilityQuerySchema>;
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type ListBookingsQuery = z.infer<typeof listBookingsQuerySchema>;
export type CancelBookingInput = z.infer<typeof cancelBookingSchema>;
export type ApplyDiscountInput = z.infer<typeof applyDiscountSchema>;
export type AdminListBookingsQuery = z.infer<typeof adminListBookingsQuerySchema>;
export type AcceptBookingInput = z.infer<typeof acceptBookingSchema>;
export type RejectBookingInput = z.infer<typeof rejectBookingSchema>;
export type ChangeBookingStatusInput = z.infer<typeof changeBookingStatusSchema>;
export type AddNoteInput = z.infer<typeof addNoteSchema>;
export type ExportBookingsQuery = z.infer<typeof exportBookingsQuerySchema>;
