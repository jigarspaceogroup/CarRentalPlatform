import { z } from 'zod';
import { uuidSchema } from '@crp/shared';

/** Vehicle status enum values */
const vehicleStatusEnum = z.enum(['AVAILABLE', 'UNAVAILABLE', 'IN_MAINTENANCE', 'RETIRED']);

/** Transmission type enum values */
const transmissionTypeEnum = z.enum(['AUTOMATIC', 'MANUAL']);

/** Fuel type enum values */
const fuelTypeEnum = z.enum(['PETROL', 'DIESEL', 'ELECTRIC', 'HYBRID']);

/** Sortable fields for vehicle listing */
const vehicleSortByEnum = z.enum(['dailyRate', 'createdAt', 'year']);

/** Create vehicle schema */
export const createVehicleSchema = z.object({
  make: z.string().trim().min(1, 'Make is required').max(100),
  model: z.string().trim().min(1, 'Model is required').max(100),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 2),
  licensePlate: z
    .string()
    .trim()
    .min(1, 'License plate is required')
    .max(20),
  categoryId: uuidSchema,
  branchId: uuidSchema,
  transmission: transmissionTypeEnum,
  fuelType: fuelTypeEnum,
  seats: z.number().int().min(1).max(50),
  doors: z.number().int().min(1).max(10),
  trunkCapacity: z.string().trim().max(50).optional().nullable(),
  mileagePolicy: z.string().trim().optional().nullable(),
  features: z.array(z.string().trim().min(1)).default([]),
  dailyRate: z.number().positive('Daily rate must be positive'),
  weeklyRate: z.number().positive('Weekly rate must be positive').optional().nullable(),
  monthlyRate: z.number().positive('Monthly rate must be positive').optional().nullable(),
  longTermRate: z.number().positive('Long-term rate must be positive').optional().nullable(),
});

/** Update vehicle schema (all fields optional) */
export const updateVehicleSchema = z.object({
  make: z.string().trim().min(1).max(100).optional(),
  model: z.string().trim().min(1).max(100).optional(),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 2).optional(),
  licensePlate: z.string().trim().min(1).max(20).optional(),
  categoryId: uuidSchema.optional(),
  branchId: uuidSchema.optional(),
  transmission: transmissionTypeEnum.optional(),
  fuelType: fuelTypeEnum.optional(),
  seats: z.number().int().min(1).max(50).optional(),
  doors: z.number().int().min(1).max(10).optional(),
  trunkCapacity: z.string().trim().max(50).optional().nullable(),
  mileagePolicy: z.string().trim().optional().nullable(),
  features: z.array(z.string().trim().min(1)).optional(),
  dailyRate: z.number().positive('Daily rate must be positive').optional(),
  weeklyRate: z.number().positive('Weekly rate must be positive').optional().nullable(),
  monthlyRate: z.number().positive('Monthly rate must be positive').optional().nullable(),
  longTermRate: z.number().positive('Long-term rate must be positive').optional().nullable(),
});

/** Vehicle filter query schema (admin + public) */
export const vehicleFilterQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  categoryId: z.string().uuid('Invalid category ID').optional(),
  branchId: z.string().uuid('Invalid branch ID').optional(),
  status: vehicleStatusEnum.optional(),
  transmission: transmissionTypeEnum.optional(),
  fuelType: fuelTypeEnum.optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  sortBy: vehicleSortByEnum.default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

/** Change vehicle status schema */
export const changeStatusSchema = z.object({
  status: vehicleStatusEnum,
});

/** Bulk status change schema */
export const bulkStatusSchema = z.object({
  vehicleIds: z.array(uuidSchema).min(1, 'At least one vehicle ID is required').max(100),
  status: vehicleStatusEnum,
});

/** Add images schema */
export const addImagesSchema = z.object({
  images: z
    .array(
      z.object({
        imageUrl: z.string().url('Invalid image URL'),
        thumbnailUrl: z.string().url('Invalid thumbnail URL').optional().nullable(),
      }),
    )
    .min(1, 'At least one image is required')
    .max(10, 'Maximum 10 images per request'),
});

/** Reorder images schema */
export const reorderImagesSchema = z.object({
  images: z
    .array(
      z.object({
        id: uuidSchema,
        sortOrder: z.number().int().min(0),
      }),
    )
    .min(1, 'At least one image is required'),
});

/** UUID param schema */
export const vehicleIdParamSchema = z.object({
  id: uuidSchema,
});

/** Vehicle + image ID params schema */
export const vehicleImageIdParamSchema = z.object({
  id: uuidSchema,
  imageId: z.string().uuid('Invalid image ID'),
});

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;
export type VehicleFilterQuery = z.infer<typeof vehicleFilterQuerySchema>;
export type ChangeStatusInput = z.infer<typeof changeStatusSchema>;
export type BulkStatusInput = z.infer<typeof bulkStatusSchema>;
export type AddImagesInput = z.infer<typeof addImagesSchema>;
export type ReorderImagesInput = z.infer<typeof reorderImagesSchema>;
