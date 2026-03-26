import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Calendar,
  Car,
  User,
  DollarSign,
  CheckCircle,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useBookings } from '@/hooks/useBookings';
import { AcceptBookingModal } from '@/pages/bookings/AcceptBookingModal';
import { RejectBookingModal } from '@/pages/bookings/RejectBookingModal';
import { formatCurrency, formatDate } from '@/pages/bookings/bookingUtils';

const AUTO_REFRESH_INTERVAL = 15_000;

export function IncomingBookingsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const previousCountRef = useRef(0);
  const [hasNewBookings, setHasNewBookings] = useState(false);

  const {
    data: bookings,
    isLoading,
    refetch,
  } = useBookings({
    page: 1,
    limit: 50,
    status: 'PENDING',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  // Auto-refresh every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, AUTO_REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [refetch]);

  // Detect new bookings
  useEffect(() => {
    if (bookings.length > previousCountRef.current && previousCountRef.current > 0) {
      setHasNewBookings(true);
      setTimeout(() => setHasNewBookings(false), 5000);
    }
    previousCountRef.current = bookings.length;
  }, [bookings.length]);

  // Modal state
  const [acceptModal, setAcceptModal] = useState<{
    open: boolean;
    bookingId: string;
    reference: string;
  }>({ open: false, bookingId: '', reference: '' });

  const [rejectModal, setRejectModal] = useState<{
    open: boolean;
    bookingId: string;
    reference: string;
  }>({ open: false, bookingId: '', reference: '' });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-gray-900">{t('bookings.incomingBookings')}</h1>
          {hasNewBookings && (
            <span className="flex items-center gap-1 rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-700 animate-pulse">
              <Bell className="h-3 w-3" />
              {t('bookings.newBookingsAlert')}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="yellow" className="text-sm">
            {t('bookings.pendingCount', { count: bookings.length })}
          </Badge>
          <Button variant="outline" size="sm" onClick={refetch}>
            <RefreshCw className="h-4 w-4" />
            {t('bookings.refresh')}
          </Button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <svg
              className="h-5 w-5 animate-spin text-primary-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            {t('common.loading')}
          </div>
        </div>
      ) : bookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 py-20">
          <CheckCircle className="mb-3 h-12 w-12 text-green-400" />
          <p className="text-lg font-medium text-gray-900">{t('bookings.noIncoming')}</p>
          <p className="mt-1 text-sm text-gray-500">{t('bookings.noIncomingSubtitle')}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              {/* Reference & Amount */}
              <div className="mb-4 flex items-start justify-between">
                <button
                  onClick={() => navigate(`/bookings/${booking.id}`)}
                  className="text-sm font-semibold text-primary-600 hover:underline"
                >
                  #{booking.referenceNumber}
                </button>
                <span className="text-lg font-bold text-gray-900">
                  {formatCurrency(booking.totalAmount)}
                </span>
              </div>

              {/* Details */}
              <div className="mb-4 space-y-2.5">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User className="h-4 w-4 shrink-0 text-gray-400" />
                  <span className="truncate">
                    {booking.customer.firstName} {booking.customer.lastName}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Car className="h-4 w-4 shrink-0 text-gray-400" />
                  <span className="truncate">
                    {booking.vehicle.make} {booking.vehicle.model} {booking.vehicle.year}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4 shrink-0 text-gray-400" />
                  <span>{formatDate(booking.pickupDate)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <DollarSign className="h-4 w-4 shrink-0 text-gray-400" />
                  <span>{formatCurrency(booking.totalAmount)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() =>
                    setAcceptModal({
                      open: true,
                      bookingId: booking.id,
                      reference: booking.referenceNumber,
                    })
                  }
                >
                  <CheckCircle className="h-4 w-4" />
                  {t('bookings.accept')}
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  className="flex-1"
                  onClick={() =>
                    setRejectModal({
                      open: true,
                      bookingId: booking.id,
                      reference: booking.referenceNumber,
                    })
                  }
                >
                  <XCircle className="h-4 w-4" />
                  {t('bookings.reject')}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <AcceptBookingModal
        open={acceptModal.open}
        onClose={() => setAcceptModal({ open: false, bookingId: '', reference: '' })}
        bookingId={acceptModal.bookingId}
        referenceNumber={acceptModal.reference}
        onSuccess={refetch}
      />

      <RejectBookingModal
        open={rejectModal.open}
        onClose={() => setRejectModal({ open: false, bookingId: '', reference: '' })}
        bookingId={rejectModal.bookingId}
        referenceNumber={rejectModal.reference}
        onSuccess={refetch}
      />
    </div>
  );
}
