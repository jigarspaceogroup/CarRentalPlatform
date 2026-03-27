import { Router } from 'express';
import { asyncHandler } from '../../utils/async-handler';
import { validate } from '../../middleware/validate';
import { requireAuth, requireStaff } from '../../middleware/auth';
import { successResponse, paginationMeta } from '../../utils/response';
import {
  listCustomersQuerySchema,
  customerIdParamSchema,
  updateCustomerStatusSchema,
  exportCustomersQuerySchema,
} from '../../validation/customer.schema';
import * as customerService from '../../services/customer.service';
import type { Request, Response } from 'express';

export const adminCustomerRouter = Router();
adminCustomerRouter.use(requireAuth, requireStaff);

adminCustomerRouter.get(
  '/customers/export',
  validate(exportCustomersQuerySchema, 'query'),
  asyncHandler(async (req: Request, res: Response) => {
    const csv = await customerService.exportCustomersCsv(req.query as any);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="customers.csv"');
    res.send(csv);
  }),
);

adminCustomerRouter.get(
  '/customers',
  validate(listCustomersQuerySchema, 'query'),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await customerService.listCustomers(req.query as any);
    res.json(successResponse(result.customers, paginationMeta(result.page, result.limit, result.total)));
  }),
);

adminCustomerRouter.get(
  '/customers/:id',
  validate(customerIdParamSchema, 'params'),
  asyncHandler(async (req: Request, res: Response) => {
    const customer = await customerService.getCustomerDetail(req.params.id as string);
    res.json(successResponse(customer));
  }),
);

adminCustomerRouter.put(
  '/customers/:id/status',
  validate(customerIdParamSchema, 'params'),
  validate(updateCustomerStatusSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const updated = await customerService.updateCustomerStatus(req.params.id as string, req.body);
    res.json(successResponse(updated));
  }),
);
