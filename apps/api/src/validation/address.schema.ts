import { z } from 'zod';
import { uuidSchema } from '@crp/shared';

// ---------------------------------------------------------------------------
// Address schemas
// ---------------------------------------------------------------------------

/** Address ID param */
export const addressIdParamSchema = z.object({
  id: uuidSchema,
});

/** Create address body */
export const createAddressSchema = z.object({
  label: z.string().trim().min(1, 'Label is required').max(50),
  fullAddress: z.string().trim().min(1, 'Address is required'),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  isDefault: z.boolean().default(false),
});

/** Update address body */
export const updateAddressSchema = z.object({
  label: z.string().trim().min(1).max(50).optional(),
  fullAddress: z.string().trim().min(1).optional(),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  isDefault: z.boolean().optional(),
});

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CreateAddressInput = z.infer<typeof createAddressSchema>;
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;
