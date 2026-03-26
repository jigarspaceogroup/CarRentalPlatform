import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import type { PaymentMethod, PaymentStatus } from '@/hooks/usePayments';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface RefundHistoryEntry {
  id: string;
  amount: number;
  reason: string;
  status: string;
  processedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
}

export interface PaymentDetail {
  id: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;
  gatewayResponse?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  booking: {
    id: string;
    referenceNumber: string;
    pickupDate: string;
    dropoffDate: string;
    vehicle?: {
      id: string;
      make: string;
      model: string;
      year: number;
    };
  };
  refunds: RefundHistoryEntry[];
}

// ─── Hook: usePaymentDetail ──────────────────────────────────────────────────

export function usePaymentDetail(id?: string) {
  const [payment, setPayment] = useState<PaymentDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchPayment = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const { data } = await api.get<PaymentDetail>(`/v1/admin/payments/${id}`);
      setPayment(data);
    } catch {
      toast.error('Failed to load payment details');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPayment();
  }, [fetchPayment]);

  return { payment, isLoading, refetch: fetchPayment };
}
