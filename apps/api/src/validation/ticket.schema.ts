import { z } from 'zod';
import { uuidSchema } from '@crp/shared';

// ---------------------------------------------------------------------------
// Ticket enums (matching Prisma schema)
// ---------------------------------------------------------------------------

const ticketStatusEnum = z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']);
const ticketPriorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH']);
const ticketCategoryEnum = z.enum(['BILLING', 'VEHICLE_ISSUE', 'GENERAL_INQUIRY', 'COMPLAINT']);
const senderTypeEnum = z.enum(['customer', 'staff']);

// ---------------------------------------------------------------------------
// Query / param schemas
// ---------------------------------------------------------------------------

/** List tickets query */
export const listTicketsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: ticketStatusEnum.optional(),
  priority: ticketPriorityEnum.optional(),
  category: ticketCategoryEnum.optional(),
  assignedTo: uuidSchema.optional(),
  search: z.string().trim().optional(),
});

/** Ticket ID param */
export const ticketIdParamSchema = z.object({
  id: uuidSchema,
});

// ---------------------------------------------------------------------------
// Body schemas
// ---------------------------------------------------------------------------

/** Create ticket body */
export const createTicketSchema = z.object({
  customerId: uuidSchema,
  bookingId: uuidSchema.optional(),
  category: ticketCategoryEnum,
  subject: z.string().trim().min(1, 'Subject is required').max(255),
  description: z.string().trim().min(1, 'Description is required').max(5000),
  priority: ticketPriorityEnum.default('MEDIUM'),
});

/** Update ticket body */
export const updateTicketSchema = z.object({
  status: ticketStatusEnum.optional(),
  priority: ticketPriorityEnum.optional(),
  assignedToStaffId: uuidSchema.nullable().optional(),
});

/** Add message body */
export const addMessageSchema = z.object({
  senderType: senderTypeEnum,
  content: z.string().trim().min(1, 'Message content is required').max(5000),
});

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ListTicketsQuery = z.infer<typeof listTicketsQuerySchema>;
export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;
export type AddMessageInput = z.infer<typeof addMessageSchema>;
