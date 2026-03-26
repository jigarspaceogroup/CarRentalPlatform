import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import type { BookingStatus } from '@/hooks/useBookings';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface StatusHistoryEntry {
  id: string;
  fromStatus: BookingStatus | null;
  toStatus: BookingStatus;
  note?: string;
  changedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
}

export interface BookingNote {
  id: string;
  content: string;
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
}

export interface BookingPayment {
  id: string;
  amount: number;
  method: string;
  status: string;
  transactionId?: string;
  createdAt: string;
}

export interface PriceBreakdown {
  baseRate: number;
  numberOfDays: number;
  subtotal: number;
  extras: number;
  discount: number;
  taxAmount: number;
  deliveryFee: number;
  totalAmount: number;
}

export interface BookingDetail {
  id: string;
  referenceNumber: string;
  status: BookingStatus;
  pickupDate: string;
  dropoffDate: string;
  actualPickupDate?: string;
  actualDropoffDate?: string;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
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
  priceBreakdown: PriceBreakdown;
  statusHistory: StatusHistoryEntry[];
  notes: BookingNote[];
  payments: BookingPayment[];
}

// ─── Hook: useBookingDetail ──────────────────────────────────────────────────

export function useBookingDetail(id?: string) {
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchBooking = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const { data } = await api.get<BookingDetail>(`/v1/admin/bookings/${id}`);
      setBooking(data);
    } catch {
      toast.error('Failed to load booking details');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchBooking();
  }, [fetchBooking]);

  return { booking, isLoading, refetch: fetchBooking };
}
