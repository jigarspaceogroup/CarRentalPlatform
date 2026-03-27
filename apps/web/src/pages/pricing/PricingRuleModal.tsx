import { useState, useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import {
  createPricingRule,
  updatePricingRule,
  checkPricingRuleConflicts,
  type PricingRule,
  type PricingRuleFormData,
} from '@/hooks/usePricingRules';
import { useVehicles } from '@/hooks/useVehicles';
import { useCategories } from '@/hooks/useCategories';

// ─── Types ───────────────────────────────────────────────────────────────────

interface PricingRuleModalProps {
  rule: PricingRule | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormErrors {
  [key: string]: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function PricingRuleModal({ rule, onClose, onSuccess }: PricingRuleModalProps) {
  const { t } = useTranslation();
  const isEdit = Boolean(rule);

  const [form, setForm] = useState<PricingRuleFormData>({
    name: '',
    ruleType: 'MULTIPLIER',
    ruleValue: 1,
    startDate: '',
    endDate: '',
    scope: 'category',
    vehicleId: undefined,
    categoryId: undefined,
    isActive: true,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [hasConflicts, setHasConflicts] = useState(false);
  const [isCheckingConflicts, setIsCheckingConflicts] = useState(false);

  const { data: vehicles } = useVehicles({ page: 1, limit: 1000 });
  const { categories } = useCategories();

  // Populate on edit
  useEffect(() => {
    if (rule) {
      setForm({
        name: rule.name,
        ruleType: rule.ruleType,
        ruleValue: Number(rule.ruleValue),
        startDate: rule.startDate?.split('T')[0] ?? '',
        endDate: rule.endDate?.split('T')[0] ?? '',
        scope: rule.vehicleId ? 'vehicle' : 'category',
        vehicleId: rule.vehicleId || undefined,
        categoryId: rule.categoryId || undefined,
        isActive: rule.isActive,
      });
    }
  }, [rule]);

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

  // Check conflicts when dates or scope change
  useEffect(() => {
    const checkConflicts = async () => {
      if (!form.startDate || !form.endDate) {
        setHasConflicts(false);
        return;
      }

      const vehicleId = form.scope === 'vehicle' ? form.vehicleId : undefined;
      const categoryId = form.scope === 'category' ? form.categoryId : undefined;

      if (!vehicleId && !categoryId) {
        setHasConflicts(false);
        return;
      }

      setIsCheckingConflicts(true);
      try {
        const result = await checkPricingRuleConflicts(
          form.startDate,
          form.endDate,
          vehicleId,
          categoryId,
          rule?.id,
        );
        setHasConflicts(result.hasConflicts);
      } catch {
        // Silently fail conflict check
      } finally {
        setIsCheckingConflicts(false);
      }
    };

    const timeout = setTimeout(checkConflicts, 500);
    return () => clearTimeout(timeout);
  }, [form.startDate, form.endDate, form.scope, form.vehicleId, form.categoryId, rule?.id]);

  // Validation
  const validate = useCallback((): boolean => {
    const errs: FormErrors = {};

    if (!form.name.trim()) errs.name = t('pricing.validation.nameRequired');
    if (!form.ruleValue || form.ruleValue <= 0) {
      errs.ruleValue = t('pricing.validation.valuePositive');
    }
    if (!form.startDate) errs.startDate = t('pricing.validation.startDateRequired');
    if (!form.endDate) errs.endDate = t('pricing.validation.endDateRequired');

    if (form.startDate && form.endDate && new Date(form.startDate) >= new Date(form.endDate)) {
      errs.endDate = t('pricing.validation.endDateAfterStart');
    }

    if (form.scope === 'vehicle' && !form.vehicleId) {
      errs.vehicleId = t('pricing.validation.vehicleRequired');
    }
    if (form.scope === 'category' && !form.categoryId) {
      errs.categoryId = t('pricing.validation.categoryRequired');
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
        if (isEdit && rule) {
          await updatePricingRule(rule.id, form);
          toast.success(t('pricing.updateSuccess'));
        } else {
          await createPricingRule(form);
          toast.success(t('pricing.createSuccess'));
        }

        onSuccess();
      } catch (err: unknown) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        const message = axiosErr?.response?.data?.message;
        toast.error(
          message || (isEdit ? t('pricing.updateFailed') : t('pricing.createFailed')),
        );
      } finally {
        setIsSaving(false);
      }
    },
    [form, isEdit, rule, validate, onSuccess, t],
  );

  const updateField = useCallback(
    <K extends keyof PricingRuleFormData>(key: K, value: PricingRuleFormData[K]) => {
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
      title={isEdit ? t('pricing.editRule') : t('pricing.createRule')}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label={t('pricing.ruleName')}
          value={form.name}
          onChange={(e) => updateField('name', e.target.value)}
          error={errors.name}
          placeholder={t('pricing.ruleNamePlaceholder')}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label={t('pricing.ruleType')}
            options={ruleTypeOptions}
            value={form.ruleType}
            onChange={(e) => updateField('ruleType', e.target.value as 'MULTIPLIER' | 'FIXED_OVERRIDE')}
            error={errors.ruleType}
          />

          <Input
            label={t('pricing.value')}
            type="number"
            step={form.ruleType === 'MULTIPLIER' ? '0.01' : '0.01'}
            min="0"
            value={form.ruleValue}
            onChange={(e) => updateField('ruleValue', Number(e.target.value))}
            error={errors.ruleValue}
            placeholder={form.ruleType === 'MULTIPLIER' ? '1.5' : '100.00'}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label={t('pricing.startDate')}
            type="date"
            value={form.startDate}
            onChange={(e) => updateField('startDate', e.target.value)}
            error={errors.startDate}
          />

          <Input
            label={t('pricing.endDate')}
            type="date"
            value={form.endDate}
            onChange={(e) => updateField('endDate', e.target.value)}
            error={errors.endDate}
          />
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            {t('pricing.applyTo')}
          </label>
          <div className="flex gap-4">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="scope"
                value="vehicle"
                checked={form.scope === 'vehicle'}
                onChange={(e) => updateField('scope', e.target.value as 'vehicle' | 'category')}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">{t('pricing.specificVehicle')}</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="scope"
                value="category"
                checked={form.scope === 'category'}
                onChange={(e) => updateField('scope', e.target.value as 'vehicle' | 'category')}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">{t('pricing.specificCategory')}</span>
            </label>
          </div>
        </div>

        {form.scope === 'vehicle' && (
          <Select
            label={t('pricing.selectVehicle')}
            options={vehicleOptions}
            value={form.vehicleId || ''}
            onChange={(e) => updateField('vehicleId', e.target.value || undefined)}
            placeholder={t('pricing.selectVehiclePlaceholder')}
            error={errors.vehicleId}
          />
        )}

        {form.scope === 'category' && (
          <Select
            label={t('pricing.selectCategory')}
            options={categoryOptions}
            value={form.categoryId || ''}
            onChange={(e) => updateField('categoryId', e.target.value || undefined)}
            placeholder={t('pricing.selectCategoryPlaceholder')}
            error={errors.categoryId}
          />
        )}

        <div className="flex items-center gap-3">
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

        {/* Conflict Warning */}
        {hasConflicts && (
          <div className="flex items-start gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-800">
                {t('pricing.conflictWarning')}
              </p>
              <p className="mt-1 text-sm text-yellow-700">
                {t('pricing.conflictWarningMessage')}
              </p>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" isLoading={isSaving || isCheckingConflicts}>
            {isEdit ? t('pricing.saveRule') : t('pricing.createRuleBtn')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
