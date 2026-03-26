import type { TFunction } from 'i18next';
import type { BadgeVariant } from '@/components/ui/Badge';
import type { PaymentMethod, PaymentStatus } from '@/hooks/usePayments';

export function getPaymentStatusVariant(status: PaymentStatus): BadgeVariant {
  const map: Record<PaymentStatus, BadgeVariant> = {
    PENDING: 'yellow',
    COMPLETED: 'green',
    FAILED: 'red',
    REFUNDED: 'purple',
  };
  return map[status] ?? 'gray';
}

export function getPaymentStatusLabel(t: TFunction, status: PaymentStatus): string {
  const map: Record<PaymentStatus, string> = {
    PENDING: t('payments.statuses.pending'),
    COMPLETED: t('payments.statuses.completed'),
    FAILED: t('payments.statuses.failed'),
    REFUNDED: t('payments.statuses.refunded'),
  };
  return map[status] ?? status;
}

export function getPaymentMethodLabel(t: TFunction, method: PaymentMethod): string {
  const map: Record<PaymentMethod, string> = {
    CREDIT_CARD: t('payments.methods.creditCard'),
    DEBIT_CARD: t('payments.methods.debitCard'),
    COD: t('payments.methods.cod'),
  };
  return map[method] ?? method;
}
