import { Router } from 'express';
import { asyncHandler } from '../utils/async-handler';
import { validate } from '../middleware/validate';
import { branchIdParamSchema } from '../validation/branch.schema';
import * as branchController from '../controllers/branch.controller';

export const publicBranchRouter = Router();

/**
 * @openapi
 * /branches:
 *   get:
 *     tags:
 *       - Branches
 *     summary: List active branches
 *     description: Returns all active branches with operating hours for the customer app
 *     responses:
 *       200:
 *         description: Active branch list
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
 *                       addressEn:
 *                         type: string
 *                       addressAr:
 *                         type: string
 *                       latitude:
 *                         type: number
 *                       longitude:
 *                         type: number
 *                       phone:
 *                         type: string
 *                       email:
 *                         type: string
 *                       isActive:
 *                         type: boolean
 *                       operatingHours:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             dayOfWeek:
 *                               type: integer
 *                             isClosed:
 *                               type: boolean
 *                             openTime:
 *                               type: string
 *                             closeTime:
 *                               type: string
 */
publicBranchRouter.get('/', asyncHandler(branchController.listPublic));

/**
 * @openapi
 * /branches/{id}:
 *   get:
 *     tags:
 *       - Branches
 *     summary: Get branch detail
 *     description: Get a single branch with operating hours
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Branch detail with operating hours
 *       404:
 *         description: Branch not found
 */
publicBranchRouter.get(
  '/:id',
  validate(branchIdParamSchema, 'params'),
  asyncHandler(branchController.getById),
);
