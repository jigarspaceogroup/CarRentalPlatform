import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  CheckCircle,
  XCircle,
  Wrench,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Badge, type BadgeVariant } from '@/components/ui/Badge';
import { Table, type TableColumn } from '@/components/ui/Table';
import { Pagination } from '@/components/ui/Pagination';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { cn } from '@/lib/cn';
import {
  useVehicles,
  deleteVehicle,
  bulkChangeStatus,
  type Vehicle,
  type VehicleListParams,
} from '@/hooks/useVehicles';
import { useCategories } from '@/hooks/useCategories';
import { useBranches } from '@/hooks/useBranches';

// ─── Status helpers ──────────────────────────────────────────────────────────

const statusBadgeVariant: Record<string, BadgeVariant> = {
  available: 'green',
  unavailable: 'gray',
  in_maintenance: 'yellow',
  retired: 'red',
};

function getStatusKey(status: string): string {
  const map: Record<string, string> = {
    available: 'fleet.statusAvailable',
    unavailable: 'fleet.statusUnavailable',
    in_maintenance: 'fleet.statusMaintenance',
    retired: 'fleet.statusRetired',
  };
  return map[status] ?? status;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function VehicleListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Filters state
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<Vehicle | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Bulk action loading
  const [bulkLoading, setBulkLoading] = useState(false);

  // Search debounce
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearch(value);
      const timeout = setTimeout(() => {
        setDebouncedSearch(value);
        setPage(1);
      }, 400);
      return () => clearTimeout(timeout);
    },
    [],
  );

  // Params
  const params: VehicleListParams = useMemo(
    () => ({
      page,
      limit: 10,
      search: debouncedSearch || undefined,
      categoryId: categoryFilter || undefined,
      branchId: branchFilter || undefined,
      status: statusFilter || undefined,
      sortBy,
      sortOrder,
    }),
    [page, debouncedSearch, categoryFilter, branchFilter, statusFilter, sortBy, sortOrder],
  );

  const { data: vehicles, meta, isLoading, refetch } = useVehicles(params);
  const { categories } = useCategories();
  const { data: branches } = useBranches();

  // Flatten categories for the filter dropdown
  const categoryOptions = useMemo(() => {
    const opts: { value: string; label: string }[] = [];
    const flatten = (cats: typeof categories, prefix = '') => {
      for (const cat of cats) {
        opts.push({ value: cat.id, label: `${prefix}${cat.nameEn}` });
        if (cat.children?.length) flatten(cat.children, `${prefix}  `);
      }
    };
    flatten(categories);
    return opts;
  }, [categories]);

  const branchOptions = useMemo(
    () => branches.map((b) => ({ value: b.id, label: b.nameEn })),
    [branches],
  );

  const statusOptions = [
    { value: 'available', label: t('fleet.statusAvailable') },
    { value: 'unavailable', label: t('fleet.statusUnavailable') },
    { value: 'in_maintenance', label: t('fleet.statusMaintenance') },
    { value: 'retired', label: t('fleet.statusRetired') },
  ];

  // Sort handler
  const handleSort = useCallback(
    (key: string) => {
      if (sortBy === key) {
        setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortBy(key);
        setSortOrder('asc');
      }
      setPage(1);
    },
    [sortBy],
  );

  // Selection handlers
  const handleSelectAll = useCallback(
    (checked: boolean) => {
      if (checked) {
        setSelectedIds(new Set(vehicles.map((v) => v.id)));
      } else {
        setSelectedIds(new Set());
      }
    },
    [vehicles],
  );

  const handleSelectRow = useCallback((id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  // Delete handler
  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteVehicle(deleteTarget.id);
      toast.success(t('fleet.deleteSuccess'));
      setDeleteTarget(null);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(deleteTarget.id);
        return next;
      });
      refetch();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number } };
      if (axiosErr?.response?.status === 409) {
        toast.error(t('fleet.deleteBlockedActiveBookings'));
      } else {
        toast.error(t('fleet.deleteFailed'));
      }
    } finally {
      setIsDeleting(false);
    }
  }, [deleteTarget, refetch, t]);

  // Bulk action handler
  const handleBulkStatus = useCallback(
    async (status: string) => {
      if (selectedIds.size === 0) return;
      setBulkLoading(true);
      try {
        await bulkChangeStatus(Array.from(selectedIds), status);
        toast.success(t('fleet.bulkStatusSuccess'));
        setSelectedIds(new Set());
        refetch();
      } catch {
        toast.error(t('fleet.bulkStatusFailed'));
      } finally {
        setBulkLoading(false);
      }
    },
    [selectedIds, refetch, t],
  );

  // Table columns
  const columns: TableColumn<Vehicle>[] = useMemo(
    () => [
      {
        key: 'thumbnail',
        header: '',
        className: 'w-16',
        render: (vehicle) => (
          <div className="h-10 w-14 overflow-hidden rounded bg-gray-100">
            {vehicle.images?.[0] ? (
              <img
                src={vehicle.images[0].thumbnailUrl || vehicle.images[0].imageUrl}
                alt={`${vehicle.make} ${vehicle.model}`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-gray-400">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
            )}
          </div>
        ),
      },
      {
        key: 'name',
        header: t('fleet.vehicleName'),
        sortable: true,
        render: (vehicle) => (
          <Link
            to={`/fleet/${vehicle.id}`}
            className="font-medium text-gray-900 hover:text-primary-600"
          >
            {vehicle.make} {vehicle.model} {vehicle.year}
          </Link>
        ),
      },
      {
        key: 'licensePlate',
        header: t('fleet.licensePlate'),
        sortable: true,
        render: (vehicle) => (
          <span className="text-sm text-gray-700">{vehicle.licensePlate}</span>
        ),
      },
      {
        key: 'category',
        header: t('fleet.category'),
        render: (vehicle) => (
          <span className="text-sm text-gray-600">
            {vehicle.category?.nameEn ?? '-'}
          </span>
        ),
      },
      {
        key: 'branch',
        header: t('fleet.branch'),
        render: (vehicle) => (
          <span className="text-sm text-gray-600">
            {vehicle.branch?.nameEn ?? '-'}
          </span>
        ),
      },
      {
        key: 'dailyRate',
        header: t('fleet.dailyRate'),
        sortable: true,
        render: (vehicle) => (
          <span className="text-sm font-medium text-gray-900">
            ${vehicle.dailyRate}
          </span>
        ),
      },
      {
        key: 'status',
        header: t('common.status'),
        render: (vehicle) => (
          <Badge variant={statusBadgeVariant[vehicle.status] ?? 'gray'}>
            {t(getStatusKey(vehicle.status))}
          </Badge>
        ),
      },
      {
        key: 'actions',
        header: t('common.actions'),
        className: 'w-24',
        render: (vehicle) => (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => navigate(`/fleet/${vehicle.id}/edit`)}
              className="rounded p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              title={t('common.edit')}
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setDeleteTarget(vehicle)}
              className="rounded p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
              title={t('common.delete')}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ),
      },
    ],
    [t, navigate],
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('fleet.title')}</h1>
          <p className="mt-1 text-sm text-gray-500">{t('fleet.subtitle')}</p>
        </div>
        <Link to="/fleet/new">
          <Button>
            <Plus className="h-4 w-4" />
            {t('fleet.addVehicle')}
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder={t('fleet.searchPlaceholder')}
              className={cn(
                'block w-full rounded-lg border border-gray-300 py-2 ps-9 pe-3 text-sm',
                'placeholder:text-gray-400',
                'focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500',
              )}
            />
          </div>
          <Select
            options={categoryOptions}
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            placeholder={t('fleet.allCategories')}
          />
          <Select
            options={branchOptions}
            value={branchFilter}
            onChange={(e) => {
              setBranchFilter(e.target.value);
              setPage(1);
            }}
            placeholder={t('fleet.allBranches')}
          />
          <Select
            options={statusOptions}
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            placeholder={t('fleet.allStatuses')}
          />
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-primary-200 bg-primary-50 px-4 py-3">
          <span className="text-sm font-medium text-primary-700">
            {t('fleet.selectedCount', { count: selectedIds.size })}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkStatus('available')}
              isLoading={bulkLoading}
            >
              <CheckCircle className="h-3.5 w-3.5" />
              {t('fleet.markAvailable')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkStatus('unavailable')}
              isLoading={bulkLoading}
            >
              <XCircle className="h-3.5 w-3.5" />
              {t('fleet.markUnavailable')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkStatus('in_maintenance')}
              isLoading={bulkLoading}
            >
              <Wrench className="h-3.5 w-3.5" />
              {t('fleet.markMaintenance')}
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <Table
          columns={columns}
          data={vehicles}
          keyExtractor={(v) => v.id}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          selectable
          selectedIds={selectedIds}
          onSelectAll={handleSelectAll}
          onSelectRow={handleSelectRow}
          isLoading={isLoading}
          emptyMessage={t('fleet.noVehicles')}
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

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={t('fleet.deleteTitle')}
        message={t('fleet.deleteMessage', {
          name: deleteTarget
            ? `${deleteTarget.make} ${deleteTarget.model} ${deleteTarget.year}`
            : '',
        })}
        confirmLabel={t('common.delete')}
        isLoading={isDeleting}
      />
    </div>
  );
}
