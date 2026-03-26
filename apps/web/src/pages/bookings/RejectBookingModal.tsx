import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { rejectBooking } from '@/hooks/useBookings';

interface RejectBookingModalProps {
  open: boolean;
  onClose: () => void;
  bookingId: string;
  referenceNumber: string;
  onSuccess: () => void;
}

export function RejectBookingModal({
  open,
  onClose,
  bookingId,
  referenceNumber,
  onSuccess,
}: RejectBookingModalProps) {
  const { t } = useTranslation();
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const rejectionReasons = [
    { value: 'VEHICLE_UNAVAILABLE', label: t('bookings.rejectReasons.vehicleUnavailable') },
    {
      value: 'CUSTOMER_VERIFICATION_FAILED',
      label: t('bookings.rejectReasons.customerVerificationFailed'),
    },
    { value: 'SCHEDULING_CONFLICT', label: t('bookings.rejectReasons.schedulingConflict') },
    { value: 'POLICY_VIOLATION', label: t('bookings.rejectReasons.policyViolation') },
    { value: 'OTHER', label: t('bookings.rejectReasons.other') },
  ];

  const handleSubmit = async () => {
    if (!reason) {
      setError(t('bookings.rejectReasonRequired'));
      return;
    }

    setIsSubmitting(true);
    try {
      await rejectBooking(bookingId, reason, note || undefined);
      toast.success(t('bookings.rejectSuccess'));
      resetForm();
      onSuccess();
      onClose();
    } catch {
      toast.error(t('bookings.rejectFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setReason('');
    setNote('');
    setError('');
  };

  const handleClose = () => {
    if (!isSubmitting) {
      resetForm();
      onClose();
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title={t('bookings.rejectBooking')} size="md">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          {t('bookings.rejectConfirmMessage', { reference: referenceNumber })}
        </p>

        <Select
          label={t('bookings.rejectionReason')}
          options={rejectionReasons}
          value={reason}
          onChange={(e) => {
            setReason(e.target.value);
            setError('');
          }}
          placeholder={t('bookings.selectReason')}
          error={error}
        />

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
          <Button
            variant="danger"
            className="flex-1"
            onClick={handleSubmit}
            isLoading={isSubmitting}
          >
            {t('bookings.rejectBooking')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
