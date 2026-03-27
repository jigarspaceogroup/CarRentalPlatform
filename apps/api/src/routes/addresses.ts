import { Router } from 'express';
import { asyncHandler } from '../utils/async-handler';
import { validate } from '../middleware/validate';
import { requireAuth } from '../middleware/auth';
import { successResponse } from '../utils/response';
import {
  addressIdParamSchema,
  createAddressSchema,
  updateAddressSchema,
} from '../validation/address.schema';
import * as settingsService from '../services/settings.service';
import type { Request, Response } from 'express';

export const addressRouter = Router();
addressRouter.use(requireAuth);

addressRouter.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const addresses = await settingsService.getAddresses(req.user!.userId);
    res.json(successResponse(addresses));
  }),
);

addressRouter.post(
  '/',
  validate(createAddressSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const address = await settingsService.createAddress(req.user!.userId, req.body);
    res.status(201).json(successResponse(address));
  }),
);

addressRouter.put(
  '/:id',
  validate(addressIdParamSchema, 'params'),
  validate(updateAddressSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const address = await settingsService.updateAddress(req.user!.userId, req.params.id as string, req.body);
    res.json(successResponse(address));
  }),
);

addressRouter.delete(
  '/:id',
  validate(addressIdParamSchema, 'params'),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await settingsService.deleteAddress(req.user!.userId, req.params.id as string);
    res.json(successResponse(result));
  }),
);

addressRouter.put(
  '/:id/default',
  validate(addressIdParamSchema, 'params'),
  asyncHandler(async (req: Request, res: Response) => {
    const address = await settingsService.setDefaultAddress(req.user!.userId, req.params.id as string);
    res.json(successResponse(address));
  }),
);
