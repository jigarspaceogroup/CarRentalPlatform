import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Hoisted mock objects
// ---------------------------------------------------------------------------

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    vehicle: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      count: vi.fn(),
    },
    vehicleCategory: {
      findUnique: vi.fn(),
    },
    branch: {
      findUnique: vi.fn(),
    },
    vehicleImage: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      aggregate: vi.fn(),
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
  MAX_VEHICLE_IMAGES: 10,
}));

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------

import * as vehicleService from './vehicle.service';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeVehicle(overrides: Record<string, unknown> = {}) {
  return {
    id: 'vehicle-uuid-1',
    make: 'Toyota',
    model: 'Camry',
    year: 2025,
    licensePlate: 'ABC-1234',
    categoryId: 'cat-uuid-1',
    branchId: 'branch-uuid-1',
    transmission: 'AUTOMATIC',
    fuelType: 'PETROL',
    seats: 5,
    doors: 4,
    trunkCapacity: 'Large',
    mileagePolicy: null,
    features: ['Bluetooth', 'GPS'],
    dailyRate: 150,
    weeklyRate: 900,
    monthlyRate: 3200,
    longTermRate: null,
    status: 'AVAILABLE',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    category: { id: 'cat-uuid-1', nameEn: 'Sedan', nameAr: 'سيدان' },
    branch: { id: 'branch-uuid-1', nameEn: 'Main Branch', nameAr: 'الفرع الرئيسي' },
    images: [],
    _count: { images: 0 },
    ...overrides,
  };
}

function makeImage(overrides: Record<string, unknown> = {}) {
  return {
    id: 'img-uuid-1',
    vehicleId: 'vehicle-uuid-1',
    imageUrl: 'https://example.com/img1.jpg',
    thumbnailUrl: null,
    sortOrder: 0,
    createdAt: new Date(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('VehicleService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── list ────────────────────────────────────────────────────────────

  describe('list', () => {
    it('returns paginated vehicles with default filters', async () => {
      const vehicles = [makeVehicle()];
      mockPrisma.vehicle.findMany.mockResolvedValue(vehicles);
      mockPrisma.vehicle.count.mockResolvedValue(1);

      const result = await vehicleService.list({
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      expect(result.vehicles).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(mockPrisma.vehicle.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { deletedAt: null },
          skip: 0,
          take: 20,
        }),
      );
    });

    it('applies search filter to make, model, and licensePlate', async () => {
      mockPrisma.vehicle.findMany.mockResolvedValue([]);
      mockPrisma.vehicle.count.mockResolvedValue(0);

      await vehicleService.list({
        page: 1,
        limit: 20,
        search: 'Toyota',
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      expect(mockPrisma.vehicle.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { make: { contains: 'Toyota', mode: 'insensitive' } },
              { model: { contains: 'Toyota', mode: 'insensitive' } },
              { licensePlate: { contains: 'Toyota', mode: 'insensitive' } },
            ],
          }),
        }),
      );
    });

    it('applies category, status, and price range filters', async () => {
      mockPrisma.vehicle.findMany.mockResolvedValue([]);
      mockPrisma.vehicle.count.mockResolvedValue(0);

      await vehicleService.list({
        page: 1,
        limit: 20,
        categoryId: 'cat-uuid-1',
        status: 'AVAILABLE',
        minPrice: 100,
        maxPrice: 500,
        sortBy: 'dailyRate',
        sortOrder: 'asc',
      });

      expect(mockPrisma.vehicle.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            categoryId: 'cat-uuid-1',
            status: 'AVAILABLE',
            dailyRate: { gte: 100, lte: 500 },
          }),
          orderBy: { dailyRate: 'asc' },
        }),
      );
    });

    it('handles pagination offset correctly', async () => {
      mockPrisma.vehicle.findMany.mockResolvedValue([]);
      mockPrisma.vehicle.count.mockResolvedValue(50);

      await vehicleService.list({
        page: 3,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      expect(mockPrisma.vehicle.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20,
          take: 10,
        }),
      );
    });
  });

  // ── getById ────────────────────────────────────────────────────────

  describe('getById', () => {
    it('returns vehicle when found', async () => {
      const vehicle = makeVehicle();
      mockPrisma.vehicle.findFirst.mockResolvedValue(vehicle);

      const result = await vehicleService.getById('vehicle-uuid-1');

      expect(result.id).toBe('vehicle-uuid-1');
      expect(result.make).toBe('Toyota');
      expect(mockPrisma.vehicle.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'vehicle-uuid-1', deletedAt: null },
        }),
      );
    });

    it('throws not found when vehicle does not exist', async () => {
      mockPrisma.vehicle.findFirst.mockResolvedValue(null);

      await expect(vehicleService.getById('nonexistent')).rejects.toThrow('Vehicle not found');
    });

    it('throws not found for soft-deleted vehicle', async () => {
      mockPrisma.vehicle.findFirst.mockResolvedValue(null);

      await expect(vehicleService.getById('deleted-uuid')).rejects.toThrow('Vehicle not found');
    });
  });

  // ── create ─────────────────────────────────────────────────────────

  describe('create', () => {
    const createInput = {
      make: 'Toyota',
      model: 'Camry',
      year: 2025,
      licensePlate: 'ABC-1234',
      categoryId: 'cat-uuid-1',
      branchId: 'branch-uuid-1',
      transmission: 'AUTOMATIC' as const,
      fuelType: 'PETROL' as const,
      seats: 5,
      doors: 4,
      dailyRate: 150,
      features: ['Bluetooth'],
    };

    it('creates a vehicle when all validations pass', async () => {
      mockPrisma.vehicleCategory.findUnique.mockResolvedValue({ id: 'cat-uuid-1' });
      mockPrisma.branch.findUnique.mockResolvedValue({ id: 'branch-uuid-1' });
      mockPrisma.vehicle.findFirst.mockResolvedValue(null);
      mockPrisma.vehicle.create.mockResolvedValue(makeVehicle());

      const result = await vehicleService.create(createInput);

      expect(result.id).toBe('vehicle-uuid-1');
      expect(mockPrisma.vehicle.create).toHaveBeenCalledOnce();
    });

    it('throws bad request when category does not exist', async () => {
      mockPrisma.vehicleCategory.findUnique.mockResolvedValue(null);

      await expect(vehicleService.create(createInput)).rejects.toThrow('Category not found');
    });

    it('throws bad request when branch does not exist', async () => {
      mockPrisma.vehicleCategory.findUnique.mockResolvedValue({ id: 'cat-uuid-1' });
      mockPrisma.branch.findUnique.mockResolvedValue(null);

      await expect(vehicleService.create(createInput)).rejects.toThrow('Branch not found');
    });

    it('throws conflict for duplicate license plate', async () => {
      mockPrisma.vehicleCategory.findUnique.mockResolvedValue({ id: 'cat-uuid-1' });
      mockPrisma.branch.findUnique.mockResolvedValue({ id: 'branch-uuid-1' });
      mockPrisma.vehicle.findFirst.mockResolvedValue(makeVehicle());

      await expect(vehicleService.create(createInput)).rejects.toThrow(
        'A vehicle with this license plate already exists',
      );
    });
  });

  // ── update ─────────────────────────────────────────────────────────

  describe('update', () => {
    it('updates vehicle when found and valid', async () => {
      const existing = makeVehicle();
      mockPrisma.vehicle.findFirst.mockResolvedValue(existing);
      mockPrisma.vehicle.update.mockResolvedValue({ ...existing, make: 'Honda' });

      const result = await vehicleService.update('vehicle-uuid-1', { make: 'Honda' });

      expect(result.make).toBe('Honda');
    });

    it('throws not found when vehicle does not exist', async () => {
      mockPrisma.vehicle.findFirst.mockResolvedValue(null);

      await expect(
        vehicleService.update('nonexistent', { make: 'Honda' }),
      ).rejects.toThrow('Vehicle not found');
    });

    it('throws conflict for duplicate license plate on update', async () => {
      const existing = makeVehicle({ licensePlate: 'OLD-1234' });
      mockPrisma.vehicle.findFirst
        .mockResolvedValueOnce(existing) // existing vehicle lookup
        .mockResolvedValueOnce(makeVehicle({ id: 'other-uuid', licensePlate: 'ABC-1234' })); // duplicate check

      await expect(
        vehicleService.update('vehicle-uuid-1', { licensePlate: 'ABC-1234' }),
      ).rejects.toThrow('A vehicle with this license plate already exists');
    });
  });

  // ── softDelete ─────────────────────────────────────────────────────

  describe('softDelete', () => {
    it('soft-deletes vehicle with no active bookings', async () => {
      const vehicle = makeVehicle({ bookings: [] });
      mockPrisma.vehicle.findFirst.mockResolvedValue(vehicle);
      mockPrisma.vehicle.update.mockResolvedValue({
        ...vehicle,
        deletedAt: new Date(),
        status: 'RETIRED',
      });

      await vehicleService.softDelete('vehicle-uuid-1');

      expect(mockPrisma.vehicle.update).toHaveBeenCalledWith({
        where: { id: 'vehicle-uuid-1' },
        data: { deletedAt: expect.any(Date), status: 'RETIRED' },
      });
    });

    it('throws not found when vehicle does not exist', async () => {
      mockPrisma.vehicle.findFirst.mockResolvedValue(null);

      await expect(vehicleService.softDelete('nonexistent')).rejects.toThrow(
        'Vehicle not found',
      );
    });

    it('throws conflict when vehicle has active bookings', async () => {
      const vehicle = makeVehicle({
        bookings: [{ id: 'booking-uuid-1' }, { id: 'booking-uuid-2' }],
      });
      mockPrisma.vehicle.findFirst.mockResolvedValue(vehicle);

      await expect(vehicleService.softDelete('vehicle-uuid-1')).rejects.toThrow(
        'Cannot delete vehicle: 2 active booking(s) exist',
      );
    });
  });

  // ── changeStatus ───────────────────────────────────────────────────

  describe('changeStatus', () => {
    it('updates vehicle status', async () => {
      const vehicle = makeVehicle();
      mockPrisma.vehicle.findFirst.mockResolvedValue(vehicle);
      mockPrisma.vehicle.update.mockResolvedValue({
        ...vehicle,
        status: 'IN_MAINTENANCE',
      });

      const result = await vehicleService.changeStatus('vehicle-uuid-1', {
        status: 'IN_MAINTENANCE',
      });

      expect(result.status).toBe('IN_MAINTENANCE');
    });

    it('throws not found when vehicle does not exist', async () => {
      mockPrisma.vehicle.findFirst.mockResolvedValue(null);

      await expect(
        vehicleService.changeStatus('nonexistent', { status: 'AVAILABLE' }),
      ).rejects.toThrow('Vehicle not found');
    });
  });

  // ── bulkChangeStatus ──────────────────────────────────────────────

  describe('bulkChangeStatus', () => {
    it('updates multiple vehicles and returns count', async () => {
      mockPrisma.vehicle.updateMany.mockResolvedValue({ count: 3 });

      const result = await vehicleService.bulkChangeStatus({
        vehicleIds: ['uuid-1', 'uuid-2', 'uuid-3'],
        status: 'UNAVAILABLE',
      });

      expect(result.updatedCount).toBe(3);
      expect(mockPrisma.vehicle.updateMany).toHaveBeenCalledWith({
        where: {
          id: { in: ['uuid-1', 'uuid-2', 'uuid-3'] },
          deletedAt: null,
        },
        data: { status: 'UNAVAILABLE' },
      });
    });
  });

  // ── addImages ──────────────────────────────────────────────────────

  describe('addImages', () => {
    it('adds images to a vehicle with correct sortOrder', async () => {
      const vehicle = makeVehicle({ _count: { images: 2 } });
      mockPrisma.vehicle.findFirst.mockResolvedValue(vehicle);
      mockPrisma.vehicleImage.aggregate.mockResolvedValue({
        _max: { sortOrder: 1 },
      });

      const newImages = [
        makeImage({ id: 'img-uuid-2', sortOrder: 2 }),
        makeImage({ id: 'img-uuid-3', sortOrder: 3 }),
      ];
      mockPrisma.$transaction.mockResolvedValue(newImages);

      const result = await vehicleService.addImages('vehicle-uuid-1', {
        images: [
          { imageUrl: 'https://example.com/img2.jpg' },
          { imageUrl: 'https://example.com/img3.jpg' },
        ],
      });

      expect(result).toHaveLength(2);
      expect(mockPrisma.$transaction).toHaveBeenCalledOnce();
    });

    it('throws not found when vehicle does not exist', async () => {
      mockPrisma.vehicle.findFirst.mockResolvedValue(null);

      await expect(
        vehicleService.addImages('nonexistent', {
          images: [{ imageUrl: 'https://example.com/img.jpg' }],
        }),
      ).rejects.toThrow('Vehicle not found');
    });

    it('throws bad request when exceeding max image limit', async () => {
      const vehicle = makeVehicle({ _count: { images: 9 } });
      mockPrisma.vehicle.findFirst.mockResolvedValue(vehicle);

      await expect(
        vehicleService.addImages('vehicle-uuid-1', {
          images: [
            { imageUrl: 'https://example.com/img1.jpg' },
            { imageUrl: 'https://example.com/img2.jpg' },
          ],
        }),
      ).rejects.toThrow('Maximum 10 images per vehicle');
    });

    it('allows adding images up to the exact limit', async () => {
      const vehicle = makeVehicle({ _count: { images: 8 } });
      mockPrisma.vehicle.findFirst.mockResolvedValue(vehicle);
      mockPrisma.vehicleImage.aggregate.mockResolvedValue({
        _max: { sortOrder: 7 },
      });
      mockPrisma.$transaction.mockResolvedValue([makeImage(), makeImage()]);

      const result = await vehicleService.addImages('vehicle-uuid-1', {
        images: [
          { imageUrl: 'https://example.com/img1.jpg' },
          { imageUrl: 'https://example.com/img2.jpg' },
        ],
      });

      expect(result).toHaveLength(2);
    });
  });

  // ── reorderImages ──────────────────────────────────────────────────

  describe('reorderImages', () => {
    it('updates sortOrders and returns reordered images', async () => {
      const vehicle = makeVehicle();
      mockPrisma.vehicle.findFirst.mockResolvedValue(vehicle);
      mockPrisma.$transaction.mockResolvedValue([]);
      const reorderedImages = [
        makeImage({ id: 'img-1', sortOrder: 0 }),
        makeImage({ id: 'img-2', sortOrder: 1 }),
      ];
      mockPrisma.vehicleImage.findMany.mockResolvedValue(reorderedImages);

      const result = await vehicleService.reorderImages('vehicle-uuid-1', {
        images: [
          { id: 'img-1', sortOrder: 0 },
          { id: 'img-2', sortOrder: 1 },
        ],
      });

      expect(result).toHaveLength(2);
      expect(mockPrisma.$transaction).toHaveBeenCalledOnce();
    });
  });

  // ── deleteImage ────────────────────────────────────────────────────

  describe('deleteImage', () => {
    it('deletes image when found', async () => {
      const image = makeImage();
      mockPrisma.vehicleImage.findFirst.mockResolvedValue(image);
      mockPrisma.vehicleImage.delete.mockResolvedValue(image);

      await vehicleService.deleteImage('vehicle-uuid-1', 'img-uuid-1');

      expect(mockPrisma.vehicleImage.delete).toHaveBeenCalledWith({
        where: { id: 'img-uuid-1' },
      });
    });

    it('throws not found when image does not exist', async () => {
      mockPrisma.vehicleImage.findFirst.mockResolvedValue(null);

      await expect(
        vehicleService.deleteImage('vehicle-uuid-1', 'nonexistent'),
      ).rejects.toThrow('Image not found');
    });
  });

  // ── listPublic ─────────────────────────────────────────────────────

  describe('listPublic', () => {
    it('returns only AVAILABLE, non-deleted vehicles', async () => {
      const vehicles = [makeVehicle()];
      mockPrisma.vehicle.findMany.mockResolvedValue(vehicles);
      mockPrisma.vehicle.count.mockResolvedValue(1);

      const result = await vehicleService.listPublic({
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      expect(result.vehicles).toHaveLength(1);
      expect(mockPrisma.vehicle.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            deletedAt: null,
            status: 'AVAILABLE',
          }),
        }),
      );
    });

    it('applies category and transmission filters for public listing', async () => {
      mockPrisma.vehicle.findMany.mockResolvedValue([]);
      mockPrisma.vehicle.count.mockResolvedValue(0);

      await vehicleService.listPublic({
        page: 1,
        limit: 20,
        categoryId: 'cat-uuid-1',
        transmission: 'AUTOMATIC',
        sortBy: 'dailyRate',
        sortOrder: 'asc',
      });

      expect(mockPrisma.vehicle.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'AVAILABLE',
            categoryId: 'cat-uuid-1',
            transmission: 'AUTOMATIC',
          }),
          orderBy: { dailyRate: 'asc' },
        }),
      );
    });

    it('applies price range filters for public listing', async () => {
      mockPrisma.vehicle.findMany.mockResolvedValue([]);
      mockPrisma.vehicle.count.mockResolvedValue(0);

      await vehicleService.listPublic({
        page: 1,
        limit: 20,
        minPrice: 50,
        maxPrice: 200,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      expect(mockPrisma.vehicle.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            dailyRate: { gte: 50, lte: 200 },
          }),
        }),
      );
    });
  });

  // ── getPublicById ──────────────────────────────────────────────────

  describe('getPublicById', () => {
    it('returns vehicle when available and not deleted', async () => {
      const vehicle = makeVehicle();
      mockPrisma.vehicle.findFirst.mockResolvedValue(vehicle);

      const result = await vehicleService.getPublicById('vehicle-uuid-1');

      expect(result.id).toBe('vehicle-uuid-1');
      expect(mockPrisma.vehicle.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'vehicle-uuid-1', deletedAt: null, status: 'AVAILABLE' },
        }),
      );
    });

    it('throws not found when vehicle is not available', async () => {
      mockPrisma.vehicle.findFirst.mockResolvedValue(null);

      await expect(vehicleService.getPublicById('unavailable-uuid')).rejects.toThrow(
        'Vehicle not found',
      );
    });
  });
});
