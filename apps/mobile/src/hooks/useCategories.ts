import { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';
import type { VehicleCategory } from '../types/vehicle';

interface UseCategoriesReturn {
  categories: VehicleCategory[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useCategories(): UseCategoriesReturn {
  const [categories, setCategories] = useState<VehicleCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { data } = await api.get('/categories');
      const result = data.data ?? data;
      setCategories(Array.isArray(result) ? result : []);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to load categories';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return { categories, isLoading, error, refetch: fetchCategories };
}
