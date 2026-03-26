import { Prisma } from '@prisma/client';
import { prisma } from '../db/client';
import { AppError } from '../utils/app-error';
import type {
  CreateBranchInput,
  UpdateBranchInput,
  SetOperatingHoursInput,
  BranchListQuery,
} from '../validation/branch.schema';

/**
 * Convert a "HH:mm" time string to a Date object for Prisma @db.Time() fields.
 * Prisma Time() fields require full Date objects but only store the time portion.
 */
function timeStringToDate(time: string): Date {
  return new Date(`1970-01-01T${time}:00.000Z`);
}

/**
 * List all branches with pagination (admin).
 */
export async function listAll(query: BranchListQuery) {
  const { page, limit, search, isActive } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.BranchWhereInput = {};

  if (isActive !== undefined) {
    where.isActive = isActive;
  }

  if (search) {
    where.OR = [
      { nameEn: { contains: search, mode: 'insensitive' } },
      { nameAr: { contains: search, mode: 'insensitive' } },
      { addressEn: { contains: search, mode: 'insensitive' } },
      { addressAr: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [branches, total] = await Promise.all([
    prisma.branch.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        operatingHours: {
          orderBy: { dayOfWeek: 'asc' },
        },
        _count: {
          select: { vehicles: true },
        },
      },
    }),
    prisma.branch.count({ where }),
  ]);

  return { branches, total, page, limit };
}

/**
 * List active branches with operating hours (public).
 */
export async function listPublic() {
  return prisma.branch.findMany({
    where: { isActive: true },
    orderBy: { nameEn: 'asc' },
    include: {
      operatingHours: {
        orderBy: { dayOfWeek: 'asc' },
      },
    },
  });
}

/**
 * Get a single branch by ID with operating hours.
 */
export async function getById(id: string) {
  const branch = await prisma.branch.findUnique({
    where: { id },
    include: {
      operatingHours: {
        orderBy: { dayOfWeek: 'asc' },
      },
      _count: {
        select: { vehicles: true },
      },
    },
  });

  if (!branch) {
    throw AppError.notFound('Branch not found');
  }

  return branch;
}

/**
 * Create a new branch.
 */
export async function create(data: CreateBranchInput) {
  return prisma.branch.create({
    data: {
      nameEn: data.nameEn,
      nameAr: data.nameAr,
      addressEn: data.addressEn,
      addressAr: data.addressAr,
      latitude: data.latitude,
      longitude: data.longitude,
      phone: data.phone ?? null,
      email: data.email ?? null,
      isActive: data.isActive,
    },
    include: {
      operatingHours: true,
    },
  });
}

/**
 * Update an existing branch.
 */
export async function update(id: string, data: UpdateBranchInput) {
  const existing = await prisma.branch.findUnique({ where: { id } });
  if (!existing) {
    throw AppError.notFound('Branch not found');
  }

  return prisma.branch.update({
    where: { id },
    data: {
      ...(data.nameEn !== undefined && { nameEn: data.nameEn }),
      ...(data.nameAr !== undefined && { nameAr: data.nameAr }),
      ...(data.addressEn !== undefined && { addressEn: data.addressEn }),
      ...(data.addressAr !== undefined && { addressAr: data.addressAr }),
      ...(data.latitude !== undefined && { latitude: data.latitude }),
      ...(data.longitude !== undefined && { longitude: data.longitude }),
      ...(data.phone !== undefined && { phone: data.phone }),
      ...(data.email !== undefined && { email: data.email }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
    include: {
      operatingHours: {
        orderBy: { dayOfWeek: 'asc' },
      },
    },
  });
}

/**
 * Set operating hours for a branch.
 * Upserts hours for each specified day (0-6).
 */
export async function setOperatingHours(branchId: string, hours: SetOperatingHoursInput['hours']) {
  const branch = await prisma.branch.findUnique({ where: { id: branchId } });
  if (!branch) {
    throw AppError.notFound('Branch not found');
  }

  // Upsert each day's operating hours in a transaction
  await prisma.$transaction(
    hours.map((hour) =>
      prisma.branchOperatingHour.upsert({
        where: {
          branchId_dayOfWeek: {
            branchId,
            dayOfWeek: hour.dayOfWeek,
          },
        },
        update: {
          isClosed: hour.isClosed,
          openTime: hour.isClosed ? null : (hour.openTime ? timeStringToDate(hour.openTime) : null),
          closeTime: hour.isClosed ? null : (hour.closeTime ? timeStringToDate(hour.closeTime) : null),
        },
        create: {
          branchId,
          dayOfWeek: hour.dayOfWeek,
          isClosed: hour.isClosed,
          openTime: hour.isClosed ? null : (hour.openTime ? timeStringToDate(hour.openTime) : null),
          closeTime: hour.isClosed ? null : (hour.closeTime ? timeStringToDate(hour.closeTime) : null),
        },
      }),
    ),
  );

  // Return updated branch with hours
  return prisma.branch.findUnique({
    where: { id: branchId },
    include: {
      operatingHours: {
        orderBy: { dayOfWeek: 'asc' },
      },
    },
  });
}

/**
 * Toggle branch active status.
 */
export async function activate(id: string, isActive: boolean) {
  const branch = await prisma.branch.findUnique({ where: { id } });
  if (!branch) {
    throw AppError.notFound('Branch not found');
  }

  return prisma.branch.update({
    where: { id },
    data: { isActive },
    include: {
      operatingHours: {
        orderBy: { dayOfWeek: 'asc' },
      },
    },
  });
}
