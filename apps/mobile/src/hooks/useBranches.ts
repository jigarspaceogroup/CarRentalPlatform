import { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';
import type { BookingBranch } from '../types/booking';

interface UseBranchesReturn {
  branches: BookingBranch[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useBranches(): UseBranchesReturn {
  const [branches, setBranches] = useState<BookingBranch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBranches = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { data } = await api.get('/branches');
      const list: BookingBranch[] = data.data ?? data ?? [];
      setBranches(list.filter((b) => b.isActive));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load branches';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  return { branches, isLoading, error, refetch: fetchBranches };
}
