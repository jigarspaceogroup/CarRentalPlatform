import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { processRefund } from '@/hooks/usePayments';
import { formatCurrency } from '@/pages/bookings/bookingUtils';

interface ProcessRefundModalProps {
  open: boolean;
  onClose: () => void;
  paymentId: string;
  originalAmount: number;
  onSuccess: () => void;
}

export function ProcessRefundModal({
  open,
  onClose,
  paymentId,
  originalAmount,
  onSuccess,
}: ProcessRefundModalProps) {
  const { t } = useTranslation();
  const [isFullRefund, setIsFullRefund] = useState(true);
  const [amount, setAmount] = useState(String(originalAmount));
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ amount?: string; reason?: string }>({});

  const validate = (): boolean => {
    const newErrors: { amount?: string; reason?: string } = {};

    if (!isFullRefund) {
      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        newErrors.amount = t('payments.refundAmountInvalid');
      } else if (numAmount > originalAmount) {
        newErrors.amount = t('payments.refundAmountExceeds');
      }
    }

    if (!reason.trim()) {
      newErrors.reason = t('payments.refundReasonRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const refundAmount = isFullRefund ? originalAmount : parseFloat(amount);
      await processRefund(paymentId, refundAmount, reason);
      toast.success(t('payments.refundSuccess'));
      resetForm();
      onSuccess();
      onClose();
    } catch {
      toast.error(t('payments.refundFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setIsFullRefund(true);
    setAmount(String(originalAmount));
    setReason('');
    setErrors({});
  };

  const handleClose = () => {
    if (!isSubmitting) {
      resetForm();
      onClose();
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title={t('payments.processRefund')} size="md">
      <div className="space-y-4">
        <div className="rounded-lg bg-gray-50 p-3">
          <p className="text-sm text-gray-600">{t('payments.originalAmount')}</p>
          <p className="text-lg font-semibold text-gray-900">{formatCurrency(originalAmount)}</p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="full-refund"
            checked={isFullRefund}
            onChange={(e) => {
              setIsFullRefund(e.target.checked);
              if (e.target.checked) {
                setAmount(String(originalAmount));
                setErrors((prev) => ({ ...prev, amount: undefined }));
              }
            }}
            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <label htmlFor="full-refund" className="text-sm font-medium text-gray-700">
            {t('payments.fullRefund')}
          </label>
        </div>

        {!isFullRefund && (
          <Input
            label={t('payments.refundAmount')}
            type="number"
            step="0.01"
            min="0.01"
            max={originalAmount}
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setErrors((prev) => ({ ...prev, amount: undefined }));
            }}
            error={errors.amount}
          />
        )}

        <Textarea
          label={t('payments.refundReason')}
          placeholder={t('payments.refundReasonPlaceholder')}
          value={reason}
          onChange={(e) => {
            setReason(e.target.value);
            setErrors((prev) => ({ ...prev, reason: undefined }));
          }}
          rows={3}
          error={errors.reason}
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
            {t('payments.processRefund')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
