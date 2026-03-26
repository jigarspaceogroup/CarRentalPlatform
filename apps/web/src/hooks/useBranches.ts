import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface OperatingHour {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

export interface Branch {
  id: string;
  nameEn: string;
  nameAr: string;
  addressEn: string;
  addressAr: string;
  latitude: number;
  longitude: number;
  phone?: string;
  email?: string;
  isActive: boolean;
  vehicleCount?: number;
  operatingHours?: OperatingHour[];
  createdAt: string;
  updatedAt: string;
}

export interface BranchFormData {
  nameEn: string;
  nameAr: string;
  addressEn: string;
  addressAr: string;
  latitude: number;
  longitude: number;
  phone?: string;
  email?: string;
  isActive: boolean;
}

interface BranchListParams {
  page: number;
  limit: number;
  search?: string;
}

interface BranchListResponse {
  data: Branch[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ─── Hook: useBranches ───────────────────────────────────────────────────────

export function useBranches(params?: BranchListParams) {
  const [data, setData] = useState<Branch[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);

  const fetchBranches = useCallback(async () => {
    setIsLoading(true);
    try {
      const query = new URLSearchParams();
      if (params) {
        query.set('page', String(params.page));
        query.set('limit', String(params.limit));
        if (params.search) query.set('search', params.search);
      }

      const { data: res } = await api.get<BranchListResponse>(
        `/v1/admin/branches?${query.toString()}`,
      );
      setData(res.data);
      setMeta(res.meta);
    } catch {
      toast.error('Failed to load branches');
    } finally {
      setIsLoading(false);
    }
  }, [params?.page, params?.limit, params?.search]);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  return { data, meta, isLoading, refetch: fetchBranches };
}

// ─── Hook: useBranchDetail ───────────────────────────────────────────────────

export function useBranchDetail(id?: string) {
  const [branch, setBranch] = useState<Branch | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchBranch = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const { data } = await api.get<Branch>(`/v1/admin/branches/${id}`);
      setBranch(data);
    } catch {
      toast.error('Failed to load branch details');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchBranch();
  }, [fetchBranch]);

  return { branch, isLoading, refetch: fetchBranch };
}

// ─── Mutation helpers ────────────────────────────────────────────────────────

export async function createBranch(data: BranchFormData): Promise<Branch> {
  const { data: branch } = await api.post<Branch>('/v1/admin/branches', data);
  return branch;
}

export async function updateBranch(
  id: string,
  data: Partial<BranchFormData>,
): Promise<Branch> {
  const { data: branch } = await api.put<Branch>(`/v1/admin/branches/${id}`, data);
  return branch;
}

export async function setBranchHours(
  id: string,
  hours: OperatingHour[],
): Promise<void> {
  await api.put(`/v1/admin/branches/${id}/hours`, { hours });
}

export async function toggleBranchActive(
  id: string,
  isActive: boolean,
): Promise<void> {
  await api.put(`/v1/admin/branches/${id}/activate`, { isActive });
}
