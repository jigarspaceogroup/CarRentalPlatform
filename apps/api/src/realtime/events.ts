import {
  emitBookingNew,
  emitBookingStatusChanged,
  emitOtpGenerated,
  emitDashboardRefresh,
  emitToUser,
} from './socket';

// Called when a new booking is created
export function onBookingCreated(booking: {
  id: string;
  referenceNumber: string;
  totalAmount: any;
  customer?: { firstName: string; lastName: string };
  vehicle?: { make: string; model: string };
}) {
  emitBookingNew({
    id: booking.id,
    referenceNumber: booking.referenceNumber,
    totalAmount: booking.totalAmount,
    customer: booking.customer,
    vehicle: booking.vehicle,
    createdAt: new Date().toISOString(),
  });
  emitDashboardRefresh();
}

// Called when booking status changes
export function onBookingStatusChanged(
  bookingId: string,
  userId: string,
  status: string,
  previousStatus: string,
) {
  const data = {
    bookingId,
    status,
    previousStatus,
    updatedAt: new Date().toISOString(),
  };
  emitBookingStatusChanged(bookingId, data);
  emitToUser(userId, 'booking:status-changed', data);
  emitDashboardRefresh();
}

// Called when OTP is generated
export function onOtpGenerated(userId: string, bookingId: string) {
  emitOtpGenerated(userId, {
    bookingId,
    message: 'Your OTP is ready',
  });
}

// Called when payment is processed
export function onPaymentProcessed(
  userId: string,
  bookingId: string,
  amount: number,
) {
  emitToUser(userId, 'payment:processed', {
    bookingId,
    amount,
    processedAt: new Date().toISOString(),
  });
  emitDashboardRefresh();
}
