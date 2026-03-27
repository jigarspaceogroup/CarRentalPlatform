import { Router } from 'express';
import { asyncHandler } from '../../utils/async-handler';
import { validate } from '../../middleware/validate';
import { requireAuth, requireStaff, requireRole } from '../../middleware/auth';
import { successResponse } from '../../utils/response';
import {
  updateSettingsSchema,
  updatePlatformConfigSchema,
} from '../../validation/settings.schema';
import * as settingsService from '../../services/settings.service';
import type { Request, Response } from 'express';
import { StaffRole } from '@crp/shared';

export const adminSettingsRouter = Router();
adminSettingsRouter.use(requireAuth, requireStaff);

adminSettingsRouter.get(
  '/settings',
  asyncHandler(async (_req: Request, res: Response) => {
    const settings = await settingsService.getAllSettings();
    res.json(successResponse(settings));
  }),
);

adminSettingsRouter.put(
  '/settings',
  requireRole(StaffRole.ADMIN, StaffRole.MANAGER),
  validate(updateSettingsSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const settings = await settingsService.updateSettings(req.body, req.user!.userId);
    res.json(successResponse(settings));
  }),
);

adminSettingsRouter.get(
  '/platform-config',
  asyncHandler(async (_req: Request, res: Response) => {
    const config = await settingsService.getPlatformConfig();
    res.json(successResponse(config));
  }),
);

adminSettingsRouter.put(
  '/platform-config',
  requireRole(StaffRole.ADMIN, StaffRole.MANAGER),
  validate(updatePlatformConfigSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const config = await settingsService.updatePlatformConfig(req.body);
    res.json(successResponse(config));
  }),
);
