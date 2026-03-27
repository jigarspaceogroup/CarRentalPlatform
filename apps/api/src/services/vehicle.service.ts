import { Prisma } from '@prisma/client';
import { prisma } from '../db/client';
import { AppError } from '../utils/app-error';
import { MAX_VEHICLE_IMAGES } from '@crp/shared';
import type {
  CreateVehicleInput,
  UpdateVehicleInput,
  VehicleFilterQuery,
  ChangeStatusInput,
  BulkStatusInput,
  AddImagesInput,
  ReorderImagesInput,
} from '../validation/vehicle.schema';

/**
 * Booking statuses that indicate a vehicle is actively in use
 * and should block soft-deletion.
 */
const ACTIVE_BOOKING_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'VEHICLE_PREPARING',
  'READY_FOR_PICKUP',
  'ACTIVE_RENTAL',
] as const;

/**
 * Common include clause for vehicle queries with relations.
 */
const vehicleInclude = {
  category: {
    select: { id: true, nameEn: true, nameAr: true },
  },
  branch: {
    select: { id: true, nameEn: true, nameAr: true },
  },
  images: {
    orderBy: { sortOrder: 'asc' as const },
  },
  _count: {
    select: { images: true },
  },
};

// ---------------------------------------------------------------------------
// Admin CRUD
// ---------------------------------------------------------------------------

/**
 * List vehicles with pagination, search, filtering, and sorting (admin).
 * Excludes soft-deleted vehicles.
 */
export async function list(filters: VehicleFilterQuery) {
  const {
    page,
    limit,
    search,
    categoryId,
    branchId,
    status,
    transmission,
    fuelType,
    minPrice,
    maxPrice,
    sortBy,
    sortOrder,
  } = filters;
  const skip = (page - 1) * limit;

  const where: Prisma.VehicleWhereInput = {
    deletedAt: null,
  };

  if (search) {
    where.OR = [
      { make: { contains: search, mode: 'insensitive' } },
      { model: { contains: search, mode: 'insensitive' } },
      { licensePlate: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (categoryId) where.categoryId = categoryId;
  if (branchId) where.branchId = branchId;
  if (status) where.status = status;
  if (transmission) where.transmission = transmission;
  if (fuelType) where.fuelType = fuelType;

  if (minPrice !== undefined || maxPrice !== undefined) {
    where.dailyRate = {};
    if (minPrice !== undefined) where.dailyRate.gte = minPrice;
    if (maxPrice !== undefined) where.dailyRate.lte = maxPrice;
  }

  const orderBy: Prisma.VehicleOrderByWithRelationInput = {
    [sortBy]: sortOrder,
  };

  const [vehicles, total] = await Promise.all([
    prisma.vehicle.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: vehicleInclude,
    }),
    prisma.vehicle.count({ where }),
  ]);

  return { vehicles, total, page, limit };
}

/**
 * Get a single vehicle by ID with all relations (admin).
 * Excludes soft-deleted.
 */
export async function getById(id: string) {
  const vehicle = await prisma.vehicle.findFirst({
    where: { id, deletedAt: null },
    include: vehicleInclude,
  });

  if (!vehicle) {
    throw AppError.notFound('Vehicle not found');
  }

  return vehicle;
}

/**
 * Create a new vehicle.
 * Validates that category and branch exist, and that licensePlate is unique
 * among non-deleted vehicles.
 */
export async function create(data: CreateVehicleInput) {
  // Validate category exists
  const category = await prisma.vehicleCategory.findUnique({
    where: { id: data.categoryId },
  });
  if (!category) {
    throw AppError.badRequest('Category not found');
  }

  // Validate branch exists
  const branch = await prisma.branch.findUnique({
    where: { id: data.branchId },
  });
  if (!branch) {
    throw AppError.badRequest('Branch not found');
  }

  // Check license plate uniqueness among non-deleted vehicles
  const existingPlate = await prisma.vehicle.findFirst({
    where: {
      licensePlate: data.licensePlate,
      deletedAt: null,
    },
  });
  if (existingPlate) {
    throw AppError.conflict('A vehicle with this license plate already exists');
  }

  return prisma.vehicle.create({
    data: {
      make: data.make,
      model: data.model,
      year: data.year,
      licensePlate: data.licensePlate,
      categoryId: data.categoryId,
      branchId: data.branchId,
      transmission: data.transmission,
      fuelType: data.fuelType,
      seats: data.seats,
      doors: data.doors,
      trunkCapacity: data.trunkCapacity ?? null,
      mileagePolicy: data.mileagePolicy ?? null,
      features: data.features,
      dailyRate: data.dailyRate,
      weeklyRate: data.weeklyRate ?? null,
      monthlyRate: data.monthlyRate ?? null,
      longTermRate: data.longTermRate ?? null,
    },
    include: vehicleInclude,
  });
}

/**
 * Update an existing vehicle.
 * Validates that the vehicle is not soft-deleted and that licensePlate
 * remains unique if changed.
 */
export async function update(id: string, data: UpdateVehicleInput) {
  const existing = await prisma.vehicle.findFirst({
    where: { id, deletedAt: null },
  });
  if (!existing) {
    throw AppError.notFound('Vehicle not found');
  }

  // Validate category exists if being changed
  if (data.categoryId) {
    const category = await prisma.vehicleCategory.findUnique({
      where: { id: data.categoryId },
    });
    if (!category) {
      throw AppError.badRequest('Category not found');
    }
  }

  // Validate branch exists if being changed
  if (data.branchId) {
    const branch = await prisma.branch.findUnique({
      where: { id: data.branchId },
    });
    if (!branch) {
      throw AppError.badRequest('Branch not found');
    }
  }

  // Check license plate uniqueness if changed
  if (data.licensePlate && data.licensePlate !== existing.licensePlate) {
    const duplicatePlate = await prisma.vehicle.findFirst({
      where: {
        licensePlate: data.licensePlate,
        deletedAt: null,
        id: { not: id },
      },
    });
    if (duplicatePlate) {
      throw AppError.conflict('A vehicle with this license plate already exists');
    }
  }

  return prisma.vehicle.update({
    where: { id },
    data: {
      ...(data.make !== undefined && { make: data.make }),
      ...(data.model !== undefined && { model: data.model }),
      ...(data.year !== undefined && { year: data.year }),
      ...(data.licensePlate !== undefined && { licensePlate: data.licensePlate }),
      ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
      ...(data.branchId !== undefined && { branchId: data.branchId }),
      ...(data.transmission !== undefined && { transmission: data.transmission }),
      ...(data.fuelType !== undefined && { fuelType: data.fuelType }),
      ...(data.seats !== undefined && { seats: data.seats }),
      ...(data.doors !== undefined && { doors: data.doors }),
      ...(data.trunkCapacity !== undefined && { trunkCapacity: data.trunkCapacity }),
      ...(data.mileagePolicy !== undefined && { mileagePolicy: data.mileagePolicy }),
      ...(data.features !== undefined && { features: data.features }),
      ...(data.dailyRate !== undefined && { dailyRate: data.dailyRate }),
      ...(data.weeklyRate !== undefined && { weeklyRate: data.weeklyRate }),
      ...(data.monthlyRate !== undefined && { monthlyRate: data.monthlyRate }),
      ...(data.longTermRate !== undefined && { longTermRate: data.longTermRate }),
    },
    include: vehicleInclude,
  });
}

/**
 * Soft-delete a vehicle.
 * Blocks deletion if the vehicle has active bookings.
 */
export async function softDelete(id: string) {
  const vehicle = await prisma.vehicle.findFirst({
    where: { id, deletedAt: null },
    include: {
      bookings: {
        where: {
          status: { in: [...ACTIVE_BOOKING_STATUSES] },
        },
        select: { id: true },
      },
    },
  });

  if (!vehicle) {
    throw AppError.notFound('Vehicle not found');
  }

  if (vehicle.bookings.length > 0) {
    throw AppError.conflict(
      `Cannot delete vehicle: ${vehicle.bookings.length} active booking(s) exist`,
    );
  }

  await prisma.vehicle.update({
    where: { id },
    data: { deletedAt: new Date(), status: 'RETIRED' },
  });
}

/**
 * Change a vehicle's status.
 */
export async function changeStatus(id: string, data: ChangeStatusInput) {
  const vehicle = await prisma.vehicle.findFirst({
    where: { id, deletedAt: null },
  });

  if (!vehicle) {
    throw AppError.notFound('Vehicle not found');
  }

  return prisma.vehicle.update({
    where: { id },
    data: { status: data.status },
    include: vehicleInclude,
  });
}

/**
 * Bulk-update status for multiple vehicles.
 */
export async function bulkChangeStatus(data: BulkStatusInput) {
  const result = await prisma.vehicle.updateMany({
    where: {
      id: { in: data.vehicleIds },
      deletedAt: null,
    },
    data: { status: data.status },
  });

  return { updatedCount: result.count };
}

// ---------------------------------------------------------------------------
// Images
// ---------------------------------------------------------------------------

/**
 * Add images to a vehicle.
 * Enforces maximum of MAX_VEHICLE_IMAGES (10) images per vehicle.
 * Auto-sets sortOrder based on current highest.
 */
export async function addImages(vehicleId: string, data: AddImagesInput) {
  const vehicle = await prisma.vehicle.findFirst({
    where: { id: vehicleId, deletedAt: null },
    include: {
      _count: { select: { images: true } },
    },
  });

  if (!vehicle) {
    throw AppError.notFound('Vehicle not found');
  }

  const currentCount = vehicle._count.images;
  const newCount = data.images.length;

  if (currentCount + newCount > MAX_VEHICLE_IMAGES) {
    throw AppError.badRequest(
      `Maximum ${MAX_VEHICLE_IMAGES} images per vehicle. Currently ${currentCount}, trying to add ${newCount}.`,
    );
  }

  // Get the current max sortOrder
  const maxSort = await prisma.vehicleImage.aggregate({
    where: { vehicleId },
    _max: { sortOrder: true },
  });
  let nextOrder = (maxSort._max.sortOrder ?? -1) + 1;

  const createdImages = await prisma.$transaction(
    data.images.map((img) =>
      prisma.vehicleImage.create({
        data: {
          vehicleId,
          imageUrl: img.imageUrl,
          thumbnailUrl: img.thumbnailUrl ?? null,
          sortOrder: nextOrder++,
        },
      }),
    ),
  );

  return createdImages;
}

/**
 * Reorder images for a vehicle by updating sortOrders.
 */
export async function reorderImages(vehicleId: string, data: ReorderImagesInput) {
  const vehicle = await prisma.vehicle.findFirst({
    where: { id: vehicleId, deletedAt: null },
  });

  if (!vehicle) {
    throw AppError.notFound('Vehicle not found');
  }

  await prisma.$transaction(
    data.images.map((img) =>
      prisma.vehicleImage.update({
        where: { id: img.id },
        data: { sortOrder: img.sortOrder },
      }),
    ),
  );

  // Return updated images
  return prisma.vehicleImage.findMany({
    where: { vehicleId },
    orderBy: { sortOrder: 'asc' },
  });
}

/**
 * Delete a single image from a vehicle.
 */
export async function deleteImage(vehicleId: string, imageId: string) {
  const image = await prisma.vehicleImage.findFirst({
    where: { id: imageId, vehicleId },
  });

  if (!image) {
    throw AppError.notFound('Image not found');
  }

  await prisma.vehicleImage.delete({ where: { id: imageId } });
}

// ---------------------------------------------------------------------------
// Public (customer-facing)
// ---------------------------------------------------------------------------

/**
 * List available vehicles for the public catalog.
 * Only returns AVAILABLE + not soft-deleted vehicles.
 */
export async function listPublic(filters: VehicleFilterQuery) {
  const {
    page,
    limit,
    search,
    categoryId,
    transmission,
    fuelType,
    minPrice,
    maxPrice,
    sortBy,
    sortOrder,
  } = filters;
  const skip = (page - 1) * limit;

  const where: Prisma.VehicleWhereInput = {
    deletedAt: null,
    status: 'AVAILABLE',
  };

  if (search) {
    where.OR = [
      { make: { contains: search, mode: 'insensitive' } },
      { model: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (categoryId) where.categoryId = categoryId;
  if (transmission) where.transmission = transmission;
  if (fuelType) where.fuelType = fuelType;

  if (minPrice !== undefined || maxPrice !== undefined) {
    where.dailyRate = {};
    if (minPrice !== undefined) where.dailyRate.gte = minPrice;
    if (maxPrice !== undefined) where.dailyRate.lte = maxPrice;
  }

  const orderBy: Prisma.VehicleOrderByWithRelationInput = {
    [sortBy]: sortOrder,
  };

  const [vehicles, total] = await Promise.all([
    prisma.vehicle.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        category: {
          select: { id: true, nameEn: true, nameAr: true },
        },
        branch: {
          select: { id: true, nameEn: true, nameAr: true },
        },
        images: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    }),
    prisma.vehicle.count({ where }),
  ]);

  return { vehicles, total, page, limit };
}

/**
 * Get a single vehicle detail for the public catalog.
 * Only returns if AVAILABLE + not soft-deleted.
 */
export async function getPublicById(id: string) {
  const vehicle = await prisma.vehicle.findFirst({
    where: { id, deletedAt: null, status: 'AVAILABLE' },
    include: {
      category: {
        select: { id: true, nameEn: true, nameAr: true },
      },
      branch: {
        select: { id: true, nameEn: true, nameAr: true, addressEn: true, addressAr: true },
      },
      images: {
        orderBy: { sortOrder: 'asc' },
      },
    },
  });

  if (!vehicle) {
    throw AppError.notFound('Vehicle not found');
  }

  return vehicle;
}
