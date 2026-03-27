import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const SECURE_STORE_TOKEN_KEY = 'auth_token';
const SECURE_STORE_REFRESH_KEY = 'auth_refresh_token';

/**
 * Default base URL uses Android emulator loopback for Android,
 * localhost for iOS/web. Override via EXPO_PUBLIC_API_URL env var.
 */
const defaultBaseURL =
  Platform.OS === 'android' ? 'http://10.0.2.2:4000/api/v1' : 'http://localhost:4000/api/v1';

// Expo's babel plugin replaces process.env.EXPO_PUBLIC_* at build time.
// Declare a minimal type to satisfy the compiler without pulling in @types/node.
declare const process: { env: Record<string, string | undefined> } | undefined;

const baseURL =
  (typeof process !== 'undefined' && process?.env?.EXPO_PUBLIC_API_URL) || defaultBaseURL;

const api = axios.create({
  baseURL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ---- Token helpers ----

export async function getStoredToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(SECURE_STORE_TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function getStoredRefreshToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(SECURE_STORE_REFRESH_KEY);
  } catch {
    return null;
  }
}

export async function setStoredTokens(token: string, refreshToken: string): Promise<void> {
  await SecureStore.setItemAsync(SECURE_STORE_TOKEN_KEY, token);
  await SecureStore.setItemAsync(SECURE_STORE_REFRESH_KEY, refreshToken);
}

export async function clearStoredTokens(): Promise<void> {
  await SecureStore.deleteItemAsync(SECURE_STORE_TOKEN_KEY);
  await SecureStore.deleteItemAsync(SECURE_STORE_REFRESH_KEY);
}

// ---- Interceptors ----

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string | null) => void;
  reject: (error: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null = null): void {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });
  failedQueue = [];
}

// Request interceptor: attach token
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await getStoredToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor: handle 401 with token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Only attempt refresh for 401 errors that haven't been retried
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Don't try to refresh if we're already on the refresh endpoint
    if (originalRequest.url?.includes('/auth/refresh')) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (token) => {
            if (token && originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            resolve(api(originalRequest));
          },
          reject,
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = await getStoredRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const { data } = await api.post('/auth/refresh', { refreshToken });
      const newToken = data.data?.token || data.token;
      const newRefreshToken = data.data?.refreshToken || data.refreshToken;

      if (newToken && newRefreshToken) {
        await setStoredTokens(newToken, newRefreshToken);
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }
        processQueue(null, newToken);
        return api(originalRequest);
      }

      throw new Error('Invalid refresh response');
    } catch (refreshError) {
      processQueue(refreshError, null);
      await clearStoredTokens();
      // The auth store will detect the cleared tokens and redirect to login
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default api;
