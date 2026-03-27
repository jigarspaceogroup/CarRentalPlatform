import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  ChevronRight,
  ChevronDown,
  Pencil,
  Trash2,
  ArrowUp,
  ArrowDown,
  FolderOpen,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { cn } from '@/lib/cn';
import {
  useCategories,
  deleteCategory,
  reorderCategories,
  type Category,
} from '@/hooks/useCategories';
import { CategoryFormModal } from './CategoryFormModal';

// ─── Component ───────────────────────────────────────────────────────────────

export function CategoryListPage() {
  const { t } = useTranslation();

  const { categories, isLoading, refetch } = useCategories();

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toggle expand
  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // Delete
  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteCategory(deleteTarget.id);
      toast.success(t('categories.deleteSuccess'));
      setDeleteTarget(null);
      refetch();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number } };
      if (axiosErr?.response?.status === 409) {
        toast.error(t('categories.deleteBlocked'));
      } else {
        toast.error(t('categories.deleteFailed'));
      }
    } finally {
      setIsDeleting(false);
    }
  }, [deleteTarget, refetch, t]);

  // Reorder
  const handleReorder = useCallback(
    async (category: Category, direction: 'up' | 'down', siblings: Category[]) => {
      const currentIndex = siblings.findIndex((c) => c.id === category.id);
      const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

      if (targetIndex < 0 || targetIndex >= siblings.length) return;

      const items = siblings.map((c, i) => {
        if (i === currentIndex) return { id: c.id, sortOrder: targetIndex };
        if (i === targetIndex) return { id: c.id, sortOrder: currentIndex };
        return { id: c.id, sortOrder: i };
      });

      try {
        await reorderCategories(items);
        refetch();
      } catch {
        toast.error(t('categories.reorderFailed'));
      }
    },
    [refetch, t],
  );

  // Modal close
  const handleModalClose = useCallback(() => {
    setShowCreateModal(false);
    setEditCategory(null);
  }, []);

  const handleModalSuccess = useCallback(() => {
    handleModalClose();
    refetch();
  }, [handleModalClose, refetch]);

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
          <h1 className="text-2xl font-bold text-gray-900">{t('categories.title')}</h1>
          <p className="mt-1 text-sm text-gray-500">{t('categories.subtitle')}</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4" />
          {t('categories.addCategory')}
        </Button>
      </div>

      {/* Category Tree */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        {categories.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center gap-3 p-6">
            <FolderOpen className="h-10 w-10 text-gray-300" />
            <p className="text-sm text-gray-500">{t('categories.noCategories')}</p>
            <Button size="sm" onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4" />
              {t('categories.addCategory')}
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {categories
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((category, index) => (
                <CategoryRow
                  key={category.id}
                  category={category}
                  siblings={categories}
                  index={index}
                  depth={0}
                  expandedIds={expandedIds}
                  onToggleExpand={toggleExpand}
                  onEdit={setEditCategory}
                  onDelete={setDeleteTarget}
                  onReorder={handleReorder}
                  t={t}
                />
              ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editCategory) && (
        <CategoryFormModal
          category={editCategory}
          categories={categories}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={t('categories.deleteTitle')}
        message={t('categories.deleteMessage', { name: deleteTarget?.nameEn ?? '' })}
        confirmLabel={t('common.delete')}
        isLoading={isDeleting}
      />
    </div>
  );
}

// ─── Category Row ────────────────────────────────────────────────────────────

function CategoryRow({
  category,
  siblings,
  index,
  depth,
  expandedIds,
  onToggleExpand,
  onEdit,
  onDelete,
  onReorder,
  t,
}: {
  category: Category;
  siblings: Category[];
  index: number;
  depth: number;
  expandedIds: Set<string>;
  onToggleExpand: (id: string) => void;
  onEdit: (cat: Category) => void;
  onDelete: (cat: Category) => void;
  onReorder: (cat: Category, dir: 'up' | 'down', siblings: Category[]) => void;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  const hasChildren = (category.children?.length ?? 0) > 0;
  const isExpanded = expandedIds.has(category.id);
  const sortedChildren = [...(category.children || [])].sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );

  return (
    <>
      <div
        className={cn(
          'flex items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-50',
          depth > 0 && 'bg-gray-50/50',
        )}
        style={{ paddingInlineStart: `${16 + depth * 32}px` }}
      >
        {/* Expand toggle */}
        <button
          type="button"
          onClick={() => hasChildren && onToggleExpand(category.id)}
          className={cn(
            'flex h-6 w-6 shrink-0 items-center justify-center rounded',
            hasChildren
              ? 'text-gray-500 hover:bg-gray-200'
              : 'pointer-events-none text-transparent',
          )}
        >
          {hasChildren &&
            (isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            ))}
        </button>

        {/* Image */}
        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-gray-100">
          {category.imageUrl ? (
            <img
              src={category.imageUrl}
              alt={category.nameEn}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-gray-300">
              <FolderOpen className="h-5 w-5" />
            </div>
          )}
        </div>

        {/* Name columns */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-gray-900">{category.nameEn}</p>
          <p className="truncate text-xs text-gray-500" dir="rtl">
            {category.nameAr}
          </p>
        </div>

        {/* Vehicle count */}
        <span className="hidden text-sm text-gray-500 sm:block">
          {t('categories.vehicleCount', { count: category.vehicleCount ?? 0 })}
        </span>

        {/* Sort order */}
        <span className="hidden text-xs text-gray-400 md:block">
          #{category.sortOrder}
        </span>

        {/* Active badge */}
        <Badge variant={category.isActive ? 'green' : 'gray'}>
          {category.isActive ? t('categories.active') : t('categories.inactive')}
        </Badge>

        {/* Reorder */}
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => onReorder(category, 'up', siblings)}
            disabled={index === 0}
            className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:opacity-30"
            title={t('categories.moveUp')}
          >
            <ArrowUp className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onReorder(category, 'down', siblings)}
            disabled={index === siblings.length - 1}
            className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:opacity-30"
            title={t('categories.moveDown')}
          >
            <ArrowDown className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onEdit(category)}
            className="rounded p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            title={t('common.edit')}
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(category)}
            className="rounded p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
            title={t('common.delete')}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Children */}
      {hasChildren &&
        isExpanded &&
        sortedChildren.map((child, childIndex) => (
          <CategoryRow
            key={child.id}
            category={child}
            siblings={sortedChildren}
            index={childIndex}
            depth={depth + 1}
            expandedIds={expandedIds}
            onToggleExpand={onToggleExpand}
            onEdit={onEdit}
            onDelete={onDelete}
            onReorder={onReorder}
            t={t}
          />
        ))}
    </>
  );
}
