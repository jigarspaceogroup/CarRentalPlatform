import { Router } from 'express';
import { healthRouter } from './health';
import { authRouter } from './auth';
import { adminRouter } from './admin';
import { publicCategoryRouter } from './categories';
import { publicBranchRouter } from './branches';
import { publicVehicleRouter } from './vehicles';
import { bookingRouter } from './bookings';
import { vehicleAvailabilityRouter } from './vehicle-availability';
import { paymentRouter, savedCardRouter } from './payments';
import { notificationRouter } from './notifications';

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

// Vehicle availability check (requires auth)
apiRouter.use('/vehicles', vehicleAvailabilityRouter);

// Customer booking routes
apiRouter.use('/bookings', bookingRouter);

// Payment routes (customer)
apiRouter.use('/payments', paymentRouter);

// Saved card routes (customer)
apiRouter.use('/saved-cards', savedCardRouter);

// Notification routes (customer)
apiRouter.use('/notifications', notificationRouter);
