import { Router } from 'express';
import { asyncHandler } from '../../utils/async-handler';
import { requireAuth, requireStaff } from '../../middleware/auth';
import * as dashboardController from '../../controllers/dashboard.controller';

export const adminDashboardRouter = Router();

// All dashboard routes require staff authentication
adminDashboardRouter.use(requireAuth, requireStaff);

/**
 * @openapi
 * /admin/dashboard/stats:
 *   get:
 *     tags:
 *       - Admin - Dashboard
 *     summary: Get dashboard statistics
 *     description: >
 *       Returns aggregate dashboard data including active bookings, today's pickups/returns,
 *       fleet availability, today's revenue, recent bookings list, and fleet status breakdown.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     stats:
 *                       type: object
 *                       properties:
 *                         activeBookings:
 *                           type: integer
 *                           example: 12
 *                           description: Count of bookings with active statuses
 *                         todayPickups:
 *                           type: integer
 *                           example: 4
 *                           description: Count of bookings with pickup scheduled today
 *                         todayReturns:
 *                           type: integer
 *                           example: 3
 *                           description: Count of active rentals with return scheduled today
 *                         fleetAvailability:
 *                           type: integer
 *                           example: 28
 *                           description: Count of vehicles currently available
 *                         todayRevenue:
 *                           type: number
 *                           format: double
 *                           example: 4280.50
 *                           description: Sum of completed payment amounts for today
 *                     recentBookings:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           referenceNumber:
 *                             type: string
 *                             example: BK-2026-0001
 *                           customerName:
 *                             type: string
 *                             example: Ahmed Al-Farsi
 *                           vehicle:
 *                             type: string
 *                             example: Toyota Camry
 *                           pickupDate:
 *                             type: string
 *                             format: date-time
 *                           returnDate:
 *                             type: string
 *                             format: date-time
 *                           status:
 *                             type: string
 *                             enum:
 *                               - PENDING
 *                               - CONFIRMED
 *                               - VEHICLE_PREPARING
 *                               - READY_FOR_PICKUP
 *                               - ACTIVE_RENTAL
 *                               - RETURN_PENDING
 *                               - COMPLETED
 *                               - CANCELLED
 *                               - REJECTED
 *                     fleetStatus:
 *                       type: object
 *                       properties:
 *                         available:
 *                           type: integer
 *                           example: 28
 *                         rented:
 *                           type: integer
 *                           example: 18
 *                         inMaintenance:
 *                           type: integer
 *                           example: 4
 *                         total:
 *                           type: integer
 *                           example: 50
 *       401:
 *         description: Unauthorized - access token is required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - staff access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
adminDashboardRouter.get('/stats', asyncHandler(dashboardController.getStats));
