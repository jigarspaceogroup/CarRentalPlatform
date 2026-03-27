import { z } from 'zod';
import { uuidSchema } from '@crp/shared';

/** List customers query */
export const listCustomersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  sortBy: z.enum(['createdAt', 'fullName', 'email', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

/** Customer ID param */
export const customerIdParamSchema = z.object({
  id: uuidSchema,
});

/** Update customer status body */
export const updateCustomerStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED']),
  reason: z.string().trim().max(500).optional(),
});

/** Export customers query */
export const exportCustomersQuerySchema = z.object({
  search: z.string().trim().optional(),
});

export type ListCustomersQuery = z.infer<typeof listCustomersQuerySchema>;
export type UpdateCustomerStatusInput = z.infer<typeof updateCustomerStatusSchema>;
export type ExportCustomersQuery = z.infer<typeof exportCustomersQuerySchema>;
