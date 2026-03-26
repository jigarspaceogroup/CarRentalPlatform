import { Router } from 'express';
import { asyncHandler } from '../../utils/async-handler';
import { validate } from '../../middleware/validate';
import { requireAuth, requireStaff } from '../../middleware/auth';
import {
  createBranchSchema,
  updateBranchSchema,
  setOperatingHoursSchema,
  activateBranchSchema,
  branchIdParamSchema,
  branchListQuerySchema,
} from '../../validation/branch.schema';
import * as branchController from '../../controllers/branch.controller';

export const adminBranchRouter = Router();

// All admin branch routes require staff authentication
adminBranchRouter.use(requireAuth, requireStaff);

/**
 * @openapi
 * /admin/branches:
 *   get:
 *     tags:
 *       - Admin - Branches
 *     summary: List all branches
 *     description: Returns all branches with pagination and optional search/filter
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: string
 *           enum: ['true', 'false']
 *     responses:
 *       200:
 *         description: Paginated branch list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Branch'
 *                 meta:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *       401:
 *         description: Unauthorized
 */
adminBranchRouter.get(
  '/',
  validate(branchListQuerySchema, 'query'),
  asyncHandler(branchController.listAll),
);

/**
 * @openapi
 * /admin/branches:
 *   post:
 *     tags:
 *       - Admin - Branches
 *     summary: Create branch
 *     description: Create a new branch location
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nameEn
 *               - nameAr
 *               - addressEn
 *               - addressAr
 *               - latitude
 *               - longitude
 *             properties:
 *               nameEn:
 *                 type: string
 *                 example: Downtown Branch
 *               nameAr:
 *                 type: string
 *                 example: فرع وسط المدينة
 *               addressEn:
 *                 type: string
 *               addressAr:
 *                 type: string
 *               latitude:
 *                 type: number
 *                 example: 24.7136
 *               longitude:
 *                 type: number
 *                 example: 46.6753
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               isActive:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Branch created
 *       400:
 *         description: Validation error
 */
adminBranchRouter.post(
  '/',
  validate(createBranchSchema),
  asyncHandler(branchController.create),
);

/**
 * @openapi
 * /admin/branches/{id}:
 *   get:
 *     tags:
 *       - Admin - Branches
 *     summary: Get branch by ID
 *     description: Get branch details with operating hours and vehicle count
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
 *         description: Branch detail
 *       404:
 *         description: Branch not found
 */
adminBranchRouter.get(
  '/:id',
  validate(branchIdParamSchema, 'params'),
  asyncHandler(branchController.getById),
);

/**
 * @openapi
 * /admin/branches/{id}:
 *   put:
 *     tags:
 *       - Admin - Branches
 *     summary: Update branch
 *     description: Update an existing branch
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nameEn:
 *                 type: string
 *               nameAr:
 *                 type: string
 *               addressEn:
 *                 type: string
 *               addressAr:
 *                 type: string
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Branch updated
 *       400:
 *         description: Validation error
 *       404:
 *         description: Branch not found
 */
adminBranchRouter.put(
  '/:id',
  validate(branchIdParamSchema, 'params'),
  validate(updateBranchSchema),
  asyncHandler(branchController.update),
);

/**
 * @openapi
 * /admin/branches/{id}/hours:
 *   put:
 *     tags:
 *       - Admin - Branches
 *     summary: Set operating hours
 *     description: Set or update operating hours for a branch. Upserts hours for each specified day (0=Sunday to 6=Saturday).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - hours
 *             properties:
 *               hours:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - dayOfWeek
 *                   properties:
 *                     dayOfWeek:
 *                       type: integer
 *                       minimum: 0
 *                       maximum: 6
 *                       description: "0=Sunday, 1=Monday, ..., 6=Saturday"
 *                     isClosed:
 *                       type: boolean
 *                       default: false
 *                     openTime:
 *                       type: string
 *                       pattern: "^([01]\\d|2[0-3]):([0-5]\\d)$"
 *                       example: "08:00"
 *                     closeTime:
 *                       type: string
 *                       pattern: "^([01]\\d|2[0-3]):([0-5]\\d)$"
 *                       example: "22:00"
 *     responses:
 *       200:
 *         description: Operating hours updated
 *       400:
 *         description: Validation error
 *       404:
 *         description: Branch not found
 */
adminBranchRouter.put(
  '/:id/hours',
  validate(branchIdParamSchema, 'params'),
  validate(setOperatingHoursSchema),
  asyncHandler(branchController.setOperatingHours),
);

/**
 * @openapi
 * /admin/branches/{id}/activate:
 *   put:
 *     tags:
 *       - Admin - Branches
 *     summary: Activate/deactivate branch
 *     description: Toggle the active status of a branch
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isActive
 *             properties:
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Branch status updated
 *       404:
 *         description: Branch not found
 */
adminBranchRouter.put(
  '/:id/activate',
  validate(branchIdParamSchema, 'params'),
  validate(activateBranchSchema),
  asyncHandler(branchController.activate),
);
