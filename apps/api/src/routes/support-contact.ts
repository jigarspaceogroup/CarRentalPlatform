import { Router } from 'express';
import { asyncHandler } from '../utils/async-handler';
import { requireAuth } from '../middleware/auth';
import { successResponse } from '../utils/response';
import * as settingsService from '../services/settings.service';
import type { Request, Response } from 'express';

export const supportContactRouter = Router();
supportContactRouter.use(requireAuth);

supportContactRouter.get(
  '/',
  asyncHandler(async (_req: Request, res: Response) => {
    const contact = await settingsService.getSupportContact();
    res.json(successResponse(contact));
  }),
);
