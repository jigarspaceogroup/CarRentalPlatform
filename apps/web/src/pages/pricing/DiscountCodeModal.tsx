import { useState, useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import {
  createDiscountCode,
  updateDiscountCode,
  checkCodeUniqueness,
  type DiscountCode,
  type DiscountCodeFormData,
} from '@/hooks/useDiscountCodes';
import { useVehicles } from '@/hooks/useVehicles';
import { useCategories } from '@/hooks/useCategories';

// ─── Types ───────────────────────────────────────────────────────────────────

interface DiscountCodeModalProps {
  code: DiscountCode | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormErrors {
  [key: string]: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function DiscountCodeModal({ code, onClose, onSuccess }: DiscountCodeModalProps) {
  const { t } = useTranslation();
  const isEdit = Boolean(code);

  const [form, setForm] = useState<DiscountCodeFormData>({
    code: '',
    description: '',
    discountType: 'PERCENTAGE',
    discountValue: 0,
    maxDiscountAmount: undefined,
    minBookingAmount: undefined,
    usageLimit: undefined,
    perUserLimit: undefined,
    applicableVehicleIds: [],
    applicableCategoryIds: [],
    startsAt: '',
    expiresAt: '',
    isActive: true,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isCheckingCode, setIsCheckingCode] = useState(false);
  const [applicableTo, setApplicableTo] = useState<'all' | 'vehicles' | 'categories'>('all');

  const { data: vehicles } = useVehicles({ page: 1, limit: 1000 });
  const { categories } = useCategories();

  // Populate on edit
  useEffect(() => {
    if (code) {
      setForm({
        code: code.code,
        description: code.description || '',
        discountType: code.discountType,
        discountValue: Number(code.discountValue),
        maxDiscountAmount: code.maxDiscountAmount ? Number(code.maxDiscountAmount) : undefined,
        minBookingAmount: code.minBookingAmount ? Number(code.minBookingAmount) : undefined,
        usageLimit: code.usageLimit ?? undefined,
        perUserLimit: code.perUserLimit ?? undefined,
        applicableVehicleIds: code.applicableVehicleIds,
        applicableCategoryIds: code.applicableCategoryIds,
        startsAt: code.startsAt?.split('T')[0] ?? '',
        expiresAt: code.expiresAt?.split('T')[0] ?? '',
        isActive: code.isActive,
      });

      if (code.applicableVehicleIds.length > 0) {
        setApplicableTo('vehicles');
      } else if (code.applicableCategoryIds.length > 0) {
        setApplicableTo('categories');
      } else {
        setApplicableTo('all');
      }
    }
  }, [code]);

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

  const discountTypeOptions = [
    { value: 'PERCENTAGE', label: t('pricing.discountTypePercentage') },
    { value: 'FIXED_AMOUNT', label: t('pricing.discountTypeFixed') },
  ];

  // Check code uniqueness
  useEffect(() => {
    const checkCode = async () => {
      if (!form.code || form.code.length < 3) return;

      setIsCheckingCode(true);
      try {
        const isUnique = await checkCodeUniqueness(form.code, code?.id);
        if (!isUnique) {
          setErrors((prev) => ({ ...prev, code: t('pricing.validation.codeNotUnique') }));
        } else {
          setErrors((prev) => {
            const next = { ...prev };
            delete next.code;
            return next;
          });
        }
      } catch {
        // Silently fail
      } finally {
        setIsCheckingCode(false);
      }
    };

    const timeout = setTimeout(checkCode, 500);
    return () => clearTimeout(timeout);
  }, [form.code, code?.id, t]);

  // Validation
  const validate = useCallback((): boolean => {
    const errs: FormErrors = {};

    if (!form.code.trim()) {
      errs.code = t('pricing.validation.codeRequired');
    } else if (!/^[A-Z0-9]+$/.test(form.code)) {
      errs.code = t('pricing.validation.codeAlphanumeric');
    }

    if (!form.discountValue || form.discountValue <= 0) {
      errs.discountValue = t('pricing.validation.valuePositive');
    }

    if (form.discountType === 'PERCENTAGE' && form.discountValue > 100) {
      errs.discountValue = t('pricing.validation.percentageMax100');
    }

    if (!form.startsAt) errs.startsAt = t('pricing.validation.startDateRequired');
    if (!form.expiresAt) errs.expiresAt = t('pricing.validation.expiryDateRequired');

    if (form.startsAt && form.expiresAt && new Date(form.startsAt) >= new Date(form.expiresAt)) {
      errs.expiresAt = t('pricing.validation.expiryAfterStart');
    }

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
        const payload: DiscountCodeFormData = {
          ...form,
          code: form.code.toUpperCase(),
          applicableVehicleIds: applicableTo === 'vehicles' ? form.applicableVehicleIds : [],
          applicableCategoryIds: applicableTo === 'categories' ? form.applicableCategoryIds : [],
        };

        if (isEdit && code) {
          await updateDiscountCode(code.id, payload);
          toast.success(t('pricing.updateCodeSuccess'));
        } else {
          await createDiscountCode(payload);
          toast.success(t('pricing.createCodeSuccess'));
        }

        onSuccess();
      } catch (err: unknown) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        const message = axiosErr?.response?.data?.message;
        toast.error(
          message || (isEdit ? t('pricing.updateCodeFailed') : t('pricing.createCodeFailed')),
        );
      } finally {
        setIsSaving(false);
      }
    },
    [form, isEdit, code, validate, applicableTo, onSuccess, t],
  );

  const updateField = useCallback(
    <K extends keyof DiscountCodeFormData>(key: K, value: DiscountCodeFormData[K]) => {
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
      title={isEdit ? t('pricing.editCode') : t('pricing.createCode')}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label={t('pricing.code')}
            value={form.code}
            onChange={(e) => updateField('code', e.target.value.toUpperCase())}
            error={errors.code}
            placeholder={t('pricing.codePlaceholder')}
            disabled={isEdit}
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
              <span className="text-sm font-medium text-gray-700">{t('pricing.isActive')}</span>
            </label>
          </div>
        </div>

        <Textarea
          label={t('pricing.description')}
          value={form.description || ''}
          onChange={(e) => updateField('description', e.target.value)}
          placeholder={t('pricing.descriptionPlaceholder')}
          rows={2}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label={t('pricing.discountType')}
            options={discountTypeOptions}
            value={form.discountType}
            onChange={(e) =>
              updateField('discountType', e.target.value as 'PERCENTAGE' | 'FIXED_AMOUNT')
            }
            error={errors.discountType}
          />

          <Input
            label={t('pricing.discountValue')}
            type="number"
            step="0.01"
            min="0"
            max={form.discountType === 'PERCENTAGE' ? '100' : undefined}
            value={form.discountValue}
            onChange={(e) => updateField('discountValue', Number(e.target.value))}
            error={errors.discountValue}
            placeholder={form.discountType === 'PERCENTAGE' ? '10' : '50.00'}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label={t('pricing.maxDiscountAmount')}
            type="number"
            step="0.01"
            min="0"
            value={form.maxDiscountAmount || ''}
            onChange={(e) => updateField('maxDiscountAmount', e.target.value ? Number(e.target.value) : undefined)}
            placeholder={t('pricing.optional')}
          />

          <Input
            label={t('pricing.minBookingAmount')}
            type="number"
            step="0.01"
            min="0"
            value={form.minBookingAmount || ''}
            onChange={(e) => updateField('minBookingAmount', e.target.value ? Number(e.target.value) : undefined)}
            placeholder={t('pricing.optional')}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label={t('pricing.usageLimit')}
            type="number"
            min="0"
            value={form.usageLimit || ''}
            onChange={(e) => updateField('usageLimit', e.target.value ? Number(e.target.value) : undefined)}
            placeholder={t('pricing.unlimited')}
          />

          <Input
            label={t('pricing.perUserLimit')}
            type="number"
            min="0"
            value={form.perUserLimit || ''}
            onChange={(e) => updateField('perUserLimit', e.target.value ? Number(e.target.value) : undefined)}
            placeholder={t('pricing.unlimited')}
          />
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            {t('pricing.applicableTo')}
          </label>
          <div className="flex gap-4">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="applicableTo"
                value="all"
                checked={applicableTo === 'all'}
                onChange={(e) => setApplicableTo(e.target.value as 'all' | 'vehicles' | 'categories')}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">{t('pricing.allVehicles')}</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="applicableTo"
                value="vehicles"
                checked={applicableTo === 'vehicles'}
                onChange={(e) => setApplicableTo(e.target.value as 'all' | 'vehicles' | 'categories')}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">{t('pricing.specificVehicles')}</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="applicableTo"
                value="categories"
                checked={applicableTo === 'categories'}
                onChange={(e) => setApplicableTo(e.target.value as 'all' | 'vehicles' | 'categories')}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">{t('pricing.specificCategories')}</span>
            </label>
          </div>
        </div>

        {applicableTo === 'vehicles' && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {t('pricing.selectVehicles')}
            </label>
            <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-300 p-2">
              {vehicleOptions.map((option) => (
                <label key={option.value} className="flex cursor-pointer items-center gap-2 px-2 py-1.5 hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={form.applicableVehicleIds.includes(option.value)}
                    onChange={(e) => {
                      const ids = e.target.checked
                        ? [...form.applicableVehicleIds, option.value]
                        : form.applicableVehicleIds.filter((id) => id !== option.value);
                      updateField('applicableVehicleIds', ids);
                    }}
                    className="h-4 w-4 rounded text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">{option.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {applicableTo === 'categories' && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {t('pricing.selectCategories')}
            </label>
            <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-300 p-2">
              {categoryOptions.map((option) => (
                <label key={option.value} className="flex cursor-pointer items-center gap-2 px-2 py-1.5 hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={form.applicableCategoryIds.includes(option.value)}
                    onChange={(e) => {
                      const ids = e.target.checked
                        ? [...form.applicableCategoryIds, option.value]
                        : form.applicableCategoryIds.filter((id) => id !== option.value);
                      updateField('applicableCategoryIds', ids);
                    }}
                    className="h-4 w-4 rounded text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">{option.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label={t('pricing.startsAt')}
            type="date"
            value={form.startsAt}
            onChange={(e) => updateField('startsAt', e.target.value)}
            error={errors.startsAt}
          />

          <Input
            label={t('pricing.expiresAt')}
            type="date"
            value={form.expiresAt}
            onChange={(e) => updateField('expiresAt', e.target.value)}
            error={errors.expiresAt}
          />
        </div>

        <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
          <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
          <div className="flex-1">
            <p className="text-sm text-blue-800">{t('pricing.codeInfoMessage')}</p>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" isLoading={isSaving || isCheckingCode}>
            {isEdit ? t('pricing.saveCode') : t('pricing.createCodeBtn')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
