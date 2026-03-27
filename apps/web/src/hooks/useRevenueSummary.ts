import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface RevenueKPIs {
  totalRevenue: number;
  totalRefunds: number;
  outstandingCOD: number;
  netRevenue: number;
}

export interface RevenueTrendPoint {
  date: string;
  revenue: number;
  refunds: number;
  netRevenue: number;
}

export interface RevenueByCategoryItem {
  categoryId: string;
  categoryName: string;
  revenue: number;
}

export interface TopRevenueVehicle {
  vehicleId: string;
  make: string;
  model: string;
  year: number;
  revenue: number;
  bookingCount: number;
}

export interface RevenueByBranchItem {
  branchId: string;
  branchName: string;
  revenue: number;
}

export interface RevenueSummaryData {
  kpis: RevenueKPIs;
  trend: RevenueTrendPoint[];
  byCategory: RevenueByCategoryItem[];
  topVehicles: TopRevenueVehicle[];
  byBranch: RevenueByBranchItem[];
}

export type GroupByPeriod = 'day' | 'week' | 'month';

export interface RevenueSummaryParams {
  startDate: string;
  endDate: string;
  groupBy: GroupByPeriod;
}

// ─── Hook: useRevenueSummary ─────────────────────────────────────────────────

export function useRevenueSummary(params: RevenueSummaryParams) {
  const [data, setData] = useState<RevenueSummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSummary = useCallback(async () => {
    setIsLoading(true);
    try {
      const query = new URLSearchParams();
      query.set('startDate', params.startDate);
      query.set('endDate', params.endDate);
      query.set('groupBy', params.groupBy);

      const { data: res } = await api.get<RevenueSummaryData>(
        `/v1/admin/revenue?${query.toString()}`,
      );
      setData(res);
    } catch {
      toast.error('Failed to load revenue data');
    } finally {
      setIsLoading(false);
    }
  }, [params.startDate, params.endDate, params.groupBy]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return { data, isLoading, refetch: fetchSummary };
}

// ─── Export helpers ──────────────────────────────────────────────────────────

export async function exportRevenueCSV(startDate: string, endDate: string): Promise<Blob> {
  const query = new URLSearchParams();
  query.set('startDate', startDate);
  query.set('endDate', endDate);
  query.set('format', 'csv');

  const { data } = await api.get(`/v1/admin/revenue/export?${query.toString()}`, {
    responseType: 'blob',
  });
  return data;
}

export async function exportRevenuePDF(startDate: string, endDate: string): Promise<Blob> {
  const query = new URLSearchParams();
  query.set('startDate', startDate);
  query.set('endDate', endDate);
  query.set('format', 'pdf');

  const { data } = await api.get(`/v1/admin/revenue/export?${query.toString()}`, {
    responseType: 'blob',
  });
  return data;
}
