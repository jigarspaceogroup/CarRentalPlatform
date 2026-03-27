import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Badge, type BadgeVariant } from '@/components/ui/Badge';
import { Table, type TableColumn } from '@/components/ui/Table';
import { Pagination } from '@/components/ui/Pagination';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { cn } from '@/lib/cn';
import {
  useDiscountCodes,
  deleteDiscountCode,
  type DiscountCode,
  type DiscountCodeListParams,
} from '@/hooks/useDiscountCodes';
import { DiscountCodeModal } from './DiscountCodeModal';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const discountTypeBadgeVariant: Record<string, BadgeVariant> = {
  PERCENTAGE: 'green',
  FIXED_AMOUNT: 'blue',
};

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function calculateUsagePercent(usageCount: number, usageLimit?: number): number {
  if (!usageLimit) return 0;
  return Math.min(100, Math.round((usageCount / usageLimit) * 100));
}

// ─── Component ───────────────────────────────────────────────────────────────

export function DiscountCodesPage() {
  const { t } = useTranslation();

  // Filters state
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [discountTypeFilter, setDiscountTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<DiscountCode | null>(null);

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<DiscountCode | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Search debounce
  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    const timeout = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 400);
    return () => clearTimeout(timeout);
  }, []);

  // Params
  const params: DiscountCodeListParams = useMemo(
    () => ({
      page,
      limit: 10,
      search: debouncedSearch || undefined,
      discountType: discountTypeFilter || undefined,
      isActive: statusFilter ? statusFilter === 'active' : undefined,
    }),
    [page, debouncedSearch, discountTypeFilter, statusFilter],
  );

  const { data: codes, meta, isLoading, refetch } = useDiscountCodes(params);

  const discountTypeOptions = [
    { value: 'PERCENTAGE', label: t('pricing.discountTypePercentage') },
    { value: 'FIXED_AMOUNT', label: t('pricing.discountTypeFixed') },
  ];

  const statusOptions = [
    { value: 'active', label: t('pricing.statusActive') },
    { value: 'inactive', label: t('pricing.statusInactive') },
  ];

  // Handlers
  const handleCreate = useCallback(() => {
    setEditingCode(null);
    setIsModalOpen(true);
  }, []);

  const handleEdit = useCallback((code: DiscountCode) => {
    setEditingCode(code);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingCode(null);
  }, []);

  const handleSuccess = useCallback(() => {
    setIsModalOpen(false);
    setEditingCode(null);
    refetch();
  }, [refetch]);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteDiscountCode(deleteTarget.id);
      toast.success(t('pricing.deleteCodeSuccess'));
      setDeleteTarget(null);
      refetch();
    } catch {
      toast.error(t('pricing.deleteCodeFailed'));
    } finally {
      setIsDeleting(false);
    }
  }, [deleteTarget, refetch, t]);

  // Table columns
  const columns: TableColumn<DiscountCode>[] = useMemo(
    () => [
      {
        key: 'code',
        header: t('pricing.code'),
        render: (code) => (
          <span className="font-mono font-medium text-gray-900">{code.code}</span>
        ),
      },
      {
        key: 'discountType',
        header: t('pricing.discountType'),
        render: (code) => (
          <Badge variant={discountTypeBadgeVariant[code.discountType] ?? 'gray'}>
            {t(
              code.discountType === 'PERCENTAGE'
                ? 'pricing.discountTypePercentage'
                : 'pricing.discountTypeFixed',
            )}
          </Badge>
        ),
      },
      {
        key: 'discountValue',
        header: t('pricing.value'),
        render: (code) => (
          <span className="text-sm font-medium text-gray-900">
            {code.discountType === 'PERCENTAGE'
              ? `${Number(code.discountValue)}%`
              : `$${Number(code.discountValue).toFixed(2)}`}
          </span>
        ),
      },
      {
        key: 'usage',
        header: t('pricing.usage'),
        render: (code) => {
          const percent = calculateUsagePercent(code.usageCount, code.usageLimit ?? undefined);
          return (
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span>
                    {code.usageCount} / {code.usageLimit ?? '∞'}
                  </span>
                  {code.usageLimit && <span>{percent}%</span>}
                </div>
                {code.usageLimit && (
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        percent >= 90 ? 'bg-red-500' : percent >= 70 ? 'bg-yellow-500' : 'bg-green-500',
                      )}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          );
        },
      },
      {
        key: 'validity',
        header: t('pricing.validityPeriod'),
        render: (code) => (
          <span className="text-sm text-gray-700">
            {formatDate(code.startsAt)} - {formatDate(code.expiresAt)}
          </span>
        ),
      },
      {
        key: 'status',
        header: t('common.status'),
        render: (code) => {
          const now = new Date();
          const isExpired = new Date(code.expiresAt) < now;
          const isNotStarted = new Date(code.startsAt) > now;

          if (!code.isActive) {
            return <Badge variant="gray">{t('pricing.statusInactive')}</Badge>;
          }
          if (isExpired) {
            return <Badge variant="red">{t('pricing.statusExpired')}</Badge>;
          }
          if (isNotStarted) {
            return <Badge variant="yellow">{t('pricing.statusScheduled')}</Badge>;
          }
          return <Badge variant="green">{t('pricing.statusActive')}</Badge>;
        },
      },
      {
        key: 'actions',
        header: t('common.actions'),
        className: 'w-24',
        render: (code) => (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleEdit(code)}
              className="rounded p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              title={t('common.edit')}
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setDeleteTarget(code)}
              className="rounded p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
              title={t('common.delete')}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ),
      },
    ],
    [t, handleEdit],
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('pricing.codesTitle')}</h1>
          <p className="mt-1 text-sm text-gray-500">{t('pricing.codesSubtitle')}</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4" />
          {t('pricing.createCode')}
        </Button>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="relative">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder={t('pricing.searchCodes')}
              className={cn(
                'block w-full rounded-lg border border-gray-300 py-2 ps-9 pe-3 text-sm',
                'placeholder:text-gray-400',
                'focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500',
              )}
            />
          </div>
          <Select
            options={discountTypeOptions}
            value={discountTypeFilter}
            onChange={(e) => {
              setDiscountTypeFilter(e.target.value);
              setPage(1);
            }}
            placeholder={t('pricing.allDiscountTypes')}
          />
          <Select
            options={statusOptions}
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            placeholder={t('pricing.allStatuses')}
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <Table
          columns={columns}
          data={codes}
          keyExtractor={(c) => c.id}
          isLoading={isLoading}
          emptyMessage={t('pricing.noCodes')}
        />

        {/* Pagination */}
        {meta.totalPages > 1 && (
          <div className="border-t border-gray-200 px-4 py-3">
            <Pagination
              page={meta.page}
              totalPages={meta.totalPages}
              totalItems={meta.total}
              limit={10}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <DiscountCodeModal code={editingCode} onClose={handleCloseModal} onSuccess={handleSuccess} />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={t('pricing.deleteCodeTitle')}
        message={t('pricing.deleteCodeMessage', { code: deleteTarget?.code ?? '' })}
        confirmLabel={t('common.delete')}
        isLoading={isDeleting}
      />
    </div>
  );
}
