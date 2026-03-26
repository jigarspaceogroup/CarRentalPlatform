import { Router } from 'express';
import { asyncHandler } from '../utils/async-handler';
import * as categoryController from '../controllers/category.controller';

export const publicCategoryRouter = Router();

/**
 * @openapi
 * /categories:
 *   get:
 *     tags:
 *       - Categories
 *     summary: List active categories
 *     description: Returns all active vehicle categories as a tree structure for the customer app
 *     responses:
 *       200:
 *         description: Active category tree
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
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       nameEn:
 *                         type: string
 *                       nameAr:
 *                         type: string
 *                       descriptionEn:
 *                         type: string
 *                       descriptionAr:
 *                         type: string
 *                       imageUrl:
 *                         type: string
 *                       sortOrder:
 *                         type: integer
 *                       subcategories:
 *                         type: array
 *                         items:
 *                           type: object
 */
publicCategoryRouter.get('/', asyncHandler(categoryController.listPublic));
