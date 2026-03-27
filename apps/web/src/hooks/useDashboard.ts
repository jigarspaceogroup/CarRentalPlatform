import { useState, useEffect, useCallback, useRef } from 'react';
import api from '@/lib/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DashboardStats {
  activeBookings: number;
  todayPickups: number;
  todayReturns: number;
  fleetAvailability: number;
  todayRevenue: number;
}

export interface RecentBooking {
  id: string;
  referenceNumber: string;
  customerName: string;
  vehicle: string;
  pickupDate: string;
  returnDate: string;
  status: string;
}

export interface FleetStatus {
  available: number;
  rented: number;
  inMaintenance: number;
  total: number;
}

export interface DashboardData {
  stats: DashboardStats;
  recentBookings: RecentBooking[];
  fleetStatus: FleetStatus;
}

interface UseDashboardReturn {
  data: DashboardData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

// ---------------------------------------------------------------------------
// Default / empty state
// ---------------------------------------------------------------------------

const EMPTY_DATA: DashboardData = {
  stats: {
    activeBookings: 0,
    todayPickups: 0,
    todayReturns: 0,
    fleetAvailability: 0,
    todayRevenue: 0,
  },
  recentBookings: [],
  fleetStatus: {
    available: 0,
    rented: 0,
    inMaintenance: 0,
    total: 0,
  },
};

/** Auto-refresh interval: 30 seconds */
const REFRESH_INTERVAL_MS = 30_000;

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useDashboard(): UseDashboardReturn {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchDashboard = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) {
        setIsLoading(true);
      }
      setError(null);

      const response = await api.get<{ success: boolean; data: DashboardData }>(
        '/v1/admin/dashboard/stats',
      );

      if (response.data.success) {
        setData(response.data.data);
      } else {
        setData(EMPTY_DATA);
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to load dashboard data';
      setError(message);

      // On first load failure, set empty data so the UI can render gracefully
      if (isInitial) {
        setData(EMPTY_DATA);
      }
    } finally {
      if (isInitial) {
        setIsLoading(false);
      }
    }
  }, []);

  const refetch = useCallback(() => {
    fetchDashboard(false);
  }, [fetchDashboard]);

  useEffect(() => {
    // Initial fetch
    fetchDashboard(true);

    // Auto-refresh
    intervalRef.current = setInterval(() => {
      fetchDashboard(false);
    }, REFRESH_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchDashboard]);

  return { data, isLoading, error, refetch };
}
