import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  MapPin,
  Phone,
  Mail,
  Pencil,
  Car,
  Power,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { cn } from '@/lib/cn';
import { useBranches, toggleBranchActive, type Branch } from '@/hooks/useBranches';

// ─── Component ───────────────────────────────────────────────────────────────

export function BranchListPage() {
  const { t } = useTranslation();

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);

  const [deactivateTarget, setDeactivateTarget] = useState<Branch | null>(null);
  const [isToggling, setIsToggling] = useState(false);

  // Search debounce
  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    const timeout = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 400);
    return () => clearTimeout(timeout);
  }, []);

  const { data: branches, meta, isLoading, refetch } = useBranches({
    page,
    limit: 12,
    search: debouncedSearch || undefined,
  });

  // Toggle active
  const handleToggleActive = useCallback(async () => {
    if (!deactivateTarget) return;
    setIsToggling(true);
    try {
      const newActive = !deactivateTarget.isActive;
      await toggleBranchActive(deactivateTarget.id, newActive);
      toast.success(
        newActive ? t('branches.activateSuccess') : t('branches.deactivateSuccess'),
      );
      setDeactivateTarget(null);
      refetch();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number } };
      if (axiosErr?.response?.status === 409) {
        toast.error(t('branches.deactivateBlockedLast'));
      } else {
        toast.error(t('branches.toggleFailed'));
      }
    } finally {
      setIsToggling(false);
    }
  }, [deactivateTarget, refetch, t]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm text-gray-500">{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('branches.title')}</h1>
          <p className="mt-1 text-sm text-gray-500">{t('branches.subtitle')}</p>
        </div>
        <Link to="/branches/new">
          <Button>
            <Plus className="h-4 w-4" />
            {t('branches.addBranch')}
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder={t('branches.searchPlaceholder')}
          className={cn(
            'block w-full rounded-lg border border-gray-300 py-2 ps-9 pe-3 text-sm',
            'placeholder:text-gray-400',
            'focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500',
          )}
        />
      </div>

      {/* Branch Cards Grid */}
      {branches.length === 0 ? (
        <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white shadow-sm">
          <MapPin className="h-10 w-10 text-gray-300" />
          <p className="text-sm text-gray-500">{t('branches.noBranches')}</p>
          <Link to="/branches/new">
            <Button size="sm">
              <Plus className="h-4 w-4" />
              {t('branches.addBranch')}
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {branches.map((branch) => (
            <BranchCard
              key={branch.id}
              branch={branch}
              onToggleActive={setDeactivateTarget}
              t={t}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <Pagination
          page={meta.page}
          totalPages={meta.totalPages}
          totalItems={meta.total}
          limit={12}
          onPageChange={setPage}
        />
      )}

      {/* Deactivate/Activate Confirmation */}
      <ConfirmDialog
        open={!!deactivateTarget}
        onClose={() => setDeactivateTarget(null)}
        onConfirm={handleToggleActive}
        title={
          deactivateTarget?.isActive
            ? t('branches.deactivateTitle')
            : t('branches.activateTitle')
        }
        message={
          deactivateTarget?.isActive
            ? t('branches.deactivateMessage', { name: deactivateTarget?.nameEn ?? '' })
            : t('branches.activateMessage', { name: deactivateTarget?.nameEn ?? '' })
        }
        confirmLabel={
          deactivateTarget?.isActive
            ? t('branches.deactivateBtn')
            : t('branches.activateBtn')
        }
        variant={deactivateTarget?.isActive ? 'danger' : 'primary'}
        isLoading={isToggling}
      />
    </div>
  );
}

// ─── Branch Card ─────────────────────────────────────────────────────────────

function BranchCard({
  branch,
  onToggleActive,
  t,
}: {
  branch: Branch;
  onToggleActive: (branch: Branch) => void;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      {/* Header */}
      <div className="mb-3 flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold text-gray-900">
            {branch.nameEn}
          </h3>
          <p className="truncate text-sm text-gray-500" dir="rtl">
            {branch.nameAr}
          </p>
        </div>
        <Badge variant={branch.isActive ? 'green' : 'gray'}>
          {branch.isActive ? t('branches.active') : t('branches.inactive')}
        </Badge>
      </div>

      {/* Details */}
      <div className="mb-4 space-y-2">
        <div className="flex items-start gap-2">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
          <span className="text-sm text-gray-600">{branch.addressEn}</span>
        </div>
        {branch.phone && (
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 shrink-0 text-gray-400" />
            <span className="text-sm text-gray-600" dir="ltr">
              {branch.phone}
            </span>
          </div>
        )}
        {branch.email && (
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 shrink-0 text-gray-400" />
            <span className="text-sm text-gray-600">{branch.email}</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Car className="h-4 w-4 shrink-0 text-gray-400" />
          <span className="text-sm text-gray-600">
            {t('branches.vehicleCount', { count: branch.vehicleCount ?? 0 })}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 border-t border-gray-100 pt-3">
        <Link to={`/branches/${branch.id}/edit`} className="flex-1">
          <Button variant="outline" size="sm" className="w-full">
            <Pencil className="h-3.5 w-3.5" />
            {t('common.edit')}
          </Button>
        </Link>
        <Button
          variant={branch.isActive ? 'ghost' : 'outline'}
          size="sm"
          className={cn(
            'flex-1',
            branch.isActive && 'text-red-600 hover:bg-red-50 hover:text-red-700',
          )}
          onClick={() => onToggleActive(branch)}
        >
          <Power className="h-3.5 w-3.5" />
          {branch.isActive ? t('branches.deactivateBtn') : t('branches.activateBtn')}
        </Button>
      </div>
    </div>
  );
}
