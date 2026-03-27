import { Router } from 'express';
import { asyncHandler } from '../../utils/async-handler';
import { validate } from '../../middleware/validate';
import { requireAuth, requireStaff } from '../../middleware/auth';
import { successResponse, paginationMeta } from '../../utils/response';
import {
  listTicketsQuerySchema,
  ticketIdParamSchema,
  createTicketSchema,
  updateTicketSchema,
  addMessageSchema,
} from '../../validation/ticket.schema';
import * as ticketService from '../../services/ticket.service';
import type { Request, Response } from 'express';

export const adminTicketRouter = Router();
adminTicketRouter.use(requireAuth, requireStaff);

adminTicketRouter.get(
  '/tickets/metrics',
  asyncHandler(async (_req: Request, res: Response) => {
    const metrics = await ticketService.getTicketMetrics();
    res.json(successResponse(metrics));
  }),
);

adminTicketRouter.get(
  '/tickets',
  validate(listTicketsQuerySchema, 'query'),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await ticketService.listTickets(req.query as any);
    res.json(successResponse(result.tickets, paginationMeta(result.page, result.limit, result.total)));
  }),
);

adminTicketRouter.post(
  '/tickets',
  validate(createTicketSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const ticket = await ticketService.createTicket(req.body);
    res.status(201).json(successResponse(ticket));
  }),
);

adminTicketRouter.get(
  '/tickets/:id',
  validate(ticketIdParamSchema, 'params'),
  asyncHandler(async (req: Request, res: Response) => {
    const ticket = await ticketService.getTicketDetail(req.params.id as string);
    res.json(successResponse(ticket));
  }),
);

adminTicketRouter.put(
  '/tickets/:id',
  validate(ticketIdParamSchema, 'params'),
  validate(updateTicketSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const ticket = await ticketService.updateTicket(req.params.id as string, req.body);
    res.json(successResponse(ticket));
  }),
);

adminTicketRouter.post(
  '/tickets/:id/messages',
  validate(ticketIdParamSchema, 'params'),
  validate(addMessageSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { senderType, content } = req.body;
    const senderId = req.user!.userId;
    const message = await ticketService.addMessage(req.params.id as string, senderId, senderType, content);
    res.status(201).json(successResponse(message));
  }),
);
