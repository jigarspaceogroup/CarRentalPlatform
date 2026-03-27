import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  CalendarCheck,
  ArrowUpRight,
  ArrowDownRight,
  Car,
  Plus,
  List,
  TrendingUp,
  Clock,
  DollarSign,
  Wrench,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

// ─── Mock Data ───────────────────────────────────────────────────────────────

interface KpiCard {
  labelKey: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
}

const kpiCards: KpiCard[] = [
  {
    labelKey: 'dashboard.activeBookings',
    value: '24',
    change: '+12%',
    trend: 'up',
    icon: CalendarCheck,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
  {
    labelKey: 'dashboard.todayPickups',
    value: '8',
    change: '+3',
    trend: 'up',
    icon: ArrowUpRight,
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
  },
  {
    labelKey: 'dashboard.todayReturns',
    value: '5',
    change: '-2',
    trend: 'down',
    icon: ArrowDownRight,
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
  },
  {
    labelKey: 'dashboard.fleetAvailability',
    value: '73%',
    change: '+5%',
    trend: 'up',
    icon: Car,
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
  },
  {
    labelKey: 'dashboard.todayRevenue',
    value: '$4,280',
    change: '+18%',
    trend: 'up',
    icon: DollarSign,
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
  },
];

interface MockBooking {
  ref: string;
  customer: string;
  vehicle: string;
  startDate: string;
  endDate: string;
  statusKey: string;
  statusColor: string;
}

const mockBookings: MockBooking[] = [
  {
    ref: 'BK-2024-001',
    customer: 'Ahmed Al-Farsi',
    vehicle: 'Toyota Camry 2024',
    startDate: '2026-03-26',
    endDate: '2026-03-30',
    statusKey: 'dashboard.statusActive',
    statusColor: 'bg-green-100 text-green-700',
  },
  {
    ref: 'BK-2024-002',
    customer: 'Sara Mohammed',
    vehicle: 'Hyundai Tucson 2025',
    startDate: '2026-03-25',
    endDate: '2026-03-28',
    statusKey: 'dashboard.statusActive',
    statusColor: 'bg-green-100 text-green-700',
  },
  {
    ref: 'BK-2024-003',
    customer: 'Omar Hassan',
    vehicle: 'Nissan Altima 2024',
    startDate: '2026-03-26',
    endDate: '2026-04-02',
    statusKey: 'dashboard.statusPending',
    statusColor: 'bg-yellow-100 text-yellow-700',
  },
  {
    ref: 'BK-2024-004',
    customer: 'Fatima Al-Rashid',
    vehicle: 'Honda Accord 2025',
    startDate: '2026-03-24',
    endDate: '2026-03-26',
    statusKey: 'dashboard.statusCompleted',
    statusColor: 'bg-blue-100 text-blue-700',
  },
  {
    ref: 'BK-2024-005',
    customer: 'Khalid Ibrahim',
    vehicle: 'Kia Sportage 2024',
    startDate: '2026-03-20',
    endDate: '2026-03-25',
    statusKey: 'dashboard.statusOverdue',
    statusColor: 'bg-red-100 text-red-700',
  },
];

interface FleetStat {
  labelKey: string;
  value: number;
  color: string;
  icon: React.ElementType;
}

const fleetStats: FleetStat[] = [
  { labelKey: 'dashboard.available', value: 32, color: 'text-green-600', icon: Car },
  { labelKey: 'dashboard.rented', value: 24, color: 'text-blue-600', icon: Clock },
  { labelKey: 'dashboard.inMaintenance', value: 6, color: 'text-orange-600', icon: Wrench },
];

// ─── Component ───────────────────────────────────────────────────────────────

export function DashboardHomePage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {kpiCards.map((card) => (
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
              <span
                className={cn(
                  'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium',
                  card.trend === 'up'
                    ? 'bg-green-50 text-green-700'
                    : 'bg-red-50 text-red-700',
                )}
              >
                {card.trend === 'up' ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <ArrowDownRight className="h-3 w-3" />
                )}
                {card.change}
              </span>
            </div>
            <p className="mt-3 text-2xl font-bold text-gray-900">{card.value}</p>
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
                {mockBookings.map((booking) => (
                  <tr
                    key={booking.ref}
                    className="transition-colors hover:bg-gray-50"
                  >
                    <td className="whitespace-nowrap px-6 py-3.5 text-sm font-medium text-gray-900">
                      {booking.ref}
                    </td>
                    <td className="whitespace-nowrap px-6 py-3.5 text-sm text-gray-700">
                      {booking.customer}
                    </td>
                    <td className="whitespace-nowrap px-6 py-3.5 text-sm text-gray-700">
                      {booking.vehicle}
                    </td>
                    <td className="whitespace-nowrap px-6 py-3.5 text-sm text-gray-500">
                      {booking.startDate} - {booking.endDate}
                    </td>
                    <td className="whitespace-nowrap px-6 py-3.5">
                      <span
                        className={cn(
                          'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
                          booking.statusColor,
                        )}
                      >
                        {t(booking.statusKey)}
                      </span>
                    </td>
                  </tr>
                ))}
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
            <div className="space-y-4">
              {fleetStats.map((stat) => (
                <div key={stat.labelKey} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100">
                      <stat.icon className={cn('h-4 w-4', stat.color)} />
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      {t(stat.labelKey)}
                    </span>
                  </div>
                  <span className={cn('text-lg font-bold', stat.color)}>{stat.value}</span>
                </div>
              ))}
            </div>

            {/* Visual bar */}
            <div className="mt-5">
              <div className="flex h-2.5 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="bg-green-500 transition-all"
                  style={{ width: `${(32 / 62) * 100}%` }}
                />
                <div
                  className="bg-blue-500 transition-all"
                  style={{ width: `${(24 / 62) * 100}%` }}
                />
                <div
                  className="bg-orange-500 transition-all"
                  style={{ width: `${(6 / 62) * 100}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-gray-400">
                {t('dashboard.totalVehicles', { count: 62 })}
              </p>
            </div>
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
