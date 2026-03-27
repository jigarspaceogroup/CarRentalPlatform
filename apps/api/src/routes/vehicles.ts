import { Router } from 'express';
import { asyncHandler } from '../utils/async-handler';
import { validate } from '../middleware/validate';
import {
  vehicleFilterQuerySchema,
  vehicleIdParamSchema,
} from '../validation/vehicle.schema';
import * as vehicleController from '../controllers/vehicle.controller';

export const publicVehicleRouter = Router();

/**
 * @openapi
 * /vehicles:
 *   get:
 *     tags:
 *       - Vehicles
 *     summary: Browse vehicles
 *     description: Browse available vehicles in the public catalog. Only returns AVAILABLE vehicles that have not been soft-deleted.
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
 *           maximum: 100
 *           default: 20
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by make or model
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: transmission
 *         schema:
 *           type: string
 *           enum: [AUTOMATIC, MANUAL]
 *       - in: query
 *         name: fuelType
 *         schema:
 *           type: string
 *           enum: [PETROL, DIESEL, ELECTRIC, HYBRID]
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *           minimum: 0
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *           minimum: 0
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [dailyRate, createdAt, year]
 *           default: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: Paginated list of available vehicles
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
 *                       make:
 *                         type: string
 *                       model:
 *                         type: string
 *                       year:
 *                         type: integer
 *                       dailyRate:
 *                         type: number
 *                       transmission:
 *                         type: string
 *                       fuelType:
 *                         type: string
 *                       seats:
 *                         type: integer
 *                       category:
 *                         type: object
 *                       branch:
 *                         type: object
 *                       images:
 *                         type: array
 *                 meta:
 *                   $ref: '#/components/schemas/PaginationMeta'
 */
publicVehicleRouter.get(
  '/',
  validate(vehicleFilterQuerySchema, 'query'),
  asyncHandler(vehicleController.listPublic),
);

/**
 * @openapi
 * /vehicles/{id}:
 *   get:
 *     tags:
 *       - Vehicles
 *     summary: Get vehicle detail
 *     description: Get detailed information about an available vehicle. Returns 404 if the vehicle is not available or has been deleted.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Vehicle detail with images, features, pricing, category, and branch
 *       404:
 *         description: Vehicle not found or not available
 */
publicVehicleRouter.get(
  '/:id',
  validate(vehicleIdParamSchema, 'params'),
  asyncHandler(vehicleController.getPublicById),
);
