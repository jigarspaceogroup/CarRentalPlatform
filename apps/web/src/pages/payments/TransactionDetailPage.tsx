import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, CreditCard, Calendar, Car, Hash, RefreshCw, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Table, type TableColumn } from '@/components/ui/Table';
import { usePaymentDetail, type RefundHistoryEntry } from '@/hooks/usePaymentDetail';
import { markAsPaid } from '@/hooks/usePayments';
import { formatCurrency, formatDate, formatDateTime } from '@/pages/bookings/bookingUtils';
import {
  getPaymentStatusVariant,
  getPaymentStatusLabel,
  getPaymentMethodLabel,
} from '@/pages/payments/paymentUtils';
import { ProcessRefundModal } from '@/pages/payments/ProcessRefundModal';

export function TransactionDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { payment, isLoading, refetch } = usePaymentDetail(id);

  const [showRefundModal, setShowRefundModal] = useState(false);
  const [isMarkingPaid, setIsMarkingPaid] = useState(false);

  const handleMarkAsPaid = async () => {
    if (!id) return;
    setIsMarkingPaid(true);
    try {
      await markAsPaid(id);
      toast.success(t('payments.markPaidSuccess'));
      refetch();
    } catch {
      toast.error(t('payments.markPaidFailed'));
    } finally {
      setIsMarkingPaid(false);
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

  if (!payment) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-lg font-medium text-gray-900">{t('payments.paymentNotFound')}</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/payments')}>
          <ArrowLeft className="h-4 w-4" />
          {t('payments.backToPayments')}
        </Button>
      </div>
    );
  }

  const canRefund = payment.status === 'COMPLETED';
  const canMarkPaid = payment.method === 'COD' && payment.status === 'PENDING';

  const refundColumns: TableColumn<RefundHistoryEntry>[] = [
    {
      key: 'amount',
      header: t('payments.amount'),
      render: (row) => (
        <span className="font-medium text-gray-900">{formatCurrency(row.amount)}</span>
      ),
    },
    {
      key: 'reason',
      header: t('payments.reason'),
      render: (row) => <span className="text-sm text-gray-600">{row.reason}</span>,
    },
    {
      key: 'status',
      header: t('common.status'),
      render: (row) => (
        <Badge variant={row.status === 'COMPLETED' ? 'green' : 'yellow'}>{row.status}</Badge>
      ),
    },
    {
      key: 'processedBy',
      header: t('payments.processedBy'),
      render: (row) =>
        row.processedBy ? (
          <span className="text-sm text-gray-600">
            {row.processedBy.firstName} {row.processedBy.lastName}
          </span>
        ) : (
          <span className="text-sm text-gray-400">-</span>
        ),
    },
    {
      key: 'date',
      header: t('common.date'),
      render: (row) => (
        <span className="text-sm text-gray-600">{formatDateTime(row.createdAt)}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/payments')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold text-gray-900">
                {t('payments.transactionDetail')}
              </h1>
              <Badge variant={getPaymentStatusVariant(payment.status)}>
                {getPaymentStatusLabel(t, payment.status)}
              </Badge>
            </div>
            <p className="mt-0.5 text-sm text-gray-500">
              {t('payments.createdAt', { date: formatDateTime(payment.createdAt) })}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {canRefund && (
            <Button variant="danger" size="sm" onClick={() => setShowRefundModal(true)}>
              <RefreshCw className="h-4 w-4" />
              {t('payments.processRefund')}
            </Button>
          )}
          {canMarkPaid && (
            <Button size="sm" onClick={handleMarkAsPaid} isLoading={isMarkingPaid}>
              <CheckCircle className="h-4 w-4" />
              {t('payments.markAsPaid')}
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Payment Info Card */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">{t('payments.paymentInfo')}</h2>
          <div className="space-y-4">
            <DetailRow
              icon={<CreditCard className="h-4 w-4" />}
              label={t('payments.amount')}
              value={formatCurrency(payment.amount)}
            />
            <DetailRow
              icon={<CreditCard className="h-4 w-4" />}
              label={t('payments.method')}
              value={getPaymentMethodLabel(t, payment.method)}
            />
            <DetailRow
              icon={<Hash className="h-4 w-4" />}
              label={t('payments.gatewayTransactionId')}
              value={payment.transactionId || '-'}
            />
            <DetailRow
              icon={<Calendar className="h-4 w-4" />}
              label={t('common.date')}
              value={formatDateTime(payment.createdAt)}
            />
          </div>
        </div>

        {/* Booking Link Card */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            {t('payments.linkedBooking')}
          </h2>
          <div className="space-y-4">
            <DetailRow
              icon={<Hash className="h-4 w-4" />}
              label={t('payments.bookingRef')}
              value={
                <Link
                  to={`/bookings/${payment.booking.id}`}
                  className="font-medium text-primary-600 hover:underline"
                >
                  #{payment.booking.referenceNumber}
                </Link>
              }
            />
            {payment.booking.vehicle && (
              <DetailRow
                icon={<Car className="h-4 w-4" />}
                label={t('bookings.vehicle')}
                value={`${payment.booking.vehicle.make} ${payment.booking.vehicle.model} ${payment.booking.vehicle.year}`}
              />
            )}
            <DetailRow
              icon={<Calendar className="h-4 w-4" />}
              label={t('bookings.pickupDate')}
              value={formatDate(payment.booking.pickupDate)}
            />
            <DetailRow
              icon={<Calendar className="h-4 w-4" />}
              label={t('bookings.dropoffDate')}
              value={formatDate(payment.booking.dropoffDate)}
            />
          </div>
        </div>
      </div>

      {/* Refund History */}
      {payment.refunds.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-900">{t('payments.refundHistory')}</h2>
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <Table
              columns={refundColumns}
              data={payment.refunds}
              keyExtractor={(row) => row.id}
              emptyMessage={t('payments.noRefunds')}
            />
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {canRefund && (
        <ProcessRefundModal
          open={showRefundModal}
          onClose={() => setShowRefundModal(false)}
          paymentId={payment.id}
          originalAmount={payment.amount}
          onSuccess={refetch}
        />
      )}
    </div>
  );
}

// ─── Helper Component ────────────────────────────────────────────────────────

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 text-gray-400">{icon}</span>
      <div className="flex-1">
        <p className="text-xs text-gray-500">{label}</p>
        <div className="text-sm font-medium text-gray-900">{value}</div>
      </div>
    </div>
  );
}
