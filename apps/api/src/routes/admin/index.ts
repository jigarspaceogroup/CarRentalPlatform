import { Router } from 'express';
import { adminAuthRouter } from './auth';
import { adminCategoryRouter } from './categories';
import { adminBranchRouter } from './branches';

export const adminRouter = Router();

// Staff authentication (login, refresh, logout, password reset)
adminRouter.use('/auth', adminAuthRouter);

// Vehicle category management
adminRouter.use('/categories', adminCategoryRouter);

// Branch / location management
adminRouter.use('/branches', adminBranchRouter);
