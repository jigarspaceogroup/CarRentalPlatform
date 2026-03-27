import type { Request, Response } from 'express';
import * as categoryService from '../services/category.service';
import { successResponse } from '../utils/response';

/**
 * GET /admin/categories
 * List all categories as tree structure (admin).
 */
export async function listAll(_req: Request, res: Response): Promise<void> {
  const categories = await categoryService.listAll();
  res.json(successResponse(categories));
}

/**
 * GET /categories
 * List active categories as tree structure (public).
 */
export async function listPublic(_req: Request, res: Response): Promise<void> {
  const categories = await categoryService.listPublic();
  res.json(successResponse(categories));
}

/**
 * GET /admin/categories/:id
 * Get a single category by ID.
 */
export async function getById(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const category = await categoryService.getById(id as string);
  res.json(successResponse(category));
}

/**
 * POST /admin/categories
 * Create a new vehicle category.
 */
export async function create(req: Request, res: Response): Promise<void> {
  const category = await categoryService.create(req.body);
  res.status(201).json(successResponse(category));
}

/**
 * PUT /admin/categories/:id
 * Update an existing vehicle category.
 */
export async function update(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const category = await categoryService.update(id as string, req.body);
  res.json(successResponse(category));
}

/**
 * DELETE /admin/categories/:id
 * Delete a vehicle category.
 */
export async function remove(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  await categoryService.remove(id as string);
  res.json(successResponse({ message: 'Category deleted successfully' }));
}

/**
 * PUT /admin/categories/reorder
 * Bulk update category sort order.
 */
export async function reorder(req: Request, res: Response): Promise<void> {
  await categoryService.reorder(req.body.items);
  res.json(successResponse({ message: 'Categories reordered successfully' }));
}
