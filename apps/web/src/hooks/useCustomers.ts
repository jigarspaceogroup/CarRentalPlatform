import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

// ─── Types ───────────────────────────────────────────────────────────────────

export type CustomerStatus = 'ACTIVE' | 'SUSPENDED' | 'BANNED';

export interface CustomerListItem {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  createdAt: string;
  lastLogin: string | null;
  status: CustomerStatus;
  totalBookings: number;
  totalSpent: number;
}

export interface CustomerListParams {
  page: number;
  limit: number;
  status?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface CustomerListResponse {
  data: CustomerListItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ─── Hook: useCustomers ──────────────────────────────────────────────────────

export function useCustomers(params: CustomerListParams) {
  const [data, setData] = useState<CustomerListItem[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);

  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    try {
      const query = new URLSearchParams();
      query.set('page', String(params.page));
      query.set('limit', String(params.limit));
      if (params.status) query.set('status', params.status);
      if (params.search) query.set('search', params.search);
      if (params.sortBy) query.set('sortBy', params.sortBy);
      if (params.sortOrder) query.set('sortOrder', params.sortOrder);

      const { data: res } = await api.get<CustomerListResponse>(
        `/v1/admin/customers?${query.toString()}`,
      );
      setData(res.data);
      setMeta(res.meta);
    } catch {
      toast.error('Failed to load customers');
    } finally {
      setIsLoading(false);
    }
  }, [params.page, params.limit, params.status, params.search, params.sortBy, params.sortOrder]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  return { data, meta, isLoading, refetch: fetchCustomers };
}

// ─── Mutation helpers ────────────────────────────────────────────────────────

export async function exportCustomers(params: {
  status?: string;
  search?: string;
}): Promise<Blob> {
  const query = new URLSearchParams();
  if (params.status) query.set('status', params.status);
  if (params.search) query.set('search', params.search);

  const { data } = await api.get(`/v1/admin/customers/export?${query.toString()}`, {
    responseType: 'blob',
  });
  return data as Blob;
}
