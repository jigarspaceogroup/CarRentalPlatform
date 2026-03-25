import { BOOKING_REFERENCE_PREFIX, TICKET_REFERENCE_PREFIX } from '@crp/shared';

/** Generate a unique reference number like BK-2026-XXXX */
export function generateBookingReference(): string {
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${BOOKING_REFERENCE_PREFIX}-${year}-${random}`;
}

/** Generate a unique ticket reference like TK-2026-XXXX */
export function generateTicketReference(): string {
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${TICKET_REFERENCE_PREFIX}-${year}-${random}`;
}
