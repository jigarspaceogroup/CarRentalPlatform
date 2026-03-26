import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Category {
  id: string;
  nameEn: string;
  nameAr: string;
  descriptionEn?: string;
  descriptionAr?: string;
  parentId?: string | null;
  imageUrl?: string;
  sortOrder: number;
  isActive: boolean;
  vehicleCount?: number;
  children?: Category[];
  createdAt: string;
  updatedAt: string;
}

export interface CategoryFormData {
  nameEn: string;
  nameAr: string;
  descriptionEn?: string;
  descriptionAr?: string;
  parentId?: string | null;
  imageUrl?: string;
  sortOrder: number;
  isActive: boolean;
}

// ─── Hook: useCategories ─────────────────────────────────────────────────────

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get<Category[]>('/v1/admin/categories');
      setCategories(data);
    } catch {
      toast.error('Failed to load categories');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return { categories, isLoading, refetch: fetchCategories };
}

// ─── Hook: useCategoryDetail ─────────────────────────────────────────────────

export function useCategoryDetail(id?: string) {
  const [category, setCategory] = useState<Category | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCategory = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const { data } = await api.get<Category>(`/v1/admin/categories/${id}`);
      setCategory(data);
    } catch {
      toast.error('Failed to load category details');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCategory();
  }, [fetchCategory]);

  return { category, isLoading, refetch: fetchCategory };
}

// ─── Mutation helpers ────────────────────────────────────────────────────────

export async function createCategory(data: CategoryFormData): Promise<Category> {
  const { data: category } = await api.post<Category>('/v1/admin/categories', data);
  return category;
}

export async function updateCategory(
  id: string,
  data: Partial<CategoryFormData>,
): Promise<Category> {
  const { data: category } = await api.put<Category>(`/v1/admin/categories/${id}`, data);
  return category;
}

export async function deleteCategory(id: string): Promise<void> {
  await api.delete(`/v1/admin/categories/${id}`);
}

export async function reorderCategories(
  items: { id: string; sortOrder: number }[],
): Promise<void> {
  await api.put('/v1/admin/categories/reorder', { items });
}
