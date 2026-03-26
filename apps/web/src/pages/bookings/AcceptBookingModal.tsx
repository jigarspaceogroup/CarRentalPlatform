import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { acceptBooking } from '@/hooks/useBookings';

interface AcceptBookingModalProps {
  open: boolean;
  onClose: () => void;
  bookingId: string;
  referenceNumber: string;
  onSuccess: () => void;
}

export function AcceptBookingModal({
  open,
  onClose,
  bookingId,
  referenceNumber,
  onSuccess,
}: AcceptBookingModalProps) {
  const { t } = useTranslation();
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await acceptBooking(bookingId, note || undefined);
      toast.success(t('bookings.acceptSuccess'));
      setNote('');
      onSuccess();
      onClose();
    } catch {
      toast.error(t('bookings.acceptFailed'));
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
    <Modal open={open} onClose={handleClose} title={t('bookings.acceptBooking')} size="md">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          {t('bookings.acceptConfirmMessage', { reference: referenceNumber })}
        </p>

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
            {t('bookings.acceptBooking')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
