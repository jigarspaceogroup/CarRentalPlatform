import { BookingStatus } from '../types/enums';

/** Valid booking status transitions */
export const BOOKING_STATUS_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  [BookingStatus.PENDING]: [BookingStatus.CONFIRMED, BookingStatus.REJECTED, BookingStatus.CANCELLED],
  [BookingStatus.CONFIRMED]: [BookingStatus.VEHICLE_PREPARING, BookingStatus.CANCELLED],
  [BookingStatus.VEHICLE_PREPARING]: [BookingStatus.READY_FOR_PICKUP, BookingStatus.CANCELLED],
  [BookingStatus.READY_FOR_PICKUP]: [BookingStatus.ACTIVE_RENTAL, BookingStatus.CANCELLED],
  [BookingStatus.ACTIVE_RENTAL]: [BookingStatus.RETURN_PENDING],
  [BookingStatus.RETURN_PENDING]: [BookingStatus.COMPLETED],
  [BookingStatus.COMPLETED]: [],
  [BookingStatus.CANCELLED]: [],
  [BookingStatus.REJECTED]: [],
};

/** Rental plan types */
export const RENTAL_PLANS = ['daily', 'weekly', 'monthly', 'long_term'] as const;
export type RentalPlan = (typeof RENTAL_PLANS)[number];

/** Default currency */
export const DEFAULT_CURRENCY = 'SAR';

/** Tax rate (can be overridden in business settings) */
export const DEFAULT_TAX_RATE = 0.15; // 15% VAT

/** Booking reference prefix */
export const BOOKING_REFERENCE_PREFIX = 'BK';

/** Ticket reference prefix */
export const TICKET_REFERENCE_PREFIX = 'TK';
