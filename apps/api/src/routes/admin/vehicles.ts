import { Router } from 'express';
import { asyncHandler } from '../../utils/async-handler';
import { validate } from '../../middleware/validate';
import { requireAuth, requireStaff, requireRole } from '../../middleware/auth';
import type { StaffRole } from '@crp/shared';
import {
  createVehicleSchema,
  updateVehicleSchema,
  vehicleFilterQuerySchema,
  vehicleIdParamSchema,
  vehicleImageIdParamSchema,
  changeStatusSchema,
  bulkStatusSchema,
  addImagesSchema,
  reorderImagesSchema,
} from '../../validation/vehicle.schema';
import * as vehicleController from '../../controllers/vehicle.controller';

export const adminVehicleRouter = Router();

// All admin vehicle routes require staff authentication
adminVehicleRouter.use(requireAuth, requireStaff);

// ---------------------------------------------------------------------------
// Bulk operations (before /:id to avoid route conflicts)
// ---------------------------------------------------------------------------

/**
 * @openapi
 * /admin/vehicles/bulk-status:
 *   put:
 *     tags:
 *       - Admin - Vehicles
 *     summary: Bulk change vehicle status
 *     description: Update the status of multiple vehicles at once
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vehicleIds
 *               - status
 *             properties:
 *               vehicleIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 minItems: 1
 *                 maxItems: 100
 *               status:
 *                 type: string
 *                 enum: [AVAILABLE, UNAVAILABLE, IN_MAINTENANCE, RETIRED]
 *     responses:
 *       200:
 *         description: Status updated for matching vehicles
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
 *                     updatedCount:
 *                       type: integer
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
adminVehicleRouter.put(
  '/bulk-status',
  requireRole('ADMIN' as StaffRole, 'MANAGER' as StaffRole),
  validate(bulkStatusSchema),
  asyncHandler(vehicleController.bulkChangeStatus),
);

// ---------------------------------------------------------------------------
// Collection routes
// ---------------------------------------------------------------------------

/**
 * @openapi
 * /admin/vehicles:
 *   get:
 *     tags:
 *       - Admin - Vehicles
 *     summary: List vehicles
 *     description: List all vehicles with filtering, search, pagination, and sorting. Excludes soft-deleted vehicles.
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
 *           maximum: 100
 *           default: 20
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by make, model, or license plate
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: branchId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [AVAILABLE, UNAVAILABLE, IN_MAINTENANCE, RETIRED]
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
 *         description: Paginated list of vehicles
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
 *                     $ref: '#/components/schemas/Vehicle'
 *                 meta:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Staff access required
 */
adminVehicleRouter.get(
  '/',
  validate(vehicleFilterQuerySchema, 'query'),
  asyncHandler(vehicleController.list),
);

/**
 * @openapi
 * /admin/vehicles:
 *   post:
 *     tags:
 *       - Admin - Vehicles
 *     summary: Create vehicle
 *     description: Create a new vehicle in the fleet catalog
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - make
 *               - model
 *               - year
 *               - licensePlate
 *               - categoryId
 *               - branchId
 *               - transmission
 *               - fuelType
 *               - seats
 *               - doors
 *               - dailyRate
 *             properties:
 *               make:
 *                 type: string
 *                 example: Toyota
 *               model:
 *                 type: string
 *                 example: Camry
 *               year:
 *                 type: integer
 *                 example: 2025
 *               licensePlate:
 *                 type: string
 *                 example: ABC-1234
 *               categoryId:
 *                 type: string
 *                 format: uuid
 *               branchId:
 *                 type: string
 *                 format: uuid
 *               transmission:
 *                 type: string
 *                 enum: [AUTOMATIC, MANUAL]
 *               fuelType:
 *                 type: string
 *                 enum: [PETROL, DIESEL, ELECTRIC, HYBRID]
 *               seats:
 *                 type: integer
 *                 example: 5
 *               doors:
 *                 type: integer
 *                 example: 4
 *               trunkCapacity:
 *                 type: string
 *                 example: Large
 *               mileagePolicy:
 *                 type: string
 *               features:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: [Bluetooth, GPS, Leather Seats]
 *               dailyRate:
 *                 type: number
 *                 example: 150.00
 *               weeklyRate:
 *                 type: number
 *                 example: 900.00
 *               monthlyRate:
 *                 type: number
 *                 example: 3200.00
 *               longTermRate:
 *                 type: number
 *                 example: 2800.00
 *     responses:
 *       201:
 *         description: Vehicle created
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       409:
 *         description: Duplicate license plate
 */
adminVehicleRouter.post(
  '/',
  requireRole('ADMIN' as StaffRole, 'MANAGER' as StaffRole),
  validate(createVehicleSchema),
  asyncHandler(vehicleController.create),
);

// ---------------------------------------------------------------------------
// Single vehicle routes
// ---------------------------------------------------------------------------

/**
 * @openapi
 * /admin/vehicles/{id}:
 *   get:
 *     tags:
 *       - Admin - Vehicles
 *     summary: Get vehicle by ID
 *     description: Get a single vehicle with category, branch, and images
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
 *         description: Vehicle detail
 *       404:
 *         description: Vehicle not found
 */
adminVehicleRouter.get(
  '/:id',
  validate(vehicleIdParamSchema, 'params'),
  asyncHandler(vehicleController.getById),
);

/**
 * @openapi
 * /admin/vehicles/{id}:
 *   put:
 *     tags:
 *       - Admin - Vehicles
 *     summary: Update vehicle
 *     description: Update an existing vehicle. All fields are optional.
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
 *               make:
 *                 type: string
 *               model:
 *                 type: string
 *               year:
 *                 type: integer
 *               licensePlate:
 *                 type: string
 *               categoryId:
 *                 type: string
 *                 format: uuid
 *               branchId:
 *                 type: string
 *                 format: uuid
 *               transmission:
 *                 type: string
 *                 enum: [AUTOMATIC, MANUAL]
 *               fuelType:
 *                 type: string
 *                 enum: [PETROL, DIESEL, ELECTRIC, HYBRID]
 *               seats:
 *                 type: integer
 *               doors:
 *                 type: integer
 *               trunkCapacity:
 *                 type: string
 *                 nullable: true
 *               mileagePolicy:
 *                 type: string
 *                 nullable: true
 *               features:
 *                 type: array
 *                 items:
 *                   type: string
 *               dailyRate:
 *                 type: number
 *               weeklyRate:
 *                 type: number
 *                 nullable: true
 *               monthlyRate:
 *                 type: number
 *                 nullable: true
 *               longTermRate:
 *                 type: number
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Vehicle updated
 *       400:
 *         description: Validation error
 *       404:
 *         description: Vehicle not found
 *       409:
 *         description: Duplicate license plate
 */
adminVehicleRouter.put(
  '/:id',
  requireRole('ADMIN' as StaffRole, 'MANAGER' as StaffRole),
  validate(vehicleIdParamSchema, 'params'),
  validate(updateVehicleSchema),
  asyncHandler(vehicleController.update),
);

/**
 * @openapi
 * /admin/vehicles/{id}:
 *   delete:
 *     tags:
 *       - Admin - Vehicles
 *     summary: Soft-delete vehicle
 *     description: Soft-delete a vehicle. Blocked if the vehicle has active bookings.
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
 *         description: Vehicle deleted
 *       404:
 *         description: Vehicle not found
 *       409:
 *         description: Cannot delete - active bookings exist
 */
adminVehicleRouter.delete(
  '/:id',
  requireRole('ADMIN' as StaffRole, 'MANAGER' as StaffRole),
  validate(vehicleIdParamSchema, 'params'),
  asyncHandler(vehicleController.remove),
);

/**
 * @openapi
 * /admin/vehicles/{id}/status:
 *   put:
 *     tags:
 *       - Admin - Vehicles
 *     summary: Change vehicle status
 *     description: Update the status of a single vehicle
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
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [AVAILABLE, UNAVAILABLE, IN_MAINTENANCE, RETIRED]
 *     responses:
 *       200:
 *         description: Status updated
 *       400:
 *         description: Validation error
 *       404:
 *         description: Vehicle not found
 */
adminVehicleRouter.put(
  '/:id/status',
  validate(vehicleIdParamSchema, 'params'),
  validate(changeStatusSchema),
  asyncHandler(vehicleController.changeStatus),
);

// ---------------------------------------------------------------------------
// Image routes
// ---------------------------------------------------------------------------

/**
 * @openapi
 * /admin/vehicles/{id}/images:
 *   post:
 *     tags:
 *       - Admin - Vehicles
 *     summary: Add vehicle images
 *     description: Add images to a vehicle. Maximum 10 images per vehicle.
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
 *               - images
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - imageUrl
 *                   properties:
 *                     imageUrl:
 *                       type: string
 *                       format: uri
 *                     thumbnailUrl:
 *                       type: string
 *                       format: uri
 *                 minItems: 1
 *                 maxItems: 10
 *     responses:
 *       201:
 *         description: Images added
 *       400:
 *         description: Validation error or maximum exceeded
 *       404:
 *         description: Vehicle not found
 */
adminVehicleRouter.post(
  '/:id/images',
  validate(vehicleIdParamSchema, 'params'),
  validate(addImagesSchema),
  asyncHandler(vehicleController.addImages),
);

/**
 * @openapi
 * /admin/vehicles/{id}/images/reorder:
 *   put:
 *     tags:
 *       - Admin - Vehicles
 *     summary: Reorder vehicle images
 *     description: Update the sort order of vehicle images
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
 *               - images
 *             properties:
 *               images:
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
 *         description: Images reordered
 *       404:
 *         description: Vehicle not found
 */
adminVehicleRouter.put(
  '/:id/images/reorder',
  validate(vehicleIdParamSchema, 'params'),
  validate(reorderImagesSchema),
  asyncHandler(vehicleController.reorderImages),
);

/**
 * @openapi
 * /admin/vehicles/{id}/images/{imageId}:
 *   delete:
 *     tags:
 *       - Admin - Vehicles
 *     summary: Delete vehicle image
 *     description: Delete a single image from a vehicle
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: imageId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Image deleted
 *       404:
 *         description: Image not found
 */
adminVehicleRouter.delete(
  '/:id/images/:imageId',
  validate(vehicleImageIdParamSchema, 'params'),
  asyncHandler(vehicleController.deleteImage),
);
