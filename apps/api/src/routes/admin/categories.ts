import { Router } from 'express';
import { asyncHandler } from '../../utils/async-handler';
import { validate } from '../../middleware/validate';
import { requireAuth, requireStaff } from '../../middleware/auth';
import {
  createCategorySchema,
  updateCategorySchema,
  reorderCategoriesSchema,
  categoryIdParamSchema,
} from '../../validation/category.schema';
import * as categoryController from '../../controllers/category.controller';

export const adminCategoryRouter = Router();

// All admin category routes require staff authentication
adminCategoryRouter.use(requireAuth, requireStaff);

/**
 * @openapi
 * /admin/categories:
 *   get:
 *     tags:
 *       - Admin - Categories
 *     summary: List all categories
 *     description: Returns all vehicle categories as a tree structure (includes inactive)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Category tree
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
 *                     $ref: '#/components/schemas/CategoryTree'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Staff access required
 */
adminCategoryRouter.get('/', asyncHandler(categoryController.listAll));

/**
 * @openapi
 * /admin/categories/reorder:
 *   put:
 *     tags:
 *       - Admin - Categories
 *     summary: Reorder categories
 *     description: Bulk update sort order for multiple categories
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - id
 *                     - sortOrder
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     sortOrder:
 *                       type: integer
 *                       minimum: 0
 *     responses:
 *       200:
 *         description: Categories reordered
 *       401:
 *         description: Unauthorized
 */
adminCategoryRouter.put(
  '/reorder',
  validate(reorderCategoriesSchema),
  asyncHandler(categoryController.reorder),
);

/**
 * @openapi
 * /admin/categories:
 *   post:
 *     tags:
 *       - Admin - Categories
 *     summary: Create category
 *     description: Create a new vehicle category
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
 *             properties:
 *               nameEn:
 *                 type: string
 *                 example: SUV
 *               nameAr:
 *                 type: string
 *                 example: دفع رباعي
 *               descriptionEn:
 *                 type: string
 *               descriptionAr:
 *                 type: string
 *               parentId:
 *                 type: string
 *                 format: uuid
 *               imageUrl:
 *                 type: string
 *                 format: uri
 *               sortOrder:
 *                 type: integer
 *                 default: 0
 *               isActive:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Category created
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
adminCategoryRouter.post(
  '/',
  validate(createCategorySchema),
  asyncHandler(categoryController.create),
);

/**
 * @openapi
 * /admin/categories/{id}:
 *   get:
 *     tags:
 *       - Admin - Categories
 *     summary: Get category by ID
 *     description: Get a single vehicle category with parent and subcategories
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
 *         description: Category detail
 *       404:
 *         description: Category not found
 */
adminCategoryRouter.get(
  '/:id',
  validate(categoryIdParamSchema, 'params'),
  asyncHandler(categoryController.getById),
);

/**
 * @openapi
 * /admin/categories/{id}:
 *   put:
 *     tags:
 *       - Admin - Categories
 *     summary: Update category
 *     description: Update an existing vehicle category
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
 *               descriptionEn:
 *                 type: string
 *               descriptionAr:
 *                 type: string
 *               parentId:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *               imageUrl:
 *                 type: string
 *                 format: uri
 *                 nullable: true
 *               sortOrder:
 *                 type: integer
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Category updated
 *       400:
 *         description: Validation error
 *       404:
 *         description: Category not found
 */
adminCategoryRouter.put(
  '/:id',
  validate(categoryIdParamSchema, 'params'),
  validate(updateCategorySchema),
  asyncHandler(categoryController.update),
);

/**
 * @openapi
 * /admin/categories/{id}:
 *   delete:
 *     tags:
 *       - Admin - Categories
 *     summary: Delete category
 *     description: Delete a vehicle category. Blocked if vehicles are assigned or subcategories exist.
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
 *         description: Category deleted
 *       404:
 *         description: Category not found
 *       409:
 *         description: Cannot delete - vehicles or subcategories exist
 */
adminCategoryRouter.delete(
  '/:id',
  validate(categoryIdParamSchema, 'params'),
  asyncHandler(categoryController.remove),
);
