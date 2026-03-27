import { useState, useCallback, useRef, useEffect } from 'react';
import api from '../lib/api';
import type { Vehicle, VehicleFilterParams, PaginationMeta } from '../types/vehicle';

interface UseVehiclesReturn {
  vehicles: Vehicle[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  meta: PaginationMeta | null;
  hasMore: boolean;
  refetch: () => Promise<void>;
  loadMore: () => Promise<void>;
  setFilters: (filters: VehicleFilterParams) => void;
  filters: VehicleFilterParams;
}

const DEFAULT_LIMIT = 20;

export function useVehicles(initialFilters?: VehicleFilterParams): UseVehiclesReturn {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [filters, setFiltersState] = useState<VehicleFilterParams>({
    page: 1,
    limit: DEFAULT_LIMIT,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    ...initialFilters,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const appendRef = useRef(false);

  const fetchVehicles = useCallback(
    async (currentFilters: VehicleFilterParams) => {
      // Cancel any in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const isAppend = appendRef.current;
      appendRef.current = false;

      try {
        if (isAppend) {
          setIsLoadingMore(true);
        } else {
          setIsLoading(true);
        }
        setError(null);

        const params: Record<string, string | number> = {};
        if (currentFilters.page) params.page = currentFilters.page;
        if (currentFilters.limit) params.limit = currentFilters.limit;
        if (currentFilters.search) params.search = currentFilters.search;
        if (currentFilters.categoryId) params.categoryId = currentFilters.categoryId;
        if (currentFilters.transmission) params.transmission = currentFilters.transmission;
        if (currentFilters.fuelType) params.fuelType = currentFilters.fuelType;
        if (currentFilters.minPrice !== undefined) params.minPrice = currentFilters.minPrice;
        if (currentFilters.maxPrice !== undefined) params.maxPrice = currentFilters.maxPrice;
        if (currentFilters.sortBy) params.sortBy = currentFilters.sortBy;
        if (currentFilters.sortOrder) params.sortOrder = currentFilters.sortOrder;

        const { data } = await api.get('/vehicles', {
          params,
          signal: controller.signal,
        });

        const vehicleList: Vehicle[] = data.data ?? [];
        const responseMeta: PaginationMeta = data.meta ?? {
          page: currentFilters.page ?? 1,
          limit: currentFilters.limit ?? DEFAULT_LIMIT,
          total: vehicleList.length,
          totalPages: 1,
        };

        if (isAppend) {
          setVehicles((prev) => [...prev, ...vehicleList]);
        } else {
          setVehicles(vehicleList);
        }
        setMeta(responseMeta);
      } catch (err) {
        // Ignore abort errors
        if (err instanceof Error && err.name === 'CanceledError') return;
        const message = err instanceof Error ? err.message : 'Failed to load vehicles';
        setError(message);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [],
  );

  useEffect(() => {
    fetchVehicles(filters);
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [filters, fetchVehicles]);

  const refetch = useCallback(async () => {
    appendRef.current = false;
    setFiltersState((prev) => ({ ...prev, page: 1 }));
  }, []);

  const loadMore = useCallback(async () => {
    if (!meta || isLoadingMore || isLoading) return;
    const currentPage = meta.page;
    const totalPages = meta.totalPages;
    if (currentPage >= totalPages) return;

    appendRef.current = true;
    setFiltersState((prev) => ({ ...prev, page: currentPage + 1 }));
  }, [meta, isLoadingMore, isLoading]);

  const hasMore = meta ? meta.page < meta.totalPages : false;

  const setFilters = useCallback((newFilters: VehicleFilterParams) => {
    appendRef.current = false;
    setFiltersState((prev) => ({
      ...prev,
      ...newFilters,
      page: 1,
    }));
  }, []);

  return {
    vehicles,
    isLoading,
    isLoadingMore,
    error,
    meta,
    hasMore,
    refetch,
    loadMore,
    setFilters,
    filters,
  };
}
