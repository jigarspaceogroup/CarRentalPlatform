import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../lib/api';
import type { Booking, BookingStatus } from '../types/booking';

interface UseBookingsReturn {
  bookings: Booking[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  filterByStatus: (status: BookingStatus | 'ALL') => void;
  activeFilter: BookingStatus | 'ALL';
}

export function useBookings(): UseBookingsReturn {
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<BookingStatus | 'ALL'>('ALL');
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchBookings = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      setIsLoading(true);
      setError(null);
      const { data } = await api.get('/bookings', { signal: controller.signal });
      const list: Booking[] = data.data ?? data ?? [];
      setAllBookings(list);
      if (activeFilter === 'ALL') {
        setBookings(list);
      } else {
        setBookings(list.filter((b) => b.status === activeFilter));
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'CanceledError') return;
      const message = err instanceof Error ? err.message : 'Failed to load bookings';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [activeFilter]);

  useEffect(() => {
    fetchBookings();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchBookings]);

  const filterByStatus = useCallback(
    (status: BookingStatus | 'ALL') => {
      setActiveFilter(status);
      if (status === 'ALL') {
        setBookings(allBookings);
      } else {
        setBookings(allBookings.filter((b) => b.status === status));
      }
    },
    [allBookings],
  );

  return {
    bookings,
    isLoading,
    error,
    refetch: fetchBookings,
    filterByStatus,
    activeFilter,
  };
}
