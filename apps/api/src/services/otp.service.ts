import { randomInt } from 'crypto';
import { prisma } from '../db/client';
import { AppError } from '../utils/app-error';
import { BookingStatus, OtpStatus, OtpChannel } from '@crp/shared';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Default OTP expiry: 24 hours */
const OTP_EXPIRY_MS = 24 * 60 * 60 * 1000;

/** Statuses that can be invalidated when generating a new OTP */
const INVALIDATABLE_STATUSES: OtpStatus[] = [OtpStatus.GENERATED, OtpStatus.DELIVERED];

/** Booking statuses that allow OTP generation for customers */
const OTP_ELIGIBLE_STATUSES: BookingStatus[] = [
  BookingStatus.READY_FOR_PICKUP,
  BookingStatus.ACTIVE_RENTAL,
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Generate a cryptographically random 6-digit OTP code.
 */
function generateOtpCode(): string {
  return String(randomInt(100000, 999999));
}

// ---------------------------------------------------------------------------
// Service functions
// ---------------------------------------------------------------------------

/**
 * Generate an OTP for a booking.
 * Invalidates all previous active OTPs for the same booking before creating a new one.
 */
export async function generateOtp(
  bookingId: string,
  staffId?: string,
  channel: OtpChannel = OtpChannel.BOTH,
) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { id: true, status: true },
  });

  if (!booking) {
    throw AppError.notFound('Booking not found');
  }

  const code = generateOtpCode();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

  const otp = await prisma.$transaction(async (tx) => {
    // Invalidate all previous GENERATED/DELIVERED OTPs for this booking
    await tx.otp.updateMany({
      where: {
        bookingId,
        status: { in: INVALIDATABLE_STATUSES },
      },
      data: {
        status: OtpStatus.INVALIDATED,
      },
    });

    // Create the new OTP
    return tx.otp.create({
      data: {
        bookingId,
        code,
        status: OtpStatus.GENERATED,
        channel,
        generatedByStaffId: staffId ?? null,
        expiresAt,
      },
    });
  });

  return otp;
}

/**
 * Get the current active OTP and full audit log for a booking.
 */
export async function getOtpStatus(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { id: true },
  });

  if (!booking) {
    throw AppError.notFound('Booking not found');
  }

  const [activeOtp, auditLog] = await Promise.all([
    prisma.otp.findFirst({
      where: {
        bookingId,
        status: { in: [OtpStatus.GENERATED, OtpStatus.DELIVERED] },
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.otp.findMany({
      where: { bookingId },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return { activeOtp, auditLog };
}

/**
 * Customer requests a new OTP for their booking.
 * Verifies ownership, eligible status, and that the contract is signed.
 */
export async function requestNewOtp(bookingId: string, userId: string) {
  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, userId },
    select: { id: true, status: true, contractSignedAt: true },
  });

  if (!booking) {
    throw AppError.notFound('Booking not found');
  }

  const currentStatus = booking.status as BookingStatus;

  if (!OTP_ELIGIBLE_STATUSES.includes(currentStatus)) {
    throw AppError.badRequest(
      `OTP cannot be requested for a booking in ${currentStatus} status`,
    );
  }

  if (!booking.contractSignedAt) {
    throw AppError.badRequest('Contract must be signed before requesting an OTP');
  }

  return generateOtp(bookingId);
}

/**
 * Customer signs the digital contract for a booking.
 * Verifies ownership and that the booking is in READY_FOR_PICKUP status.
 */
export async function signContract(bookingId: string, userId: string) {
  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, userId },
    select: { id: true, status: true, contractSignedAt: true },
  });

  if (!booking) {
    throw AppError.notFound('Booking not found');
  }

  if (booking.status !== BookingStatus.READY_FOR_PICKUP) {
    throw AppError.badRequest(
      'Contract can only be signed when booking is in READY_FOR_PICKUP status',
    );
  }

  if (booking.contractSignedAt) {
    throw AppError.badRequest('Contract has already been signed');
  }

  return prisma.booking.update({
    where: { id: bookingId },
    data: { contractSignedAt: new Date() },
  });
}

/**
 * Verify an OTP code and mark it as used.
 */
export async function verifyAndUseOtp(bookingId: string, code: string) {
  const otp = await prisma.otp.findFirst({
    where: {
      bookingId,
      status: { in: [OtpStatus.GENERATED, OtpStatus.DELIVERED] },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!otp) {
    throw AppError.notFound('No active OTP found for this booking');
  }

  if (new Date() > otp.expiresAt) {
    // Mark the OTP as expired
    await prisma.otp.update({
      where: { id: otp.id },
      data: { status: OtpStatus.EXPIRED },
    });
    throw AppError.badRequest('OTP has expired');
  }

  if (otp.code !== code) {
    throw AppError.badRequest('Invalid OTP code');
  }

  return prisma.otp.update({
    where: { id: otp.id },
    data: {
      status: OtpStatus.USED,
      usedAt: new Date(),
    },
  });
}

/**
 * Expire all OTPs that have passed their expiresAt timestamp.
 * Intended to be called by a cron job.
 */
export async function expireOtps() {
  const result = await prisma.otp.updateMany({
    where: {
      status: { in: INVALIDATABLE_STATUSES },
      expiresAt: { lt: new Date() },
    },
    data: {
      status: OtpStatus.EXPIRED,
    },
  });

  return result;
}
