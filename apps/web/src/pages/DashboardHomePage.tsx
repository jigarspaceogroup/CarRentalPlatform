import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  CalendarCheck,
  ArrowUpRight,
  ArrowDownRight,
  Car,
  Plus,
  List,
  Clock,
  DollarSign,
  Wrench,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import { useDashboard } from '@/hooks/useDashboard';
import { useSocket } from '@/hooks/useSocket';
import type { RecentBooking } from '@/hooks/useDashboard';

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------

const BOOKING_STATUS_CONFIG: Record<string, { key: string; color: string }> = {
  PENDING: { key: 'dashboard.statusPending', color: 'bg-yellow-100 text-yellow-700' },
  CONFIRMED: { key: 'dashboard.statusConfirmed', color: 'bg-blue-100 text-blue-700' },
  VEHICLE_PREPARING: {
    key: 'dashboard.statusPreparing',
    color: 'bg-indigo-100 text-indigo-700',
  },
  READY_FOR_PICKUP: {
    key: 'dashboard.statusReady',
    color: 'bg-cyan-100 text-cyan-700',
  },
  ACTIVE_RENTAL: { key: 'dashboard.statusActive', color: 'bg-green-100 text-green-700' },
  RETURN_PENDING: {
    key: 'dashboard.statusReturnPending',
    color: 'bg-orange-100 text-orange-700',
  },
  COMPLETED: { key: 'dashboard.statusCompleted', color: 'bg-gray-100 text-gray-700' },
  CANCELLED: { key: 'dashboard.statusCancelled', color: 'bg-red-100 text-red-700' },
  REJECTED: { key: 'dashboard.statusRejected', color: 'bg-red-100 text-red-700' },
};

function getStatusConfig(status: string) {
  return BOOKING_STATUS_CONFIG[status] ?? { key: status, color: 'bg-gray-100 text-gray-700' };
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// ---------------------------------------------------------------------------
// Skeleton components
// ---------------------------------------------------------------------------

function KpiCardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="h-10 w-10 rounded-lg bg-gray-200" />
        <div className="h-5 w-12 rounded-full bg-gray-200" />
      </div>
      <div className="mt-3 h-8 w-16 rounded bg-gray-200" />
      <div className="mt-2 h-4 w-24 rounded bg-gray-200" />
    </div>
  );
}

function TableRowSkeleton() {
  return (
    <tr>
      <td className="px-6 py-3.5">
        <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
      </td>
      <td className="px-6 py-3.5">
        <div className="h-4 w-28 animate-pulse rounded bg-gray-200" />
      </td>
      <td className="px-6 py-3.5">
        <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
      </td>
      <td className="px-6 py-3.5">
        <div className="h-4 w-28 animate-pulse rounded bg-gray-200" />
      </td>
      <td className="px-6 py-3.5">
        <div className="h-5 w-16 animate-pulse rounded-full bg-gray-200" />
      </td>
    </tr>
  );
}

function FleetStatusSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-gray-200" />
            <div className="h-4 w-20 rounded bg-gray-200" />
          </div>
          <div className="h-6 w-8 rounded bg-gray-200" />
        </div>
      ))}
      <div className="mt-5">
        <div className="h-2.5 w-full rounded-full bg-gray-200" />
        <div className="mt-2 h-3 w-24 rounded bg-gray-200" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// KPI Card definitions
// ---------------------------------------------------------------------------

interface KpiCardDef {
  labelKey: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  getValue: (stats: {
    activeBookings: number;
    todayPickups: number;
    todayReturns: number;
    fleetAvailability: number;
    todayRevenue: number;
  }) => string;
}

const kpiCardDefs: KpiCardDef[] = [
  {
    labelKey: 'dashboard.activeBookings',
    icon: CalendarCheck,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    getValue: (s) => String(s.activeBookings),
  },
  {
    labelKey: 'dashboard.todayPickups',
    icon: ArrowUpRight,
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    getValue: (s) => String(s.todayPickups),
  },
  {
    labelKey: 'dashboard.todayReturns',
    icon: ArrowDownRight,
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
    getValue: (s) => String(s.todayReturns),
  },
  {
    labelKey: 'dashboard.fleetAvailability',
    icon: Car,
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
    getValue: (s) => String(s.fleetAvailability),
  },
  {
    labelKey: 'dashboard.todayRevenue',
    icon: DollarSign,
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    getValue: (s) => formatCurrency(s.todayRevenue),
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DashboardHomePage() {
  const { t } = useTranslation();
  const { data, isLoading, error, refetch } = useDashboard();
  const { on } = useSocket();
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    const offNew = on('booking:new', () => {
      toast.success(t('realtime.newBookingAlert'), { duration: 5000 });
      refetch();
    });
    const offRefresh = on('dashboard:refresh', () => {
      refetch();
    });
    const offConnect = on('connect', () => setIsLive(true));
    const offDisconnect = on('disconnect', () => setIsLive(false));
    return () => {
      offNew?.();
      offRefresh?.();
      offConnect?.();
      offDisconnect?.();
    };
  }, [on, refetch, t]);

  return (
    <div className="space-y-6">
      {/* Live indicator */}
      {isLive && (
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
          </span>
          <span className="text-xs font-medium text-green-600">{t('realtime.live')}</span>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
          <p className="text-sm text-red-700">{error}</p>
          <Button variant="ghost" size="sm" className="ml-auto shrink-0" onClick={refetch}>
            <RefreshCw className="h-4 w-4" />
            {t('common.retry')}
          </Button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => <KpiCardSkeleton key={i} />)
          : kpiCardDefs.map((card) => (
              <div
                key={card.labelKey}
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-lg',
                      card.iconBg,
                    )}
                  >
                    <card.icon className={cn('h-5 w-5', card.iconColor)} />
                  </div>
                </div>
                <p className="mt-3 text-2xl font-bold text-gray-900">
                  {data ? card.getValue(data.stats) : '0'}
                </p>
                <p className="mt-1 text-sm text-gray-500">{t(card.labelKey)}</p>
              </div>
            ))}
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Bookings - takes 2 columns */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <h2 className="text-base font-semibold text-gray-900">
              {t('dashboard.recentBookings')}
            </h2>
            <Link
              to="/bookings"
              className="text-sm font-medium text-primary-600 transition-colors hover:text-primary-700"
            >
              {t('dashboard.viewAll')}
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-6 py-3 text-start text-xs font-medium uppercase tracking-wider text-gray-500">
                    {t('dashboard.refNumber')}
                  </th>
                  <th className="px-6 py-3 text-start text-xs font-medium uppercase tracking-wider text-gray-500">
                    {t('dashboard.customer')}
                  </th>
                  <th className="px-6 py-3 text-start text-xs font-medium uppercase tracking-wider text-gray-500">
                    {t('dashboard.vehicle')}
                  </th>
                  <th className="px-6 py-3 text-start text-xs font-medium uppercase tracking-wider text-gray-500">
                    {t('dashboard.dates')}
                  </th>
                  <th className="px-6 py-3 text-start text-xs font-medium uppercase tracking-wider text-gray-500">
                    {t('common.status')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} />)
                ) : data && data.recentBookings.length > 0 ? (
                  data.recentBookings.map((booking: RecentBooking) => {
                    const statusCfg = getStatusConfig(booking.status);
                    return (
                      <tr
                        key={booking.id}
                        className="transition-colors hover:bg-gray-50"
                      >
                        <td className="whitespace-nowrap px-6 py-3.5 text-sm font-medium text-gray-900">
                          {booking.referenceNumber}
                        </td>
                        <td className="whitespace-nowrap px-6 py-3.5 text-sm text-gray-700">
                          {booking.customerName}
                        </td>
                        <td className="whitespace-nowrap px-6 py-3.5 text-sm text-gray-700">
                          {booking.vehicle}
                        </td>
                        <td className="whitespace-nowrap px-6 py-3.5 text-sm text-gray-500">
                          {formatDate(booking.pickupDate)} -{' '}
                          {formatDate(booking.returnDate)}
                        </td>
                        <td className="whitespace-nowrap px-6 py-3.5">
                          <span
                            className={cn(
                              'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
                              statusCfg.color,
                            )}
                          >
                            {t(statusCfg.key)}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-10 text-center text-sm text-gray-400"
                    >
                      {t('dashboard.noBookings')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right column: Fleet Status + Quick Actions */}
        <div className="space-y-6">
          {/* Fleet Status */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-gray-900">
              {t('dashboard.fleetStatus')}
            </h2>

            {isLoading ? (
              <FleetStatusSkeleton />
            ) : (
              <>
                <div className="space-y-4">
                  {[
                    {
                      labelKey: 'dashboard.available',
                      value: data?.fleetStatus.available ?? 0,
                      color: 'text-green-600',
                      icon: Car,
                    },
                    {
                      labelKey: 'dashboard.rented',
                      value: data?.fleetStatus.rented ?? 0,
                      color: 'text-blue-600',
                      icon: Clock,
                    },
                    {
                      labelKey: 'dashboard.inMaintenance',
                      value: data?.fleetStatus.inMaintenance ?? 0,
                      color: 'text-orange-600',
                      icon: Wrench,
                    },
                  ].map((stat) => (
                    <div key={stat.labelKey} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100">
                          <stat.icon className={cn('h-4 w-4', stat.color)} />
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                          {t(stat.labelKey)}
                        </span>
                      </div>
                      <span className={cn('text-lg font-bold', stat.color)}>
                        {stat.value}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Visual bar */}
                {(() => {
                  const total = data?.fleetStatus.total ?? 0;
                  const available = data?.fleetStatus.available ?? 0;
                  const rented = data?.fleetStatus.rented ?? 0;
                  const inMaint = data?.fleetStatus.inMaintenance ?? 0;
                  const safeTotal = total > 0 ? total : 1;

                  return (
                    <div className="mt-5">
                      <div className="flex h-2.5 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="bg-green-500 transition-all"
                          style={{ width: `${(available / safeTotal) * 100}%` }}
                        />
                        <div
                          className="bg-blue-500 transition-all"
                          style={{ width: `${(rented / safeTotal) * 100}%` }}
                        />
                        <div
                          className="bg-orange-500 transition-all"
                          style={{ width: `${(inMaint / safeTotal) * 100}%` }}
                        />
                      </div>
                      <p className="mt-2 text-xs text-gray-400">
                        {t('dashboard.totalVehicles', { count: total })}
                      </p>
                    </div>
                  );
                })()}
              </>
            )}
          </div>

          {/* Quick Actions */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-gray-900">
              {t('dashboard.quickActions')}
            </h2>
            <div className="space-y-3">
              <Link to="/fleet" className="block">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Plus className="h-4 w-4" />
                  {t('dashboard.newVehicle')}
                </Button>
              </Link>
              <Link to="/bookings" className="block">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <List className="h-4 w-4" />
                  {t('dashboard.viewBookings')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
