import { z } from 'zod';

// ---------------------------------------------------------------------------
// Settings schemas
// ---------------------------------------------------------------------------

/** Update business settings body */
export const updateSettingsSchema = z.object({}).catchall(z.string().max(10000));

/** Update platform config body */
export const updatePlatformConfigSchema = z.object({}).catchall(
  z.union([z.string(), z.record(z.unknown()), z.null()]),
);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
export type UpdatePlatformConfigInput = z.infer<typeof updatePlatformConfigSchema>;
