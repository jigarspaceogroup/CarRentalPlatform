import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Search, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Badge, type BadgeVariant } from '@/components/ui/Badge';
import { Table, type TableColumn } from '@/components/ui/Table';
import { Pagination } from '@/components/ui/Pagination';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { cn } from '@/lib/cn';
import {
  usePricingRules,
  deletePricingRule,
  type PricingRule,
  type PricingRuleListParams,
} from '@/hooks/usePricingRules';
import { useVehicles } from '@/hooks/useVehicles';
import { useCategories } from '@/hooks/useCategories';
import { PricingRuleModal } from './PricingRuleModal';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ruleTypeBadgeVariant: Record<string, BadgeVariant> = {
  MULTIPLIER: 'blue',
  FIXED_OVERRIDE: 'purple',
};

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function checkDateOverlap(rule1: PricingRule, rule2: PricingRule): boolean {
  const start1 = new Date(rule1.startDate);
  const end1 = new Date(rule1.endDate);
  const start2 = new Date(rule2.startDate);
  const end2 = new Date(rule2.endDate);

  // Check if same vehicle or category
  const sameScope =
    (rule1.vehicleId && rule1.vehicleId === rule2.vehicleId) ||
    (rule1.categoryId && rule1.categoryId === rule2.categoryId);

  if (!sameScope) return false;

  // Check date overlap
  return start1 <= end2 && start2 <= end1;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function PricingRulesPage() {
  const { t } = useTranslation();

  // Filters state
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [ruleTypeFilter, setRuleTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<PricingRule | null>(null);

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<PricingRule | null>(null);
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
  const params: PricingRuleListParams = useMemo(
    () => ({
      page,
      limit: 10,
      search: debouncedSearch || undefined,
      ruleType: ruleTypeFilter || undefined,
      vehicleId: vehicleFilter || undefined,
      categoryId: categoryFilter || undefined,
      isActive: statusFilter ? statusFilter === 'active' : undefined,
    }),
    [page, debouncedSearch, ruleTypeFilter, vehicleFilter, categoryFilter, statusFilter],
  );

  const { data: rules, meta, isLoading, refetch } = usePricingRules(params);
  const { data: vehicles } = useVehicles({ page: 1, limit: 1000 });
  const { categories } = useCategories();

  // Detect conflicts
  const rulesWithConflicts = useMemo(() => {
    const conflicts = new Set<string>();
    for (let i = 0; i < rules.length; i++) {
      for (let j = i + 1; j < rules.length; j++) {
        const rule1 = rules[i];
        const rule2 = rules[j];
        if (rule1 && rule2 && checkDateOverlap(rule1, rule2)) {
          conflicts.add(rule1.id);
          conflicts.add(rule2.id);
        }
      }
    }
    return conflicts;
  }, [rules]);

  // Vehicle options
  const vehicleOptions = useMemo(
    () =>
      vehicles.map((v) => ({
        value: v.id,
        label: `${v.make} ${v.model} ${v.year} (${v.licensePlate})`,
      })),
    [vehicles],
  );

  // Category options (flatten)
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

  const ruleTypeOptions = [
    { value: 'MULTIPLIER', label: t('pricing.ruleTypeMultiplier') },
    { value: 'FIXED_OVERRIDE', label: t('pricing.ruleTypeFixed') },
  ];

  const statusOptions = [
    { value: 'active', label: t('pricing.statusActive') },
    { value: 'inactive', label: t('pricing.statusInactive') },
  ];

  // Handlers
  const handleCreate = useCallback(() => {
    setEditingRule(null);
    setIsModalOpen(true);
  }, []);

  const handleEdit = useCallback((rule: PricingRule) => {
    setEditingRule(rule);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingRule(null);
  }, []);

  const handleSuccess = useCallback(() => {
    setIsModalOpen(false);
    setEditingRule(null);
    refetch();
  }, [refetch]);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deletePricingRule(deleteTarget.id);
      toast.success(t('pricing.deleteSuccess'));
      setDeleteTarget(null);
      refetch();
    } catch {
      toast.error(t('pricing.deleteFailed'));
    } finally {
      setIsDeleting(false);
    }
  }, [deleteTarget, refetch, t]);

  // Table columns
  const columns: TableColumn<PricingRule>[] = useMemo(
    () => [
      {
        key: 'name',
        header: t('pricing.ruleName'),
        render: (rule) => (
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900">{rule.name}</span>
            {rulesWithConflicts.has(rule.id) && (
              <div
                className="flex items-center gap-1 rounded bg-yellow-100 px-1.5 py-0.5 text-xs text-yellow-700"
                title={t('pricing.hasConflicts')}
              >
                <AlertTriangle className="h-3 w-3" />
                <span>{t('pricing.conflict')}</span>
              </div>
            )}
          </div>
        ),
      },
      {
        key: 'ruleType',
        header: t('pricing.ruleType'),
        render: (rule) => (
          <Badge variant={ruleTypeBadgeVariant[rule.ruleType] ?? 'gray'}>
            {t(
              rule.ruleType === 'MULTIPLIER'
                ? 'pricing.ruleTypeMultiplier'
                : 'pricing.ruleTypeFixed',
            )}
          </Badge>
        ),
      },
      {
        key: 'ruleValue',
        header: t('pricing.value'),
        render: (rule) => (
          <span className="text-sm font-medium text-gray-900">
            {rule.ruleType === 'MULTIPLIER'
              ? `${rule.ruleValue}x`
              : `$${Number(rule.ruleValue).toFixed(2)}`}
          </span>
        ),
      },
      {
        key: 'dateRange',
        header: t('pricing.dateRange'),
        render: (rule) => (
          <span className="text-sm text-gray-700">
            {formatDate(rule.startDate)} - {formatDate(rule.endDate)}
          </span>
        ),
      },
      {
        key: 'scope',
        header: t('pricing.scope'),
        render: (rule) => (
          <span className="text-sm text-gray-600">
            {rule.vehicle
              ? `${rule.vehicle.make} ${rule.vehicle.model} ${rule.vehicle.year}`
              : rule.category
                ? rule.category.nameEn
                : '-'}
          </span>
        ),
      },
      {
        key: 'status',
        header: t('common.status'),
        render: (rule) => (
          <Badge variant={rule.isActive ? 'green' : 'gray'}>
            {t(rule.isActive ? 'pricing.statusActive' : 'pricing.statusInactive')}
          </Badge>
        ),
      },
      {
        key: 'actions',
        header: t('common.actions'),
        className: 'w-24',
        render: (rule) => (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleEdit(rule)}
              className="rounded p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              title={t('common.edit')}
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setDeleteTarget(rule)}
              className="rounded p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
              title={t('common.delete')}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ),
      },
    ],
    [t, handleEdit, rulesWithConflicts],
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('pricing.rulesTitle')}</h1>
          <p className="mt-1 text-sm text-gray-500">{t('pricing.rulesSubtitle')}</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4" />
          {t('pricing.createRule')}
        </Button>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="relative">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder={t('pricing.searchRules')}
              className={cn(
                'block w-full rounded-lg border border-gray-300 py-2 ps-9 pe-3 text-sm',
                'placeholder:text-gray-400',
                'focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500',
              )}
            />
          </div>
          <Select
            options={ruleTypeOptions}
            value={ruleTypeFilter}
            onChange={(e) => {
              setRuleTypeFilter(e.target.value);
              setPage(1);
            }}
            placeholder={t('pricing.allRuleTypes')}
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
          <Select
            options={vehicleOptions}
            value={vehicleFilter}
            onChange={(e) => {
              setVehicleFilter(e.target.value);
              setPage(1);
            }}
            placeholder={t('pricing.filterByVehicle')}
          />
          <Select
            options={categoryOptions}
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            placeholder={t('pricing.filterByCategory')}
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <Table
          columns={columns}
          data={rules}
          keyExtractor={(r) => r.id}
          isLoading={isLoading}
          emptyMessage={t('pricing.noRules')}
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
        <PricingRuleModal
          rule={editingRule}
          onClose={handleCloseModal}
          onSuccess={handleSuccess}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={t('pricing.deleteRuleTitle')}
        message={t('pricing.deleteRuleMessage', { name: deleteTarget?.name ?? '' })}
        confirmLabel={t('common.delete')}
        isLoading={isDeleting}
      />
    </div>
  );
}
