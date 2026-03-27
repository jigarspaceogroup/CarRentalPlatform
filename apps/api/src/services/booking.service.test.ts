import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Hoisted mock objects
// ---------------------------------------------------------------------------

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    vehicle: {
      findFirst: vi.fn(),
    },
    branch: {
      findFirst: vi.fn(),
    },
    booking: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    bookingExtra: {
      createMany: vi.fn(),
    },
    bookingStatusHistory: {
      create: vi.fn(),
    },
    bookingNote: {
      create: vi.fn(),
    },
    discountCode: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    discountCodeUsage: {
      count: vi.fn(),
      create: vi.fn(),
    },
    seasonalPricingRule: {
      findMany: vi.fn(),
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
  CancellationInitiator: {
    CUSTOMER: 'CUSTOMER',
    SERVICE_PROVIDER: 'SERVICE_PROVIDER',
  },
  BOOKING_STATUS_TRANSITIONS: {
    PENDING: ['CONFIRMED', 'REJECTED', 'CANCELLED'],
    CONFIRMED: ['VEHICLE_PREPARING', 'CANCELLED'],
    VEHICLE_PREPARING: ['READY_FOR_PICKUP', 'CANCELLED'],
    READY_FOR_PICKUP: ['ACTIVE_RENTAL', 'CANCELLED'],
    ACTIVE_RENTAL: ['RETURN_PENDING'],
    RETURN_PENDING: ['COMPLETED'],
    COMPLETED: [],
    CANCELLED: [],
    REJECTED: [],
  },
  BOOKING_REFERENCE_PREFIX: 'BK',
  DEFAULT_TAX_RATE: 0.15,
  RENTAL_PLANS: ['daily', 'weekly', 'monthly', 'long_term'],
}));

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------

import * as bookingService from './booking.service';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeVehicle(overrides: Record<string, unknown> = {}) {
  return {
    id: 'vehicle-uuid-1',
    make: 'Toyota',
    model: 'Camry',
    year: 2025,
    categoryId: 'cat-uuid-1',
    branchId: 'branch-uuid-1',
    dailyRate: Number(150),
    weeklyRate: Number(900),
    monthlyRate: Number(3200),
    longTermRate: null,
    status: 'AVAILABLE',
    deletedAt: null,
    category: { id: 'cat-uuid-1' },
    ...overrides,
  };
}

function makeBranch(overrides: Record<string, unknown> = {}) {
  return {
    id: 'branch-uuid-1',
    nameEn: 'Main Branch',
    nameAr: 'الفرع الرئيسي',
    isActive: true,
    ...overrides,
  };
}

function makeBooking(overrides: Record<string, unknown> = {}) {
  return {
    id: 'booking-uuid-1',
    referenceNumber: 'BK-20260101-ABCD',
    userId: 'user-uuid-1',
    vehicleId: 'vehicle-uuid-1',
    pickupBranchId: 'branch-uuid-1',
    dropoffBranchId: 'branch-uuid-2',
    discountCodeId: null,
    status: 'PENDING',
    pickupDate: new Date('2026-04-01'),
    dropoffDate: new Date('2026-04-05'),
    rentalPlan: 'daily',
    baseAmount: Number(600),
    extrasAmount: Number(0),
    discountAmount: Number(0),
    taxAmount: Number(90),
    serviceFee: Number(0),
    totalAmount: Number(690),
    loyaltyPointsEarned: 0,
    loyaltyPointsRedeemed: 0,
    cancellationReason: null,
    cancellationInitiatedBy: null,
    contractSignedAt: null,
    termsAcceptedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeDiscountCode(overrides: Record<string, unknown> = {}) {
  return {
    id: 'dc-uuid-1',
    code: 'SAVE10',
    description: '10% off',
    discountType: 'PERCENTAGE',
    discountValue: Number(10),
    maxDiscountAmount: Number(100),
    minBookingAmount: null,
    usageLimit: 100,
    usageCount: 5,
    perUserLimit: 2,
    applicableVehicleIds: [],
    applicableCategoryIds: [],
    startsAt: new Date('2026-01-01'),
    expiresAt: new Date('2026-12-31'),
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

const createBookingInput = {
  vehicleId: 'vehicle-uuid-1',
  pickupBranchId: 'branch-uuid-1',
  dropoffBranchId: 'branch-uuid-2',
  pickupDate: new Date('2026-04-01'),
  dropoffDate: new Date('2026-04-05'),
  rentalPlan: 'daily' as const,
  extras: [],
  termsAccepted: true as const,
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('BookingService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── checkAvailability ──────────────────────────────────────────────

  describe('checkAvailability', () => {
    it('returns available when no conflicts exist', async () => {
      mockPrisma.vehicle.findFirst.mockResolvedValue(makeVehicle());
      mockPrisma.booking.findMany.mockResolvedValue([]);

      const result = await bookingService.checkAvailability(
        'vehicle-uuid-1',
        new Date('2026-04-01'),
        new Date('2026-04-05'),
      );

      expect(result.available).toBe(true);
      expect(result.conflicts).toHaveLength(0);
    });

    it('returns unavailable when conflicts exist', async () => {
      mockPrisma.vehicle.findFirst.mockResolvedValue(makeVehicle());
      mockPrisma.booking.findMany.mockResolvedValue([
        {
          id: 'conflict-1',
          referenceNumber: 'BK-20260401-XXXX',
          pickupDate: new Date('2026-04-02'),
          dropoffDate: new Date('2026-04-07'),
          status: 'CONFIRMED',
        },
      ]);

      const result = await bookingService.checkAvailability(
        'vehicle-uuid-1',
        new Date('2026-04-01'),
        new Date('2026-04-05'),
      );

      expect(result.available).toBe(false);
      expect(result.conflicts).toHaveLength(1);
    });

    it('throws not found when vehicle does not exist', async () => {
      mockPrisma.vehicle.findFirst.mockResolvedValue(null);

      await expect(
        bookingService.checkAvailability(
          'nonexistent',
          new Date('2026-04-01'),
          new Date('2026-04-05'),
        ),
      ).rejects.toThrow('Vehicle not found');
    });

    it('returns unavailable when vehicle status is not AVAILABLE', async () => {
      mockPrisma.vehicle.findFirst.mockResolvedValue(
        makeVehicle({ status: 'IN_MAINTENANCE' }),
      );

      const result = await bookingService.checkAvailability(
        'vehicle-uuid-1',
        new Date('2026-04-01'),
        new Date('2026-04-05'),
      );

      expect(result.available).toBe(false);
    });
  });

  // ── validateDiscount ──────────────────────────────────────────────

  describe('validateDiscount', () => {
    it('returns valid discount for percentage type', async () => {
      mockPrisma.discountCode.findUnique.mockResolvedValue(makeDiscountCode());
      mockPrisma.discountCodeUsage.count.mockResolvedValue(0);

      const result = await bookingService.validateDiscount(
        'SAVE10',
        'user-uuid-1',
        'vehicle-uuid-1',
        'cat-uuid-1',
        600,
      );

      expect(result.valid).toBe(true);
      expect(result.discountAmount).toBe(60); // 10% of 600
      expect(result.discountCodeId).toBe('dc-uuid-1');
    });

    it('caps percentage discount at maxDiscountAmount', async () => {
      mockPrisma.discountCode.findUnique.mockResolvedValue(
        makeDiscountCode({ discountValue: Number(50), maxDiscountAmount: Number(100) }),
      );
      mockPrisma.discountCodeUsage.count.mockResolvedValue(0);

      const result = await bookingService.validateDiscount(
        'SAVE10',
        'user-uuid-1',
        'vehicle-uuid-1',
        'cat-uuid-1',
        600,
      );

      // 50% of 600 = 300, but capped at 100
      expect(result.discountAmount).toBe(100);
    });

    it('returns valid discount for fixed amount type', async () => {
      mockPrisma.discountCode.findUnique.mockResolvedValue(
        makeDiscountCode({
          discountType: 'FIXED_AMOUNT',
          discountValue: Number(50),
          maxDiscountAmount: null,
        }),
      );
      mockPrisma.discountCodeUsage.count.mockResolvedValue(0);

      const result = await bookingService.validateDiscount(
        'FLAT50',
        'user-uuid-1',
        'vehicle-uuid-1',
        'cat-uuid-1',
        600,
      );

      expect(result.discountAmount).toBe(50);
    });

    it('throws when discount code not found', async () => {
      mockPrisma.discountCode.findUnique.mockResolvedValue(null);

      await expect(
        bookingService.validateDiscount('INVALID', 'user-uuid-1', 'v1', 'c1', 100),
      ).rejects.toThrow('Discount code not found');
    });

    it('throws when discount code is not active', async () => {
      mockPrisma.discountCode.findUnique.mockResolvedValue(
        makeDiscountCode({ isActive: false }),
      );

      await expect(
        bookingService.validateDiscount('SAVE10', 'user-uuid-1', 'v1', 'c1', 100),
      ).rejects.toThrow('Discount code is not active');
    });

    it('throws when discount code has expired', async () => {
      mockPrisma.discountCode.findUnique.mockResolvedValue(
        makeDiscountCode({ expiresAt: new Date('2020-01-01') }),
      );

      await expect(
        bookingService.validateDiscount('SAVE10', 'user-uuid-1', 'v1', 'c1', 100),
      ).rejects.toThrow('Discount code has expired');
    });

    it('throws when global usage limit reached', async () => {
      mockPrisma.discountCode.findUnique.mockResolvedValue(
        makeDiscountCode({ usageLimit: 5, usageCount: 5 }),
      );

      await expect(
        bookingService.validateDiscount('SAVE10', 'user-uuid-1', 'v1', 'c1', 100),
      ).rejects.toThrow('Discount code usage limit has been reached');
    });

    it('throws when per-user limit reached', async () => {
      mockPrisma.discountCode.findUnique.mockResolvedValue(
        makeDiscountCode({ perUserLimit: 1 }),
      );
      mockPrisma.discountCodeUsage.count.mockResolvedValue(1);

      await expect(
        bookingService.validateDiscount('SAVE10', 'user-uuid-1', 'v1', 'c1', 100),
      ).rejects.toThrow('You have already used this discount code the maximum number of times');
    });

    it('throws when minimum booking amount not met', async () => {
      mockPrisma.discountCode.findUnique.mockResolvedValue(
        makeDiscountCode({ minBookingAmount: Number(500) }),
      );
      mockPrisma.discountCodeUsage.count.mockResolvedValue(0);

      await expect(
        bookingService.validateDiscount('SAVE10', 'user-uuid-1', 'v1', 'c1', 100),
      ).rejects.toThrow('Minimum booking amount of 500 required');
    });

    it('throws when vehicle is not in applicable list', async () => {
      mockPrisma.discountCode.findUnique.mockResolvedValue(
        makeDiscountCode({ applicableVehicleIds: ['other-vehicle-uuid'] }),
      );
      mockPrisma.discountCodeUsage.count.mockResolvedValue(0);

      await expect(
        bookingService.validateDiscount('SAVE10', 'user-uuid-1', 'vehicle-uuid-1', 'c1', 600),
      ).rejects.toThrow('Discount code is not applicable to this vehicle');
    });

    it('throws when category is not in applicable list', async () => {
      mockPrisma.discountCode.findUnique.mockResolvedValue(
        makeDiscountCode({ applicableCategoryIds: ['other-cat-uuid'] }),
      );
      mockPrisma.discountCodeUsage.count.mockResolvedValue(0);

      await expect(
        bookingService.validateDiscount('SAVE10', 'user-uuid-1', 'v1', 'cat-uuid-1', 600),
      ).rejects.toThrow('Discount code is not applicable to this vehicle category');
    });
  });

  // ── createBooking ─────────────────────────────────────────────────

  describe('createBooking', () => {
    it('creates a booking successfully', async () => {
      const vehicle = makeVehicle();
      const booking = makeBooking();

      mockPrisma.vehicle.findFirst.mockResolvedValue(vehicle);
      mockPrisma.branch.findFirst
        .mockResolvedValueOnce(makeBranch({ id: 'branch-uuid-1' }))
        .mockResolvedValueOnce(makeBranch({ id: 'branch-uuid-2' }));
      // checkAvailability internal calls
      mockPrisma.booking.findMany.mockResolvedValue([]);
      mockPrisma.seasonalPricingRule.findMany.mockResolvedValue([]);
      mockPrisma.booking.findUnique
        .mockResolvedValueOnce(null) // reference number uniqueness check
        .mockResolvedValueOnce(booking); // final return

      mockPrisma.$transaction.mockImplementation(async (fn: Function) => {
        const tx = {
          booking: {
            create: vi.fn().mockResolvedValue(booking),
          },
          bookingExtra: {
            createMany: vi.fn().mockResolvedValue({ count: 0 }),
          },
          bookingStatusHistory: {
            create: vi.fn().mockResolvedValue({}),
          },
          discountCodeUsage: {
            create: vi.fn().mockResolvedValue({}),
          },
          discountCode: {
            update: vi.fn().mockResolvedValue({}),
          },
        };
        return fn(tx);
      });

      const result = await bookingService.createBooking('user-uuid-1', createBookingInput);

      expect(result).toBeDefined();
      expect(mockPrisma.vehicle.findFirst).toHaveBeenCalled();
      expect(mockPrisma.branch.findFirst).toHaveBeenCalledTimes(2);
    });

    it('throws when vehicle is not found', async () => {
      mockPrisma.vehicle.findFirst.mockResolvedValue(null);

      await expect(
        bookingService.createBooking('user-uuid-1', createBookingInput),
      ).rejects.toThrow('Vehicle not found');
    });

    it('throws when vehicle is not available', async () => {
      mockPrisma.vehicle.findFirst.mockResolvedValue(
        makeVehicle({ status: 'IN_MAINTENANCE' }),
      );

      await expect(
        bookingService.createBooking('user-uuid-1', createBookingInput),
      ).rejects.toThrow('Vehicle is not available for booking');
    });

    it('throws when pickup branch is not active', async () => {
      mockPrisma.vehicle.findFirst.mockResolvedValue(makeVehicle());
      mockPrisma.branch.findFirst.mockResolvedValueOnce(null);

      await expect(
        bookingService.createBooking('user-uuid-1', createBookingInput),
      ).rejects.toThrow('Pickup branch not found or is not active');
    });

    it('throws when dates conflict with existing booking', async () => {
      mockPrisma.vehicle.findFirst
        .mockResolvedValueOnce(makeVehicle()) // createBooking vehicle check
        .mockResolvedValueOnce(makeVehicle()); // checkAvailability vehicle check
      mockPrisma.branch.findFirst
        .mockResolvedValueOnce(makeBranch())
        .mockResolvedValueOnce(makeBranch());
      mockPrisma.booking.findMany.mockResolvedValue([
        { id: 'conflict-1', pickupDate: new Date('2026-04-02'), dropoffDate: new Date('2026-04-07') },
      ]);

      await expect(
        bookingService.createBooking('user-uuid-1', createBookingInput),
      ).rejects.toThrow('Vehicle is not available for the selected dates');
    });
  });

  // ── cancelBooking ─────────────────────────────────────────────────

  describe('cancelBooking', () => {
    it('cancels a PENDING booking successfully', async () => {
      const booking = makeBooking({ status: 'PENDING' });
      mockPrisma.booking.findFirst.mockResolvedValue(booking);
      mockPrisma.$transaction.mockResolvedValue([
        { ...booking, status: 'CANCELLED', cancellationInitiatedBy: 'CUSTOMER' },
        {},
      ]);

      const result = await bookingService.cancelBooking(
        'booking-uuid-1',
        'user-uuid-1',
        'Changed plans',
      );

      expect(result.status).toBe('CANCELLED');
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('cancels a CONFIRMED booking successfully', async () => {
      const booking = makeBooking({ status: 'CONFIRMED' });
      mockPrisma.booking.findFirst.mockResolvedValue(booking);
      mockPrisma.$transaction.mockResolvedValue([
        { ...booking, status: 'CANCELLED' },
        {},
      ]);

      const result = await bookingService.cancelBooking(
        'booking-uuid-1',
        'user-uuid-1',
      );

      expect(result.status).toBe('CANCELLED');
    });

    it('throws when booking is not found', async () => {
      mockPrisma.booking.findFirst.mockResolvedValue(null);

      await expect(
        bookingService.cancelBooking('nonexistent', 'user-uuid-1'),
      ).rejects.toThrow('Booking not found');
    });

    it('throws when booking is in ACTIVE_RENTAL status', async () => {
      mockPrisma.booking.findFirst.mockResolvedValue(
        makeBooking({ status: 'ACTIVE_RENTAL' }),
      );

      await expect(
        bookingService.cancelBooking('booking-uuid-1', 'user-uuid-1'),
      ).rejects.toThrow('Booking cannot be cancelled in its current status (ACTIVE_RENTAL)');
    });

    it('throws when booking is COMPLETED', async () => {
      mockPrisma.booking.findFirst.mockResolvedValue(
        makeBooking({ status: 'COMPLETED' }),
      );

      await expect(
        bookingService.cancelBooking('booking-uuid-1', 'user-uuid-1'),
      ).rejects.toThrow('Booking cannot be cancelled in its current status (COMPLETED)');
    });
  });

  // ── acceptBooking ─────────────────────────────────────────────────

  describe('acceptBooking', () => {
    it('accepts a PENDING booking', async () => {
      const booking = makeBooking({ status: 'PENDING' });
      mockPrisma.booking.findUnique
        .mockResolvedValueOnce(booking) // initial lookup
        .mockResolvedValueOnce({ ...booking, status: 'CONFIRMED' }); // return after update
      mockPrisma.$transaction.mockResolvedValue([]);

      const result = await bookingService.acceptBooking(
        'booking-uuid-1',
        'staff-uuid-1',
        'Confirmed with customer',
      );

      expect(result!.status).toBe('CONFIRMED');
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('throws when booking is not PENDING', async () => {
      mockPrisma.booking.findUnique.mockResolvedValue(
        makeBooking({ status: 'CONFIRMED' }),
      );

      await expect(
        bookingService.acceptBooking('booking-uuid-1', 'staff-uuid-1'),
      ).rejects.toThrow('Booking cannot be accepted in its current status (CONFIRMED)');
    });

    it('throws when booking not found', async () => {
      mockPrisma.booking.findUnique.mockResolvedValue(null);

      await expect(
        bookingService.acceptBooking('nonexistent', 'staff-uuid-1'),
      ).rejects.toThrow('Booking not found');
    });
  });

  // ── rejectBooking ─────────────────────────────────────────────────

  describe('rejectBooking', () => {
    it('rejects a PENDING booking', async () => {
      const booking = makeBooking({ status: 'PENDING' });
      mockPrisma.booking.findUnique
        .mockResolvedValueOnce(booking)
        .mockResolvedValueOnce({ ...booking, status: 'REJECTED' });
      mockPrisma.$transaction.mockResolvedValue([]);

      const result = await bookingService.rejectBooking(
        'booking-uuid-1',
        'staff-uuid-1',
        'Vehicle already allocated',
      );

      expect(result!.status).toBe('REJECTED');
    });

    it('throws when booking is not PENDING', async () => {
      mockPrisma.booking.findUnique.mockResolvedValue(
        makeBooking({ status: 'ACTIVE_RENTAL' }),
      );

      await expect(
        bookingService.rejectBooking('booking-uuid-1', 'staff-uuid-1', 'reason'),
      ).rejects.toThrow('Booking cannot be rejected in its current status (ACTIVE_RENTAL)');
    });
  });

  // ── advanceStatus ─────────────────────────────────────────────────

  describe('advanceStatus', () => {
    it('transitions from CONFIRMED to VEHICLE_PREPARING', async () => {
      const booking = makeBooking({ status: 'CONFIRMED' });
      mockPrisma.booking.findUnique
        .mockResolvedValueOnce(booking)
        .mockResolvedValueOnce({ ...booking, status: 'VEHICLE_PREPARING' });
      mockPrisma.$transaction.mockResolvedValue([]);

      const result = await bookingService.advanceStatus(
        'booking-uuid-1',
        'staff-uuid-1',
        'VEHICLE_PREPARING',
      );

      expect(result!.status).toBe('VEHICLE_PREPARING');
    });

    it('transitions from ACTIVE_RENTAL to RETURN_PENDING', async () => {
      const booking = makeBooking({ status: 'ACTIVE_RENTAL' });
      mockPrisma.booking.findUnique
        .mockResolvedValueOnce(booking)
        .mockResolvedValueOnce({ ...booking, status: 'RETURN_PENDING' });
      mockPrisma.$transaction.mockResolvedValue([]);

      const result = await bookingService.advanceStatus(
        'booking-uuid-1',
        'staff-uuid-1',
        'RETURN_PENDING',
      );

      expect(result!.status).toBe('RETURN_PENDING');
    });

    it('throws for invalid transition (PENDING to ACTIVE_RENTAL)', async () => {
      mockPrisma.booking.findUnique.mockResolvedValue(
        makeBooking({ status: 'PENDING' }),
      );

      await expect(
        bookingService.advanceStatus('booking-uuid-1', 'staff-uuid-1', 'ACTIVE_RENTAL'),
      ).rejects.toThrow('Cannot transition from PENDING to ACTIVE_RENTAL');
    });

    it('throws for invalid transition (COMPLETED to any)', async () => {
      mockPrisma.booking.findUnique.mockResolvedValue(
        makeBooking({ status: 'COMPLETED' }),
      );

      await expect(
        bookingService.advanceStatus('booking-uuid-1', 'staff-uuid-1', 'PENDING'),
      ).rejects.toThrow('Cannot transition from COMPLETED to PENDING');
    });

    it('throws when booking not found', async () => {
      mockPrisma.booking.findUnique.mockResolvedValue(null);

      await expect(
        bookingService.advanceStatus('nonexistent', 'staff-uuid-1', 'CONFIRMED'),
      ).rejects.toThrow('Booking not found');
    });
  });

  // ── adminCancelBooking ────────────────────────────────────────────

  describe('adminCancelBooking', () => {
    it('cancels a CONFIRMED booking as admin', async () => {
      const booking = makeBooking({ status: 'CONFIRMED' });
      mockPrisma.booking.findUnique
        .mockResolvedValueOnce(booking)
        .mockResolvedValueOnce({ ...booking, status: 'CANCELLED' });
      mockPrisma.$transaction.mockResolvedValue([]);

      const result = await bookingService.adminCancelBooking(
        'booking-uuid-1',
        'staff-uuid-1',
        'Customer no-show',
      );

      expect(result!.status).toBe('CANCELLED');
    });

    it('throws when booking is COMPLETED', async () => {
      mockPrisma.booking.findUnique.mockResolvedValue(
        makeBooking({ status: 'COMPLETED' }),
      );

      await expect(
        bookingService.adminCancelBooking('booking-uuid-1', 'staff-uuid-1'),
      ).rejects.toThrow('Booking cannot be cancelled in its current status (COMPLETED)');
    });

    it('throws when booking is already CANCELLED', async () => {
      mockPrisma.booking.findUnique.mockResolvedValue(
        makeBooking({ status: 'CANCELLED' }),
      );

      await expect(
        bookingService.adminCancelBooking('booking-uuid-1', 'staff-uuid-1'),
      ).rejects.toThrow('Booking cannot be cancelled in its current status (CANCELLED)');
    });
  });

  // ── listUserBookings ──────────────────────────────────────────────

  describe('listUserBookings', () => {
    it('returns paginated bookings for a user', async () => {
      const bookings = [makeBooking()];
      mockPrisma.booking.findMany.mockResolvedValue(bookings);
      mockPrisma.booking.count.mockResolvedValue(1);

      const result = await bookingService.listUserBookings('user-uuid-1', {
        page: 1,
        limit: 20,
      });

      expect(result.bookings).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(mockPrisma.booking.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-uuid-1' },
          skip: 0,
          take: 20,
        }),
      );
    });

    it('filters by status', async () => {
      mockPrisma.booking.findMany.mockResolvedValue([]);
      mockPrisma.booking.count.mockResolvedValue(0);

      await bookingService.listUserBookings('user-uuid-1', {
        page: 1,
        limit: 20,
        status: 'CONFIRMED',
      });

      expect(mockPrisma.booking.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-uuid-1', status: 'CONFIRMED' },
        }),
      );
    });
  });

  // ── getBookingById ────────────────────────────────────────────────

  describe('getBookingById', () => {
    it('returns booking when found for user', async () => {
      const booking = makeBooking();
      mockPrisma.booking.findFirst.mockResolvedValue(booking);

      const result = await bookingService.getBookingById('booking-uuid-1', 'user-uuid-1');

      expect(result.id).toBe('booking-uuid-1');
      expect(mockPrisma.booking.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'booking-uuid-1', userId: 'user-uuid-1' },
        }),
      );
    });

    it('throws not found when booking does not exist', async () => {
      mockPrisma.booking.findFirst.mockResolvedValue(null);

      await expect(
        bookingService.getBookingById('nonexistent', 'user-uuid-1'),
      ).rejects.toThrow('Booking not found');
    });
  });

  // ── addNote ───────────────────────────────────────────────────────

  describe('addNote', () => {
    it('creates a note for an existing booking', async () => {
      mockPrisma.booking.findUnique.mockResolvedValue(makeBooking());
      mockPrisma.bookingNote.create.mockResolvedValue({
        id: 'note-uuid-1',
        bookingId: 'booking-uuid-1',
        staffId: 'staff-uuid-1',
        content: 'Test note',
        createdAt: new Date(),
        staff: { id: 'staff-uuid-1', fullName: 'Admin User' },
      });

      const result = await bookingService.addNote(
        'booking-uuid-1',
        'staff-uuid-1',
        'Test note',
      );

      expect(result.content).toBe('Test note');
      expect(result.staffId).toBe('staff-uuid-1');
    });

    it('throws when booking not found', async () => {
      mockPrisma.booking.findUnique.mockResolvedValue(null);

      await expect(
        bookingService.addNote('nonexistent', 'staff-uuid-1', 'note'),
      ).rejects.toThrow('Booking not found');
    });
  });

  // ── exportBookings ────────────────────────────────────────────────

  describe('exportBookings', () => {
    it('returns CSV with headers and data rows', async () => {
      mockPrisma.booking.findMany.mockResolvedValue([
        {
          ...makeBooking(),
          user: { fullName: 'John Doe', email: 'john@test.com' },
          vehicle: { make: 'Toyota', model: 'Camry', year: 2025, licensePlate: 'ABC-1234' },
        },
      ]);

      const csv = await bookingService.exportBookings({});

      expect(csv).toContain('Reference Number');
      expect(csv).toContain('Customer Name');
      expect(csv).toContain('BK-20260101-ABCD');
      expect(csv).toContain('John Doe');
      expect(csv).toContain('Toyota Camry 2025');
    });

    it('returns only headers when no bookings', async () => {
      mockPrisma.booking.findMany.mockResolvedValue([]);

      const csv = await bookingService.exportBookings({});

      expect(csv).toContain('Reference Number');
      const lines = csv.split('\n');
      expect(lines).toHaveLength(1); // headers only
    });
  });

  // ── getPriceBreakdown ─────────────────────────────────────────────

  describe('getPriceBreakdown', () => {
    it('returns pricing breakdown for a booking', async () => {
      mockPrisma.booking.findFirst.mockResolvedValue({
        id: 'booking-uuid-1',
        referenceNumber: 'BK-20260101-ABCD',
        rentalPlan: 'daily',
        baseAmount: Number(600),
        extrasAmount: Number(50),
        discountAmount: Number(60),
        taxAmount: Number(88.5),
        serviceFee: Number(0),
        totalAmount: Number(678.5),
        extras: [],
        discountCode: null,
      });

      const result = await bookingService.getPriceBreakdown('booking-uuid-1', 'user-uuid-1');

      expect(result.id).toBe('booking-uuid-1');
      expect(Number(result.baseAmount)).toBe(600);
    });

    it('throws when booking not found', async () => {
      mockPrisma.booking.findFirst.mockResolvedValue(null);

      await expect(
        bookingService.getPriceBreakdown('nonexistent', 'user-uuid-1'),
      ).rejects.toThrow('Booking not found');
    });
  });
});
