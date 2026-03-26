import type { Request, Response } from 'express';
import * as vehicleService from '../services/vehicle.service';
import { successResponse, paginationMeta } from '../utils/response';

// ---------------------------------------------------------------------------
// Admin endpoints
// ---------------------------------------------------------------------------

/**
 * GET /admin/vehicles
 * List vehicles with filters, pagination, and sorting.
 */
export async function list(req: Request, res: Response): Promise<void> {
  const result = await vehicleService.list(req.query as any);
  res.json(
    successResponse(
      result.vehicles,
      paginationMeta(result.page, result.limit, result.total),
    ),
  );
}

/**
 * GET /admin/vehicles/:id
 * Get a single vehicle by ID.
 */
export async function getById(req: Request, res: Response): Promise<void> {
  const vehicle = await vehicleService.getById(req.params.id as string);
  res.json(successResponse(vehicle));
}

/**
 * POST /admin/vehicles
 * Create a new vehicle.
 */
export async function create(req: Request, res: Response): Promise<void> {
  const vehicle = await vehicleService.create(req.body);
  res.status(201).json(successResponse(vehicle));
}

/**
 * PUT /admin/vehicles/:id
 * Update an existing vehicle.
 */
export async function update(req: Request, res: Response): Promise<void> {
  const vehicle = await vehicleService.update(req.params.id as string, req.body);
  res.json(successResponse(vehicle));
}

/**
 * DELETE /admin/vehicles/:id
 * Soft-delete a vehicle.
 */
export async function remove(req: Request, res: Response): Promise<void> {
  await vehicleService.softDelete(req.params.id as string);
  res.json(successResponse({ message: 'Vehicle deleted successfully' }));
}

/**
 * PUT /admin/vehicles/:id/status
 * Change vehicle status.
 */
export async function changeStatus(req: Request, res: Response): Promise<void> {
  const vehicle = await vehicleService.changeStatus(req.params.id as string, req.body);
  res.json(successResponse(vehicle));
}

/**
 * PUT /admin/vehicles/bulk-status
 * Bulk-change vehicle status.
 */
export async function bulkChangeStatus(req: Request, res: Response): Promise<void> {
  const result = await vehicleService.bulkChangeStatus(req.body);
  res.json(successResponse(result));
}

// ---------------------------------------------------------------------------
// Images
// ---------------------------------------------------------------------------

/**
 * POST /admin/vehicles/:id/images
 * Add images to a vehicle.
 */
export async function addImages(req: Request, res: Response): Promise<void> {
  const images = await vehicleService.addImages(req.params.id as string, req.body);
  res.status(201).json(successResponse(images));
}

/**
 * PUT /admin/vehicles/:id/images/reorder
 * Reorder vehicle images.
 */
export async function reorderImages(req: Request, res: Response): Promise<void> {
  const images = await vehicleService.reorderImages(req.params.id as string, req.body);
  res.json(successResponse(images));
}

/**
 * DELETE /admin/vehicles/:id/images/:imageId
 * Delete a vehicle image.
 */
export async function deleteImage(req: Request, res: Response): Promise<void> {
  await vehicleService.deleteImage(req.params.id as string, req.params.imageId as string);
  res.json(successResponse({ message: 'Image deleted successfully' }));
}

// ---------------------------------------------------------------------------
// Public endpoints
// ---------------------------------------------------------------------------

/**
 * GET /vehicles
 * Browse available vehicles (public catalog).
 */
export async function listPublic(req: Request, res: Response): Promise<void> {
  const result = await vehicleService.listPublic(req.query as any);
  res.json(
    successResponse(
      result.vehicles,
      paginationMeta(result.page, result.limit, result.total),
    ),
  );
}

/**
 * GET /vehicles/:id
 * Get available vehicle detail (public).
 */
export async function getPublicById(req: Request, res: Response): Promise<void> {
  const vehicle = await vehicleService.getPublicById(req.params.id as string);
  res.json(successResponse(vehicle));
}
