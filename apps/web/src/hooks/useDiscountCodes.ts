import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DiscountCode {
  id: string;
  code: string;
  description?: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  maxDiscountAmount?: number;
  minBookingAmount?: number;
  usageLimit?: number;
  usageCount: number;
  perUserLimit?: number;
  applicableVehicleIds: string[];
  applicableCategoryIds: string[];
  startsAt: string;
  expiresAt: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DiscountCodeFormData {
  code: string;
  description?: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  maxDiscountAmount?: number;
  minBookingAmount?: number;
  usageLimit?: number;
  perUserLimit?: number;
  applicableVehicleIds: string[];
  applicableCategoryIds: string[];
  startsAt: string;
  expiresAt: string;
  isActive: boolean;
}

export interface DiscountCodeListParams {
  page?: number;
  limit?: number;
  search?: string;
  discountType?: string;
  isActive?: boolean;
}

interface DiscountCodeListResponse {
  data: DiscountCode[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ─── Hook: useDiscountCodes ──────────────────────────────────────────────────

export function useDiscountCodes(params: DiscountCodeListParams = {}) {
  const [data, setData] = useState<DiscountCode[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);

  const fetchCodes = useCallback(async () => {
    setIsLoading(true);
    try {
      const query = new URLSearchParams();
      if (params.page) query.set('page', String(params.page));
      if (params.limit) query.set('limit', String(params.limit));
      if (params.search) query.set('search', params.search);
      if (params.discountType) query.set('discountType', params.discountType);
      if (params.isActive !== undefined) query.set('isActive', String(params.isActive));

      const { data: res } = await api.get<DiscountCodeListResponse>(
        `/v1/admin/discount-codes?${query.toString()}`,
      );
      setData(res.data);
      setMeta(res.meta);
    } catch {
      toast.error('Failed to load discount codes');
    } finally {
      setIsLoading(false);
    }
  }, [params.page, params.limit, params.search, params.discountType, params.isActive]);

  useEffect(() => {
    fetchCodes();
  }, [fetchCodes]);

  return { data, meta, isLoading, refetch: fetchCodes };
}

// ─── Mutation helpers ────────────────────────────────────────────────────────

export async function createDiscountCode(data: DiscountCodeFormData): Promise<DiscountCode> {
  const { data: code } = await api.post<DiscountCode>('/v1/admin/discount-codes', data);
  return code;
}

export async function updateDiscountCode(
  id: string,
  data: Partial<DiscountCodeFormData>,
): Promise<DiscountCode> {
  const { data: code } = await api.put<DiscountCode>(`/v1/admin/discount-codes/${id}`, data);
  return code;
}

export async function deleteDiscountCode(id: string): Promise<void> {
  await api.delete(`/v1/admin/discount-codes/${id}`);
}

export async function checkCodeUniqueness(code: string, excludeId?: string): Promise<boolean> {
  const query = new URLSearchParams();
  query.set('code', code);
  if (excludeId) query.set('excludeId', excludeId);

  const { data } = await api.get<{ isUnique: boolean }>(
    `/v1/admin/discount-codes/check-unique?${query.toString()}`,
  );
  return data.isUnique;
}
