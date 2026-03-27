import jwt from 'jsonwebtoken';
import type { User, UserSession } from '@prisma/client';
import { prisma } from '../db/client';
import { hashPassword, comparePassword } from '../utils/password';
import { generateTokenPair, verifyRefreshToken } from '../utils/jwt';
import type { AuthPayload } from '../middleware/auth';
import { AppError } from '../utils/app-error';
import { env } from '../config/env';
import { PHONE_OTP_EXPIRY_MINUTES } from '@crp/shared';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EmailRegisterInput {
  email: string;
  password: string;
  fullName: string;
}

interface PhoneRegisterInput {
  phone: string;
  fullName: string;
}

interface EmailLoginInput {
  email: string;
  password: string;
}

interface PhoneLoginInput {
  phone: string;
}

interface SocialAuthInput {
  provider: 'GOOGLE' | 'APPLE' | 'FACEBOOK';
  token: string;
}

interface VerifyOtpInput {
  phone: string;
  code: string;
}

interface SessionMeta {
  userAgent: string;
  ipAddress: string;
}

interface TokenPairResult {
  accessToken: string;
  refreshToken: string;
}

interface AuthResult {
  user: Omit<User, 'passwordHash'>;
  tokens: TokenPairResult;
}

interface ProfileUpdateInput {
  fullName?: string;
  phone?: string;
  email?: string;
  drivingLicenseNumber?: string;
  preferredLanguage?: 'en' | 'ar';
}

interface OtpEntry {
  code: string;
  expiresAt: Date;
}

interface SocialProfile {
  id: string;
  email: string;
  fullName: string;
}

// ---------------------------------------------------------------------------
// In-memory OTP store (dev only; production would use Redis)
// ---------------------------------------------------------------------------

const phoneOtps = new Map<string, OtpEntry>();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function stripPasswordHash(user: User): Omit<User, 'passwordHash'> {
  const { passwordHash: _pw, ...safe } = user;
  return safe;
}

function buildAuthPayload(user: User): AuthPayload {
  return { userId: user.id, type: 'customer' };
}

function generateOtp(): string {
  return String(Math.floor(100_000 + Math.random() * 900_000));
}

function maskPhone(phone: string): string {
  if (phone.length <= 4) return '****';
  return phone.slice(0, phone.length - 4).replace(/./g, '*') + phone.slice(-4);
}

async function createSession(
  userId: string,
  refreshToken: string,
  meta: SessionMeta,
): Promise<UserSession> {
  // Refresh tokens for customers expire in 7 days
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  return prisma.userSession.create({
    data: {
      userId,
      refreshToken,
      deviceInfo: meta.userAgent,
      ipAddress: meta.ipAddress,
      expiresAt,
    },
  });
}

/**
 * Mock OAuth verification.
 * In production this would call the provider's verification endpoint.
 */
function mockVerifySocialToken(
  provider: 'GOOGLE' | 'APPLE' | 'FACEBOOK',
  _token: string,
): SocialProfile {
  return {
    id: `${provider.toLowerCase()}-mock-id-${Date.now()}`,
    email: `user-${Date.now()}@${provider.toLowerCase()}.mock`,
    fullName: `${provider} User`,
  };
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const authService = {
  // ── Register with email ──────────────────────────────────────────────

  async registerWithEmail(
    data: EmailRegisterInput,
    meta: SessionMeta,
  ): Promise<AuthResult> {
    const existing = await prisma.user.findFirst({
      where: { email: data.email, deletedAt: null },
    });
    if (existing) {
      throw AppError.conflict('A user with this email already exists');
    }

    const hashed = await hashPassword(data.password);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        fullName: data.fullName,
        passwordHash: hashed,
        authProvider: 'EMAIL',
      },
    });

    const payload = buildAuthPayload(user);
    const tokens = generateTokenPair(payload);
    await createSession(user.id, tokens.refreshToken, meta);

    // In production: send verification email
    const emailToken = jwt.sign({ userId: user.id, purpose: 'email-verify' }, env.JWT_SECRET, {
      expiresIn: '24h',
    });
    console.log(`[DEV] Email verification link: ${env.APP_URL}/verify-email?token=${emailToken}`);

    return { user: stripPasswordHash(user), tokens };
  },

  // ── Register with phone ──────────────────────────────────────────────

  async registerWithPhone(data: PhoneRegisterInput): Promise<{ maskedPhone: string }> {
    const existing = await prisma.user.findFirst({
      where: { phone: data.phone, deletedAt: null },
    });
    if (existing) {
      throw AppError.conflict('A user with this phone number already exists');
    }

    // Pre-create user record (will be fully activated on OTP verification)
    await prisma.user.create({
      data: {
        phone: data.phone,
        fullName: data.fullName,
        authProvider: 'PHONE',
      },
    });

    const code = generateOtp();
    phoneOtps.set(data.phone, {
      code,
      expiresAt: new Date(Date.now() + PHONE_OTP_EXPIRY_MINUTES * 60 * 1000),
    });

    // Mock Twilio SMS send
    console.log(`[DEV] OTP for ${data.phone}: ${code}`);

    return { maskedPhone: maskPhone(data.phone) };
  },

  // ── Login with email ─────────────────────────────────────────────────

  async loginWithEmail(
    data: EmailLoginInput,
    meta: SessionMeta,
  ): Promise<AuthResult> {
    const user = await prisma.user.findFirst({
      where: { email: data.email, deletedAt: null },
    });
    if (!user || !user.passwordHash) {
      throw AppError.unauthorized('Invalid email or password');
    }

    const isValid = await comparePassword(data.password, user.passwordHash);
    if (!isValid) {
      throw AppError.unauthorized('Invalid email or password');
    }

    if (user.status === 'SUSPENDED') {
      throw AppError.forbidden('Your account has been suspended. Please contact support.');
    }

    if (user.status === 'DEACTIVATED') {
      throw AppError.forbidden('Your account has been deactivated.');
    }

    const payload = buildAuthPayload(user);
    const tokens = generateTokenPair(payload);
    await createSession(user.id, tokens.refreshToken, meta);

    return { user: stripPasswordHash(user), tokens };
  },

  // ── Login with phone ─────────────────────────────────────────────────

  async loginWithPhone(data: PhoneLoginInput): Promise<{ maskedPhone: string }> {
    const user = await prisma.user.findFirst({
      where: { phone: data.phone, deletedAt: null },
    });
    if (!user) {
      throw AppError.notFound('No account found with this phone number');
    }

    if (user.status === 'SUSPENDED') {
      throw AppError.forbidden('Your account has been suspended. Please contact support.');
    }

    const code = generateOtp();
    phoneOtps.set(data.phone, {
      code,
      expiresAt: new Date(Date.now() + PHONE_OTP_EXPIRY_MINUTES * 60 * 1000),
    });

    // Mock Twilio SMS send
    console.log(`[DEV] OTP for ${data.phone}: ${code}`);

    return { maskedPhone: maskPhone(data.phone) };
  },

  // ── Login with social provider ───────────────────────────────────────

  async loginWithSocial(
    data: SocialAuthInput,
    meta: SessionMeta,
  ): Promise<AuthResult> {
    const profile = mockVerifySocialToken(data.provider, data.token);

    // Upsert: find by provider + providerId, or by email
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { authProvider: data.provider, authProviderId: profile.id },
          { email: profile.email, deletedAt: null },
        ],
      },
    });

    if (user && user.status === 'SUSPENDED') {
      throw AppError.forbidden('Your account has been suspended. Please contact support.');
    }

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: profile.email,
          fullName: profile.fullName,
          authProvider: data.provider,
          authProviderId: profile.id,
          emailVerified: true,
        },
      });
    } else if (!user.authProviderId) {
      // Link social provider to existing account
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          authProvider: data.provider,
          authProviderId: profile.id,
          emailVerified: true,
        },
      });
    }

    const payload = buildAuthPayload(user);
    const tokens = generateTokenPair(payload);
    await createSession(user.id, tokens.refreshToken, meta);

    return { user: stripPasswordHash(user), tokens };
  },

  // ── Verify OTP ───────────────────────────────────────────────────────

  async verifyOtp(
    data: VerifyOtpInput,
    meta: SessionMeta,
  ): Promise<AuthResult> {
    const entry = phoneOtps.get(data.phone);

    // In dev mode, accept "123456" as a valid OTP always
    const isDev = env.NODE_ENV === 'development';
    const isDevBypass = isDev && data.code === '123456';

    if (!entry && !isDevBypass) {
      throw AppError.badRequest('No OTP was requested for this phone number');
    }

    if (entry) {
      if (entry.expiresAt < new Date() && !isDevBypass) {
        phoneOtps.delete(data.phone);
        throw AppError.badRequest('OTP has expired. Please request a new one.');
      }

      if (entry.code !== data.code && !isDevBypass) {
        throw AppError.badRequest('Invalid OTP code');
      }

      // OTP is valid; remove it
      phoneOtps.delete(data.phone);
    }

    const user = await prisma.user.findFirst({
      where: { phone: data.phone, deletedAt: null },
    });
    if (!user) {
      throw AppError.notFound('No account found with this phone number');
    }

    // Mark phone as verified if not already
    let updatedUser = user;
    if (!user.phoneVerified) {
      updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: { phoneVerified: true },
      });
    }

    const payload = buildAuthPayload(updatedUser);
    const tokens = generateTokenPair(payload);
    await createSession(updatedUser.id, tokens.refreshToken, meta);

    return { user: stripPasswordHash(updatedUser), tokens };
  },

  // ── Verify email ─────────────────────────────────────────────────────

  async verifyEmail(token: string): Promise<{ message: string }> {
    let decoded: { userId: string; purpose: string };
    try {
      decoded = jwt.verify(token, env.JWT_SECRET) as { userId: string; purpose: string };
    } catch {
      throw AppError.badRequest('Invalid or expired email verification token');
    }

    if (decoded.purpose !== 'email-verify') {
      throw AppError.badRequest('Invalid token purpose');
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) {
      throw AppError.notFound('User not found');
    }

    if (user.emailVerified) {
      return { message: 'Email is already verified' };
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true },
    });

    return { message: 'Email verified successfully' };
  },

  // ── Refresh token ────────────────────────────────────────────────────

  async refreshToken(
    refreshToken: string,
    meta: SessionMeta,
  ): Promise<TokenPairResult> {
    let payload: AuthPayload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw AppError.unauthorized('Invalid or expired refresh token');
    }

    const session = await prisma.userSession.findUnique({
      where: { refreshToken },
    });
    if (!session || session.revokedAt) {
      throw AppError.unauthorized('Session not found or has been revoked');
    }

    if (session.expiresAt < new Date()) {
      await prisma.userSession.update({
        where: { id: session.id },
        data: { revokedAt: new Date() },
      });
      throw AppError.unauthorized('Session has expired');
    }

    // Generate new token pair
    const newPayload: AuthPayload = { userId: payload.userId, type: payload.type };
    const tokens = generateTokenPair(newPayload);

    // Update session with new refresh token
    await prisma.userSession.update({
      where: { id: session.id },
      data: {
        refreshToken: tokens.refreshToken,
        deviceInfo: meta.userAgent,
        ipAddress: meta.ipAddress,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return tokens;
  },

  // ── Logout ───────────────────────────────────────────────────────────

  async logout(userId: string, refreshToken: string): Promise<{ message: string }> {
    const session = await prisma.userSession.findUnique({
      where: { refreshToken },
    });

    if (!session || session.userId !== userId) {
      throw AppError.unauthorized('Invalid session');
    }

    await prisma.userSession.delete({
      where: { id: session.id },
    });

    return { message: 'Logged out successfully' };
  },

  // ── Forgot password ──────────────────────────────────────────────────

  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await prisma.user.findFirst({
      where: { email, deletedAt: null },
    });

    // Always return success to avoid email enumeration
    if (!user) {
      return { message: 'If an account with that email exists, a reset link has been sent.' };
    }

    const resetToken = jwt.sign(
      { userId: user.id, purpose: 'password-reset' },
      env.JWT_SECRET,
      { expiresIn: '1h' },
    );

    // Mock email send
    console.log(`[DEV] Password reset link: ${env.APP_URL}/reset-password?token=${resetToken}`);

    return { message: 'If an account with that email exists, a reset link has been sent.' };
  },

  // ── Reset password ───────────────────────────────────────────────────

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    let decoded: { userId: string; purpose: string };
    try {
      decoded = jwt.verify(token, env.JWT_SECRET) as { userId: string; purpose: string };
    } catch {
      throw AppError.badRequest('Invalid or expired reset token');
    }

    if (decoded.purpose !== 'password-reset') {
      throw AppError.badRequest('Invalid token purpose');
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) {
      throw AppError.notFound('User not found');
    }

    const hashed = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: hashed },
    });

    // Revoke all existing sessions for security
    await prisma.userSession.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    return { message: 'Password reset successfully' };
  },

  // ── Get profile ──────────────────────────────────────────────────────

  async getProfile(userId: string): Promise<Omit<User, 'passwordHash'>> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.deletedAt) {
      throw AppError.notFound('User not found');
    }

    return stripPasswordHash(user);
  },

  // ── Update profile ───────────────────────────────────────────────────

  async updateProfile(
    userId: string,
    data: ProfileUpdateInput,
  ): Promise<Omit<User, 'passwordHash'>> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.deletedAt) {
      throw AppError.notFound('User not found');
    }

    // If email is being changed, check uniqueness
    if (data.email && data.email !== user.email) {
      const emailExists = await prisma.user.findFirst({
        where: { email: data.email, deletedAt: null, id: { not: userId } },
      });
      if (emailExists) {
        throw AppError.conflict('This email is already in use');
      }
    }

    // If phone is being changed, check uniqueness
    if (data.phone && data.phone !== user.phone) {
      const phoneExists = await prisma.user.findFirst({
        where: { phone: data.phone, deletedAt: null, id: { not: userId } },
      });
      if (phoneExists) {
        throw AppError.conflict('This phone number is already in use');
      }
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.fullName !== undefined && { fullName: data.fullName }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.email !== undefined && { email: data.email, emailVerified: false }),
        ...(data.drivingLicenseNumber !== undefined && {
          drivingLicenseNumber: data.drivingLicenseNumber,
        }),
        ...(data.preferredLanguage !== undefined && {
          preferredLanguage: data.preferredLanguage,
        }),
      },
    });

    return stripPasswordHash(updated);
  },
};
