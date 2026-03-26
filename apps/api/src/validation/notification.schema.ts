import { z } from 'zod';
import { uuidSchema } from '@crp/shared';

// ---------------------------------------------------------------------------
// Customer notification schemas
// ---------------------------------------------------------------------------

/** List notifications query params */
export const listNotificationsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

/** Mark single notification as read */
export const markAsReadSchema = z.object({
  id: uuidSchema,
});

/** Update notification preferences */
export const updatePreferencesSchema = z.object({
  bookingUpdates: z.boolean().optional(),
  promotional: z.boolean().optional(),
  reminders: z.boolean().optional(),
});

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------

export type ListNotificationsQuery = z.infer<typeof listNotificationsSchema>;
export type MarkAsReadParams = z.infer<typeof markAsReadSchema>;
export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;
