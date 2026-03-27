import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, DollarSign, RefreshCcw, Wallet, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { cn } from '@/lib/cn';
import {
  useRevenueSummary,
  exportRevenueCSV,
  exportRevenuePDF,
  type GroupByPeriod,
} from '@/hooks/useRevenueSummary';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

function getDateRange(preset: string): { startDate: string; endDate: string } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (preset) {
    case 'today': {
      const start = new Date(today);
      return {
        startDate: start.toISOString().split('T')[0] ?? '',
        endDate: start.toISOString().split('T')[0] ?? '',
      };
    }
    case 'week': {
      const start = new Date(today);
      start.setDate(today.getDate() - 6);
      return {
        startDate: start.toISOString().split('T')[0] ?? '',
        endDate: today.toISOString().split('T')[0] ?? '',
      };
    }
    case 'month': {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      return {
        startDate: start.toISOString().split('T')[0] ?? '',
        endDate: today.toISOString().split('T')[0] ?? '',
      };
    }
    case 'lastMonth': {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const end = new Date(today.getFullYear(), today.getMonth(), 0);
      return {
        startDate: start.toISOString().split('T')[0] ?? '',
        endDate: end.toISOString().split('T')[0] ?? '',
      };
    }
    default:
      return {
        startDate: today.toISOString().split('T')[0] ?? '',
        endDate: today.toISOString().split('T')[0] ?? '',
      };
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

export function RevenueDashboardPage() {
  const { t } = useTranslation();

  const [preset, setPreset] = useState('month');
  const [isCustom, setIsCustom] = useState(false);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [groupBy, setGroupBy] = useState<GroupByPeriod>('day');
  const [isExporting, setIsExporting] = useState(false);

  const { startDate, endDate } = useMemo(() => {
    if (isCustom && customStartDate && customEndDate) {
      return { startDate: customStartDate, endDate: customEndDate };
    }
    return getDateRange(preset);
  }, [preset, isCustom, customStartDate, customEndDate]);

  const { data, isLoading } = useRevenueSummary({ startDate, endDate, groupBy });

  const presetOptions = [
    { value: 'today', label: t('pricing.today') },
    { value: 'week', label: t('pricing.thisWeek') },
    { value: 'month', label: t('pricing.thisMonth') },
    { value: 'lastMonth', label: t('pricing.lastMonth') },
    { value: 'custom', label: t('pricing.customRange') },
  ];

  const groupByOptions = [
    { value: 'day', label: t('pricing.byDay') },
    { value: 'week', label: t('pricing.byWeek') },
    { value: 'month', label: t('pricing.byMonth') },
  ];

  const handlePresetChange = useCallback((value: string) => {
    setPreset(value);
    setIsCustom(value === 'custom');
  }, []);

  const handleExportCSV = useCallback(async () => {
    setIsExporting(true);
    try {
      const blob = await exportRevenueCSV(startDate, endDate);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `revenue-report-${startDate}-to-${endDate}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success(t('pricing.exportSuccess'));
    } catch {
      toast.error(t('pricing.exportFailed'));
    } finally {
      setIsExporting(false);
    }
  }, [startDate, endDate, t]);

  const handleExportPDF = useCallback(async () => {
    setIsExporting(true);
    try {
      const blob = await exportRevenuePDF(startDate, endDate);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `revenue-report-${startDate}-to-${endDate}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success(t('pricing.exportSuccess'));
    } catch {
      toast.error(t('pricing.exportFailed'));
    } finally {
      setIsExporting(false);
    }
  }, [startDate, endDate, t]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('pricing.revenueTitle')}</h1>
          <p className="mt-1 text-sm text-gray-500">{t('pricing.revenueSubtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCSV} isLoading={isExporting}>
            <Download className="h-4 w-4" />
            {t('pricing.exportCSV')}
          </Button>
          <Button variant="outline" onClick={handleExportPDF} isLoading={isExporting}>
            <Download className="h-4 w-4" />
            {t('pricing.exportPDF')}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Select
            label={t('pricing.dateRange')}
            options={presetOptions}
            value={preset}
            onChange={(e) => handlePresetChange(e.target.value)}
          />

          {isCustom && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('pricing.startDate')}
                </label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className={cn(
                    'block w-full rounded-lg border border-gray-300 py-2 px-3 text-sm',
                    'focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500',
                  )}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('pricing.endDate')}
                </label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className={cn(
                    'block w-full rounded-lg border border-gray-300 py-2 px-3 text-sm',
                    'focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500',
                  )}
                />
              </div>
            </>
          )}

          {!isCustom && (
            <Select
              label={t('pricing.groupBy')}
              options={groupByOptions}
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as GroupByPeriod)}
            />
          )}
        </div>
      </div>

      {/* KPI Cards */}
      {!isLoading && data && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('pricing.totalRevenue')}</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {formatCurrency(data.kpis.totalRevenue)}
                </p>
              </div>
              <div className="rounded-full bg-green-100 p-3">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('pricing.totalRefunds')}</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {formatCurrency(data.kpis.totalRefunds)}
                </p>
              </div>
              <div className="rounded-full bg-red-100 p-3">
                <RefreshCcw className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('pricing.outstandingCOD')}</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {formatCurrency(data.kpis.outstandingCOD)}
                </p>
              </div>
              <div className="rounded-full bg-yellow-100 p-3">
                <Wallet className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('pricing.netRevenue')}</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {formatCurrency(data.kpis.netRevenue)}
                </p>
              </div>
              <div className="rounded-full bg-blue-100 p-3">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Revenue Trend Chart */}
      {!isLoading && data && data.trend.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            {t('pricing.revenueTrend')}
          </h2>
          <div className="h-64 flex items-end justify-between gap-2">
            {data.trend.map((point, index) => {
              const maxRevenue = Math.max(...data.trend.map((p) => p.revenue));
              const height = maxRevenue > 0 ? (point.revenue / maxRevenue) * 100 : 0;

              return (
                <div key={index} className="flex flex-1 flex-col items-center gap-2">
                  <div className="relative w-full">
                    <div
                      className="w-full rounded-t-md bg-primary-500 transition-all hover:bg-primary-600"
                      style={{ height: `${Math.max(height, 2)}%` }}
                      title={`${point.date}: ${formatCurrency(point.revenue)}`}
                    />
                  </div>
                  <span className="text-xs text-gray-600">
                    {new Date(point.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Revenue by Category */}
        {!isLoading && data && data.byCategory.length > 0 && (
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              {t('pricing.revenueByCategory')}
            </h2>
            <div className="space-y-3">
              {data.byCategory.slice(0, 5).map((item) => {
                const maxRevenue = Math.max(...data.byCategory.map((c) => c.revenue));
                const percent = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0;

                return (
                  <div key={item.categoryId}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-700">{item.categoryName}</span>
                      <span className="font-semibold text-gray-900">
                        {formatCurrency(item.revenue)}
                      </span>
                    </div>
                    <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-200">
                      <div
                        className="h-full rounded-full bg-primary-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Revenue by Branch */}
        {!isLoading && data && data.byBranch.length > 0 && (
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              {t('pricing.revenueByBranch')}
            </h2>
            <div className="space-y-3">
              {data.byBranch.slice(0, 5).map((item) => {
                const maxRevenue = Math.max(...data.byBranch.map((b) => b.revenue));
                const percent = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0;

                return (
                  <div key={item.branchId}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-700">{item.branchName}</span>
                      <span className="font-semibold text-gray-900">
                        {formatCurrency(item.revenue)}
                      </span>
                    </div>
                    <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-200">
                      <div
                        className="h-full rounded-full bg-green-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Top Revenue Vehicles */}
      {!isLoading && data && data.topVehicles.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {t('pricing.topRevenueVehicles')}
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-start text-xs font-medium uppercase tracking-wider text-gray-500">
                    {t('pricing.vehicle')}
                  </th>
                  <th className="px-6 py-3 text-end text-xs font-medium uppercase tracking-wider text-gray-500">
                    {t('pricing.bookings')}
                  </th>
                  <th className="px-6 py-3 text-end text-xs font-medium uppercase tracking-wider text-gray-500">
                    {t('pricing.revenue')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {data.topVehicles.map((vehicle) => (
                  <tr key={vehicle.vehicleId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {vehicle.make} {vehicle.model} {vehicle.year}
                    </td>
                    <td className="px-6 py-4 text-end text-sm text-gray-700">
                      {vehicle.bookingCount}
                    </td>
                    <td className="px-6 py-4 text-end text-sm font-semibold text-gray-900">
                      {formatCurrency(vehicle.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-primary-600" />
            <p className="mt-2 text-sm text-gray-500">{t('common.loading')}</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && data && data.trend.length === 0 && (
        <div className="flex h-64 items-center justify-center rounded-xl border border-gray-200 bg-white">
          <div className="text-center">
            <p className="text-gray-500">{t('pricing.noRevenueData')}</p>
          </div>
        </div>
      )}
    </div>
  );
}
