import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  ChevronRight,
  User,
  Phone,
  Mail,
  Car,
  MapPin,
  Calendar,
  CreditCard,
  MessageSquare,
  Send,
  Clock,
  Ban,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Textarea } from '@/components/ui/Textarea';
import { useBookingDetail } from '@/hooks/useBookingDetail';
import { addBookingNote } from '@/hooks/useBookings';
import { AcceptBookingModal } from '@/pages/bookings/AcceptBookingModal';
import { RejectBookingModal } from '@/pages/bookings/RejectBookingModal';
import { CancelBookingModal } from '@/pages/bookings/CancelBookingModal';
import { AdvanceStatusModal } from '@/pages/bookings/AdvanceStatusModal';
import { OtpSection } from '@/pages/bookings/OtpSection';
import {
  getBookingStatusVariant,
  getBookingStatusLabel,
  getNextStatus,
  formatCurrency,
  formatDate,
  formatDateTime,
} from '@/pages/bookings/bookingUtils';

export function BookingDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { booking, isLoading, refetch } = useBookingDetail(id);

  const [newNote, setNewNote] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);

  // Modal states
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);

  const handleAddNote = async () => {
    if (!newNote.trim() || !id) return;
    setIsAddingNote(true);
    try {
      await addBookingNote(id, newNote.trim());
      toast.success(t('bookings.noteAdded'));
      setNewNote('');
      refetch();
    } catch {
      toast.error(t('bookings.noteAddFailed'));
    } finally {
      setIsAddingNote(false);
    }
  };

  if (isLoading) {
    return (
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
    );
  }

  if (!booking) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-lg font-medium text-gray-900">{t('bookings.bookingNotFound')}</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/bookings')}>
          <ArrowLeft className="h-4 w-4" />
          {t('bookings.backToBookings')}
        </Button>
      </div>
    );
  }

  const nextStatus = getNextStatus(booking.status);
  const canAccept = booking.status === 'PENDING';
  const canReject = booking.status === 'PENDING';
  const canCancel = booking.status === 'CONFIRMED';
  const canAdvance = nextStatus !== null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/bookings')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold text-gray-900">#{booking.referenceNumber}</h1>
              <Badge variant={getBookingStatusVariant(booking.status)}>
                {getBookingStatusLabel(t, booking.status)}
              </Badge>
            </div>
            <p className="mt-0.5 text-sm text-gray-500">
              {t('bookings.createdAt', { date: formatDateTime(booking.createdAt) })}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          {canAccept && (
            <Button size="sm" onClick={() => setShowAcceptModal(true)}>
              <CheckCircle className="h-4 w-4" />
              {t('bookings.accept')}
            </Button>
          )}
          {canReject && (
            <Button variant="danger" size="sm" onClick={() => setShowRejectModal(true)}>
              <XCircle className="h-4 w-4" />
              {t('bookings.reject')}
            </Button>
          )}
          {canAdvance && (
            <Button size="sm" onClick={() => setShowAdvanceModal(true)}>
              <ChevronRight className="h-4 w-4" />
              {t('bookings.advanceTo', {
                status: getBookingStatusLabel(t, nextStatus),
              })}
            </Button>
          )}
          {canCancel && (
            <Button variant="danger" size="sm" onClick={() => setShowCancelModal(true)}>
              <Ban className="h-4 w-4" />
              {t('bookings.cancelBooking')}
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Main Info */}
        <div className="space-y-6 lg:col-span-2">
          {/* Booking Info Card */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              {t('bookings.bookingInfo')}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <InfoRow
                icon={<Calendar className="h-4 w-4" />}
                label={t('bookings.pickupDate')}
                value={formatDate(booking.pickupDate)}
              />
              <InfoRow
                icon={<Calendar className="h-4 w-4" />}
                label={t('bookings.dropoffDate')}
                value={formatDate(booking.dropoffDate)}
              />
              <InfoRow
                icon={<Car className="h-4 w-4" />}
                label={t('bookings.vehicle')}
                value={`${booking.vehicle.make} ${booking.vehicle.model} ${booking.vehicle.year}`}
              />
              <InfoRow
                icon={<Car className="h-4 w-4" />}
                label={t('bookings.licensePlate')}
                value={booking.vehicle.licensePlate}
              />
              {booking.pickupBranch && (
                <InfoRow
                  icon={<MapPin className="h-4 w-4" />}
                  label={t('bookings.pickupBranch')}
                  value={booking.pickupBranch.nameEn}
                />
              )}
              {booking.dropoffBranch && (
                <InfoRow
                  icon={<MapPin className="h-4 w-4" />}
                  label={t('bookings.dropoffBranch')}
                  value={booking.dropoffBranch.nameEn}
                />
              )}
            </div>
          </div>

          {/* Customer Info Card */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              {t('bookings.customerInfo')}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <InfoRow
                icon={<User className="h-4 w-4" />}
                label={t('bookings.customerName')}
                value={`${booking.customer.firstName} ${booking.customer.lastName}`}
              />
              <InfoRow
                icon={<Phone className="h-4 w-4" />}
                label={t('bookings.customerPhone')}
                value={booking.customer.phone}
              />
              <InfoRow
                icon={<Mail className="h-4 w-4" />}
                label={t('bookings.customerEmail')}
                value={booking.customer.email}
              />
            </div>
          </div>

          {/* Price Breakdown Card */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              {t('bookings.priceBreakdown')}
            </h2>
            <div className="space-y-3">
              <PriceRow
                label={t('bookings.baseRate', {
                  days: booking.priceBreakdown.numberOfDays,
                })}
                amount={booking.priceBreakdown.subtotal}
              />
              {booking.priceBreakdown.extras > 0 && (
                <PriceRow label={t('bookings.extras')} amount={booking.priceBreakdown.extras} />
              )}
              {booking.priceBreakdown.discount > 0 && (
                <PriceRow
                  label={t('bookings.discount')}
                  amount={-booking.priceBreakdown.discount}
                  className="text-green-600"
                />
              )}
              {booking.priceBreakdown.taxAmount > 0 && (
                <PriceRow label={t('bookings.tax')} amount={booking.priceBreakdown.taxAmount} />
              )}
              {booking.priceBreakdown.deliveryFee > 0 && (
                <PriceRow
                  label={t('bookings.deliveryFee')}
                  amount={booking.priceBreakdown.deliveryFee}
                />
              )}
              <div className="border-t border-gray-200 pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-base font-semibold text-gray-900">
                    {t('bookings.totalAmount')}
                  </span>
                  <span className="text-base font-bold text-gray-900">
                    {formatCurrency(booking.priceBreakdown.totalAmount)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Info Card */}
          {booking.payments.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                {t('bookings.paymentInfo')}
              </h2>
              <div className="space-y-3">
                {booking.payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between rounded-lg border border-gray-100 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {formatCurrency(payment.amount)}
                        </p>
                        <p className="text-xs text-gray-500">{payment.method}</p>
                      </div>
                    </div>
                    <Link
                      to={`/payments/${payment.id}`}
                      className="text-sm font-medium text-primary-600 hover:underline"
                    >
                      {t('bookings.viewPayment')}
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Internal Notes */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
              <MessageSquare className="h-5 w-5" />
              {t('bookings.internalNotes')}
            </h2>

            {/* Add Note */}
            <div className="mb-4 flex gap-2">
              <Textarea
                placeholder={t('bookings.addNotePlaceholder')}
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                rows={2}
                className="flex-1"
              />
              <Button
                size="sm"
                onClick={handleAddNote}
                disabled={!newNote.trim()}
                isLoading={isAddingNote}
                className="self-end"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>

            {/* Notes List */}
            {booking.notes.length === 0 ? (
              <p className="text-center text-sm text-gray-500 py-4">{t('bookings.noNotes')}</p>
            ) : (
              <div className="space-y-3">
                {booking.notes.map((note) => (
                  <div key={note.id} className="rounded-lg bg-gray-50 p-3">
                    <p className="text-sm text-gray-700">{note.content}</p>
                    <div className="mt-1.5 flex items-center gap-2 text-xs text-gray-500">
                      {note.createdBy && (
                        <span className="font-medium">
                          {note.createdBy.firstName} {note.createdBy.lastName}
                        </span>
                      )}
                      <span>{formatDateTime(note.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* OTP Management */}
          <OtpSection bookingId={booking.id} bookingStatus={booking.status} />
        </div>

        {/* Right Column: Status Timeline */}
        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              {t('bookings.statusTimeline')}
            </h2>
            <div className="relative">
              {booking.statusHistory.map((entry, index) => {
                const isLast = index === booking.statusHistory.length - 1;
                return (
                  <div key={entry.id} className="relative flex gap-3 pb-6 last:pb-0">
                    {/* Timeline line */}
                    {!isLast && (
                      <div className="absolute start-[11px] top-6 h-full w-0.5 bg-gray-200" />
                    )}
                    {/* Timeline dot */}
                    <div className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white">
                      <div
                        className={`h-3 w-3 rounded-full ${
                          isLast ? 'bg-primary-600' : 'bg-gray-300'
                        }`}
                      />
                    </div>
                    {/* Content */}
                    <div className="flex-1 -mt-0.5">
                      <Badge variant={getBookingStatusVariant(entry.toStatus)} className="mb-1">
                        {getBookingStatusLabel(t, entry.toStatus)}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        {formatDateTime(entry.createdAt)}
                      </div>
                      {entry.changedBy && (
                        <p className="mt-0.5 text-xs text-gray-500">
                          {t('bookings.by')} {entry.changedBy.firstName} {entry.changedBy.lastName}
                        </p>
                      )}
                      {entry.note && (
                        <p className="mt-1 text-xs text-gray-600 italic">
                          &ldquo;{entry.note}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {canAccept && (
        <AcceptBookingModal
          open={showAcceptModal}
          onClose={() => setShowAcceptModal(false)}
          bookingId={booking.id}
          referenceNumber={booking.referenceNumber}
          onSuccess={refetch}
        />
      )}

      {canReject && (
        <RejectBookingModal
          open={showRejectModal}
          onClose={() => setShowRejectModal(false)}
          bookingId={booking.id}
          referenceNumber={booking.referenceNumber}
          onSuccess={refetch}
        />
      )}

      {canCancel && (
        <CancelBookingModal
          open={showCancelModal}
          onClose={() => setShowCancelModal(false)}
          bookingId={booking.id}
          referenceNumber={booking.referenceNumber}
          onSuccess={refetch}
        />
      )}

      {canAdvance && nextStatus && (
        <AdvanceStatusModal
          open={showAdvanceModal}
          onClose={() => setShowAdvanceModal(false)}
          bookingId={booking.id}
          currentStatus={booking.status}
          nextStatus={nextStatus}
          onSuccess={refetch}
        />
      )}
    </div>
  );
}

// ─── Helper Components ───────────────────────────────────────────────────────

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 text-gray-400">{icon}</span>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-medium text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function PriceRow({
  label,
  amount,
  className,
}: {
  label: string;
  amount: number;
  className?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-600">{label}</span>
      <span className={`text-sm font-medium ${className || 'text-gray-900'}`}>
        {amount < 0 ? `- ${formatCurrency(Math.abs(amount))}` : formatCurrency(amount)}
      </span>
    </div>
  );
}
