import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { ArrowRight } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';
import { updateBookingStatus, type BookingStatus } from '@/hooks/useBookings';
import { getBookingStatusVariant, getBookingStatusLabel } from '@/pages/bookings/bookingUtils';

interface AdvanceStatusModalProps {
  open: boolean;
  onClose: () => void;
  bookingId: string;
  currentStatus: BookingStatus;
  nextStatus: BookingStatus;
  onSuccess: () => void;
}

export function AdvanceStatusModal({
  open,
  onClose,
  bookingId,
  currentStatus,
  nextStatus,
  onSuccess,
}: AdvanceStatusModalProps) {
  const { t } = useTranslation();
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await updateBookingStatus(bookingId, nextStatus);
      toast.success(t('bookings.statusUpdateSuccess'));
      setNote('');
      onSuccess();
      onClose();
    } catch {
      toast.error(t('bookings.statusUpdateFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setNote('');
      onClose();
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title={t('bookings.advanceStatus')} size="md">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">{t('bookings.advanceStatusMessage')}</p>

        <div className="flex items-center justify-center gap-3 rounded-lg bg-gray-50 p-4">
          <Badge variant={getBookingStatusVariant(currentStatus)}>
            {getBookingStatusLabel(t, currentStatus)}
          </Badge>
          <ArrowRight className="h-4 w-4 text-gray-400" />
          <Badge variant={getBookingStatusVariant(nextStatus)}>
            {getBookingStatusLabel(t, nextStatus)}
          </Badge>
        </div>

        <Textarea
          label={t('bookings.noteOptional')}
          placeholder={t('bookings.notePlaceholder')}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
        />

        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            {t('common.cancel')}
          </Button>
          <Button className="flex-1" onClick={handleSubmit} isLoading={isSubmitting}>
            {t('bookings.confirmAdvance')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
