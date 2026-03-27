import { Router } from 'express';
import { adminAuthRouter } from './auth';
import { adminDashboardRouter } from './dashboard';
import { adminCategoryRouter } from './categories';
import { adminBranchRouter } from './branches';
import { adminVehicleRouter } from './vehicles';
import { adminBookingRouter } from './bookings';
import { adminPaymentRouter } from './payments';
import { adminOtpRouter } from './otp';

import { adminCustomerRouter } from './customers';
import { adminTicketRouter } from './tickets';
import { adminSettingsRouter } from './settings';

export const adminRouter = Router();

// Staff authentication (login, refresh, logout, password reset)
adminRouter.use('/auth', adminAuthRouter);

// Dashboard statistics
adminRouter.use('/dashboard', adminDashboardRouter);

// Vehicle category management
adminRouter.use('/categories', adminCategoryRouter);

// Branch / location management
adminRouter.use('/branches', adminBranchRouter);

// Vehicle fleet management
adminRouter.use('/vehicles', adminVehicleRouter);

// Booking management
adminRouter.use('/bookings', adminBookingRouter);

// OTP management (nested under /bookings/:id/otp)
adminRouter.use('/bookings', adminOtpRouter);

// Payment & financial management
adminRouter.use('/payments', adminPaymentRouter);

// Customer management
adminRouter.use('/', adminCustomerRouter);

// Support ticket management
adminRouter.use('/', adminTicketRouter);

// Business settings & platform config
adminRouter.use('/', adminSettingsRouter);
