import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Search, Download, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Table, type TableColumn } from '@/components/ui/Table';
import { Pagination } from '@/components/ui/Pagination';
import { cn } from '@/lib/cn';
import {
  useBookings,
  exportBookings,
  type BookingListItem,
  type BookingStatus,
} from '@/hooks/useBookings';
import {
  getBookingStatusVariant,
  getBookingStatusLabel,
  formatCurrency,
  formatDate,
} from '@/pages/bookings/bookingUtils';

const STATUS_TABS: (BookingStatus | 'ALL')[] = [
  'ALL',
  'PENDING',
  'CONFIRMED',
  'ACTIVE_RENTAL',
  'COMPLETED',
  'CANCELLED',
  'REJECTED',
];

export function BookingListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<BookingStatus | 'ALL'>('ALL');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isExporting, setIsExporting] = useState(false);

  const {
    data: bookings,
    meta,
    isLoading,
  } = useBookings({
    page,
    limit: 10,
    status: activeTab === 'ALL' ? undefined : activeTab,
    search: search || undefined,
    sortBy,
    sortOrder,
  });

  const handleSort = useCallback(
    (key: string) => {
      if (sortBy === key) {
        setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortBy(key);
        setSortOrder('asc');
      }
    },
    [sortBy],
  );

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const blob = await exportBookings({
        status: activeTab === 'ALL' ? undefined : activeTab,
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bookings-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success(t('bookings.exportSuccess'));
    } catch {
      toast.error(t('bookings.exportFailed'));
    } finally {
      setIsExporting(false);
    }
  };

  const columns: TableColumn<BookingListItem>[] = useMemo(
    () => [
      {
        key: 'referenceNumber',
        header: t('bookings.reference'),
        sortable: true,
        render: (row) => (
          <button
            onClick={() => navigate(`/bookings/${row.id}`)}
            className="font-medium text-primary-600 hover:underline"
          >
            #{row.referenceNumber}
          </button>
        ),
      },
      {
        key: 'customer',
        header: t('bookings.customer'),
        render: (row) => (
          <div>
            <p className="font-medium text-gray-900">
              {row.customer.firstName} {row.customer.lastName}
            </p>
            <p className="text-xs text-gray-500">{row.customer.phone}</p>
          </div>
        ),
      },
      {
        key: 'vehicle',
        header: t('bookings.vehicle'),
        render: (row) => (
          <div>
            <p className="font-medium text-gray-900">
              {row.vehicle.make} {row.vehicle.model}
            </p>
            <p className="text-xs text-gray-500">{row.vehicle.licensePlate}</p>
          </div>
        ),
      },
      {
        key: 'pickupDate',
        header: t('bookings.pickupDate'),
        sortable: true,
        render: (row) => (
          <span className="text-sm text-gray-600">{formatDate(row.pickupDate)}</span>
        ),
      },
      {
        key: 'dropoffDate',
        header: t('bookings.dropoffDate'),
        sortable: true,
        render: (row) => (
          <span className="text-sm text-gray-600">{formatDate(row.dropoffDate)}</span>
        ),
      },
      {
        key: 'totalAmount',
        header: t('bookings.totalAmount'),
        sortable: true,
        render: (row) => (
          <span className="font-medium text-gray-900">{formatCurrency(row.totalAmount)}</span>
        ),
      },
      {
        key: 'status',
        header: t('common.status'),
        render: (row) => (
          <Badge variant={getBookingStatusVariant(row.status)}>
            {getBookingStatusLabel(t, row.status)}
          </Badge>
        ),
      },
      {
        key: 'actions',
        header: t('common.actions'),
        render: (row) => (
          <Button variant="ghost" size="sm" onClick={() => navigate(`/bookings/${row.id}`)}>
            <Eye className="h-4 w-4" />
          </Button>
        ),
      },
    ],
    [t, navigate],
  );

  const getTabLabel = (tab: BookingStatus | 'ALL'): string => {
    if (tab === 'ALL') return t('bookings.allBookings');
    return getBookingStatusLabel(t, tab);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{t('bookings.title')}</h1>
          <p className="mt-1 text-sm text-gray-500">{t('bookings.subtitle')}</p>
        </div>
        <Button variant="outline" onClick={handleExport} isLoading={isExporting}>
          <Download className="h-4 w-4" />
          {t('bookings.exportCsv')}
        </Button>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-1 overflow-x-auto rounded-lg border border-gray-200 bg-gray-50 p-1">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setPage(1);
            }}
            className={cn(
              'whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              activeTab === tab
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900',
            )}
          >
            {getTabLabel(tab)}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder={t('bookings.searchPlaceholder')}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="ps-9"
        />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <Table
          columns={columns}
          data={bookings}
          keyExtractor={(row) => row.id}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          isLoading={isLoading}
          emptyMessage={t('bookings.noBookings')}
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
