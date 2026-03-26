import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Hoisted mock objects
// ---------------------------------------------------------------------------

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    booking: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    otp: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('../db/client', () => ({
  prisma: mockPrisma,
}));

vi.mock('@crp/shared', () => ({
  BookingStatus: {
    PENDING: 'PENDING',
    CONFIRMED: 'CONFIRMED',
    VEHICLE_PREPARING: 'VEHICLE_PREPARING',
    READY_FOR_PICKUP: 'READY_FOR_PICKUP',
    ACTIVE_RENTAL: 'ACTIVE_RENTAL',
    RETURN_PENDING: 'RETURN_PENDING',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
    REJECTED: 'REJECTED',
  },
  OtpStatus: {
    GENERATED: 'GENERATED',
    DELIVERED: 'DELIVERED',
    USED: 'USED',
    EXPIRED: 'EXPIRED',
    INVALIDATED: 'INVALIDATED',
  },
  OtpChannel: {
    SMS: 'SMS',
    PUSH: 'PUSH',
    BOTH: 'BOTH',
  },
}));

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------

import * as otpService from './otp.service';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeBooking(overrides: Record<string, unknown> = {}) {
  return {
    id: 'booking-uuid-1',
    userId: 'user-uuid-1',
    status: 'READY_FOR_PICKUP',
    contractSignedAt: new Date('2026-03-25T10:00:00Z'),
    ...overrides,
  };
}

function makeOtp(overrides: Record<string, unknown> = {}) {
  return {
    id: 'otp-uuid-1',
    bookingId: 'booking-uuid-1',
    code: '123456',
    status: 'GENERATED',
    channel: 'BOTH',
    generatedByStaffId: null,
    deliveredAt: null,
    usedAt: null,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    createdAt: new Date(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('OtpService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -- generateOtp ---------------------------------------------------------

  describe('generateOtp', () => {
    it('generates a 6-digit OTP with GENERATED status', async () => {
      mockPrisma.booking.findUnique.mockResolvedValue(makeBooking());

      const createdOtp = makeOtp();
      mockPrisma.$transaction.mockImplementation(async (fn: Function) => {
        const tx = {
          otp: {
            updateMany: vi.fn().mockResolvedValue({ count: 0 }),
            create: vi.fn().mockResolvedValue(createdOtp),
          },
        };
        return fn(tx);
      });

      const result = await otpService.generateOtp('booking-uuid-1', 'staff-uuid-1');

      expect(result).toBeDefined();
      expect(result.code).toHaveLength(6);
      expect(result.status).toBe('GENERATED');
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('sets expiry to 24 hours from creation', async () => {
      mockPrisma.booking.findUnique.mockResolvedValue(makeBooking());

      let capturedData: any;
      mockPrisma.$transaction.mockImplementation(async (fn: Function) => {
        const tx = {
          otp: {
            updateMany: vi.fn().mockResolvedValue({ count: 0 }),
            create: vi.fn().mockImplementation((args: any) => {
              capturedData = args.data;
              return makeOtp({ expiresAt: args.data.expiresAt });
            }),
          },
        };
        return fn(tx);
      });

      await otpService.generateOtp('booking-uuid-1');

      expect(capturedData).toBeDefined();
      const expiresAt = new Date(capturedData.expiresAt);
      const expectedExpiry = Date.now() + 24 * 60 * 60 * 1000;
      // Allow 5 second tolerance
      expect(Math.abs(expiresAt.getTime() - expectedExpiry)).toBeLessThan(5000);
    });

    it('invalidates previous GENERATED/DELIVERED OTPs for the same booking', async () => {
      mockPrisma.booking.findUnique.mockResolvedValue(makeBooking());

      let updateManyMock: any;
      mockPrisma.$transaction.mockImplementation(async (fn: Function) => {
        updateManyMock = vi.fn().mockResolvedValue({ count: 2 });
        const tx = {
          otp: {
            updateMany: updateManyMock,
            create: vi.fn().mockResolvedValue(makeOtp()),
          },
        };
        return fn(tx);
      });

      await otpService.generateOtp('booking-uuid-1', 'staff-uuid-1');

      expect(updateManyMock).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            bookingId: 'booking-uuid-1',
            status: { in: ['GENERATED', 'DELIVERED'] },
          }),
          data: { status: 'INVALIDATED' },
        }),
      );
    });

    it('throws when booking is not found', async () => {
      mockPrisma.booking.findUnique.mockResolvedValue(null);

      await expect(
        otpService.generateOtp('nonexistent'),
      ).rejects.toThrow('Booking not found');
    });
  });

  // -- signContract --------------------------------------------------------

  describe('signContract', () => {
    it('sets contractSignedAt on a READY_FOR_PICKUP booking', async () => {
      const booking = makeBooking({ contractSignedAt: null });
      mockPrisma.booking.findFirst.mockResolvedValue(booking);
      const updatedBooking = { ...booking, contractSignedAt: new Date() };
      mockPrisma.booking.update.mockResolvedValue(updatedBooking);

      const result = await otpService.signContract('booking-uuid-1', 'user-uuid-1');

      expect(result.contractSignedAt).toBeDefined();
      expect(mockPrisma.booking.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'booking-uuid-1' },
          data: expect.objectContaining({
            contractSignedAt: expect.any(Date),
          }),
        }),
      );
    });

    it('throws when booking is not in READY_FOR_PICKUP status', async () => {
      mockPrisma.booking.findFirst.mockResolvedValue(
        makeBooking({ status: 'CONFIRMED', contractSignedAt: null }),
      );

      await expect(
        otpService.signContract('booking-uuid-1', 'user-uuid-1'),
      ).rejects.toThrow('Contract can only be signed when booking is in READY_FOR_PICKUP status');
    });

    it('throws when contract has already been signed', async () => {
      mockPrisma.booking.findFirst.mockResolvedValue(
        makeBooking({ contractSignedAt: new Date() }),
      );

      await expect(
        otpService.signContract('booking-uuid-1', 'user-uuid-1'),
      ).rejects.toThrow('Contract has already been signed');
    });

    it('throws when booking is not found', async () => {
      mockPrisma.booking.findFirst.mockResolvedValue(null);

      await expect(
        otpService.signContract('nonexistent', 'user-uuid-1'),
      ).rejects.toThrow('Booking not found');
    });
  });

  // -- requestNewOtp -------------------------------------------------------

  describe('requestNewOtp', () => {
    it('generates new OTP when contract is signed and status is eligible', async () => {
      const booking = makeBooking({
        status: 'READY_FOR_PICKUP',
        contractSignedAt: new Date(),
      });
      mockPrisma.booking.findFirst.mockResolvedValue(booking);
      mockPrisma.booking.findUnique.mockResolvedValue(booking);

      mockPrisma.$transaction.mockImplementation(async (fn: Function) => {
        const tx = {
          otp: {
            updateMany: vi.fn().mockResolvedValue({ count: 0 }),
            create: vi.fn().mockResolvedValue(makeOtp()),
          },
        };
        return fn(tx);
      });

      const result = await otpService.requestNewOtp('booking-uuid-1', 'user-uuid-1');

      expect(result).toBeDefined();
      expect(result.status).toBe('GENERATED');
    });

    it('throws when contract is not signed', async () => {
      mockPrisma.booking.findFirst.mockResolvedValue(
        makeBooking({ status: 'READY_FOR_PICKUP', contractSignedAt: null }),
      );

      await expect(
        otpService.requestNewOtp('booking-uuid-1', 'user-uuid-1'),
      ).rejects.toThrow('Contract must be signed before requesting an OTP');
    });

    it('throws when booking status is not eligible', async () => {
      mockPrisma.booking.findFirst.mockResolvedValue(
        makeBooking({ status: 'CONFIRMED', contractSignedAt: new Date() }),
      );

      await expect(
        otpService.requestNewOtp('booking-uuid-1', 'user-uuid-1'),
      ).rejects.toThrow('OTP cannot be requested for a booking in CONFIRMED status');
    });

    it('throws when booking is not found', async () => {
      mockPrisma.booking.findFirst.mockResolvedValue(null);

      await expect(
        otpService.requestNewOtp('nonexistent', 'user-uuid-1'),
      ).rejects.toThrow('Booking not found');
    });

    it('allows ACTIVE_RENTAL status', async () => {
      const booking = makeBooking({
        status: 'ACTIVE_RENTAL',
        contractSignedAt: new Date(),
      });
      mockPrisma.booking.findFirst.mockResolvedValue(booking);
      mockPrisma.booking.findUnique.mockResolvedValue(booking);

      mockPrisma.$transaction.mockImplementation(async (fn: Function) => {
        const tx = {
          otp: {
            updateMany: vi.fn().mockResolvedValue({ count: 0 }),
            create: vi.fn().mockResolvedValue(makeOtp()),
          },
        };
        return fn(tx);
      });

      const result = await otpService.requestNewOtp('booking-uuid-1', 'user-uuid-1');

      expect(result).toBeDefined();
    });
  });

  // -- verifyAndUseOtp -----------------------------------------------------

  describe('verifyAndUseOtp', () => {
    it('marks OTP as USED with usedAt timestamp when code matches', async () => {
      const otp = makeOtp({ code: '654321' });
      mockPrisma.otp.findFirst.mockResolvedValue(otp);

      const usedOtp = { ...otp, status: 'USED', usedAt: new Date() };
      mockPrisma.otp.update.mockResolvedValue(usedOtp);

      const result = await otpService.verifyAndUseOtp('booking-uuid-1', '654321');

      expect(result.status).toBe('USED');
      expect(result.usedAt).toBeDefined();
      expect(mockPrisma.otp.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'otp-uuid-1' },
          data: expect.objectContaining({
            status: 'USED',
            usedAt: expect.any(Date),
          }),
        }),
      );
    });

    it('throws when OTP code does not match', async () => {
      mockPrisma.otp.findFirst.mockResolvedValue(makeOtp({ code: '654321' }));

      await expect(
        otpService.verifyAndUseOtp('booking-uuid-1', '000000'),
      ).rejects.toThrow('Invalid OTP code');
    });

    it('throws and marks as expired when OTP has expired', async () => {
      const expiredOtp = makeOtp({
        code: '654321',
        expiresAt: new Date(Date.now() - 1000),
      });
      mockPrisma.otp.findFirst.mockResolvedValue(expiredOtp);
      mockPrisma.otp.update.mockResolvedValue({
        ...expiredOtp,
        status: 'EXPIRED',
      });

      await expect(
        otpService.verifyAndUseOtp('booking-uuid-1', '654321'),
      ).rejects.toThrow('OTP has expired');

      expect(mockPrisma.otp.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'otp-uuid-1' },
          data: { status: 'EXPIRED' },
        }),
      );
    });

    it('throws when no active OTP is found', async () => {
      mockPrisma.otp.findFirst.mockResolvedValue(null);

      await expect(
        otpService.verifyAndUseOtp('booking-uuid-1', '123456'),
      ).rejects.toThrow('No active OTP found for this booking');
    });
  });

  // -- getOtpStatus --------------------------------------------------------

  describe('getOtpStatus', () => {
    it('returns active OTP and audit log', async () => {
      const activeOtp = makeOtp();
      const allOtps = [activeOtp, makeOtp({ id: 'otp-uuid-2', status: 'INVALIDATED' })];

      mockPrisma.booking.findUnique.mockResolvedValue(makeBooking());
      mockPrisma.otp.findFirst.mockResolvedValue(activeOtp);
      mockPrisma.otp.findMany.mockResolvedValue(allOtps);

      const result = await otpService.getOtpStatus('booking-uuid-1');

      expect(result.activeOtp).toBeDefined();
      expect(result.activeOtp!.status).toBe('GENERATED');
      expect(result.auditLog).toHaveLength(2);
    });

    it('returns null activeOtp when no active OTP exists', async () => {
      mockPrisma.booking.findUnique.mockResolvedValue(makeBooking());
      mockPrisma.otp.findFirst.mockResolvedValue(null);
      mockPrisma.otp.findMany.mockResolvedValue([
        makeOtp({ status: 'EXPIRED' }),
      ]);

      const result = await otpService.getOtpStatus('booking-uuid-1');

      expect(result.activeOtp).toBeNull();
      expect(result.auditLog).toHaveLength(1);
    });

    it('throws when booking is not found', async () => {
      mockPrisma.booking.findUnique.mockResolvedValue(null);

      await expect(
        otpService.getOtpStatus('nonexistent'),
      ).rejects.toThrow('Booking not found');
    });
  });

  // -- expireOtps ----------------------------------------------------------

  describe('expireOtps', () => {
    it('expires all OTPs past their expiresAt', async () => {
      mockPrisma.otp.updateMany.mockResolvedValue({ count: 5 });

      const result = await otpService.expireOtps();

      expect(result.count).toBe(5);
      expect(mockPrisma.otp.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: { in: ['GENERATED', 'DELIVERED'] },
            expiresAt: { lt: expect.any(Date) },
          }),
          data: { status: 'EXPIRED' },
        }),
      );
    });

    it('returns count of 0 when no OTPs need expiring', async () => {
      mockPrisma.otp.updateMany.mockResolvedValue({ count: 0 });

      const result = await otpService.expireOtps();

      expect(result.count).toBe(0);
    });
  });
});
