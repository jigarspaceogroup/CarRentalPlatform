import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface FinancialSummary {
  totalRevenue: number;
  totalRefunds: number;
  outstandingCod: number;
  netRevenue: number;
}

interface SummaryParams {
  startDate?: string;
  endDate?: string;
}

// ─── Hook: useFinancialSummary ───────────────────────────────────────────────

export function useFinancialSummary(params: SummaryParams) {
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSummary = useCallback(async () => {
    setIsLoading(true);
    try {
      const query = new URLSearchParams();
      if (params.startDate) query.set('startDate', params.startDate);
      if (params.endDate) query.set('endDate', params.endDate);

      const { data } = await api.get<FinancialSummary>(
        `/v1/admin/payments/summary?${query.toString()}`,
      );
      setSummary(data);
    } catch {
      toast.error('Failed to load financial summary');
    } finally {
      setIsLoading(false);
    }
  }, [params.startDate, params.endDate]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return { summary, isLoading, refetch: fetchSummary };
}
