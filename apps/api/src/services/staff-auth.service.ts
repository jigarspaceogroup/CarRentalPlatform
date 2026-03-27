import jwt from 'jsonwebtoken';
import { prisma } from '../db/client';
import { comparePassword, hashPassword } from '../utils/password';
import { generateTokenPair, verifyRefreshToken } from '../utils/jwt';
import { AppError } from '../utils/app-error';
import { env } from '../config/env';
import type { AuthPayload } from '../middleware/auth';
import { STAFF_REFRESH_TOKEN_EXPIRY, type StaffRole } from '@crp/shared';

/**
 * Parse duration strings like '24h', '7d', '30m' to milliseconds.
 */
function parseExpiryToMs(expiry: string): number {
  const match = expiry.match(/^(\d+)([smhd])$/);
  if (!match) return 24 * 60 * 60 * 1000; // default 24h
  const value = parseInt(match[1]!, 10);
  const unit = match[2]!;
  switch (unit) {
    case 's':
      return value * 1000;
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    case 'd':
      return value * 24 * 60 * 60 * 1000;
    default:
      return 24 * 60 * 60 * 1000;
  }
}

/**
 * Staff authentication: login with email and password.
 */
export async function login(
  email: string,
  password: string,
  meta: { userAgent?: string; ipAddress?: string },
) {
  // Find staff by email
  const staff = await prisma.staffMember.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!staff) {
    throw AppError.unauthorized('Invalid email or password');
  }

  // Verify password
  const isValid = await comparePassword(password, staff.passwordHash);
  if (!isValid) {
    throw AppError.unauthorized('Invalid email or password');
  }

  // Check status
  if (staff.status !== 'ACTIVE') {
    throw AppError.forbidden('Account is inactive. Contact your administrator.');
  }

  // Generate token pair
  const payload: AuthPayload = {
    userId: staff.id,
    type: 'staff',
    role: staff.role as StaffRole,
  };
  const tokens = generateTokenPair(payload);

  // Calculate refresh token expiry
  const expiresAt = new Date(Date.now() + parseExpiryToMs(STAFF_REFRESH_TOKEN_EXPIRY));

  // Create staff session
  await prisma.staffSession.create({
    data: {
      staffId: staff.id,
      refreshToken: tokens.refreshToken,
      userAgent: meta.userAgent ?? null,
      ipAddress: meta.ipAddress ?? null,
      expiresAt,
    },
  });

  // Update last login timestamp
  await prisma.staffMember.update({
    where: { id: staff.id },
    data: { lastLoginAt: new Date() },
  });

  return {
    staff: {
      id: staff.id,
      email: staff.email,
      fullName: staff.fullName,
      role: staff.role,
      status: staff.status,
    },
    ...tokens,
  };
}

/**
 * Refresh an expired access token using a valid refresh token.
 */
export async function refreshToken(token: string) {
  // Verify the JWT signature and decode
  let decoded: AuthPayload;
  try {
    decoded = verifyRefreshToken(token);
  } catch {
    throw AppError.unauthorized('Invalid or expired refresh token');
  }

  // Check that session exists in the database
  const session = await prisma.staffSession.findUnique({
    where: { refreshToken: token },
    include: { staff: true },
  });

  if (!session) {
    throw AppError.unauthorized('Session not found. Please log in again.');
  }

  if (session.expiresAt < new Date()) {
    // Clean up expired session
    await prisma.staffSession.delete({ where: { id: session.id } });
    throw AppError.unauthorized('Session expired. Please log in again.');
  }

  if (session.staff.status !== 'ACTIVE') {
    throw AppError.forbidden('Account is inactive. Contact your administrator.');
  }

  // Generate new token pair
  const payload: AuthPayload = {
    userId: decoded.userId,
    type: 'staff',
    role: session.staff.role as StaffRole,
  };
  const tokens = generateTokenPair(payload);

  // Calculate new refresh token expiry
  const expiresAt = new Date(Date.now() + parseExpiryToMs(STAFF_REFRESH_TOKEN_EXPIRY));

  // Update the session with the new refresh token
  await prisma.staffSession.update({
    where: { id: session.id },
    data: {
      refreshToken: tokens.refreshToken,
      expiresAt,
    },
  });

  return tokens;
}

/**
 * Logout: delete the staff session associated with the given refresh token.
 */
export async function logout(staffId: string, token: string) {
  const session = await prisma.staffSession.findUnique({
    where: { refreshToken: token },
  });

  if (session && session.staffId === staffId) {
    await prisma.staffSession.delete({ where: { id: session.id } });
  }
}

/**
 * Forgot password: generate a password reset token and log it.
 * In production, this would send an email with the reset link.
 */
export async function forgotPassword(email: string) {
  const staff = await prisma.staffMember.findUnique({
    where: { email: email.toLowerCase() },
  });

  // Always return success to prevent email enumeration
  if (!staff) {
    return;
  }

  // Generate a reset token valid for 1 hour
  const resetToken = jwt.sign(
    { userId: staff.id, type: 'password_reset' },
    env.JWT_SECRET,
    { expiresIn: '1h' },
  );

  // In production, send an email with the reset link
  // For now, log the token (will be replaced with email service)
  const resetLink = `${env.APP_URL}/reset-password?token=${resetToken}`;
  console.log(`[Password Reset] Staff: ${staff.email}, Link: ${resetLink}`);
}

/**
 * Reset password: verify the reset token and update the password hash.
 */
export async function resetPassword(token: string, newPassword: string) {
  let decoded: { userId: string; type: string };
  try {
    decoded = jwt.verify(token, env.JWT_SECRET) as { userId: string; type: string };
  } catch {
    throw AppError.badRequest('Invalid or expired reset token');
  }

  if (decoded.type !== 'password_reset') {
    throw AppError.badRequest('Invalid token type');
  }

  const staff = await prisma.staffMember.findUnique({
    where: { id: decoded.userId },
  });

  if (!staff) {
    throw AppError.notFound('Staff member not found');
  }

  const hashedPassword = await hashPassword(newPassword);

  await prisma.staffMember.update({
    where: { id: staff.id },
    data: { passwordHash: hashedPassword },
  });

  // Invalidate all existing sessions for security
  await prisma.staffSession.deleteMany({
    where: { staffId: staff.id },
  });
}
