import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Download, Eye, DollarSign, TrendingUp, TrendingDown, Banknote } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Table, type TableColumn } from '@/components/ui/Table';
import { Pagination } from '@/components/ui/Pagination';
import { usePayments, exportPayments, type PaymentListItem } from '@/hooks/usePayments';
import { useFinancialSummary } from '@/hooks/useFinancialSummary';
import { formatCurrency, formatDate } from '@/pages/bookings/bookingUtils';
import {
  getPaymentStatusVariant,
  getPaymentStatusLabel,
  getPaymentMethodLabel,
} from '@/pages/payments/paymentUtils';

export function TransactionListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [method, setMethod] = useState('');
  const [status, setStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const {
    data: payments,
    meta,
    isLoading,
  } = usePayments({
    page,
    limit: 10,
    method: method || undefined,
    status: status || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    search: search || undefined,
  });

  const { summary, isLoading: isSummaryLoading } = useFinancialSummary({
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const blob = await exportPayments({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payments-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success(t('payments.exportSuccess'));
    } catch {
      toast.error(t('payments.exportFailed'));
    } finally {
      setIsExporting(false);
    }
  };

  const methodOptions = [
    { value: '', label: t('payments.allMethods') },
    { value: 'CREDIT_CARD', label: t('payments.methods.creditCard') },
    { value: 'DEBIT_CARD', label: t('payments.methods.debitCard') },
    { value: 'COD', label: t('payments.methods.cod') },
  ];

  const statusOptions = [
    { value: '', label: t('payments.allStatuses') },
    { value: 'PENDING', label: t('payments.statuses.pending') },
    { value: 'COMPLETED', label: t('payments.statuses.completed') },
    { value: 'FAILED', label: t('payments.statuses.failed') },
    { value: 'REFUNDED', label: t('payments.statuses.refunded') },
  ];

  const columns: TableColumn<PaymentListItem>[] = useMemo(
    () => [
      {
        key: 'bookingRef',
        header: t('payments.bookingRef'),
        render: (row) => (
          <button
            onClick={() => navigate(`/bookings/${row.booking.id}`)}
            className="font-medium text-primary-600 hover:underline"
          >
            #{row.booking.referenceNumber}
          </button>
        ),
      },
      {
        key: 'amount',
        header: t('payments.amount'),
        render: (row) => (
          <span className="font-medium text-gray-900">{formatCurrency(row.amount)}</span>
        ),
      },
      {
        key: 'method',
        header: t('payments.method'),
        render: (row) => (
          <span className="text-sm text-gray-600">{getPaymentMethodLabel(t, row.method)}</span>
        ),
      },
      {
        key: 'status',
        header: t('common.status'),
        render: (row) => (
          <Badge variant={getPaymentStatusVariant(row.status)}>
            {getPaymentStatusLabel(t, row.status)}
          </Badge>
        ),
      },
      {
        key: 'date',
        header: t('common.date'),
        render: (row) => <span className="text-sm text-gray-600">{formatDate(row.createdAt)}</span>,
      },
      {
        key: 'actions',
        header: t('common.actions'),
        render: (row) => (
          <Button variant="ghost" size="sm" onClick={() => navigate(`/payments/${row.id}`)}>
            <Eye className="h-4 w-4" />
          </Button>
        ),
      },
    ],
    [t, navigate],
  );

  const summaryCards = useMemo(
    () => [
      {
        key: 'totalRevenue',
        label: t('payments.totalRevenue'),
        value: summary?.totalRevenue ?? 0,
        icon: DollarSign,
        color: 'text-green-600',
        bg: 'bg-green-50',
      },
      {
        key: 'totalRefunds',
        label: t('payments.totalRefunds'),
        value: summary?.totalRefunds ?? 0,
        icon: TrendingDown,
        color: 'text-red-600',
        bg: 'bg-red-50',
      },
      {
        key: 'outstandingCod',
        label: t('payments.outstandingCod'),
        value: summary?.outstandingCod ?? 0,
        icon: Banknote,
        color: 'text-yellow-600',
        bg: 'bg-yellow-50',
      },
      {
        key: 'netRevenue',
        label: t('payments.netRevenue'),
        value: summary?.netRevenue ?? 0,
        icon: TrendingUp,
        color: 'text-blue-600',
        bg: 'bg-blue-50',
      },
    ],
    [summary, t],
  );

  const handleFilterReset = useCallback(() => {
    setSearch('');
    setMethod('');
    setStatus('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{t('payments.title')}</h1>
          <p className="mt-1 text-sm text-gray-500">{t('payments.subtitle')}</p>
        </div>
        <Button variant="outline" onClick={handleExport} isLoading={isExporting}>
          <Download className="h-4 w-4" />
          {t('payments.exportCsv')}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => (
          <div key={card.key} className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${card.bg}`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
              <div>
                <p className="text-sm text-gray-500">{card.label}</p>
                {isSummaryLoading ? (
                  <div className="mt-1 h-6 w-20 animate-pulse rounded bg-gray-200" />
                ) : (
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(card.value)}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-full sm:w-48">
          <Input
            label={t('payments.startDate')}
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="w-full sm:w-48">
          <Input
            label={t('payments.endDate')}
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="w-full sm:w-44">
          <Select
            label={t('payments.method')}
            options={methodOptions}
            value={method}
            onChange={(e) => {
              setMethod(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="w-full sm:w-44">
          <Select
            label={t('common.status')}
            options={statusOptions}
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="w-full sm:w-64">
          <Input
            label={t('common.search')}
            placeholder={t('payments.searchPlaceholder')}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <Button variant="ghost" size="sm" onClick={handleFilterReset}>
          {t('payments.clearFilters')}
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <Table
          columns={columns}
          data={payments}
          keyExtractor={(row) => row.id}
          isLoading={isLoading}
          emptyMessage={t('payments.noPayments')}
        />
      </div>

      {/* Pagination */}
      <Pagination
        page={meta.page}
        totalPages={meta.totalPages}
        totalItems={meta.total}
        limit={meta.limit}
        onPageChange={setPage}
      />
    </div>
  );
}
