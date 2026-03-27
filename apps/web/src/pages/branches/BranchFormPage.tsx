import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  useBranchDetail,
  createBranch,
  updateBranch,
  setBranchHours,
  type BranchFormData,
  type OperatingHour,
} from '@/hooks/useBranches';

// ─── Types ───────────────────────────────────────────────────────────────────

interface FormErrors {
  [key: string]: string;
}

// ─── Default operating hours (Sunday-Saturday) ──────────────────────────────

function getDefaultHours(): OperatingHour[] {
  return Array.from({ length: 7 }, (_, i) => ({
    dayOfWeek: i,
    openTime: '08:00',
    closeTime: '18:00',
    isClosed: i === 5, // Friday closed by default
  }));
}

// ─── Component ───────────────────────────────────────────────────────────────

export function BranchFormPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const { branch, isLoading: detailLoading } = useBranchDetail(id);

  const [form, setForm] = useState<BranchFormData>({
    nameEn: '',
    nameAr: '',
    addressEn: '',
    addressAr: '',
    latitude: 0,
    longitude: 0,
    phone: '',
    email: '',
    isActive: true,
  });

  const [hours, setHours] = useState<OperatingHour[]>(getDefaultHours());
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSaving, setIsSaving] = useState(false);

  // Populate on edit
  useEffect(() => {
    if (branch && isEdit) {
      setForm({
        nameEn: branch.nameEn,
        nameAr: branch.nameAr,
        addressEn: branch.addressEn,
        addressAr: branch.addressAr,
        latitude: branch.latitude,
        longitude: branch.longitude,
        phone: branch.phone || '',
        email: branch.email || '',
        isActive: branch.isActive,
      });
      if (branch.operatingHours && branch.operatingHours.length > 0) {
        setHours(
          branch.operatingHours.map((h) => ({
            dayOfWeek: h.dayOfWeek,
            openTime: h.openTime,
            closeTime: h.closeTime,
            isClosed: h.isClosed,
          })),
        );
      }
    }
  }, [branch, isEdit]);

  const dayNames = [
    t('branches.sunday'),
    t('branches.monday'),
    t('branches.tuesday'),
    t('branches.wednesday'),
    t('branches.thursday'),
    t('branches.friday'),
    t('branches.saturday'),
  ];

  const updateField = useCallback(
    <K extends keyof BranchFormData>(key: K, value: BranchFormData[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    },
    [],
  );

  const updateHour = useCallback(
    (dayOfWeek: number, field: keyof OperatingHour, value: string | boolean) => {
      setHours((prev) =>
        prev.map((h) =>
          h.dayOfWeek === dayOfWeek ? { ...h, [field]: value } : h,
        ),
      );
    },
    [],
  );

  // Validation
  const validate = useCallback((): boolean => {
    const errs: FormErrors = {};

    if (!form.nameEn.trim()) errs.nameEn = t('branches.validation.nameEnRequired');
    if (!form.nameAr.trim()) errs.nameAr = t('branches.validation.nameArRequired');
    if (!form.addressEn.trim()) errs.addressEn = t('branches.validation.addressEnRequired');
    if (!form.addressAr.trim()) errs.addressAr = t('branches.validation.addressArRequired');
    if (!form.latitude && form.latitude !== 0) {
      errs.latitude = t('branches.validation.latitudeRequired');
    }
    if (!form.longitude && form.longitude !== 0) {
      errs.longitude = t('branches.validation.longitudeRequired');
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = t('branches.validation.emailInvalid');
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
        const payload: BranchFormData = {
          ...form,
          phone: form.phone || undefined,
          email: form.email || undefined,
        };

        if (isEdit && id) {
          await updateBranch(id, payload);
          await setBranchHours(id, hours);
          toast.success(t('branches.updateSuccess'));
        } else {
          const created = await createBranch(payload);
          await setBranchHours(created.id, hours);
          toast.success(t('branches.createSuccess'));
        }

        navigate('/branches');
      } catch {
        toast.error(isEdit ? t('branches.updateFailed') : t('branches.createFailed'));
      } finally {
        setIsSaving(false);
      }
    },
    [form, hours, isEdit, id, validate, navigate, t],
  );

  if (isEdit && detailLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm text-gray-500">{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          to="/branches"
          className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? t('branches.editBranch') : t('branches.addBranch')}
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {isEdit ? t('branches.editBranchSubtitle') : t('branches.addBranchSubtitle')}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Branch Info */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-gray-900">
            {t('branches.branchInfo')}
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label={t('branches.nameEn')}
              value={form.nameEn}
              onChange={(e) => updateField('nameEn', e.target.value)}
              error={errors.nameEn}
              placeholder={t('branches.nameEnPlaceholder')}
            />
            <Input
              label={t('branches.nameAr')}
              value={form.nameAr}
              onChange={(e) => updateField('nameAr', e.target.value)}
              error={errors.nameAr}
              placeholder={t('branches.nameArPlaceholder')}
              dir="rtl"
            />
            <Input
              label={t('branches.addressEn')}
              value={form.addressEn}
              onChange={(e) => updateField('addressEn', e.target.value)}
              error={errors.addressEn}
              placeholder={t('branches.addressEnPlaceholder')}
            />
            <Input
              label={t('branches.addressAr')}
              value={form.addressAr}
              onChange={(e) => updateField('addressAr', e.target.value)}
              error={errors.addressAr}
              placeholder={t('branches.addressArPlaceholder')}
              dir="rtl"
            />
            <Input
              label={t('branches.latitude')}
              type="number"
              value={form.latitude}
              onChange={(e) => updateField('latitude', Number(e.target.value))}
              error={errors.latitude}
              step="any"
              placeholder="24.7136"
            />
            <Input
              label={t('branches.longitude')}
              type="number"
              value={form.longitude}
              onChange={(e) => updateField('longitude', Number(e.target.value))}
              error={errors.longitude}
              step="any"
              placeholder="46.6753"
            />
            <Input
              label={t('branches.phone')}
              value={form.phone || ''}
              onChange={(e) => updateField('phone', e.target.value)}
              placeholder={t('branches.phonePlaceholder')}
              dir="ltr"
            />
            <Input
              label={t('branches.email')}
              type="email"
              value={form.email || ''}
              onChange={(e) => updateField('email', e.target.value)}
              error={errors.email}
              placeholder={t('branches.emailPlaceholder')}
            />
          </div>
        </div>

        {/* Operating Hours */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-gray-900">
            {t('branches.operatingHours')}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="pb-3 text-start text-xs font-medium uppercase tracking-wider text-gray-500">
                    {t('branches.day')}
                  </th>
                  <th className="pb-3 text-start text-xs font-medium uppercase tracking-wider text-gray-500">
                    {t('branches.openTime')}
                  </th>
                  <th className="pb-3 text-start text-xs font-medium uppercase tracking-wider text-gray-500">
                    {t('branches.closeTime')}
                  </th>
                  <th className="pb-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                    {t('branches.closed')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {hours
                  .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
                  .map((hour) => (
                    <tr key={hour.dayOfWeek}>
                      <td className="py-3 pe-4">
                        <span className="text-sm font-medium text-gray-900">
                          {dayNames[hour.dayOfWeek]}
                        </span>
                      </td>
                      <td className="py-3 pe-4">
                        <input
                          type="time"
                          value={hour.openTime}
                          onChange={(e) =>
                            updateHour(hour.dayOfWeek, 'openTime', e.target.value)
                          }
                          disabled={hour.isClosed}
                          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
                        />
                      </td>
                      <td className="py-3 pe-4">
                        <input
                          type="time"
                          value={hour.closeTime}
                          onChange={(e) =>
                            updateHour(hour.dayOfWeek, 'closeTime', e.target.value)
                          }
                          disabled={hour.isClosed}
                          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
                        />
                      </td>
                      <td className="py-3 text-center">
                        <input
                          type="checkbox"
                          checked={hour.isClosed}
                          onChange={(e) =>
                            updateHour(hour.dayOfWeek, 'isClosed', e.target.checked)
                          }
                          className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Active Toggle */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
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
            <div>
              <span className="text-sm font-medium text-gray-900">
                {t('branches.isActive')}
              </span>
              <p className="text-xs text-gray-500">{t('branches.isActiveHint')}</p>
            </div>
          </label>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-6">
          <Link to="/branches">
            <Button type="button" variant="outline">
              {t('common.cancel')}
            </Button>
          </Link>
          <Button type="submit" isLoading={isSaving}>
            {isEdit ? t('branches.saveBranch') : t('branches.createBranchBtn')}
          </Button>
        </div>
      </form>
    </div>
  );
}
