import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

// ─── Types ───────────────────────────────────────────────────────────────────

export type BookingStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'VEHICLE_PREPARING'
  | 'READY_FOR_PICKUP'
  | 'ACTIVE_RENTAL'
  | 'RETURN_PENDING'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REJECTED';

export interface BookingListItem {
  id: string;
  referenceNumber: string;
  status: BookingStatus;
  pickupDate: string;
  dropoffDate: string;
  totalAmount: number;
  createdAt: string;
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  vehicle: {
    id: string;
    make: string;
    model: string;
    year: number;
    licensePlate: string;
  };
  pickupBranch?: {
    id: string;
    nameEn: string;
    nameAr: string;
  };
  dropoffBranch?: {
    id: string;
    nameEn: string;
    nameAr: string;
  };
}

export interface BookingListParams {
  page: number;
  limit: number;
  status?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface BookingListResponse {
  data: BookingListItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ─── Hook: useBookings ───────────────────────────────────────────────────────

export function useBookings(params: BookingListParams) {
  const [data, setData] = useState<BookingListItem[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);

  const fetchBookings = useCallback(async () => {
    setIsLoading(true);
    try {
      const query = new URLSearchParams();
      query.set('page', String(params.page));
      query.set('limit', String(params.limit));
      if (params.status) query.set('status', params.status);
      if (params.search) query.set('search', params.search);
      if (params.sortBy) query.set('sortBy', params.sortBy);
      if (params.sortOrder) query.set('sortOrder', params.sortOrder);

      const { data: res } = await api.get<BookingListResponse>(
        `/v1/admin/bookings?${query.toString()}`,
      );
      setData(res.data);
      setMeta(res.meta);
    } catch {
      toast.error('Failed to load bookings');
    } finally {
      setIsLoading(false);
    }
  }, [params.page, params.limit, params.status, params.search, params.sortBy, params.sortOrder]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  return { data, meta, isLoading, refetch: fetchBookings };
}

// ─── Mutation helpers ────────────────────────────────────────────────────────

export async function acceptBooking(id: string, note?: string): Promise<void> {
  await api.post(`/v1/admin/bookings/${id}/accept`, { note });
}

export async function rejectBooking(id: string, reason: string, note?: string): Promise<void> {
  await api.post(`/v1/admin/bookings/${id}/reject`, { reason, note });
}

export async function updateBookingStatus(id: string, status: string): Promise<void> {
  await api.put(`/v1/admin/bookings/${id}/status`, { status });
}

export async function cancelBooking(id: string, reason?: string): Promise<void> {
  await api.post(`/v1/admin/bookings/${id}/cancel`, { reason });
}

export async function addBookingNote(id: string, content: string): Promise<void> {
  await api.post(`/v1/admin/bookings/${id}/notes`, { content });
}

export async function exportBookings(params: {
  startDate?: string;
  endDate?: string;
  status?: string;
}): Promise<Blob> {
  const query = new URLSearchParams();
  if (params.startDate) query.set('startDate', params.startDate);
  if (params.endDate) query.set('endDate', params.endDate);
  if (params.status) query.set('status', params.status);

  const { data } = await api.get(`/v1/admin/bookings/export?${query.toString()}`, {
    responseType: 'blob',
  });
  return data as Blob;
}
