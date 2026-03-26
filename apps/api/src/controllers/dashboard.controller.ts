import type { Request, Response } from 'express';
import * as dashboardService from '../services/dashboard.service';
import { successResponse } from '../utils/response';

/**
 * GET /admin/dashboard/stats
 * Returns all dashboard data: stats, recent bookings, fleet status.
 */
export async function getStats(_req: Request, res: Response): Promise<void> {
  const [stats, recentBookings, fleetStatus] = await Promise.all([
    dashboardService.getStats(),
    dashboardService.getRecentBookings(10),
    dashboardService.getFleetStatus(),
  ]);

  res.json(
    successResponse({
      stats,
      recentBookings,
      fleetStatus,
    }),
  );
}
