import { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';
import type { Booking } from '../types/booking';

interface UseBookingDetailReturn {
  booking: Booking | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  cancelBooking: (reason?: string) => Promise<void>;
  isCancelling: boolean;
}

export function useBookingDetail(bookingId: string | undefined): UseBookingDetailReturn {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const fetchBooking = useCallback(async () => {
    if (!bookingId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const { data } = await api.get(`/bookings/${bookingId}`);
      const result = data.data ?? data;
      setBooking(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load booking details';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    fetchBooking();
  }, [fetchBooking]);

  const cancelBooking = useCallback(
    async (reason?: string) => {
      if (!bookingId) return;
      try {
        setIsCancelling(true);
        await api.post(`/bookings/${bookingId}/cancel`, { reason });
        await fetchBooking();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to cancel booking';
        setError(message);
        throw new Error(message);
      } finally {
        setIsCancelling(false);
      }
    },
    [bookingId, fetchBooking],
  );

  return { booking, isLoading, error, refetch: fetchBooking, cancelBooking, isCancelling };
}
