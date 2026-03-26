import type { TFunction } from 'i18next';
import type { BadgeVariant } from '@/components/ui/Badge';
import type { BookingStatus } from '@/hooks/useBookings';

export function getBookingStatusVariant(status: BookingStatus): BadgeVariant {
  const map: Record<BookingStatus, BadgeVariant> = {
    PENDING: 'yellow',
    CONFIRMED: 'blue',
    VEHICLE_PREPARING: 'blue',
    READY_FOR_PICKUP: 'blue',
    ACTIVE_RENTAL: 'green',
    RETURN_PENDING: 'yellow',
    COMPLETED: 'gray',
    CANCELLED: 'red',
    REJECTED: 'red',
  };
  return map[status] ?? 'gray';
}

export function getBookingStatusLabel(t: TFunction, status: BookingStatus): string {
  const map: Record<BookingStatus, string> = {
    PENDING: t('bookings.statuses.pending'),
    CONFIRMED: t('bookings.statuses.confirmed'),
    VEHICLE_PREPARING: t('bookings.statuses.vehiclePreparing'),
    READY_FOR_PICKUP: t('bookings.statuses.readyForPickup'),
    ACTIVE_RENTAL: t('bookings.statuses.activeRental'),
    RETURN_PENDING: t('bookings.statuses.returnPending'),
    COMPLETED: t('bookings.statuses.completed'),
    CANCELLED: t('bookings.statuses.cancelled'),
    REJECTED: t('bookings.statuses.rejected'),
  };
  return map[status] ?? status;
}

export function getNextStatus(status: BookingStatus): BookingStatus | null {
  const flow: Partial<Record<BookingStatus, BookingStatus>> = {
    CONFIRMED: 'VEHICLE_PREPARING',
    VEHICLE_PREPARING: 'READY_FOR_PICKUP',
    READY_FOR_PICKUP: 'ACTIVE_RENTAL',
    ACTIVE_RENTAL: 'RETURN_PENDING',
    RETURN_PENDING: 'COMPLETED',
  };
  return flow[status] ?? null;
}

export function formatCurrency(amount: number): string {
  return `SAR ${amount.toFixed(2)}`;
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
