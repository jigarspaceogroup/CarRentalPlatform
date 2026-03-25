import { Router } from 'express';
import { successResponse } from '../utils/response';

export const healthRouter = Router();

healthRouter.get('/', (_req, res) => {
  res.json(successResponse({ status: 'ok', timestamp: new Date().toISOString() }));
});
