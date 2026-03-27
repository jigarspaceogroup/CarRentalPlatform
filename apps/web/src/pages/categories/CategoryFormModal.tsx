import { useState, useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import {
  createCategory,
  updateCategory,
  type Category,
  type CategoryFormData,
} from '@/hooks/useCategories';

// ─── Types ───────────────────────────────────────────────────────────────────

interface CategoryFormModalProps {
  category: Category | null;
  categories: Category[];
  onClose: () => void;
  onSuccess: () => void;
}

interface FormErrors {
  [key: string]: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function CategoryFormModal({
  category,
  categories,
  onClose,
  onSuccess,
}: CategoryFormModalProps) {
  const { t } = useTranslation();
  const isEdit = Boolean(category);

  const [form, setForm] = useState<CategoryFormData>({
    nameEn: '',
    nameAr: '',
    descriptionEn: '',
    descriptionAr: '',
    parentId: null,
    imageUrl: '',
    sortOrder: 0,
    isActive: true,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSaving, setIsSaving] = useState(false);

  // Populate on edit
  useEffect(() => {
    if (category) {
      setForm({
        nameEn: category.nameEn,
        nameAr: category.nameAr,
        descriptionEn: category.descriptionEn || '',
        descriptionAr: category.descriptionAr || '',
        parentId: category.parentId || null,
        imageUrl: category.imageUrl || '',
        sortOrder: category.sortOrder,
        isActive: category.isActive,
      });
    }
  }, [category]);

  // Parent category options (exclude self and children if editing)
  const parentOptions = useMemo(() => {
    const opts: { value: string; label: string }[] = [];
    const flatten = (cats: Category[], prefix = '') => {
      for (const cat of cats) {
        // Skip self and descendants when editing
        if (isEdit && cat.id === category?.id) continue;
        opts.push({ value: cat.id, label: `${prefix}${cat.nameEn}` });
        if (cat.children?.length) flatten(cat.children, `${prefix}  `);
      }
    };
    flatten(categories);
    return opts;
  }, [categories, category, isEdit]);

  // Validation
  const validate = useCallback((): boolean => {
    const errs: FormErrors = {};

    if (!form.nameEn.trim()) errs.nameEn = t('categories.validation.nameEnRequired');
    if (!form.nameAr.trim()) errs.nameAr = t('categories.validation.nameArRequired');

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [form, t]);

  // Submit
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!validate()) return;

      setIsSaving(true);
      try {
        const payload: CategoryFormData = {
          ...form,
          parentId: form.parentId || null,
          imageUrl: form.imageUrl || undefined,
          descriptionEn: form.descriptionEn || undefined,
          descriptionAr: form.descriptionAr || undefined,
        };

        if (isEdit && category) {
          await updateCategory(category.id, payload);
          toast.success(t('categories.updateSuccess'));
        } else {
          await createCategory(payload);
          toast.success(t('categories.createSuccess'));
        }

        onSuccess();
      } catch {
        toast.error(isEdit ? t('categories.updateFailed') : t('categories.createFailed'));
      } finally {
        setIsSaving(false);
      }
    },
    [form, isEdit, category, validate, onSuccess, t],
  );

  const updateField = useCallback(
    <K extends keyof CategoryFormData>(key: K, value: CategoryFormData[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    },
    [],
  );

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? t('categories.editCategory') : t('categories.addCategory')}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label={t('categories.nameEn')}
            value={form.nameEn}
            onChange={(e) => updateField('nameEn', e.target.value)}
            error={errors.nameEn}
            placeholder={t('categories.nameEnPlaceholder')}
          />
          <Input
            label={t('categories.nameAr')}
            value={form.nameAr}
            onChange={(e) => updateField('nameAr', e.target.value)}
            error={errors.nameAr}
            placeholder={t('categories.nameArPlaceholder')}
            dir="rtl"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Textarea
            label={t('categories.descriptionEn')}
            value={form.descriptionEn || ''}
            onChange={(e) => updateField('descriptionEn', e.target.value)}
            placeholder={t('categories.descriptionEnPlaceholder')}
            rows={3}
          />
          <Textarea
            label={t('categories.descriptionAr')}
            value={form.descriptionAr || ''}
            onChange={(e) => updateField('descriptionAr', e.target.value)}
            placeholder={t('categories.descriptionArPlaceholder')}
            rows={3}
            dir="rtl"
          />
        </div>

        <Select
          label={t('categories.parentCategory')}
          options={parentOptions}
          value={form.parentId || ''}
          onChange={(e) => updateField('parentId', e.target.value || null)}
          placeholder={t('categories.noParent')}
        />

        <Input
          label={t('categories.imageUrl')}
          value={form.imageUrl || ''}
          onChange={(e) => updateField('imageUrl', e.target.value)}
          placeholder={t('categories.imageUrlPlaceholder')}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label={t('categories.sortOrder')}
            type="number"
            value={form.sortOrder}
            onChange={(e) => updateField('sortOrder', Number(e.target.value))}
            min={0}
          />
          <div className="flex items-end pb-1">
            <label className="flex cursor-pointer items-center gap-3">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => updateField('isActive', e.target.checked)}
                  className="peer sr-only"
                />
                <div className="h-6 w-11 rounded-full bg-gray-200 peer-checked:bg-primary-600 peer-focus:ring-2 peer-focus:ring-primary-500 peer-focus:ring-offset-2" />
                <div className="absolute start-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-all peer-checked:translate-x-5 rtl:peer-checked:-translate-x-5" />
              </div>
              <span className="text-sm font-medium text-gray-700">
                {t('categories.isActive')}
              </span>
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" isLoading={isSaving}>
            {isEdit ? t('categories.saveCategory') : t('categories.createCategoryBtn')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
