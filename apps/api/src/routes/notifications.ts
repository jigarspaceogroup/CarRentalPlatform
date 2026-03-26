import { Router } from 'express';
import { asyncHandler } from '../utils/async-handler';
import { validate } from '../middleware/validate';
import { requireAuth } from '../middleware/auth';
import {
  listNotificationsSchema,
  markAsReadSchema,
  updatePreferencesSchema,
} from '../validation/notification.schema';
import * as notificationService from '../services/notification.service';
import { successResponse, paginationMeta } from '../utils/response';
import type { Request, Response } from 'express';

export const notificationRouter = Router();

// All notification routes require authentication
notificationRouter.use(requireAuth);

// ---------------------------------------------------------------------------
// Notification CRUD
// ---------------------------------------------------------------------------

/**
 * @openapi
 * /notifications:
 *   get:
 *     tags:
 *       - Notifications
 *     summary: List notifications
 *     description: List all notifications for the authenticated user with pagination.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 20
 *     responses:
 *       200:
 *         description: Paginated list of notifications
 *       401:
 *         description: Unauthorized
 */
notificationRouter.get(
  '/',
  validate(listNotificationsSchema, 'query'),
  asyncHandler(async (req: Request, res: Response) => {
    const { page, limit } = req.query as unknown as { page: number; limit: number };
    const result = await notificationService.listNotifications(
      req.user!.userId,
      page,
      limit,
    );
    res.json(
      successResponse(
        result.notifications,
        paginationMeta(result.page, result.limit, result.total),
      ),
    );
  }),
);

/**
 * @openapi
 * /notifications/unread-count:
 *   get:
 *     tags:
 *       - Notifications
 *     summary: Get unread count
 *     description: Get the count of unread notifications for the authenticated user.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unread notification count
 *       401:
 *         description: Unauthorized
 */
notificationRouter.get(
  '/unread-count',
  asyncHandler(async (req: Request, res: Response) => {
    const result = await notificationService.getUnreadCount(req.user!.userId);
    res.json(successResponse(result));
  }),
);

/**
 * @openapi
 * /notifications/read-all:
 *   put:
 *     tags:
 *       - Notifications
 *     summary: Mark all as read
 *     description: Mark all unread notifications as read for the authenticated user.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 *       401:
 *         description: Unauthorized
 */
notificationRouter.put(
  '/read-all',
  asyncHandler(async (req: Request, res: Response) => {
    const result = await notificationService.markAllAsRead(req.user!.userId);
    res.json(successResponse(result));
  }),
);

/**
 * @openapi
 * /notifications/{id}/read:
 *   put:
 *     tags:
 *       - Notifications
 *     summary: Mark as read
 *     description: Mark a single notification as read.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Notification marked as read
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Notification not found
 */
notificationRouter.put(
  '/:id/read',
  validate(markAsReadSchema, 'params'),
  asyncHandler(async (req: Request, res: Response) => {
    const notification = await notificationService.markAsRead(
      req.params.id as string,
      req.user!.userId,
    );
    res.json(successResponse(notification));
  }),
);

// ---------------------------------------------------------------------------
// Preferences
// ---------------------------------------------------------------------------

/**
 * @openapi
 * /notifications/preferences:
 *   get:
 *     tags:
 *       - Notifications
 *     summary: Get notification preferences
 *     description: Get notification preferences for the authenticated user.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notification preferences
 *       401:
 *         description: Unauthorized
 */
notificationRouter.get(
  '/preferences',
  asyncHandler(async (req: Request, res: Response) => {
    const preferences = await notificationService.getPreferences(req.user!.userId);
    res.json(successResponse(preferences));
  }),
);

/**
 * @openapi
 * /notifications/preferences:
 *   put:
 *     tags:
 *       - Notifications
 *     summary: Update notification preferences
 *     description: Update notification preferences for the authenticated user.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               bookingUpdates:
 *                 type: boolean
 *               promotional:
 *                 type: boolean
 *               reminders:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Updated notification preferences
 *       401:
 *         description: Unauthorized
 */
notificationRouter.put(
  '/preferences',
  validate(updatePreferencesSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const preferences = await notificationService.updatePreferences(
      req.user!.userId,
      req.body,
    );
    res.json(successResponse(preferences));
  }),
);
