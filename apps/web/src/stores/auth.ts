import { create } from 'zustand';
import api from '@/lib/api';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar_url?: string;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface LoginResponse {
  token: string;
  refreshToken: string;
  user: User;
}

interface RefreshResponse {
  token: string;
  refreshToken: string;
}

const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  loginError: string | null;
  lastActivity: number | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
  hydrate: () => void;
  refreshTokens: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
  updateActivity: () => void;
  isSessionExpired: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  refreshToken: null,
  user: null,
  isLoading: false,
  isAuthenticated: false,
  loginError: null,
  lastActivity: null,

  login: async (credentials: LoginCredentials) => {
    set({ isLoading: true, loginError: null });
    try {
      const { data } = await api.post<LoginResponse>(
        '/v1/admin/auth/login',
        credentials,
      );
      const now = Date.now();
      localStorage.setItem('auth-token', data.token);
      localStorage.setItem('auth-refresh-token', data.refreshToken);
      localStorage.setItem('auth-user', JSON.stringify(data.user));
      localStorage.setItem('auth-last-activity', String(now));
      set({
        token: data.token,
        refreshToken: data.refreshToken,
        user: data.user,
        isAuthenticated: true,
        isLoading: false,
        loginError: null,
        lastActivity: now,
      });
    } catch (error: unknown) {
      let errorMessage = 'auth.invalidCredentials';

      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number; data?: { message?: string } } };
        if (axiosError.response?.status === 429) {
          errorMessage = 'auth.tooManyAttempts';
        } else if (axiosError.response?.data?.message) {
          errorMessage = axiosError.response.data.message;
        }
      }

      set({ isLoading: false, loginError: errorMessage });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('auth-token');
    localStorage.removeItem('auth-refresh-token');
    localStorage.removeItem('auth-user');
    localStorage.removeItem('auth-last-activity');
    set({
      token: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      loginError: null,
      lastActivity: null,
    });
  },

  setUser: (user: User) => {
    localStorage.setItem('auth-user', JSON.stringify(user));
    set({ user });
  },

  hydrate: () => {
    const token = localStorage.getItem('auth-token');
    const refreshTokenVal = localStorage.getItem('auth-refresh-token');
    const userJson = localStorage.getItem('auth-user');
    const lastActivityStr = localStorage.getItem('auth-last-activity');
    const lastActivity = lastActivityStr ? parseInt(lastActivityStr, 10) : null;

    if (token && userJson) {
      try {
        const user = JSON.parse(userJson) as User;
        set({
          token,
          refreshToken: refreshTokenVal,
          user,
          isAuthenticated: true,
          lastActivity,
        });
      } catch {
        localStorage.removeItem('auth-token');
        localStorage.removeItem('auth-refresh-token');
        localStorage.removeItem('auth-user');
        localStorage.removeItem('auth-last-activity');
      }
    }
  },

  refreshTokens: async () => {
    const currentRefreshToken = get().refreshToken;
    if (!currentRefreshToken) {
      get().logout();
      return;
    }

    try {
      const { data } = await api.post<RefreshResponse>('/v1/admin/auth/refresh', {
        refreshToken: currentRefreshToken,
      });
      localStorage.setItem('auth-token', data.token);
      localStorage.setItem('auth-refresh-token', data.refreshToken);
      set({
        token: data.token,
        refreshToken: data.refreshToken,
      });
    } catch {
      get().logout();
    }
  },

  forgotPassword: async (email: string) => {
    await api.post('/v1/admin/auth/forgot-password', { email });
  },

  resetPassword: async (token: string, password: string) => {
    await api.post('/v1/admin/auth/reset-password', { token, password });
  },

  updateActivity: () => {
    const now = Date.now();
    localStorage.setItem('auth-last-activity', String(now));
    set({ lastActivity: now });
  },

  isSessionExpired: () => {
    const { lastActivity, isAuthenticated } = get();
    if (!isAuthenticated || !lastActivity) return false;
    return Date.now() - lastActivity > SESSION_TIMEOUT_MS;
  },
}));
