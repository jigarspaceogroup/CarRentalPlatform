import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  X,
  ChevronUp,
  ChevronDown,
  Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import {
  useVehicleDetail,
  createVehicle,
  updateVehicle,
  addVehicleImages,
  reorderVehicleImages,
  deleteVehicleImage,
  type VehicleFormData,
} from '@/hooks/useVehicles';
import { useCategories, type Category } from '@/hooks/useCategories';
import { useBranches } from '@/hooks/useBranches';

// ─── Types ───────────────────────────────────────────────────────────────────

interface FormErrors {
  [key: string]: string;
}

interface LocalImage {
  id?: string;
  imageUrl: string;
  thumbnailUrl?: string;
  sortOrder: number;
  isNew?: boolean;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function VehicleFormPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const { vehicle, isLoading: detailLoading } = useVehicleDetail(id);
  const { categories } = useCategories();
  const { data: branches } = useBranches();

  // Form state
  const [form, setForm] = useState<VehicleFormData>({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    licensePlate: '',
    transmission: 'automatic',
    fuelType: 'gasoline',
    seats: 5,
    doors: 4,
    trunkCapacity: '',
    dailyRate: 0,
    weeklyRate: undefined,
    monthlyRate: undefined,
    longTermRate: undefined,
    status: 'available',
    features: [],
    mileagePolicy: '',
    categoryId: '',
    branchId: '',
  });

  const [images, setImages] = useState<LocalImage[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [featureInput, setFeatureInput] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSaving, setIsSaving] = useState(false);

  // Populate form on edit
  useEffect(() => {
    if (vehicle && isEdit) {
      setForm({
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        licensePlate: vehicle.licensePlate,
        transmission: vehicle.transmission,
        fuelType: vehicle.fuelType,
        seats: vehicle.seats,
        doors: vehicle.doors,
        trunkCapacity: vehicle.trunkCapacity || '',
        dailyRate: vehicle.dailyRate,
        weeklyRate: vehicle.weeklyRate,
        monthlyRate: vehicle.monthlyRate,
        longTermRate: vehicle.longTermRate,
        status: vehicle.status,
        features: vehicle.features || [],
        mileagePolicy: vehicle.mileagePolicy || '',
        categoryId: vehicle.categoryId || '',
        branchId: vehicle.branchId || '',
      });
      setImages(
        (vehicle.images || []).map((img) => ({
          id: img.id,
          imageUrl: img.imageUrl,
          thumbnailUrl: img.thumbnailUrl,
          sortOrder: img.sortOrder,
          isNew: false,
        })),
      );
    }
  }, [vehicle, isEdit]);

  // Category options flattened
  const categoryOptions = (() => {
    const opts: { value: string; label: string }[] = [];
    const flatten = (cats: Category[], prefix = '') => {
      for (const cat of cats) {
        opts.push({ value: cat.id, label: `${prefix}${cat.nameEn}` });
        if (cat.children?.length) flatten(cat.children, `${prefix}  `);
      }
    };
    flatten(categories);
    return opts;
  })();

  const branchOptions = branches.map((b) => ({ value: b.id, label: b.nameEn }));

  const transmissionOptions = [
    { value: 'automatic', label: t('fleet.automatic') },
    { value: 'manual', label: t('fleet.manual') },
  ];

  const fuelTypeOptions = [
    { value: 'gasoline', label: t('fleet.gasoline') },
    { value: 'diesel', label: t('fleet.diesel') },
    { value: 'electric', label: t('fleet.electric') },
    { value: 'hybrid', label: t('fleet.hybrid') },
  ];

  const statusOptions = [
    { value: 'available', label: t('fleet.statusAvailable') },
    { value: 'unavailable', label: t('fleet.statusUnavailable') },
    { value: 'in_maintenance', label: t('fleet.statusMaintenance') },
    { value: 'retired', label: t('fleet.statusRetired') },
  ];

  // Field change handler
  const updateField = useCallback(
    <K extends keyof VehicleFormData>(key: K, value: VehicleFormData[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    },
    [],
  );

  // Features
  const addFeature = useCallback(() => {
    const trimmed = featureInput.trim();
    if (!trimmed) return;
    if (form.features.includes(trimmed)) return;
    setForm((prev) => ({ ...prev, features: [...prev.features, trimmed] }));
    setFeatureInput('');
  }, [featureInput, form.features]);

  const removeFeature = useCallback((feature: string) => {
    setForm((prev) => ({
      ...prev,
      features: prev.features.filter((f) => f !== feature),
    }));
  }, []);

  const handleFeatureKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addFeature();
      }
    },
    [addFeature],
  );

  // Images
  const addImage = useCallback(() => {
    const trimmed = newImageUrl.trim();
    if (!trimmed) return;
    if (images.length >= 10) {
      toast.error(t('fleet.maxImagesReached'));
      return;
    }
    setImages((prev) => [
      ...prev,
      { imageUrl: trimmed, sortOrder: prev.length, isNew: true },
    ]);
    setNewImageUrl('');
  }, [newImageUrl, images.length, t]);

  const removeImage = useCallback((index: number) => {
    setImages((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.map((img, i) => ({ ...img, sortOrder: i }));
    });
  }, []);

  const moveImage = useCallback((index: number, direction: 'up' | 'down') => {
    setImages((prev) => {
      const next = [...prev];
      const swapIndex = direction === 'up' ? index - 1 : index + 1;
      if (swapIndex < 0 || swapIndex >= next.length) return prev;
      const temp = next[index]!;
      next[index] = next[swapIndex]!;
      next[swapIndex] = temp;
      return next.map((img, i) => ({ ...img, sortOrder: i }));
    });
  }, []);

  // Validation
  const validate = useCallback((): boolean => {
    const errs: FormErrors = {};

    if (!form.make.trim()) errs.make = t('fleet.validation.makeRequired');
    if (!form.model.trim()) errs.model = t('fleet.validation.modelRequired');
    if (!form.year || form.year < 1900 || form.year > new Date().getFullYear() + 2) {
      errs.year = t('fleet.validation.yearInvalid');
    }
    if (!form.licensePlate.trim()) {
      errs.licensePlate = t('fleet.validation.licensePlateRequired');
    }
    if (!form.dailyRate || form.dailyRate <= 0) {
      errs.dailyRate = t('fleet.validation.dailyRateRequired');
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
        const payload: VehicleFormData = {
          ...form,
          categoryId: form.categoryId || undefined,
          branchId: form.branchId || undefined,
          trunkCapacity: form.trunkCapacity || undefined,
          mileagePolicy: form.mileagePolicy || undefined,
          weeklyRate: form.weeklyRate || undefined,
          monthlyRate: form.monthlyRate || undefined,
          longTermRate: form.longTermRate || undefined,
        };

        if (isEdit && id) {
          await updateVehicle(id, payload);

          // Handle image changes
          const newImages = images.filter((img) => img.isNew);
          if (newImages.length > 0) {
            await addVehicleImages(
              id,
              newImages.map((img) => ({
                imageUrl: img.imageUrl,
                thumbnailUrl: img.thumbnailUrl,
              })),
            );
          }

          // Handle deleted images
          const originalIds = new Set((vehicle?.images || []).map((i) => i.id));
          const currentIds = new Set(images.filter((i) => i.id).map((i) => i.id!));
          for (const origId of originalIds) {
            if (!currentIds.has(origId)) {
              await deleteVehicleImage(id, origId);
            }
          }

          // Handle reorder for existing images
          const existingImages = images.filter((img) => img.id);
          if (existingImages.length > 0) {
            await reorderVehicleImages(
              id,
              existingImages.map((img) => ({ id: img.id!, sortOrder: img.sortOrder })),
            );
          }

          toast.success(t('fleet.updateSuccess'));
        } else {
          const created = await createVehicle(payload);

          // Add images to newly created vehicle
          if (images.length > 0) {
            await addVehicleImages(
              created.id,
              images.map((img) => ({
                imageUrl: img.imageUrl,
                thumbnailUrl: img.thumbnailUrl,
              })),
            );
          }

          toast.success(t('fleet.createSuccess'));
        }

        navigate('/fleet');
      } catch {
        toast.error(isEdit ? t('fleet.updateFailed') : t('fleet.createFailed'));
      } finally {
        setIsSaving(false);
      }
    },
    [form, images, isEdit, id, vehicle, validate, navigate, t],
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
          to="/fleet"
          className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? t('fleet.editVehicle') : t('fleet.addVehicle')}
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {isEdit ? t('fleet.editVehicleSubtitle') : t('fleet.addVehicleSubtitle')}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <FormSection title={t('fleet.basicInfo')}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label={t('fleet.make')}
              value={form.make}
              onChange={(e) => updateField('make', e.target.value)}
              error={errors.make}
              placeholder={t('fleet.makePlaceholder')}
            />
            <Input
              label={t('fleet.model')}
              value={form.model}
              onChange={(e) => updateField('model', e.target.value)}
              error={errors.model}
              placeholder={t('fleet.modelPlaceholder')}
            />
            <Input
              label={t('fleet.year')}
              type="number"
              value={form.year}
              onChange={(e) => updateField('year', Number(e.target.value))}
              error={errors.year}
              min={1900}
              max={new Date().getFullYear() + 2}
            />
            <Input
              label={t('fleet.licensePlate')}
              value={form.licensePlate}
              onChange={(e) => updateField('licensePlate', e.target.value)}
              error={errors.licensePlate}
              placeholder={t('fleet.licensePlatePlaceholder')}
            />
          </div>
        </FormSection>

        {/* Classification */}
        <FormSection title={t('fleet.classification')}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              label={t('fleet.category')}
              options={categoryOptions}
              value={form.categoryId || ''}
              onChange={(e) => updateField('categoryId', e.target.value)}
              placeholder={t('fleet.selectCategory')}
            />
            <Select
              label={t('fleet.branch')}
              options={branchOptions}
              value={form.branchId || ''}
              onChange={(e) => updateField('branchId', e.target.value)}
              placeholder={t('fleet.selectBranch')}
            />
            <Select
              label={t('fleet.transmission')}
              options={transmissionOptions}
              value={form.transmission}
              onChange={(e) => updateField('transmission', e.target.value)}
            />
            <Select
              label={t('fleet.fuelType')}
              options={fuelTypeOptions}
              value={form.fuelType}
              onChange={(e) => updateField('fuelType', e.target.value)}
            />
            <Input
              label={t('fleet.seats')}
              type="number"
              value={form.seats}
              onChange={(e) => updateField('seats', Number(e.target.value))}
              min={1}
              max={50}
            />
            <Input
              label={t('fleet.doors')}
              type="number"
              value={form.doors}
              onChange={(e) => updateField('doors', Number(e.target.value))}
              min={1}
              max={10}
            />
            <Input
              label={t('fleet.trunkCapacity')}
              value={form.trunkCapacity || ''}
              onChange={(e) => updateField('trunkCapacity', e.target.value)}
              placeholder={t('fleet.trunkCapacityPlaceholder')}
            />
          </div>
        </FormSection>

        {/* Pricing */}
        <FormSection title={t('fleet.pricing')}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Input
              label={t('fleet.dailyRate')}
              type="number"
              value={form.dailyRate || ''}
              onChange={(e) => updateField('dailyRate', Number(e.target.value))}
              error={errors.dailyRate}
              min={0}
              step={0.01}
            />
            <Input
              label={t('fleet.weeklyRate')}
              type="number"
              value={form.weeklyRate ?? ''}
              onChange={(e) =>
                updateField('weeklyRate', e.target.value ? Number(e.target.value) : undefined)
              }
              min={0}
              step={0.01}
              hint={t('fleet.optionalHint')}
            />
            <Input
              label={t('fleet.monthlyRate')}
              type="number"
              value={form.monthlyRate ?? ''}
              onChange={(e) =>
                updateField('monthlyRate', e.target.value ? Number(e.target.value) : undefined)
              }
              min={0}
              step={0.01}
              hint={t('fleet.optionalHint')}
            />
            <Input
              label={t('fleet.longTermRate')}
              type="number"
              value={form.longTermRate ?? ''}
              onChange={(e) =>
                updateField('longTermRate', e.target.value ? Number(e.target.value) : undefined)
              }
              min={0}
              step={0.01}
              hint={t('fleet.optionalHint')}
            />
          </div>
        </FormSection>

        {/* Features */}
        <FormSection title={t('fleet.features')}>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                value={featureInput}
                onChange={(e) => setFeatureInput(e.target.value)}
                onKeyDown={handleFeatureKeyDown}
                placeholder={t('fleet.featurePlaceholder')}
              />
              <Button type="button" variant="outline" onClick={addFeature}>
                <Plus className="h-4 w-4" />
                {t('common.add')}
              </Button>
            </div>
            {form.features.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {form.features.map((feature) => (
                  <span
                    key={feature}
                    className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700"
                  >
                    {feature}
                    <button
                      type="button"
                      onClick={() => removeFeature(feature)}
                      className="rounded-full p-0.5 hover:bg-blue-200"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </FormSection>

        {/* Mileage Policy */}
        <FormSection title={t('fleet.mileagePolicy')}>
          <Textarea
            value={form.mileagePolicy || ''}
            onChange={(e) => updateField('mileagePolicy', e.target.value)}
            placeholder={t('fleet.mileagePolicyPlaceholder')}
            rows={3}
          />
        </FormSection>

        {/* Images */}
        <FormSection title={t('fleet.images')}>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder={t('fleet.imageUrlPlaceholder')}
              />
              <Button
                type="button"
                variant="outline"
                onClick={addImage}
                disabled={images.length >= 10}
              >
                <Plus className="h-4 w-4" />
                {t('common.add')}
              </Button>
            </div>
            <p className="text-xs text-gray-400">
              {t('fleet.imagesCount', { count: images.length, max: 10 })}
            </p>
            {images.length > 0 && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {images.map((img, index) => (
                  <div
                    key={`${img.imageUrl}-${index}`}
                    className="group relative aspect-video overflow-hidden rounded-lg border border-gray-200 bg-gray-100"
                  >
                    <img
                      src={img.imageUrl}
                      alt={`Vehicle ${index + 1}`}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '';
                        (e.target as HTMLImageElement).alt = 'Error';
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => moveImage(index, 'up')}
                        disabled={index === 0}
                        className="rounded bg-white/90 p-1 text-gray-700 disabled:opacity-30"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveImage(index, 'down')}
                        disabled={index === images.length - 1}
                        className="rounded bg-white/90 p-1 text-gray-700 disabled:opacity-30"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="rounded bg-red-500/90 p-1 text-white"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <span className="absolute start-1 top-1 rounded bg-black/50 px-1.5 py-0.5 text-xs text-white">
                      {index + 1}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </FormSection>

        {/* Status */}
        <FormSection title={t('common.status')}>
          <div className="max-w-xs">
            <Select
              options={statusOptions}
              value={form.status}
              onChange={(e) => updateField('status', e.target.value)}
            />
          </div>
        </FormSection>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-6">
          <Link to="/fleet">
            <Button type="button" variant="outline">
              {t('common.cancel')}
            </Button>
          </Link>
          <Button type="submit" isLoading={isSaving}>
            {isEdit ? t('fleet.saveVehicle') : t('fleet.createVehicleBtn')}
          </Button>
        </div>
      </form>
    </div>
  );
}

// ─── Helper ──────────────────────────────────────────────────────────────────

function FormSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-base font-semibold text-gray-900">{title}</h2>
      {children}
    </div>
  );
}
