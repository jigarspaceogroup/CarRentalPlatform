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
  user: User;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isLoading: false,
  isAuthenticated: false,

  login: async (credentials: LoginCredentials) => {
    set({ isLoading: true });
    try {
      const { data } = await api.post<LoginResponse>('/auth/login', credentials);
      localStorage.setItem('auth-token', data.token);
      localStorage.setItem('auth-user', JSON.stringify(data.user));
      set({
        token: data.token,
        user: data.user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('auth-token');
    localStorage.removeItem('auth-user');
    set({
      token: null,
      user: null,
      isAuthenticated: false,
    });
  },

  setUser: (user: User) => {
    localStorage.setItem('auth-user', JSON.stringify(user));
    set({ user });
  },

  hydrate: () => {
    const token = localStorage.getItem('auth-token');
    const userJson = localStorage.getItem('auth-user');
    if (token && userJson) {
      try {
        const user = JSON.parse(userJson) as User;
        set({ token, user, isAuthenticated: true });
      } catch {
        localStorage.removeItem('auth-token');
        localStorage.removeItem('auth-user');
      }
    }
  },
}));
