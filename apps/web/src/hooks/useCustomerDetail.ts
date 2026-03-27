import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import type { CustomerStatus } from './useCustomers';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CustomerStats {
  totalBookings: number;
  totalSpent: number;
  activeBookings: number;
  cancelledBookings: number;
}

export interface CustomerNote {
  id: string;
  content: string;
  createdAt: string;
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface CustomerBooking {
  id: string;
  referenceNumber: string;
  status: string;
  pickupDate: string;
  dropoffDate: string;
  totalAmount: number;
  vehicle: {
    make: string;
    model: string;
    year: number;
  };
}

export interface CustomerDetail {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  photoUrl: string | null;
  drivingLicense: string;
  status: CustomerStatus;
  createdAt: string;
  lastLogin: string | null;
  stats: CustomerStats;
  notes: CustomerNote[];
  bookings: CustomerBooking[];
}

// ─── Hook: useCustomerDetail ─────────────────────────────────────────────────

export function useCustomerDetail(id: string | undefined) {
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCustomer = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const { data } = await api.get<CustomerDetail>(`/v1/admin/customers/${id}`);
      setCustomer(data);
    } catch {
      toast.error('Failed to load customer details');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCustomer();
  }, [fetchCustomer]);

  return { customer, isLoading, refetch: fetchCustomer };
}

// ─── Mutation helpers ────────────────────────────────────────────────────────

export async function updateCustomerStatus(
  id: string,
  status: CustomerStatus,
  reason?: string,
  note?: string,
): Promise<void> {
  await api.put(`/v1/admin/customers/${id}/status`, { status, reason, note });
}

export async function addCustomerNote(id: string, content: string): Promise<void> {
  await api.post(`/v1/admin/customers/${id}/notes`, { content });
}
