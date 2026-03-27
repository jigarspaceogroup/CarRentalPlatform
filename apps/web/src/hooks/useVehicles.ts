import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface VehicleImage {
  id: string;
  imageUrl: string;
  thumbnailUrl?: string;
  sortOrder: number;
}

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  transmission: 'automatic' | 'manual';
  fuelType: string;
  seats: number;
  doors: number;
  trunkCapacity?: string;
  dailyRate: number;
  weeklyRate?: number;
  monthlyRate?: number;
  longTermRate?: number;
  status: 'available' | 'unavailable' | 'in_maintenance' | 'retired';
  features: string[];
  mileagePolicy?: string;
  categoryId?: string;
  branchId?: string;
  category?: { id: string; nameEn: string; nameAr: string };
  branch?: { id: string; nameEn: string; nameAr: string };
  images: VehicleImage[];
  createdAt: string;
  updatedAt: string;
}

export interface VehicleFormData {
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  transmission: string;
  fuelType: string;
  seats: number;
  doors: number;
  trunkCapacity?: string;
  dailyRate: number;
  weeklyRate?: number;
  monthlyRate?: number;
  longTermRate?: number;
  status: string;
  features: string[];
  mileagePolicy?: string;
  categoryId?: string;
  branchId?: string;
}

export interface VehicleListParams {
  page: number;
  limit: number;
  search?: string;
  categoryId?: string;
  branchId?: string;
  status?: string;
  transmission?: string;
  fuelType?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface VehicleListResponse {
  data: Vehicle[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ─── Hook: useVehicles ───────────────────────────────────────────────────────

export function useVehicles(params: VehicleListParams) {
  const [data, setData] = useState<Vehicle[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);

  const fetchVehicles = useCallback(async () => {
    setIsLoading(true);
    try {
      const query = new URLSearchParams();
      query.set('page', String(params.page));
      query.set('limit', String(params.limit));
      if (params.search) query.set('search', params.search);
      if (params.categoryId) query.set('categoryId', params.categoryId);
      if (params.branchId) query.set('branchId', params.branchId);
      if (params.status) query.set('status', params.status);
      if (params.transmission) query.set('transmission', params.transmission);
      if (params.fuelType) query.set('fuelType', params.fuelType);
      if (params.sortBy) query.set('sortBy', params.sortBy);
      if (params.sortOrder) query.set('sortOrder', params.sortOrder);

      const { data: res } = await api.get<VehicleListResponse>(
        `/v1/admin/vehicles?${query.toString()}`,
      );
      setData(res.data);
      setMeta(res.meta);
    } catch {
      toast.error('Failed to load vehicles');
    } finally {
      setIsLoading(false);
    }
  }, [
    params.page,
    params.limit,
    params.search,
    params.categoryId,
    params.branchId,
    params.status,
    params.transmission,
    params.fuelType,
    params.sortBy,
    params.sortOrder,
  ]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  return { data, meta, isLoading, refetch: fetchVehicles };
}

// ─── Hook: useVehicleDetail ──────────────────────────────────────────────────

export function useVehicleDetail(id?: string) {
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchVehicle = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const { data } = await api.get<Vehicle>(`/v1/admin/vehicles/${id}`);
      setVehicle(data);
    } catch {
      toast.error('Failed to load vehicle details');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchVehicle();
  }, [fetchVehicle]);

  return { vehicle, isLoading, refetch: fetchVehicle };
}

// ─── Mutation helpers ────────────────────────────────────────────────────────

export async function createVehicle(data: VehicleFormData): Promise<Vehicle> {
  const { data: vehicle } = await api.post<Vehicle>('/v1/admin/vehicles', data);
  return vehicle;
}

export async function updateVehicle(id: string, data: Partial<VehicleFormData>): Promise<Vehicle> {
  const { data: vehicle } = await api.put<Vehicle>(`/v1/admin/vehicles/${id}`, data);
  return vehicle;
}

export async function deleteVehicle(id: string): Promise<void> {
  await api.delete(`/v1/admin/vehicles/${id}`);
}

export async function changeVehicleStatus(
  id: string,
  status: string,
): Promise<void> {
  await api.put(`/v1/admin/vehicles/${id}/status`, { status });
}

export async function bulkChangeStatus(
  vehicleIds: string[],
  status: string,
): Promise<void> {
  await api.put('/v1/admin/vehicles/bulk-status', { vehicleIds, status });
}

export async function addVehicleImages(
  vehicleId: string,
  images: { imageUrl: string; thumbnailUrl?: string }[],
): Promise<void> {
  await api.post(`/v1/admin/vehicles/${vehicleId}/images`, { images });
}

export async function reorderVehicleImages(
  vehicleId: string,
  images: { id: string; sortOrder: number }[],
): Promise<void> {
  await api.put(`/v1/admin/vehicles/${vehicleId}/images/reorder`, { images });
}

export async function deleteVehicleImage(
  vehicleId: string,
  imageId: string,
): Promise<void> {
  await api.delete(`/v1/admin/vehicles/${vehicleId}/images/${imageId}`);
}
