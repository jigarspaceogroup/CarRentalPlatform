import { z } from 'zod';
import { uuidSchema } from '@crp/shared';

/** Time string pattern: HH:mm (24-hour) */
const timeStringSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Time must be in HH:mm format (24-hour)');

/** Single operating hour entry */
const operatingHourEntrySchema = z
  .object({
    dayOfWeek: z.number().int().min(0).max(6),
    isClosed: z.boolean().default(false),
    openTime: timeStringSchema.optional().nullable(),
    closeTime: timeStringSchema.optional().nullable(),
  })
  .refine(
    (data) => {
      if (!data.isClosed) {
        return data.openTime != null && data.closeTime != null;
      }
      return true;
    },
    { message: 'Open time and close time are required when the branch is not closed' },
  );

/** Create branch schema */
export const createBranchSchema = z.object({
  nameEn: z.string().trim().min(1, 'English name is required').max(150),
  nameAr: z.string().trim().min(1, 'Arabic name is required').max(150),
  addressEn: z.string().trim().min(1, 'English address is required'),
  addressAr: z.string().trim().min(1, 'Arabic address is required'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  phone: z.string().min(8).max(20).optional().nullable(),
  email: z.string().email('Invalid email address').optional().nullable(),
  isActive: z.boolean().default(true),
});

/** Update branch schema */
export const updateBranchSchema = z.object({
  nameEn: z.string().trim().min(1).max(150).optional(),
  nameAr: z.string().trim().min(1).max(150).optional(),
  addressEn: z.string().trim().min(1).optional(),
  addressAr: z.string().trim().min(1).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  phone: z.string().min(8).max(20).optional().nullable(),
  email: z.string().email('Invalid email address').optional().nullable(),
  isActive: z.boolean().optional(),
});

/** Set operating hours schema */
export const setOperatingHoursSchema = z.object({
  hours: z
    .array(operatingHourEntrySchema)
    .min(1, 'At least one day is required')
    .max(7, 'Maximum 7 days')
    .refine(
      (hours) => {
        const days = hours.map((h) => h.dayOfWeek);
        return new Set(days).size === days.length;
      },
      { message: 'Duplicate day entries are not allowed' },
    ),
});

/** Activate/deactivate branch schema */
export const activateBranchSchema = z.object({
  isActive: z.boolean(),
});

/** Branch ID param schema */
export const branchIdParamSchema = z.object({
  id: uuidSchema,
});

/** Branch list query schema */
export const branchListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  isActive: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
});

export type CreateBranchInput = z.infer<typeof createBranchSchema>;
export type UpdateBranchInput = z.infer<typeof updateBranchSchema>;
export type SetOperatingHoursInput = z.infer<typeof setOperatingHoursSchema>;
export type ActivateBranchInput = z.infer<typeof activateBranchSchema>;
export type BranchListQuery = z.infer<typeof branchListQuerySchema>;
