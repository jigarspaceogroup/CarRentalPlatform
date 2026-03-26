import { Router } from 'express';
import { healthRouter } from './health';
import { authRouter } from './auth';
import { adminRouter } from './admin';
import { publicCategoryRouter } from './categories';
import { publicBranchRouter } from './branches';
import { publicVehicleRouter } from './vehicles';

export const apiRouter = Router();

// Health check
apiRouter.use('/health', healthRouter);

// Customer auth routes
apiRouter.use('/auth', authRouter);

// Admin routes (staff auth, categories, branches, vehicles management)
apiRouter.use('/admin', adminRouter);

// Public category routes (customer app)
apiRouter.use('/categories', publicCategoryRouter);

// Public branch routes (customer app)
apiRouter.use('/branches', publicBranchRouter);

// Public vehicle routes (customer app)
apiRouter.use('/vehicles', publicVehicleRouter);
