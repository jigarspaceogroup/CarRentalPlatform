import { z } from 'zod';
import { uuidSchema } from '@crp/shared';

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

const paymentMethodEnum = z.enum(['CREDIT_CARD', 'DEBIT_CARD', 'CASH_ON_DELIVERY']);
const paymentStatusEnum = z.enum([
  'PENDING',
  'COMPLETED',
  'FAILED',
  'REFUNDED',
  'PARTIALLY_REFUNDED',
]);

// ---------------------------------------------------------------------------
// Customer schemas
// ---------------------------------------------------------------------------

/** POST /payments - Initiate a payment for a booking */
export const initiatePaymentSchema = z
  .object({
    bookingId: uuidSchema,
    method: paymentMethodEnum,
    savedCardId: uuidSchema.optional(),
    cardToken: z.string().min(1, 'Card token is required').optional(),
  })
  .refine(
    (data) => {
      // Card payments must supply either a savedCardId or a cardToken
      if (data.method === 'CREDIT_CARD' || data.method === 'DEBIT_CARD') {
        return Boolean(data.savedCardId || data.cardToken);
      }
      return true;
    },
    {
      message: 'Card payment requires either savedCardId or cardToken',
      path: ['cardToken'],
    },
  );

export type InitiatePaymentInput = z.infer<typeof initiatePaymentSchema>;

/** POST /saved-cards - Save a new card */
export const saveCardSchema = z.object({
  gatewayToken: z.string().min(1, 'Gateway token is required'),
  lastFour: z
    .string()
    .length(4, 'Must be exactly 4 digits')
    .regex(/^\d{4}$/, 'Must be 4 digits'),
  cardBrand: z.string().trim().min(1, 'Card brand is required').max(50),
  expiryMonth: z.number().int().min(1, 'Min 1').max(12, 'Max 12'),
  expiryYear: z
    .number()
    .int()
    .min(2024, 'Card must not be expired')
    .max(2099, 'Invalid year'),
});

export type SaveCardInput = z.infer<typeof saveCardSchema>;

/** Param schema for saved card routes */
export const savedCardIdParamSchema = z.object({
  id: uuidSchema,
});

// ---------------------------------------------------------------------------
// Admin schemas
// ---------------------------------------------------------------------------

/** GET /admin/payments */
export const adminListPaymentsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  method: paymentMethodEnum.optional(),
  status: paymentStatusEnum.optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  search: z.string().trim().optional(),
});

export type AdminListPaymentsQuery = z.infer<typeof adminListPaymentsQuerySchema>;

/** Param schema for admin payment routes */
export const paymentIdParamSchema = z.object({
  id: uuidSchema,
});

/** POST /admin/payments/:id/refund */
export const processRefundSchema = z.object({
  amount: z.number().positive('Refund amount must be positive'),
  reason: z.string().trim().min(1, 'Reason is required').max(1000),
});

export type ProcessRefundInput = z.infer<typeof processRefundSchema>;

/** GET /admin/payments/summary */
export const financialSummaryQuerySchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export type FinancialSummaryQuery = z.infer<typeof financialSummaryQuerySchema>;

/** GET /admin/payments/export */
export const exportPaymentsQuerySchema = z.object({
  method: paymentMethodEnum.optional(),
  status: paymentStatusEnum.optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export type ExportPaymentsQuery = z.infer<typeof exportPaymentsQuerySchema>;
