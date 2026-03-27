import { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';
import type { Vehicle } from '../types/vehicle';

interface UseVehicleDetailReturn {
  vehicle: Vehicle | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useVehicleDetail(vehicleId: string | undefined): UseVehicleDetailReturn {
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVehicle = useCallback(async () => {
    if (!vehicleId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const { data } = await api.get(`/vehicles/${vehicleId}`);
      const result = data.data ?? data;
      setVehicle(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load vehicle details';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [vehicleId]);

  useEffect(() => {
    fetchVehicle();
  }, [fetchVehicle]);

  return { vehicle, isLoading, error, refetch: fetchVehicle };
}
