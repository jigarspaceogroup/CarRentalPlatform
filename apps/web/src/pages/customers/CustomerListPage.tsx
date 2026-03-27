import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Search, Download, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge, type BadgeVariant } from '@/components/ui/Badge';
import { Table, type TableColumn } from '@/components/ui/Table';
import { Pagination } from '@/components/ui/Pagination';
import { cn } from '@/lib/cn';
import {
  useCustomers,
  exportCustomers,
  type CustomerListItem,
  type CustomerStatus,
} from '@/hooks/useCustomers';

const STATUS_TABS: (CustomerStatus | 'ALL')[] = ['ALL', 'ACTIVE', 'SUSPENDED', 'BANNED'];

function getCustomerStatusVariant(status: CustomerStatus): BadgeVariant {
  switch (status) {
    case 'ACTIVE':
      return 'green';
    case 'SUSPENDED':
      return 'yellow';
    case 'BANNED':
      return 'red';
    default:
      return 'gray';
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'SAR',
  }).format(amount);
}

function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(dateString));
}

export function CustomerListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<CustomerStatus | 'ALL'>('ALL');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isExporting, setIsExporting] = useState(false);

  const {
    data: customers,
    meta,
    isLoading,
  } = useCustomers({
    page,
    limit: 20,
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
      const blob = await exportCustomers({
        status: activeTab === 'ALL' ? undefined : activeTab,
        search: search || undefined,
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `customers-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success(t('customers.exportSuccess'));
    } catch {
      toast.error(t('customers.exportFailed'));
    } finally {
      setIsExporting(false);
    }
  };

  const columns: TableColumn<CustomerListItem>[] = useMemo(
    () => [
      {
        key: 'name',
        header: t('customers.name'),
        sortable: true,
        render: (row) => (
          <button
            onClick={() => navigate(`/customers/${row.id}`)}
            className="font-medium text-primary-600 hover:underline"
          >
            {row.firstName} {row.lastName}
          </button>
        ),
      },
      {
        key: 'email',
        header: t('customers.email'),
        render: (row) => <span className="text-sm text-gray-600">{row.email}</span>,
      },
      {
        key: 'phone',
        header: t('customers.phone'),
        render: (row) => <span className="text-sm text-gray-600">{row.phone}</span>,
      },
      {
        key: 'createdAt',
        header: t('customers.registrationDate'),
        sortable: true,
        render: (row) => <span className="text-sm text-gray-600">{formatDate(row.createdAt)}</span>,
      },
      {
        key: 'totalBookings',
        header: t('customers.totalBookings'),
        sortable: true,
        render: (row) => (
          <span className="font-medium text-gray-900">{row.totalBookings}</span>
        ),
      },
      {
        key: 'totalSpent',
        header: t('customers.totalSpent'),
        sortable: true,
        render: (row) => (
          <span className="font-medium text-gray-900">{formatCurrency(row.totalSpent)}</span>
        ),
      },
      {
        key: 'status',
        header: t('common.status'),
        render: (row) => (
          <Badge variant={getCustomerStatusVariant(row.status)}>
            {t(`customers.status${row.status}`)}
          </Badge>
        ),
      },
      {
        key: 'actions',
        header: t('common.actions'),
        render: (row) => (
          <Button variant="ghost" size="sm" onClick={() => navigate(`/customers/${row.id}`)}>
            <Eye className="h-4 w-4" />
          </Button>
        ),
      },
    ],
    [t, navigate],
  );

  const getTabLabel = (tab: CustomerStatus | 'ALL'): string => {
    if (tab === 'ALL') return t('customers.allCustomers');
    return t(`customers.status${tab}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{t('customers.title')}</h1>
          <p className="mt-1 text-sm text-gray-500">{t('customers.subtitle')}</p>
        </div>
        <Button variant="outline" onClick={handleExport} isLoading={isExporting}>
          <Download className="h-4 w-4" />
          {t('customers.exportCsv')}
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
          placeholder={t('customers.searchPlaceholder')}
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
          data={customers}
          keyExtractor={(row) => row.id}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          isLoading={isLoading}
          emptyMessage={t('customers.noCustomers')}
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
