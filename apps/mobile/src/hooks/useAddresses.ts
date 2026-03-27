import { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';

export interface Address {
  id: string;
  label: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  postalCode: string | null;
  latitude: number | null;
  longitude: number | null;
  isDefault: boolean;
  createdAt: string;
}

interface CreateAddressPayload {
  label: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  isDefault?: boolean;
}

interface UseAddressesReturn {
  addresses: Address[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createAddress: (data: CreateAddressPayload) => Promise<Address>;
  updateAddress: (id: string, data: Partial<CreateAddressPayload>) => Promise<Address>;
  deleteAddress: (id: string) => Promise<void>;
  setDefaultAddress: (id: string) => Promise<void>;
}

export function useAddresses(): UseAddressesReturn {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAddresses = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { data } = await api.get('/addresses');
      const list: Address[] = data.data ?? data ?? [];
      setAddresses(list);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load addresses';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  const createAddress = async (payload: CreateAddressPayload): Promise<Address> => {
    try {
      setError(null);
      const { data } = await api.post('/addresses', payload);
      const newAddress: Address = data.data ?? data;
      setAddresses((prev) => [...prev, newAddress]);
      return newAddress;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create address';
      setError(message);
      throw new Error(message);
    }
  };

  const updateAddress = async (
    id: string,
    payload: Partial<CreateAddressPayload>,
  ): Promise<Address> => {
    try {
      setError(null);
      const { data } = await api.put(`/addresses/${id}`, payload);
      const updatedAddress: Address = data.data ?? data;
      setAddresses((prev) => prev.map((addr) => (addr.id === id ? updatedAddress : addr)));
      return updatedAddress;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update address';
      setError(message);
      throw new Error(message);
    }
  };

  const deleteAddress = async (id: string): Promise<void> => {
    try {
      setError(null);
      await api.delete(`/addresses/${id}`);
      setAddresses((prev) => prev.filter((addr) => addr.id !== id));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete address';
      setError(message);
      throw new Error(message);
    }
  };

  const setDefaultAddress = async (id: string): Promise<void> => {
    try {
      setError(null);
      const { data } = await api.put(`/addresses/${id}`, { isDefault: true });
      const updatedAddress: Address = data.data ?? data;
      setAddresses((prev) =>
        prev.map((addr) => ({
          ...addr,
          isDefault: addr.id === id ? true : false,
        })),
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to set default address';
      setError(message);
      throw new Error(message);
    }
  };

  return {
    addresses,
    isLoading,
    error,
    refetch: fetchAddresses,
    createAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
  };
}
