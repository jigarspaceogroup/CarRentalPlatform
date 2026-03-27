import { Prisma } from '@prisma/client';
import { prisma } from '../db/client';
import { AppError } from '../utils/app-error';
import {
  BookingStatus,
  BOOKING_STATUS_TRANSITIONS,
  BOOKING_REFERENCE_PREFIX,
  DEFAULT_TAX_RATE,
} from '@crp/shared';
import type {
  CreateBookingInput,
  ListBookingsQuery,
  AdminListBookingsQuery,
  ExportBookingsQuery,
} from '../validation/booking.schema';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Booking statuses that are neither terminal nor should overlap */
const ACTIVE_BOOKING_STATUSES: BookingStatus[] = [
  BookingStatus.PENDING,
  BookingStatus.CONFIRMED,
  BookingStatus.VEHICLE_PREPARING,
  BookingStatus.READY_FOR_PICKUP,
  BookingStatus.ACTIVE_RENTAL,
  BookingStatus.RETURN_PENDING,
];

/** Customer-cancellable statuses */
const CUSTOMER_CANCELLABLE_STATUSES: BookingStatus[] = [
  BookingStatus.PENDING,
  BookingStatus.CONFIRMED,
];

/** Admin-cancellable statuses */
const ADMIN_CANCELLABLE_STATUSES: BookingStatus[] = [
  BookingStatus.PENDING,
  BookingStatus.CONFIRMED,
  BookingStatus.VEHICLE_PREPARING,
  BookingStatus.READY_FOR_PICKUP,
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Generate a unique booking reference number.
 * Format: BK-YYYYMMDD-XXXX (random 4-char alphanumeric)
 */
function generateReferenceNumber(): string {
  const now = new Date();
  const datePart = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('');
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let random = '';
  for (let i = 0; i < 4; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${BOOKING_REFERENCE_PREFIX}-${datePart}-${random}`;
}

/**
 * Calculate the number of rental units from dates and plan type.
 */
function calculateRentalUnits(
  pickupDate: Date,
  dropoffDate: Date,
  rentalPlan: string,
): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  const totalDays = Math.ceil(
    (dropoffDate.getTime() - pickupDate.getTime()) / msPerDay,
  );

  switch (rentalPlan) {
    case 'weekly':
      return Math.ceil(totalDays / 7);
    case 'monthly':
      return Math.ceil(totalDays / 30);
    case 'long_term':
      return Math.ceil(totalDays / 30);
    case 'daily':
    default:
      return Math.max(totalDays, 1);
  }
}

/**
 * Pick the rate from vehicle based on rental plan.
 * Falls back to dailyRate if the plan-specific rate is not set.
 */
function pickRate(
  vehicle: {
    dailyRate: Prisma.Decimal;
    weeklyRate: Prisma.Decimal | null;
    monthlyRate: Prisma.Decimal | null;
    longTermRate: Prisma.Decimal | null;
  },
  rentalPlan: string,
): number {
  switch (rentalPlan) {
    case 'weekly':
      return vehicle.weeklyRate ? Number(vehicle.weeklyRate) : Number(vehicle.dailyRate) * 7;
    case 'monthly':
      return vehicle.monthlyRate ? Number(vehicle.monthlyRate) : Number(vehicle.dailyRate) * 30;
    case 'long_term':
      return vehicle.longTermRate ? Number(vehicle.longTermRate) : Number(vehicle.dailyRate) * 30;
    case 'daily':
    default:
      return Number(vehicle.dailyRate);
  }
}

/**
 * Round a number to 2 decimal places.
 */
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// ---------------------------------------------------------------------------
// Customer services
// ---------------------------------------------------------------------------

/**
 * Check whether a vehicle is available for the requested date range.
 */
export async function checkAvailability(
  vehicleId: string,
  startDate: Date,
  endDate: Date,
) {
  const vehicle = await prisma.vehicle.findFirst({
    where: { id: vehicleId, deletedAt: null },
    select: { id: true, status: true },
  });

  if (!vehicle) {
    throw AppError.notFound('Vehicle not found');
  }

  if (vehicle.status !== 'AVAILABLE') {
    return { available: false, conflicts: [], reason: 'Vehicle is not available' };
  }

  const conflicts = await prisma.booking.findMany({
    where: {
      vehicleId,
      status: { in: ACTIVE_BOOKING_STATUSES },
      pickupDate: { lt: endDate },
      dropoffDate: { gt: startDate },
    },
    select: {
      id: true,
      referenceNumber: true,
      pickupDate: true,
      dropoffDate: true,
      status: true,
    },
  });

  return {
    available: conflicts.length === 0,
    conflicts,
  };
}

/**
 * Validate a discount code and calculate the discount amount.
 */
export async function validateDiscount(
  code: string,
  userId: string,
  vehicleId: string,
  categoryId: string,
  bookingAmount: number,
) {
  const discountCode = await prisma.discountCode.findUnique({
    where: { code },
  });

  if (!discountCode) {
    throw AppError.notFound('Discount code not found');
  }

  if (!discountCode.isActive) {
    throw AppError.badRequest('Discount code is not active');
  }

  const now = new Date();
  if (now < discountCode.startsAt) {
    throw AppError.badRequest('Discount code is not yet valid');
  }
  if (now > discountCode.expiresAt) {
    throw AppError.badRequest('Discount code has expired');
  }

  // Check global usage limit
  if (discountCode.usageLimit !== null && discountCode.usageCount >= discountCode.usageLimit) {
    throw AppError.badRequest('Discount code usage limit has been reached');
  }

  // Check per-user usage limit
  if (discountCode.perUserLimit !== null) {
    const userUsageCount = await prisma.discountCodeUsage.count({
      where: { discountCodeId: discountCode.id, userId },
    });
    if (userUsageCount >= discountCode.perUserLimit) {
      throw AppError.badRequest('You have already used this discount code the maximum number of times');
    }
  }

  // Check applicable vehicles (empty array = all vehicles)
  if (
    discountCode.applicableVehicleIds.length > 0 &&
    !discountCode.applicableVehicleIds.includes(vehicleId)
  ) {
    throw AppError.badRequest('Discount code is not applicable to this vehicle');
  }

  // Check applicable categories (empty array = all categories)
  if (
    discountCode.applicableCategoryIds.length > 0 &&
    !discountCode.applicableCategoryIds.includes(categoryId)
  ) {
    throw AppError.badRequest('Discount code is not applicable to this vehicle category');
  }

  // Check minimum booking amount
  if (
    discountCode.minBookingAmount !== null &&
    bookingAmount < Number(discountCode.minBookingAmount)
  ) {
    throw AppError.badRequest(
      `Minimum booking amount of ${Number(discountCode.minBookingAmount)} required for this discount code`,
    );
  }

  // Calculate discount
  let discountAmount: number;
  if (discountCode.discountType === 'PERCENTAGE') {
    discountAmount = round2(bookingAmount * Number(discountCode.discountValue) / 100);
    if (
      discountCode.maxDiscountAmount !== null &&
      discountAmount > Number(discountCode.maxDiscountAmount)
    ) {
      discountAmount = Number(discountCode.maxDiscountAmount);
    }
  } else {
    // FIXED_AMOUNT
    discountAmount = Number(discountCode.discountValue);
  }

  // Discount cannot exceed booking amount
  discountAmount = Math.min(discountAmount, bookingAmount);

  return {
    valid: true,
    discountAmount: round2(discountAmount),
    discountCodeId: discountCode.id,
  };
}

/**
 * Create a new booking.
 */
export async function createBooking(userId: string, data: CreateBookingInput) {
  // 1. Validate vehicle
  const vehicle = await prisma.vehicle.findFirst({
    where: { id: data.vehicleId, deletedAt: null },
    include: {
      category: { select: { id: true } },
    },
  });

  if (!vehicle) {
    throw AppError.notFound('Vehicle not found');
  }

  if (vehicle.status !== 'AVAILABLE') {
    throw AppError.badRequest('Vehicle is not available for booking');
  }

  // 2. Validate branches
  const [pickupBranch, dropoffBranch] = await Promise.all([
    prisma.branch.findFirst({
      where: { id: data.pickupBranchId, isActive: true },
    }),
    prisma.branch.findFirst({
      where: { id: data.dropoffBranchId, isActive: true },
    }),
  ]);

  if (!pickupBranch) {
    throw AppError.badRequest('Pickup branch not found or is not active');
  }
  if (!dropoffBranch) {
    throw AppError.badRequest('Dropoff branch not found or is not active');
  }

  // 3. Check for date conflicts
  const availability = await checkAvailability(data.vehicleId, data.pickupDate, data.dropoffDate);
  if (!availability.available) {
    throw AppError.conflict('Vehicle is not available for the selected dates');
  }

  // 4. Calculate pricing
  const rentalPlan = data.rentalPlan ?? 'daily';
  const rentalUnits = calculateRentalUnits(data.pickupDate, data.dropoffDate, rentalPlan);
  let rate = pickRate(vehicle, rentalPlan);

  // Check seasonal pricing rules
  const seasonalRules = await prisma.seasonalPricingRule.findMany({
    where: {
      isActive: true,
      OR: [
        { vehicleId: data.vehicleId },
        { categoryId: vehicle.categoryId },
      ],
      startDate: { lte: data.dropoffDate },
      endDate: { gte: data.pickupDate },
    },
    orderBy: { createdAt: 'desc' },
  });

  const topRule = seasonalRules[0];
  if (topRule) {
    if (topRule.ruleType === 'MULTIPLIER') {
      rate = round2(rate * Number(topRule.value));
    } else if (topRule.ruleType === 'FIXED_OVERRIDE') {
      rate = Number(topRule.value);
    }
  }

  const baseAmount = round2(rate * rentalUnits);

  // Calculate extras
  const extrasAmount = round2(
    data.extras.reduce((sum, extra) => sum + extra.price * extra.quantity, 0),
  );

  // Validate and apply discount
  let discountAmount = 0;
  let discountCodeId: string | null = null;
  if (data.discountCode) {
    const discountResult = await validateDiscount(
      data.discountCode,
      userId,
      data.vehicleId,
      vehicle.categoryId,
      baseAmount + extrasAmount,
    );
    discountAmount = discountResult.discountAmount;
    discountCodeId = discountResult.discountCodeId;
  }

  // Tax and totals
  const taxableAmount = round2(baseAmount + extrasAmount - discountAmount);
  const taxAmount = round2(taxableAmount * DEFAULT_TAX_RATE);
  const serviceFee = 0;
  const totalAmount = round2(taxableAmount + taxAmount + serviceFee);

  // 5. Generate reference number (retry on collision)
  let referenceNumber = generateReferenceNumber();
  let attempts = 0;
  while (attempts < 5) {
    const existing = await prisma.booking.findUnique({
      where: { referenceNumber },
      select: { id: true },
    });
    if (!existing) break;
    referenceNumber = generateReferenceNumber();
    attempts++;
  }

  // 6. Create booking in a transaction
  const booking = await prisma.$transaction(async (tx) => {
    const newBooking = await tx.booking.create({
      data: {
        referenceNumber,
        userId,
        vehicleId: data.vehicleId,
        pickupBranchId: data.pickupBranchId,
        dropoffBranchId: data.dropoffBranchId,
        discountCodeId,
        status: 'PENDING',
        pickupDate: data.pickupDate,
        dropoffDate: data.dropoffDate,
        rentalPlan,
        baseAmount,
        extrasAmount,
        discountAmount,
        taxAmount,
        serviceFee,
        totalAmount,
        termsAcceptedAt: new Date(),
      },
    });

    // Create extras
    if (data.extras.length > 0) {
      await tx.bookingExtra.createMany({
        data: data.extras.map((extra) => ({
          bookingId: newBooking.id,
          nameEn: extra.nameEn,
          nameAr: extra.nameAr,
          price: extra.price,
          quantity: extra.quantity,
        })),
      });
    }

    // Create initial status history entry
    await tx.bookingStatusHistory.create({
      data: {
        bookingId: newBooking.id,
        fromStatus: null,
        toStatus: 'PENDING',
        changedByUserId: userId,
      },
    });

    // Record discount code usage and increment counter
    if (discountCodeId) {
      await tx.discountCodeUsage.create({
        data: {
          discountCodeId,
          userId,
          bookingId: newBooking.id,
          discountApplied: discountAmount,
        },
      });
      await tx.discountCode.update({
        where: { id: discountCodeId },
        data: { usageCount: { increment: 1 } },
      });
    }

    return newBooking;
  });

  // Return the full booking with relations
  return prisma.booking.findUnique({
    where: { id: booking.id },
    include: {
      vehicle: {
        select: {
          id: true,
          make: true,
          model: true,
          year: true,
          images: { orderBy: { sortOrder: 'asc' }, take: 1 },
        },
      },
      pickupBranch: { select: { id: true, nameEn: true, nameAr: true } },
      dropoffBranch: { select: { id: true, nameEn: true, nameAr: true } },
      extras: true,
      statusHistory: { orderBy: { createdAt: 'desc' } },
    },
  });
}

/**
 * List bookings for a customer user.
 */
export async function listUserBookings(userId: string, filters: ListBookingsQuery) {
  const { page, limit, status } = filters;
  const skip = (page - 1) * limit;

  const where: Prisma.BookingWhereInput = { userId };
  if (status) {
    where.status = status;
  }

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        vehicle: {
          select: {
            id: true,
            make: true,
            model: true,
            year: true,
            images: { orderBy: { sortOrder: 'asc' }, take: 1 },
          },
        },
        pickupBranch: { select: { id: true, nameEn: true, nameAr: true } },
        dropoffBranch: { select: { id: true, nameEn: true, nameAr: true } },
        payments: {
          select: { id: true, amount: true, status: true, method: true },
        },
      },
    }),
    prisma.booking.count({ where }),
  ]);

  return { bookings, total, page, limit };
}

/**
 * Get a single booking by ID.
 * If userId is provided, verifies ownership (customer access).
 */
export async function getBookingById(id: string, userId?: string) {
  const where: Prisma.BookingWhereInput = { id };
  if (userId) {
    where.userId = userId;
  }

  const booking = await prisma.booking.findFirst({
    where,
    include: {
      user: {
        select: { id: true, fullName: true, email: true, phone: true },
      },
      vehicle: {
        select: {
          id: true,
          make: true,
          model: true,
          year: true,
          licensePlate: true,
          images: { orderBy: { sortOrder: 'asc' }, take: 1 },
        },
      },
      pickupBranch: {
        select: { id: true, nameEn: true, nameAr: true, addressEn: true, addressAr: true },
      },
      dropoffBranch: {
        select: { id: true, nameEn: true, nameAr: true, addressEn: true, addressAr: true },
      },
      extras: true,
      statusHistory: { orderBy: { createdAt: 'desc' } },
      payments: true,
      discountCode: {
        select: { id: true, code: true, discountType: true, discountValue: true },
      },
    },
  });

  if (!booking) {
    throw AppError.notFound('Booking not found');
  }

  return booking;
}

/**
 * Customer cancels their own booking.
 */
export async function cancelBooking(bookingId: string, userId: string, reason?: string) {
  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, userId },
  });

  if (!booking) {
    throw AppError.notFound('Booking not found');
  }

  const currentStatus = booking.status as BookingStatus;

  if (!CUSTOMER_CANCELLABLE_STATUSES.includes(currentStatus)) {
    throw AppError.badRequest(
      `Booking cannot be cancelled in its current status (${currentStatus})`,
    );
  }

  const [updatedBooking] = await prisma.$transaction([
    prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'CANCELLED',
        cancellationReason: reason ?? null,
        cancellationInitiatedBy: 'CUSTOMER',
      },
    }),
    prisma.bookingStatusHistory.create({
      data: {
        bookingId,
        fromStatus: currentStatus,
        toStatus: 'CANCELLED',
        changedByUserId: userId,
        note: reason ?? null,
      },
    }),
  ]);

  return updatedBooking;
}

/**
 * Get pricing breakdown for a booking.
 */
export async function getPriceBreakdown(bookingId: string, userId: string) {
  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, userId },
    select: {
      id: true,
      referenceNumber: true,
      rentalPlan: true,
      baseAmount: true,
      extrasAmount: true,
      discountAmount: true,
      taxAmount: true,
      serviceFee: true,
      totalAmount: true,
      extras: true,
      discountCode: {
        select: { code: true, discountType: true, discountValue: true },
      },
    },
  });

  if (!booking) {
    throw AppError.notFound('Booking not found');
  }

  return booking;
}

// ---------------------------------------------------------------------------
// Admin services
// ---------------------------------------------------------------------------

/**
 * List all bookings with filters, search, and pagination (admin).
 */
export async function adminListBookings(filters: AdminListBookingsQuery) {
  const { page, limit, status, search, startDate, endDate, sortBy, sortOrder } = filters;
  const skip = (page - 1) * limit;

  const where: Prisma.BookingWhereInput = {};

  if (status) {
    where.status = status;
  }

  if (startDate) {
    where.createdAt = { ...(where.createdAt as object), gte: startDate };
  }
  if (endDate) {
    where.createdAt = { ...(where.createdAt as object), lte: endDate };
  }

  if (search) {
    where.OR = [
      { referenceNumber: { contains: search, mode: 'insensitive' } },
      { user: { fullName: { contains: search, mode: 'insensitive' } } },
      { vehicle: { make: { contains: search, mode: 'insensitive' } } },
      { vehicle: { model: { contains: search, mode: 'insensitive' } } },
    ];
  }

  const orderBy: Prisma.BookingOrderByWithRelationInput = {
    [sortBy]: sortOrder,
  };

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        user: {
          select: { id: true, fullName: true, email: true, phone: true },
        },
        vehicle: {
          select: {
            id: true,
            make: true,
            model: true,
            year: true,
            licensePlate: true,
          },
        },
        pickupBranch: { select: { id: true, nameEn: true, nameAr: true } },
        dropoffBranch: { select: { id: true, nameEn: true, nameAr: true } },
      },
    }),
    prisma.booking.count({ where }),
  ]);

  return { bookings, total, page, limit };
}

/**
 * Get full booking detail for admin.
 */
export async function adminGetBooking(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      user: {
        select: { id: true, fullName: true, email: true, phone: true },
      },
      vehicle: {
        select: {
          id: true,
          make: true,
          model: true,
          year: true,
          licensePlate: true,
          images: { orderBy: { sortOrder: 'asc' }, take: 1 },
          category: { select: { id: true, nameEn: true, nameAr: true } },
        },
      },
      pickupBranch: {
        select: { id: true, nameEn: true, nameAr: true, addressEn: true, addressAr: true },
      },
      dropoffBranch: {
        select: { id: true, nameEn: true, nameAr: true, addressEn: true, addressAr: true },
      },
      extras: true,
      statusHistory: {
        orderBy: { createdAt: 'desc' },
        include: {
          changedByStaff: { select: { id: true, fullName: true } },
          changedByUser: { select: { id: true, fullName: true } },
        },
      },
      notes: {
        orderBy: { createdAt: 'desc' },
        include: {
          staff: { select: { id: true, fullName: true } },
        },
      },
      payments: true,
      otps: {
        select: { id: true, status: true, createdAt: true, expiresAt: true },
        orderBy: { createdAt: 'desc' },
      },
      discountCode: {
        select: { id: true, code: true, discountType: true, discountValue: true },
      },
    },
  });

  if (!booking) {
    throw AppError.notFound('Booking not found');
  }

  return booking;
}

/**
 * Accept (confirm) a pending booking.
 */
export async function acceptBooking(bookingId: string, staffId: string, note?: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
  });

  if (!booking) {
    throw AppError.notFound('Booking not found');
  }

  if (booking.status !== BookingStatus.PENDING) {
    throw AppError.badRequest(
      `Booking cannot be accepted in its current status (${booking.status})`,
    );
  }

  const operations: Prisma.PrismaPromise<unknown>[] = [
    prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'CONFIRMED' },
    }),
    prisma.bookingStatusHistory.create({
      data: {
        bookingId,
        fromStatus: 'PENDING',
        toStatus: 'CONFIRMED',
        changedByStaffId: staffId,
        note: note ?? null,
      },
    }),
  ];

  if (note) {
    operations.push(
      prisma.bookingNote.create({
        data: {
          bookingId,
          staffId,
          content: note,
        },
      }),
    );
  }

  await prisma.$transaction(operations);

  return prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      statusHistory: { orderBy: { createdAt: 'desc' } },
    },
  });
}

/**
 * Reject a pending booking.
 */
export async function rejectBooking(
  bookingId: string,
  staffId: string,
  reason: string,
  note?: string,
) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
  });

  if (!booking) {
    throw AppError.notFound('Booking not found');
  }

  if (booking.status !== BookingStatus.PENDING) {
    throw AppError.badRequest(
      `Booking cannot be rejected in its current status (${booking.status})`,
    );
  }

  const operations: Prisma.PrismaPromise<unknown>[] = [
    prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'REJECTED',
        cancellationReason: reason,
        cancellationInitiatedBy: 'SERVICE_PROVIDER',
      },
    }),
    prisma.bookingStatusHistory.create({
      data: {
        bookingId,
        fromStatus: 'PENDING',
        toStatus: 'REJECTED',
        changedByStaffId: staffId,
        note: reason,
      },
    }),
  ];

  if (note) {
    operations.push(
      prisma.bookingNote.create({
        data: {
          bookingId,
          staffId,
          content: note,
        },
      }),
    );
  }

  await prisma.$transaction(operations);

  return prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      statusHistory: { orderBy: { createdAt: 'desc' } },
    },
  });
}

/**
 * Advance a booking to the next status in the workflow.
 */
export async function advanceStatus(
  bookingId: string,
  staffId: string,
  newStatus: string,
) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
  });

  if (!booking) {
    throw AppError.notFound('Booking not found');
  }

  const currentStatus = booking.status as BookingStatus;
  const allowedTransitions = BOOKING_STATUS_TRANSITIONS[currentStatus] ?? [];

  if (!allowedTransitions.includes(newStatus as BookingStatus)) {
    throw AppError.badRequest(
      `Cannot transition from ${currentStatus} to ${newStatus}. Allowed: ${allowedTransitions.join(', ') || 'none'}`,
    );
  }

  await prisma.$transaction([
    prisma.booking.update({
      where: { id: bookingId },
      data: { status: newStatus as BookingStatus },
    }),
    prisma.bookingStatusHistory.create({
      data: {
        bookingId,
        fromStatus: currentStatus,
        toStatus: newStatus as BookingStatus,
        changedByStaffId: staffId,
      },
    }),
  ]);

  return prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      statusHistory: { orderBy: { createdAt: 'desc' } },
    },
  });
}

/**
 * Admin cancels a booking.
 */
export async function adminCancelBooking(
  bookingId: string,
  staffId: string,
  reason?: string,
) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
  });

  if (!booking) {
    throw AppError.notFound('Booking not found');
  }

  const adminCurrentStatus = booking.status as BookingStatus;

  if (!ADMIN_CANCELLABLE_STATUSES.includes(adminCurrentStatus)) {
    throw AppError.badRequest(
      `Booking cannot be cancelled in its current status (${adminCurrentStatus})`,
    );
  }

  await prisma.$transaction([
    prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'CANCELLED',
        cancellationReason: reason ?? null,
        cancellationInitiatedBy: 'SERVICE_PROVIDER',
      },
    }),
    prisma.bookingStatusHistory.create({
      data: {
        bookingId,
        fromStatus: adminCurrentStatus,
        toStatus: 'CANCELLED',
        changedByStaffId: staffId,
        note: reason ?? null,
      },
    }),
  ]);

  return prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      statusHistory: { orderBy: { createdAt: 'desc' } },
    },
  });
}

/**
 * Add a note to a booking.
 */
export async function addNote(bookingId: string, staffId: string, content: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { id: true },
  });

  if (!booking) {
    throw AppError.notFound('Booking not found');
  }

  return prisma.bookingNote.create({
    data: {
      bookingId,
      staffId,
      content,
    },
    include: {
      staff: { select: { id: true, fullName: true } },
    },
  });
}

/**
 * Export bookings as a CSV string.
 */
export async function exportBookings(filters: ExportBookingsQuery) {
  const where: Prisma.BookingWhereInput = {};

  if (filters.status) {
    where.status = filters.status;
  }
  if (filters.startDate) {
    where.createdAt = { ...(where.createdAt as object), gte: filters.startDate };
  }
  if (filters.endDate) {
    where.createdAt = { ...(where.createdAt as object), lte: filters.endDate };
  }

  const bookings = await prisma.booking.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { fullName: true, email: true } },
      vehicle: { select: { make: true, model: true, year: true, licensePlate: true } },
    },
  });

  // Build CSV
  const headers = [
    'Reference Number',
    'Customer Name',
    'Customer Email',
    'Vehicle',
    'License Plate',
    'Pickup Date',
    'Dropoff Date',
    'Status',
    'Total Amount',
    'Created At',
  ];

  const rows = bookings.map((b) => [
    b.referenceNumber,
    b.user.fullName ?? '',
    b.user.email ?? '',
    `${b.vehicle.make} ${b.vehicle.model} ${b.vehicle.year}`,
    b.vehicle.licensePlate,
    b.pickupDate.toISOString(),
    b.dropoffDate.toISOString(),
    b.status,
    Number(b.totalAmount).toFixed(2),
    b.createdAt.toISOString(),
  ]);

  const csvLines = [
    headers.join(','),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','),
    ),
  ];

  return csvLines.join('\n');
}
