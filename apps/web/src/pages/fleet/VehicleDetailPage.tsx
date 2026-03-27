import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Car,
  Fuel,
  Users,
  DoorOpen,
  Briefcase,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Badge, type BadgeVariant } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { cn } from '@/lib/cn';
import {
  useVehicleDetail,
  deleteVehicle,
  changeVehicleStatus,
} from '@/hooks/useVehicles';

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

export function VehicleDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { vehicle, isLoading, refetch } = useVehicleDetail(id);

  const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'maintenance'>('overview');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [statusChanging, setStatusChanging] = useState(false);

  const handleDelete = useCallback(async () => {
    if (!id) return;
    setIsDeleting(true);
    try {
      await deleteVehicle(id);
      toast.success(t('fleet.deleteSuccess'));
      navigate('/fleet');
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
  }, [id, navigate, t]);

  const handleStatusChange = useCallback(
    async (newStatus: string) => {
      if (!id || !newStatus) return;
      setStatusChanging(true);
      try {
        await changeVehicleStatus(id, newStatus);
        toast.success(t('fleet.statusChangeSuccess'));
        refetch();
      } catch {
        toast.error(t('fleet.statusChangeFailed'));
      } finally {
        setStatusChanging(false);
      }
    },
    [id, refetch, t],
  );

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <svg
            className="mx-auto h-8 w-8 animate-spin text-primary-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <p className="mt-2 text-sm text-gray-500">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium text-gray-900">{t('fleet.vehicleNotFound')}</p>
          <Link to="/fleet" className="mt-2 text-sm text-primary-600 hover:text-primary-700">
            {t('fleet.backToFleet')}
          </Link>
        </div>
      </div>
    );
  }

  const vehicleName = `${vehicle.make} ${vehicle.model} ${vehicle.year}`;

  const statusOptions = [
    { value: 'available', label: t('fleet.statusAvailable') },
    { value: 'unavailable', label: t('fleet.statusUnavailable') },
    { value: 'in_maintenance', label: t('fleet.statusMaintenance') },
    { value: 'retired', label: t('fleet.statusRetired') },
  ];

  const tabs = [
    { key: 'overview' as const, label: t('fleet.tabOverview') },
    { key: 'bookings' as const, label: t('fleet.tabBookingHistory') },
    { key: 'maintenance' as const, label: t('fleet.tabMaintenance') },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/fleet"
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{vehicleName}</h1>
            <p className="mt-0.5 text-sm text-gray-500">{vehicle.licensePlate}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to={`/fleet/${vehicle.id}/edit`}>
            <Button variant="outline">
              <Pencil className="h-4 w-4" />
              {t('fleet.editVehicle')}
            </Button>
          </Link>
          <Button variant="danger" onClick={() => setShowDeleteDialog(true)}>
            <Trash2 className="h-4 w-4" />
            {t('fleet.deleteVehicle')}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'border-b-2 pb-3 text-sm font-medium transition-colors',
                activeTab === tab.key
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Image Gallery */}
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-gray-900">
                {t('fleet.images')}
              </h2>
              {vehicle.images?.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {vehicle.images
                    .sort((a, b) => a.sortOrder - b.sortOrder)
                    .map((img) => (
                      <button
                        key={img.id}
                        type="button"
                        onClick={() => setLightboxImage(img.imageUrl)}
                        className="group relative aspect-video overflow-hidden rounded-lg bg-gray-100"
                      >
                        <img
                          src={img.thumbnailUrl || img.imageUrl}
                          alt={vehicleName}
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        />
                      </button>
                    ))}
                </div>
              ) : (
                <div className="flex h-40 items-center justify-center rounded-lg border-2 border-dashed border-gray-200">
                  <p className="text-sm text-gray-400">{t('fleet.noImages')}</p>
                </div>
              )}
            </div>

            {/* Specifications */}
            <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-gray-900">
                {t('fleet.specifications')}
              </h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <SpecItem icon={Car} label={t('fleet.make')} value={vehicle.make} />
                <SpecItem icon={Car} label={t('fleet.model')} value={vehicle.model} />
                <SpecItem icon={Car} label={t('fleet.year')} value={String(vehicle.year)} />
                <SpecItem
                  icon={Car}
                  label={t('fleet.transmission')}
                  value={t(`fleet.${vehicle.transmission}`)}
                />
                <SpecItem icon={Fuel} label={t('fleet.fuelType')} value={vehicle.fuelType} />
                <SpecItem icon={Users} label={t('fleet.seats')} value={String(vehicle.seats)} />
                <SpecItem
                  icon={DoorOpen}
                  label={t('fleet.doors')}
                  value={String(vehicle.doors)}
                />
                <SpecItem
                  icon={Briefcase}
                  label={t('fleet.trunkCapacity')}
                  value={vehicle.trunkCapacity || '-'}
                />
              </div>
            </div>

            {/* Features */}
            {vehicle.features?.length > 0 && (
              <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-base font-semibold text-gray-900">
                  {t('fleet.features')}
                </h2>
                <div className="flex flex-wrap gap-2">
                  {vehicle.features.map((feature, idx) => (
                    <Badge key={idx} variant="blue">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-3 text-base font-semibold text-gray-900">
                {t('common.status')}
              </h2>
              <div className="mb-3">
                <Badge variant={statusBadgeVariant[vehicle.status] ?? 'gray'}>
                  {t(getStatusKey(vehicle.status))}
                </Badge>
              </div>
              <Select
                label={t('fleet.changeStatus')}
                options={statusOptions}
                value={vehicle.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={statusChanging}
              />
            </div>

            {/* Pricing */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-gray-900">
                {t('fleet.pricing')}
              </h2>
              <div className="space-y-3">
                <PriceRow
                  label={t('fleet.dailyRate')}
                  value={vehicle.dailyRate}
                  highlight
                />
                {vehicle.weeklyRate != null && (
                  <PriceRow label={t('fleet.weeklyRate')} value={vehicle.weeklyRate} />
                )}
                {vehicle.monthlyRate != null && (
                  <PriceRow label={t('fleet.monthlyRate')} value={vehicle.monthlyRate} />
                )}
                {vehicle.longTermRate != null && (
                  <PriceRow label={t('fleet.longTermRate')} value={vehicle.longTermRate} />
                )}
              </div>
            </div>

            {/* Branch */}
            {vehicle.branch && (
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="mb-3 text-base font-semibold text-gray-900">
                  {t('fleet.branch')}
                </h2>
                <p className="text-sm text-gray-700">{vehicle.branch.nameEn}</p>
              </div>
            )}

            {/* Category */}
            {vehicle.category && (
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="mb-3 text-base font-semibold text-gray-900">
                  {t('fleet.category')}
                </h2>
                <p className="text-sm text-gray-700">{vehicle.category.nameEn}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'bookings' && (
        <div className="flex h-48 items-center justify-center rounded-xl border border-gray-200 bg-white shadow-sm">
          <p className="text-sm text-gray-400">{t('fleet.bookingHistoryPlaceholder')}</p>
        </div>
      )}

      {activeTab === 'maintenance' && (
        <div className="flex h-48 items-center justify-center rounded-xl border border-gray-200 bg-white shadow-sm">
          <p className="text-sm text-gray-400">{t('fleet.maintenancePlaceholder')}</p>
        </div>
      )}

      {/* Delete Confirm */}
      <ConfirmDialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title={t('fleet.deleteTitle')}
        message={t('fleet.deleteMessage', { name: vehicleName })}
        confirmLabel={t('common.delete')}
        isLoading={isDeleting}
      />

      {/* Lightbox */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightboxImage(null)}
        >
          <button
            type="button"
            onClick={() => setLightboxImage(null)}
            className="absolute end-4 top-4 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
          >
            <X className="h-6 w-6" />
          </button>
          <img
            src={lightboxImage}
            alt={vehicleName}
            className="max-h-[85vh] max-w-full rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

// ─── Helper components ───────────────────────────────────────────────────────

function SpecItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100">
        <Icon className="h-4 w-4 text-gray-500" />
      </div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-medium text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function PriceRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-500">{label}</span>
      <span
        className={cn(
          'text-sm font-medium',
          highlight ? 'text-lg font-bold text-primary-600' : 'text-gray-900',
        )}
      >
        ${value}
      </span>
    </div>
  );
}
