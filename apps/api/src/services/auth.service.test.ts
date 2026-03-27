import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { User, UserSession } from '@prisma/client';

// ---------------------------------------------------------------------------
// Hoisted mock objects (vi.mock factories are hoisted, so they need vi.hoisted)
// ---------------------------------------------------------------------------

const { mockPrisma, mockHashPassword, mockComparePassword, mockGenerateTokenPair, mockVerifyRefreshToken, mockJwtSign, mockJwtVerify } = vi.hoisted(() => ({
  mockPrisma: {
    user: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    userSession: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
    },
  },
  mockHashPassword: vi.fn().mockResolvedValue('hashed-password-123'),
  mockComparePassword: vi.fn(),
  mockGenerateTokenPair: vi.fn().mockReturnValue({
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
  }),
  mockVerifyRefreshToken: vi.fn(),
  mockJwtSign: vi.fn().mockReturnValue('mock-jwt-token'),
  mockJwtVerify: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('../db/client', () => ({
  prisma: mockPrisma,
}));

vi.mock('../utils/password', () => ({
  hashPassword: mockHashPassword,
  comparePassword: mockComparePassword,
}));

vi.mock('../utils/jwt', () => ({
  generateTokenPair: mockGenerateTokenPair,
  verifyRefreshToken: mockVerifyRefreshToken,
}));

vi.mock('jsonwebtoken', () => ({
  default: {
    sign: mockJwtSign,
    verify: mockJwtVerify,
  },
}));

vi.mock('../config/env', () => ({
  env: {
    NODE_ENV: 'development',
    JWT_SECRET: 'test-secret',
    JWT_REFRESH_SECRET: 'test-refresh-secret',
    APP_URL: 'http://localhost:3000',
  },
}));

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------

import { authService } from './auth.service';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const sessionMeta = { userAgent: 'test-agent', ipAddress: '127.0.0.1' };

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-uuid-1',
    email: 'test@example.com',
    phone: null,
    passwordHash: 'hashed-password-123',
    fullName: 'Test User',
    profilePhotoUrl: null,
    drivingLicenseNumber: null,
    authProvider: 'EMAIL',
    authProviderId: null,
    emailVerified: false,
    phoneVerified: false,
    status: 'ACTIVE',
    suspensionReason: null,
    preferredLanguage: 'en',
    loyaltyPointsBalance: 0,
    fcmToken: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  };
}

function makeSession(overrides: Partial<UserSession> = {}): UserSession {
  return {
    id: 'session-uuid-1',
    userId: 'user-uuid-1',
    refreshToken: 'existing-refresh-token',
    deviceInfo: 'test-agent',
    ipAddress: '127.0.0.1',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    createdAt: new Date(),
    revokedAt: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── registerWithEmail ────────────────────────────────────────────────

  describe('registerWithEmail', () => {
    it('creates a user and returns tokens', async () => {
      const user = makeUser();
      mockPrisma.user.findFirst.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(user);
      mockPrisma.userSession.create.mockResolvedValue(makeSession());

      const result = await authService.registerWithEmail(
        { email: 'test@example.com', password: 'Password1', fullName: 'Test User' },
        sessionMeta,
      );

      expect(result.user.id).toBe('user-uuid-1');
      expect(result.user.email).toBe('test@example.com');
      expect(result.tokens.accessToken).toBe('mock-access-token');
      expect(result.tokens.refreshToken).toBe('mock-refresh-token');
      // passwordHash should not be in the result
      expect('passwordHash' in result.user).toBe(false);
      // Session should have been created
      expect(mockPrisma.userSession.create).toHaveBeenCalledOnce();
    });

    it('throws conflict if email already exists', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(makeUser());

      await expect(
        authService.registerWithEmail(
          { email: 'test@example.com', password: 'Password1', fullName: 'Test User' },
          sessionMeta,
        ),
      ).rejects.toThrow('A user with this email already exists');
    });
  });

  // ── loginWithEmail ───────────────────────────────────────────────────

  describe('loginWithEmail', () => {
    it('returns user and tokens for valid credentials', async () => {
      const user = makeUser();
      mockPrisma.user.findFirst.mockResolvedValue(user);
      mockComparePassword.mockResolvedValue(true);
      mockPrisma.userSession.create.mockResolvedValue(makeSession());

      const result = await authService.loginWithEmail(
        { email: 'test@example.com', password: 'Password1' },
        sessionMeta,
      );

      expect(result.user.id).toBe('user-uuid-1');
      expect(result.tokens.accessToken).toBe('mock-access-token');
    });

    it('throws unauthorized for wrong password', async () => {
      const user = makeUser();
      mockPrisma.user.findFirst.mockResolvedValue(user);
      mockComparePassword.mockResolvedValue(false);

      await expect(
        authService.loginWithEmail(
          { email: 'test@example.com', password: 'WrongPass1' },
          sessionMeta,
        ),
      ).rejects.toThrow('Invalid email or password');
    });

    it('throws unauthorized for non-existent user', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await expect(
        authService.loginWithEmail(
          { email: 'nonexistent@example.com', password: 'Password1' },
          sessionMeta,
        ),
      ).rejects.toThrow('Invalid email or password');
    });

    it('throws forbidden for suspended user', async () => {
      const user = makeUser({ status: 'SUSPENDED' });
      mockPrisma.user.findFirst.mockResolvedValue(user);
      mockComparePassword.mockResolvedValue(true);

      await expect(
        authService.loginWithEmail(
          { email: 'test@example.com', password: 'Password1' },
          sessionMeta,
        ),
      ).rejects.toThrow('Your account has been suspended');
    });

    it('throws forbidden for deactivated user', async () => {
      const user = makeUser({ status: 'DEACTIVATED' });
      mockPrisma.user.findFirst.mockResolvedValue(user);
      mockComparePassword.mockResolvedValue(true);

      await expect(
        authService.loginWithEmail(
          { email: 'test@example.com', password: 'Password1' },
          sessionMeta,
        ),
      ).rejects.toThrow('Your account has been deactivated');
    });
  });

  // ── refreshToken ─────────────────────────────────────────────────────

  describe('refreshToken', () => {
    it('returns new token pair for valid refresh token', async () => {
      const session = makeSession();
      mockVerifyRefreshToken.mockReturnValue({ userId: 'user-uuid-1', type: 'customer' });
      mockPrisma.userSession.findUnique.mockResolvedValue(session);
      mockPrisma.userSession.update.mockResolvedValue({
        ...session,
        refreshToken: 'mock-refresh-token',
      });

      const result = await authService.refreshToken('existing-refresh-token', sessionMeta);

      expect(result.accessToken).toBe('mock-access-token');
      expect(result.refreshToken).toBe('mock-refresh-token');
      expect(mockPrisma.userSession.update).toHaveBeenCalledOnce();
    });

    it('throws unauthorized for invalid refresh token', async () => {
      mockVerifyRefreshToken.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(
        authService.refreshToken('bad-token', sessionMeta),
      ).rejects.toThrow('Invalid or expired refresh token');
    });

    it('throws unauthorized for revoked session', async () => {
      mockVerifyRefreshToken.mockReturnValue({ userId: 'user-uuid-1', type: 'customer' });
      mockPrisma.userSession.findUnique.mockResolvedValue(
        makeSession({ revokedAt: new Date() }),
      );

      await expect(
        authService.refreshToken('revoked-token', sessionMeta),
      ).rejects.toThrow('Session not found or has been revoked');
    });

    it('throws unauthorized for expired session', async () => {
      mockVerifyRefreshToken.mockReturnValue({ userId: 'user-uuid-1', type: 'customer' });
      mockPrisma.userSession.findUnique.mockResolvedValue(
        makeSession({ expiresAt: new Date(Date.now() - 1000) }),
      );
      mockPrisma.userSession.update.mockResolvedValue(
        makeSession({ revokedAt: new Date() }),
      );

      await expect(
        authService.refreshToken('expired-session-token', sessionMeta),
      ).rejects.toThrow('Session has expired');
    });

    it('throws unauthorized when session does not exist', async () => {
      mockVerifyRefreshToken.mockReturnValue({ userId: 'user-uuid-1', type: 'customer' });
      mockPrisma.userSession.findUnique.mockResolvedValue(null);

      await expect(
        authService.refreshToken('nonexistent-token', sessionMeta),
      ).rejects.toThrow('Session not found or has been revoked');
    });
  });

  // ── logout ───────────────────────────────────────────────────────────

  describe('logout', () => {
    it('deletes the session for a valid token', async () => {
      const session = makeSession();
      mockPrisma.userSession.findUnique.mockResolvedValue(session);
      mockPrisma.userSession.delete.mockResolvedValue(session);

      const result = await authService.logout('user-uuid-1', 'existing-refresh-token');

      expect(result.message).toBe('Logged out successfully');
      expect(mockPrisma.userSession.delete).toHaveBeenCalledWith({
        where: { id: 'session-uuid-1' },
      });
    });

    it('throws unauthorized for non-existent session', async () => {
      mockPrisma.userSession.findUnique.mockResolvedValue(null);

      await expect(
        authService.logout('user-uuid-1', 'nonexistent-token'),
      ).rejects.toThrow('Invalid session');
    });

    it('throws unauthorized when userId does not match session', async () => {
      const session = makeSession({ userId: 'other-user-id' });
      mockPrisma.userSession.findUnique.mockResolvedValue(session);

      await expect(
        authService.logout('user-uuid-1', 'existing-refresh-token'),
      ).rejects.toThrow('Invalid session');
    });
  });

  // ── forgotPassword ───────────────────────────────────────────────────

  describe('forgotPassword', () => {
    it('returns success message even if user does not exist (prevents enumeration)', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      const result = await authService.forgotPassword('nonexistent@example.com');
      expect(result.message).toContain('If an account with that email exists');
    });

    it('generates a reset token for an existing user', async () => {
      const user = makeUser();
      mockPrisma.user.findFirst.mockResolvedValue(user);

      const result = await authService.forgotPassword('test@example.com');
      expect(result.message).toContain('If an account with that email exists');
      expect(mockJwtSign).toHaveBeenCalledWith(
        { userId: user.id, purpose: 'password-reset' },
        'test-secret',
        { expiresIn: '1h' },
      );
    });
  });

  // ── resetPassword ────────────────────────────────────────────────────

  describe('resetPassword', () => {
    it('resets password and revokes all sessions', async () => {
      const user = makeUser();
      mockJwtVerify.mockReturnValue({
        userId: 'user-uuid-1',
        purpose: 'password-reset',
      });
      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.user.update.mockResolvedValue({ ...user, passwordHash: 'new-hash' });
      mockPrisma.userSession.updateMany.mockResolvedValue({ count: 2 });

      const result = await authService.resetPassword('valid-reset-token', 'NewPassword1');

      expect(result.message).toBe('Password reset successfully');
      expect(mockPrisma.user.update).toHaveBeenCalledOnce();
      expect(mockPrisma.userSession.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-uuid-1', revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
    });

    it('throws for invalid reset token', async () => {
      mockJwtVerify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(
        authService.resetPassword('bad-token', 'NewPassword1'),
      ).rejects.toThrow('Invalid or expired reset token');
    });
  });

  // ── getProfile ───────────────────────────────────────────────────────

  describe('getProfile', () => {
    it('returns user without passwordHash', async () => {
      const user = makeUser();
      mockPrisma.user.findUnique.mockResolvedValue(user);

      const result = await authService.getProfile('user-uuid-1');

      expect(result.id).toBe('user-uuid-1');
      expect('passwordHash' in result).toBe(false);
    });

    it('throws not found for deleted user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(
        makeUser({ deletedAt: new Date() }),
      );

      await expect(authService.getProfile('user-uuid-1')).rejects.toThrow('User not found');
    });

    it('throws not found for non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(authService.getProfile('nonexistent')).rejects.toThrow('User not found');
    });
  });

  // ── updateProfile ────────────────────────────────────────────────────

  describe('updateProfile', () => {
    it('updates allowed fields and returns the updated user', async () => {
      const user = makeUser();
      const updatedUser = makeUser({ fullName: 'Updated Name' });
      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.user.update.mockResolvedValue(updatedUser);

      const result = await authService.updateProfile('user-uuid-1', {
        fullName: 'Updated Name',
      });

      expect(result.fullName).toBe('Updated Name');
      expect('passwordHash' in result).toBe(false);
    });

    it('throws conflict if new email is already in use', async () => {
      const user = makeUser();
      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.user.findFirst.mockResolvedValue(makeUser({ id: 'other-user-id', email: 'taken@example.com' }));

      await expect(
        authService.updateProfile('user-uuid-1', { email: 'taken@example.com' }),
      ).rejects.toThrow('This email is already in use');
    });
  });

  // ── registerWithPhone ────────────────────────────────────────────────

  describe('registerWithPhone', () => {
    it('creates user and returns masked phone', async () => {
      const user = makeUser({ phone: '+966500001234', authProvider: 'PHONE' });
      mockPrisma.user.findFirst.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(user);

      const result = await authService.registerWithPhone({
        phone: '+966500001234',
        fullName: 'Phone User',
      });

      expect(result.maskedPhone).toContain('1234');
      expect(result.maskedPhone).toContain('*');
      expect(mockPrisma.user.create).toHaveBeenCalledOnce();
    });

    it('throws conflict if phone already exists', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(makeUser({ phone: '+966500001234' }));

      await expect(
        authService.registerWithPhone({ phone: '+966500001234', fullName: 'Phone User' }),
      ).rejects.toThrow('A user with this phone number already exists');
    });
  });

  // ── verifyEmail ──────────────────────────────────────────────────────

  describe('verifyEmail', () => {
    it('marks email as verified', async () => {
      mockJwtVerify.mockReturnValue({
        userId: 'user-uuid-1',
        purpose: 'email-verify',
      });
      const user = makeUser({ emailVerified: false });
      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.user.update.mockResolvedValue({ ...user, emailVerified: true });

      const result = await authService.verifyEmail('valid-token');

      expect(result.message).toBe('Email verified successfully');
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-uuid-1' },
        data: { emailVerified: true },
      });
    });

    it('returns already verified if email was already verified', async () => {
      mockJwtVerify.mockReturnValue({
        userId: 'user-uuid-1',
        purpose: 'email-verify',
      });
      mockPrisma.user.findUnique.mockResolvedValue(makeUser({ emailVerified: true }));

      const result = await authService.verifyEmail('valid-token');
      expect(result.message).toBe('Email is already verified');
    });
  });
});
