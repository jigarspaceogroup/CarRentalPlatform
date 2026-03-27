export interface User {
  id: string;
  email: string | null;
  phone: string | null;
  name: string | null;
  avatar: string | null;
  drivingLicenseNumber: string | null;
  emailVerified: boolean;
  phoneVerified: boolean;
  role: 'CUSTOMER' | 'ADMIN' | 'STAFF';
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  token: string;
  refreshToken: string;
}

export interface AuthResponse {
  data: {
    user: User;
    token: string;
    refreshToken: string;
  };
}

export interface RegisterEmailPayload {
  email: string;
  password: string;
}

export interface RegisterPhonePayload {
  phone: string;
}

export interface LoginEmailPayload {
  email: string;
  password: string;
}

export interface LoginPhonePayload {
  phone: string;
}

export interface SocialLoginPayload {
  provider: 'google' | 'apple' | 'facebook';
  token: string;
}

export interface VerifyOtpPayload {
  phone: string;
  code: string;
}

export interface UpdateProfilePayload {
  name?: string;
  phone?: string;
  email?: string;
  drivingLicenseNumber?: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  password: string;
}

export interface ApiErrorResponse {
  message: string;
  errors?: Array<{ field: string; message: string }>;
}
