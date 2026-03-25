import { Router } from 'express';
import { healthRouter } from './health';

export const apiRouter = Router();

// Health check
apiRouter.use('/health', healthRouter);

// Auth routes (to be added in Sprint 1)
// apiRouter.use('/auth', authRouter);
// apiRouter.use('/admin/auth', adminAuthRouter);

// Category routes (to be added in Sprint 1)
// apiRouter.use('/categories', publicCategoryRouter);
// apiRouter.use('/admin/categories', adminCategoryRouter);

// Branch routes (to be added in Sprint 1)
// apiRouter.use('/branches', publicBranchRouter);
// apiRouter.use('/admin/branches', adminBranchRouter);
