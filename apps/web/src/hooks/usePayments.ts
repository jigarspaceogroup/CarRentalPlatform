import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

// ─── Types ───────────────────────────────────────────────────────────────────

export type PaymentMethod = 'CREDIT_CARD' | 'DEBIT_CARD' | 'COD';
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';

export interface PaymentListItem {
  id: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;
  createdAt: string;
  booking: {
    id: string;
    referenceNumber: string;
    vehicle?: {
      make: string;
      model: string;
    };
  };
}

export interface PaymentListParams {
  page: number;
  limit: number;
  method?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

interface PaymentListResponse {
  data: PaymentListItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ─── Hook: usePayments ───────────────────────────────────────────────────────

export function usePayments(params: PaymentListParams) {
  const [data, setData] = useState<PaymentListItem[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);

  const fetchPayments = useCallback(async () => {
    setIsLoading(true);
    try {
      const query = new URLSearchParams();
      query.set('page', String(params.page));
      query.set('limit', String(params.limit));
      if (params.method) query.set('method', params.method);
      if (params.status) query.set('status', params.status);
      if (params.startDate) query.set('startDate', params.startDate);
      if (params.endDate) query.set('endDate', params.endDate);
      if (params.search) query.set('search', params.search);

      const { data: res } = await api.get<PaymentListResponse>(
        `/v1/admin/payments?${query.toString()}`,
      );
      setData(res.data);
      setMeta(res.meta);
    } catch {
      toast.error('Failed to load payments');
    } finally {
      setIsLoading(false);
    }
  }, [
    params.page,
    params.limit,
    params.method,
    params.status,
    params.startDate,
    params.endDate,
    params.search,
  ]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  return { data, meta, isLoading, refetch: fetchPayments };
}

// ─── Mutation helpers ────────────────────────────────────────────────────────

export async function processRefund(id: string, amount: number, reason: string): Promise<void> {
  await api.post(`/v1/admin/payments/${id}/refund`, { amount, reason });
}

export async function markAsPaid(id: string): Promise<void> {
  await api.put(`/v1/admin/payments/${id}/mark-paid`);
}

export async function exportPayments(params: {
  startDate?: string;
  endDate?: string;
}): Promise<Blob> {
  const query = new URLSearchParams();
  if (params.startDate) query.set('startDate', params.startDate);
  if (params.endDate) query.set('endDate', params.endDate);

  const { data } = await api.get(`/v1/admin/payments/export?${query.toString()}`, {
    responseType: 'blob',
  });
  return data as Blob;
}
