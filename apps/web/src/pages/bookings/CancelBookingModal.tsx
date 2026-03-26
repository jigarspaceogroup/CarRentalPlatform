import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { cancelBooking } from '@/hooks/useBookings';

interface CancelBookingModalProps {
  open: boolean;
  onClose: () => void;
  bookingId: string;
  referenceNumber: string;
  onSuccess: () => void;
}

export function CancelBookingModal({
  open,
  onClose,
  bookingId,
  referenceNumber,
  onSuccess,
}: CancelBookingModalProps) {
  const { t } = useTranslation();
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await cancelBooking(bookingId, reason || undefined);
      toast.success(t('bookings.cancelSuccess'));
      setReason('');
      onSuccess();
      onClose();
    } catch {
      toast.error(t('bookings.cancelFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setReason('');
      onClose();
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title={t('bookings.cancelBooking')} size="md">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          {t('bookings.cancelConfirmMessage', { reference: referenceNumber })}
        </p>

        <Textarea
          label={t('bookings.cancellationReason')}
          placeholder={t('bookings.cancellationReasonPlaceholder')}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
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
          <Button
            variant="danger"
            className="flex-1"
            onClick={handleSubmit}
            isLoading={isSubmitting}
          >
            {t('bookings.confirmCancellation')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
