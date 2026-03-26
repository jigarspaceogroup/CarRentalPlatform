import { z } from 'zod';
import { uuidSchema } from '@crp/shared';

// ---------------------------------------------------------------------------
// OTP Validation Schemas
// ---------------------------------------------------------------------------

/** Generate OTP body - admin generates OTP for a booking */
export const generateOtpBodySchema = z.object({
  channel: z.enum(['SMS', 'PUSH', 'BOTH']).optional(),
});

/** Booking ID param (reusable for all OTP routes) */
export const otpBookingIdParamSchema = z.object({
  id: uuidSchema,
});

// ---------------------------------------------------------------------------
// Composite schemas (for routes that validate both params and body)
// ---------------------------------------------------------------------------

/** Generate OTP - full schema */
export const generateOtpSchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),
  body: z.object({
    channel: z.enum(['SMS', 'PUSH', 'BOTH']).optional(),
  }).default({}),
});

/** Sign contract - params only */
export const signContractSchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),
});

/** Request new OTP - params only */
export const requestNewOtpSchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),
});

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------

export type GenerateOtpBody = z.infer<typeof generateOtpBodySchema>;
export type OtpBookingIdParam = z.infer<typeof otpBookingIdParamSchema>;
