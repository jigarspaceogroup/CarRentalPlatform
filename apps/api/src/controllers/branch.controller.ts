import type { Request, Response } from 'express';
import * as branchService from '../services/branch.service';
import { successResponse, paginationMeta } from '../utils/response';
import type { BranchListQuery } from '../validation/branch.schema';

/**
 * GET /admin/branches
 * List all branches with pagination (admin).
 */
export async function listAll(req: Request, res: Response): Promise<void> {
  const query = req.query as unknown as BranchListQuery;
  const result = await branchService.listAll(query);
  const meta = paginationMeta(result.page, result.limit, result.total);
  res.json(successResponse(result.branches, meta));
}

/**
 * GET /branches
 * List active branches with operating hours (public).
 */
export async function listPublic(_req: Request, res: Response): Promise<void> {
  const branches = await branchService.listPublic();
  res.json(successResponse(branches));
}

/**
 * GET /admin/branches/:id or /branches/:id
 * Get a single branch by ID.
 */
export async function getById(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const branch = await branchService.getById(id as string);
  res.json(successResponse(branch));
}

/**
 * POST /admin/branches
 * Create a new branch.
 */
export async function create(req: Request, res: Response): Promise<void> {
  const branch = await branchService.create(req.body);
  res.status(201).json(successResponse(branch));
}

/**
 * PUT /admin/branches/:id
 * Update an existing branch.
 */
export async function update(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const branch = await branchService.update(id as string, req.body);
  res.json(successResponse(branch));
}

/**
 * PUT /admin/branches/:id/hours
 * Set operating hours for a branch.
 */
export async function setOperatingHours(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const branch = await branchService.setOperatingHours(id as string, req.body.hours);
  res.json(successResponse(branch));
}

/**
 * PUT /admin/branches/:id/activate
 * Activate or deactivate a branch.
 */
export async function activate(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const branch = await branchService.activate(id as string, req.body.isActive);
  res.json(successResponse(branch));
}
