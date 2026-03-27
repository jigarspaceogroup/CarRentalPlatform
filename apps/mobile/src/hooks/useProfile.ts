import { useState } from 'react';
import api from '../lib/api';
import { useAuthStore } from '../stores/auth';

interface UpdateProfileData {
  name?: string;
  email?: string;
  phone?: string;
  drivingLicenseNumber?: string;
  licenseExpiryDate?: string;
}

interface UseProfileReturn {
  updateProfile: (data: UpdateProfileData) => Promise<void>;
  uploadPhoto: (uri: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export function useProfile(): UseProfileReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setUser } = useAuthStore();

  const updateProfile = async (data: UpdateProfileData) => {
    try {
      setIsLoading(true);
      setError(null);
      const { data: response } = await api.put('/auth/profile', data);
      const user = response.data?.user || response.data || response.user || response;
      setUser(user);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update profile';
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const uploadPhoto = async (uri: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Create FormData with the image
      const formData = new FormData();
      const filename = uri.split('/').pop() || 'photo.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('photo', {
        uri,
        name: filename,
        type,
      } as any);

      const { data: response } = await api.put('/auth/profile/photo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const user = response.data?.user || response.data || response.user || response;
      setUser(user);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to upload photo';
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    updateProfile,
    uploadPhoto,
    isLoading,
    error,
  };
}
