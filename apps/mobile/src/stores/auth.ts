import { create } from 'zustand';
import { AxiosError } from 'axios';
import api, {
  getStoredToken,
  getStoredRefreshToken,
  setStoredTokens,
  clearStoredTokens,
} from '../lib/api';
import type {
  User,
  AuthResponse,
  RegisterEmailPayload,
  RegisterPhonePayload,
  LoginEmailPayload,
  LoginPhonePayload,
  SocialLoginPayload,
  VerifyOtpPayload,
  UpdateProfilePayload,
  ForgotPasswordPayload,
  ApiErrorResponse,
} from '../types/auth';

export interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  initialize: () => Promise<void>;
  registerEmail: (payload: RegisterEmailPayload) => Promise<{ requiresEmailVerification: boolean }>;
  registerPhone: (payload: RegisterPhonePayload) => Promise<void>;
  loginEmail: (payload: LoginEmailPayload) => Promise<void>;
  loginPhone: (payload: LoginPhonePayload) => Promise<void>;
  socialLogin: (payload: SocialLoginPayload) => Promise<void>;
  verifyOtp: (payload: VerifyOtpPayload) => Promise<{ isNewUser: boolean }>;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (payload: UpdateProfilePayload) => Promise<void>;
  forgotPassword: (payload: ForgotPasswordPayload) => Promise<void>;
  clearError: () => void;
  setUser: (user: User) => void;
}

function extractErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as ApiErrorResponse | undefined;
    if (data?.message) return data.message;
    if (error.response?.status === 429) {
      return 'Too many attempts. Try again in 15 minutes.';
    }
    if (error.message === 'Network Error') {
      return 'Network error. Please check your connection.';
    }
  }
  if (error instanceof Error) return error.message;
  return 'Something went wrong. Please try again.';
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  refreshToken: null,
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  error: null,

  initialize: async () => {
    try {
      set({ isLoading: true, error: null });
      const token = await getStoredToken();
      const refreshToken = await getStoredRefreshToken();

      if (!token || !refreshToken) {
        set({ isInitialized: true, isLoading: false });
        return;
      }

      // Validate token by fetching profile
      try {
        const { data } = await api.get('/auth/profile');
        const user = data.data?.user || data.user || data.data || data;
        set({
          token,
          refreshToken,
          user,
          isAuthenticated: true,
          isInitialized: true,
          isLoading: false,
        });
      } catch {
        // Token invalid, try refresh
        try {
          const { data } = await api.post('/auth/refresh', { refreshToken });
          const newToken = data.data?.token || data.token;
          const newRefreshToken = data.data?.refreshToken || data.refreshToken;

          if (newToken && newRefreshToken) {
            await setStoredTokens(newToken, newRefreshToken);
            const profileRes = await api.get('/auth/profile');
            const user =
              profileRes.data.data?.user || profileRes.data.user || profileRes.data.data || profileRes.data;
            set({
              token: newToken,
              refreshToken: newRefreshToken,
              user,
              isAuthenticated: true,
              isInitialized: true,
              isLoading: false,
            });
          } else {
            throw new Error('Invalid refresh response');
          }
        } catch {
          await clearStoredTokens();
          set({ isInitialized: true, isLoading: false });
        }
      }
    } catch {
      set({ isInitialized: true, isLoading: false });
    }
  },

  registerEmail: async (payload) => {
    try {
      set({ isLoading: true, error: null });
      const { data } = await api.post('/auth/register', payload);

      // If the API returns tokens directly, the user is auto-logged in
      const token = data.data?.token || data.token;
      const refreshToken = data.data?.refreshToken || data.refreshToken;

      if (token && refreshToken) {
        await setStoredTokens(token, refreshToken);
        const user = data.data?.user || data.user;
        set({
          token,
          refreshToken,
          user: user || null,
          isAuthenticated: true,
          isLoading: false,
        });
        return { requiresEmailVerification: false };
      }

      // API may require email verification before login
      set({ isLoading: false });
      return { requiresEmailVerification: true };
    } catch (error) {
      const message = extractErrorMessage(error);
      set({ isLoading: false, error: message });
      throw new Error(message);
    }
  },

  registerPhone: async (payload) => {
    try {
      set({ isLoading: true, error: null });
      await api.post('/auth/register', payload);
      set({ isLoading: false });
      // OTP will be sent; navigate to OTP screen
    } catch (error) {
      const message = extractErrorMessage(error);
      set({ isLoading: false, error: message });
      throw new Error(message);
    }
  },

  loginEmail: async (payload) => {
    try {
      set({ isLoading: true, error: null });
      const { data } = await api.post<AuthResponse>('/auth/login', payload);
      const token = data.data?.token || (data as unknown as { token: string }).token;
      const refreshToken =
        data.data?.refreshToken || (data as unknown as { refreshToken: string }).refreshToken;
      const user = data.data?.user || (data as unknown as { user: User }).user;

      if (token && refreshToken) {
        await setStoredTokens(token, refreshToken);
        set({
          token,
          refreshToken,
          user: user || null,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        throw new Error('Invalid login response');
      }
    } catch (error) {
      const message = extractErrorMessage(error);
      set({ isLoading: false, error: message });
      throw new Error(message);
    }
  },

  loginPhone: async (payload) => {
    try {
      set({ isLoading: true, error: null });
      await api.post('/auth/login', payload);
      set({ isLoading: false });
      // OTP will be sent; navigate to OTP screen
    } catch (error) {
      const message = extractErrorMessage(error);
      set({ isLoading: false, error: message });
      throw new Error(message);
    }
  },

  socialLogin: async (payload) => {
    try {
      set({ isLoading: true, error: null });
      const { data } = await api.post<AuthResponse>('/auth/social', payload);
      const token = data.data?.token || (data as unknown as { token: string }).token;
      const refreshToken =
        data.data?.refreshToken || (data as unknown as { refreshToken: string }).refreshToken;
      const user = data.data?.user || (data as unknown as { user: User }).user;

      if (token && refreshToken) {
        await setStoredTokens(token, refreshToken);
        set({
          token,
          refreshToken,
          user: user || null,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        throw new Error('Invalid social login response');
      }
    } catch (error) {
      const message = extractErrorMessage(error);
      set({ isLoading: false, error: message });
      throw new Error(message);
    }
  },

  verifyOtp: async (payload) => {
    try {
      set({ isLoading: true, error: null });
      const { data } = await api.post<AuthResponse>('/auth/verify-otp', payload);
      const token = data.data?.token || (data as unknown as { token: string }).token;
      const refreshToken =
        data.data?.refreshToken || (data as unknown as { refreshToken: string }).refreshToken;
      const user = data.data?.user || (data as unknown as { user: User }).user;
      const isNewUser =
        (data as unknown as { data?: { isNewUser?: boolean } }).data?.isNewUser ?? !user?.name;

      if (token && refreshToken) {
        await setStoredTokens(token, refreshToken);
        set({
          token,
          refreshToken,
          user: user || null,
          isAuthenticated: true,
          isLoading: false,
        });
        return { isNewUser: !!isNewUser };
      }

      throw new Error('Invalid OTP response');
    } catch (error) {
      const message = extractErrorMessage(error);
      set({ isLoading: false, error: message });
      throw new Error(message);
    }
  },

  refresh: async () => {
    try {
      const currentRefreshToken = get().refreshToken || (await getStoredRefreshToken());
      if (!currentRefreshToken) {
        throw new Error('No refresh token');
      }
      const { data } = await api.post('/auth/refresh', {
        refreshToken: currentRefreshToken,
      });
      const token = data.data?.token || data.token;
      const refreshToken = data.data?.refreshToken || data.refreshToken;

      if (token && refreshToken) {
        await setStoredTokens(token, refreshToken);
        set({ token, refreshToken });
      }
    } catch (error) {
      await clearStoredTokens();
      set({
        token: null,
        refreshToken: null,
        user: null,
        isAuthenticated: false,
      });
      throw error;
    }
  },

  logout: async () => {
    try {
      const currentRefreshToken = get().refreshToken || (await getStoredRefreshToken());
      if (currentRefreshToken) {
        await api.post('/auth/logout', { refreshToken: currentRefreshToken }).catch(() => {
          // Best effort: clear local state even if server call fails
        });
      }
    } finally {
      await clearStoredTokens();
      set({
        token: null,
        refreshToken: null,
        user: null,
        isAuthenticated: false,
        error: null,
      });
    }
  },

  updateProfile: async (payload) => {
    try {
      set({ isLoading: true, error: null });
      const { data } = await api.put('/auth/profile', payload);
      const user = data.data?.user || data.data || data.user || data;
      set({ user, isLoading: false });
    } catch (error) {
      const message = extractErrorMessage(error);
      set({ isLoading: false, error: message });
      throw new Error(message);
    }
  },

  forgotPassword: async (payload) => {
    try {
      set({ isLoading: true, error: null });
      await api.post('/auth/forgot-password', payload);
      set({ isLoading: false });
    } catch (error) {
      const message = extractErrorMessage(error);
      set({ isLoading: false, error: message });
      throw new Error(message);
    }
  },

  clearError: () => set({ error: null }),

  setUser: (user) => set({ user }),
}));
