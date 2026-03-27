import { Prisma } from '@prisma/client';
import { prisma } from '../db/client';
import { AppError } from '../utils/app-error';
import type {
  ListCustomersQuery,
  UpdateCustomerStatusInput,
  ExportCustomersQuery,
} from '../validation/customer.schema';

// ---------------------------------------------------------------------------
// List customers (paginated, searchable, sortable)
// ---------------------------------------------------------------------------

export async function listCustomers(filters: ListCustomersQuery) {
  const { page, limit, search, sortBy, sortOrder } = filters;
  const skip = (page - 1) * limit;

  const where: Prisma.UserWhereInput = {
    deletedAt: null,
  };

  if (search) {
    where.OR = [
      { fullName: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } },
    ];
  }

  const orderBy: Prisma.UserOrderByWithRelationInput = {
    [sortBy]: sortOrder,
  };

  const [customers, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        profilePhotoUrl: true,
        status: true,
        createdAt: true,
        _count: {
          select: { bookings: true },
        },
        bookings: {
          where: {
            payments: { some: { status: 'COMPLETED' } },
          },
          select: {
            totalAmount: true,
          },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  const data = customers.map((c) => ({
    id: c.id,
    fullName: c.fullName,
    email: c.email,
    phone: c.phone,
    profilePhotoUrl: c.profilePhotoUrl,
    status: c.status,
    createdAt: c.createdAt,
    bookingCount: c._count.bookings,
    totalSpent: c.bookings.reduce(
      (sum, b) => sum + Number(b.totalAmount),
      0,
    ),
  }));

  return { customers: data, total, page, limit };
}

// ---------------------------------------------------------------------------
// Get customer detail with stats
// ---------------------------------------------------------------------------

export async function getCustomerDetail(id: string) {
  const customer = await prisma.user.findFirst({
    where: { id, deletedAt: null },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      profilePhotoUrl: true,
      drivingLicenseNumber: true,
      authProvider: true,
      emailVerified: true,
      phoneVerified: true,
      status: true,
      suspensionReason: true,
      preferredLanguage: true,
      loyaltyPointsBalance: true,
      createdAt: true,
      updatedAt: true,
      addresses: true,
      bookings: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          referenceNumber: true,
          status: true,
          totalAmount: true,
          pickupDate: true,
          dropoffDate: true,
          createdAt: true,
          vehicle: {
            select: {
              id: true,
              make: true,
              model: true,
              year: true,
            },
          },
        },
      },
    },
  });

  if (!customer) {
    throw AppError.notFound('Customer not found');
  }

  // Compute stats
  const stats = await prisma.booking.aggregate({
    where: { userId: id },
    _count: { id: true },
    _sum: { totalAmount: true },
    _max: { createdAt: true },
  });

  return {
    ...customer,
    stats: {
      totalBookings: stats._count.id,
      totalSpent: stats._sum.totalAmount ? Number(stats._sum.totalAmount) : 0,
      lastBookingDate: stats._max.createdAt,
    },
    recentBookings: customer.bookings,
  };
}

// ---------------------------------------------------------------------------
// Update customer status (suspend / reactivate)
// ---------------------------------------------------------------------------

export async function updateCustomerStatus(
  id: string,
  data: UpdateCustomerStatusInput,
) {
  const customer = await prisma.user.findFirst({
    where: { id, deletedAt: null },
    select: { id: true, status: true },
  });

  if (!customer) {
    throw AppError.notFound('Customer not found');
  }

  if (customer.status === data.status) {
    throw AppError.badRequest(`Customer is already ${data.status}`);
  }

  const updated = await prisma.user.update({
    where: { id },
    data: {
      status: data.status,
      suspensionReason: data.status === 'SUSPENDED' ? (data.reason ?? null) : null,
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      status: true,
      suspensionReason: true,
      updatedAt: true,
    },
  });

  return updated;
}

// ---------------------------------------------------------------------------
// Export customers CSV
// ---------------------------------------------------------------------------

export async function exportCustomersCsv(filters: ExportCustomersQuery) {
  const where: Prisma.UserWhereInput = {
    deletedAt: null,
  };

  if (filters.search) {
    where.OR = [
      { fullName: { contains: filters.search, mode: 'insensitive' } },
      { email: { contains: filters.search, mode: 'insensitive' } },
      { phone: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  const customers = await prisma.user.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      status: true,
      createdAt: true,
      _count: { select: { bookings: true } },
    },
  });

  const headers = [
    'ID',
    'Full Name',
    'Email',
    'Phone',
    'Status',
    'Total Bookings',
    'Created At',
  ];

  const rows = customers.map((c) => [
    c.id,
    c.fullName,
    c.email ?? '',
    c.phone ?? '',
    c.status,
    String(c._count.bookings),
    c.createdAt.toISOString(),
  ]);

  const csvLines = [
    headers.join(','),
    ...rows.map((row) =>
      row.map((cell) => '"' + String(cell).replace(/"/g, '""') + '"').join(','),
    ),
  ];

  return csvLines.join('\n');
}
