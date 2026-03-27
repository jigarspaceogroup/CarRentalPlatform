import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PricingRule {
  id: string;
  name: string;
  ruleType: 'MULTIPLIER' | 'FIXED_OVERRIDE';
  ruleValue: number;
  startDate: string;
  endDate: string;
  vehicleId?: string | null;
  categoryId?: string | null;
  isActive: boolean;
  vehicle?: { id: string; make: string; model: string; year: number };
  category?: { id: string; nameEn: string; nameAr: string };
  createdAt: string;
  updatedAt: string;
}

export interface PricingRuleFormData {
  name: string;
  ruleType: 'MULTIPLIER' | 'FIXED_OVERRIDE';
  ruleValue: number;
  startDate: string;
  endDate: string;
  scope: 'vehicle' | 'category';
  vehicleId?: string;
  categoryId?: string;
  isActive: boolean;
}

export interface PricingRuleListParams {
  page?: number;
  limit?: number;
  search?: string;
  ruleType?: string;
  vehicleId?: string;
  categoryId?: string;
  isActive?: boolean;
}

interface PricingRuleListResponse {
  data: PricingRule[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ─── Hook: usePricingRules ───────────────────────────────────────────────────

export function usePricingRules(params: PricingRuleListParams = {}) {
  const [data, setData] = useState<PricingRule[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);

  const fetchRules = useCallback(async () => {
    setIsLoading(true);
    try {
      const query = new URLSearchParams();
      if (params.page) query.set('page', String(params.page));
      if (params.limit) query.set('limit', String(params.limit));
      if (params.search) query.set('search', params.search);
      if (params.ruleType) query.set('ruleType', params.ruleType);
      if (params.vehicleId) query.set('vehicleId', params.vehicleId);
      if (params.categoryId) query.set('categoryId', params.categoryId);
      if (params.isActive !== undefined) query.set('isActive', String(params.isActive));

      const { data: res } = await api.get<PricingRuleListResponse>(
        `/v1/admin/pricing-rules?${query.toString()}`,
      );
      setData(res.data);
      setMeta(res.meta);
    } catch {
      toast.error('Failed to load pricing rules');
    } finally {
      setIsLoading(false);
    }
  }, [
    params.page,
    params.limit,
    params.search,
    params.ruleType,
    params.vehicleId,
    params.categoryId,
    params.isActive,
  ]);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  return { data, meta, isLoading, refetch: fetchRules };
}

// ─── Mutation helpers ────────────────────────────────────────────────────────

export async function createPricingRule(data: PricingRuleFormData): Promise<PricingRule> {
  const payload = {
    name: data.name,
    ruleType: data.ruleType,
    ruleValue: data.ruleValue,
    startDate: data.startDate,
    endDate: data.endDate,
    vehicleId: data.scope === 'vehicle' ? data.vehicleId : null,
    categoryId: data.scope === 'category' ? data.categoryId : null,
    isActive: data.isActive,
  };

  const { data: rule } = await api.post<PricingRule>('/v1/admin/pricing-rules', payload);
  return rule;
}

export async function updatePricingRule(
  id: string,
  data: Partial<PricingRuleFormData>,
): Promise<PricingRule> {
  const payload: Record<string, unknown> = {
    name: data.name,
    ruleType: data.ruleType,
    ruleValue: data.ruleValue,
    startDate: data.startDate,
    endDate: data.endDate,
    isActive: data.isActive,
  };

  if (data.scope === 'vehicle') {
    payload.vehicleId = data.vehicleId;
    payload.categoryId = null;
  } else if (data.scope === 'category') {
    payload.categoryId = data.categoryId;
    payload.vehicleId = null;
  }

  const { data: rule } = await api.put<PricingRule>(`/v1/admin/pricing-rules/${id}`, payload);
  return rule;
}

export async function deletePricingRule(id: string): Promise<void> {
  await api.delete(`/v1/admin/pricing-rules/${id}`);
}

export async function checkPricingRuleConflicts(
  startDate: string,
  endDate: string,
  vehicleId?: string,
  categoryId?: string,
  excludeRuleId?: string,
): Promise<{ hasConflicts: boolean; conflicts: PricingRule[] }> {
  const query = new URLSearchParams();
  query.set('startDate', startDate);
  query.set('endDate', endDate);
  if (vehicleId) query.set('vehicleId', vehicleId);
  if (categoryId) query.set('categoryId', categoryId);
  if (excludeRuleId) query.set('excludeRuleId', excludeRuleId);

  const { data } = await api.get<{ hasConflicts: boolean; conflicts: PricingRule[] }>(
    `/v1/admin/pricing-rules/check-conflicts?${query.toString()}`,
  );
  return data;
}
