import { prisma } from '../db/client';

/**
 * Booking statuses that indicate an active rental lifecycle.
 */
const ACTIVE_BOOKING_STATUSES = [
  'CONFIRMED',
  'VEHICLE_PREPARING',
  'READY_FOR_PICKUP',
  'ACTIVE_RENTAL',
] as const;

/**
 * Booking statuses for today's pickups (not yet picked up).
 */
const PICKUP_STATUSES = ['CONFIRMED', 'VEHICLE_PREPARING', 'READY_FOR_PICKUP'] as const;

/**
 * Helper: returns the start and end of today (UTC) for date-range queries.
 */
function getTodayRange(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}

// ---------------------------------------------------------------------------
// getStats
// ---------------------------------------------------------------------------

export interface DashboardStats {
  activeBookings: number;
  todayPickups: number;
  todayReturns: number;
  fleetAvailability: number;
  todayRevenue: number;
}

/**
 * Fetch aggregate dashboard statistics.
 * Handles missing tables gracefully by returning 0 for counts.
 */
export async function getStats(): Promise<DashboardStats> {
  const { start, end } = getTodayRange();

  const [activeBookings, todayPickups, todayReturns, fleetAvailability, todayRevenue] =
    await Promise.all([
      // Active bookings
      safeCount(() =>
        prisma.booking.count({
          where: {
            status: { in: [...ACTIVE_BOOKING_STATUSES] },
          },
        }),
      ),

      // Today's pickups
      safeCount(() =>
        prisma.booking.count({
          where: {
            pickupDate: { gte: start, lt: end },
            status: { in: [...PICKUP_STATUSES] },
          },
        }),
      ),

      // Today's returns
      safeCount(() =>
        prisma.booking.count({
          where: {
            dropoffDate: { gte: start, lt: end },
            status: 'ACTIVE_RENTAL',
          },
        }),
      ),

      // Fleet availability
      safeCount(() =>
        prisma.vehicle.count({
          where: {
            status: 'AVAILABLE',
            deletedAt: null,
          },
        }),
      ),

      // Today's revenue
      safeSumPayments(start, end),
    ]);

  return {
    activeBookings,
    todayPickups,
    todayReturns,
    fleetAvailability,
    todayRevenue,
  };
}

// ---------------------------------------------------------------------------
// getRecentBookings
// ---------------------------------------------------------------------------

export interface RecentBooking {
  id: string;
  referenceNumber: string;
  customerName: string;
  vehicle: string;
  pickupDate: Date;
  returnDate: Date;
  status: string;
}

/**
 * Fetch the most recent bookings for the dashboard table.
 */
export async function getRecentBookings(limit = 10): Promise<RecentBooking[]> {
  try {
    const bookings = await prisma.booking.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        referenceNumber: true,
        pickupDate: true,
        dropoffDate: true,
        status: true,
        user: {
          select: { fullName: true },
        },
        vehicle: {
          select: { make: true, model: true },
        },
      },
    });

    return bookings.map((b) => ({
      id: b.id,
      referenceNumber: b.referenceNumber,
      customerName: b.user.fullName,
      vehicle: `${b.vehicle.make} ${b.vehicle.model}`,
      pickupDate: b.pickupDate,
      returnDate: b.dropoffDate,
      status: b.status,
    }));
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// getFleetStatus
// ---------------------------------------------------------------------------

export interface FleetStatus {
  available: number;
  rented: number;
  inMaintenance: number;
  total: number;
}

/**
 * Fetch vehicle fleet breakdown by status.
 */
export async function getFleetStatus(): Promise<FleetStatus> {
  try {
    const [available, rented, inMaintenance, total] = await Promise.all([
      prisma.vehicle.count({
        where: { status: 'AVAILABLE', deletedAt: null },
      }),
      prisma.vehicle.count({
        where: { status: 'UNAVAILABLE', deletedAt: null },
      }),
      prisma.vehicle.count({
        where: { status: 'IN_MAINTENANCE', deletedAt: null },
      }),
      prisma.vehicle.count({
        where: { deletedAt: null },
      }),
    ]);

    return { available, rented, inMaintenance, total };
  } catch {
    return { available: 0, rented: 0, inMaintenance: 0, total: 0 };
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Execute a Prisma count query and return 0 if the table doesn't exist yet
 * or any other error occurs.
 */
async function safeCount(fn: () => Promise<number>): Promise<number> {
  try {
    return await fn();
  } catch {
    return 0;
  }
}

/**
 * Sum completed payment amounts for a date range.
 * Returns 0 if the payments table is empty or doesn't exist.
 */
async function safeSumPayments(start: Date, end: Date): Promise<number> {
  try {
    const result = await prisma.payment.aggregate({
      where: {
        status: 'COMPLETED',
        createdAt: { gte: start, lt: end },
      },
      _sum: {
        amount: true,
      },
    });

    return Number(result._sum.amount ?? 0);
  } catch {
    return 0;
  }
}
