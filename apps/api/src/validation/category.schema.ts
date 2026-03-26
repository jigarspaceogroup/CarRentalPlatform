import { z } from 'zod';
import { uuidSchema } from '@crp/shared';

/** Create category schema */
export const createCategorySchema = z.object({
  nameEn: z.string().trim().min(1, 'English name is required').max(100),
  nameAr: z.string().trim().min(1, 'Arabic name is required').max(100),
  descriptionEn: z.string().trim().max(2000).optional(),
  descriptionAr: z.string().trim().max(2000).optional(),
  parentId: z.string().uuid('Invalid parent category ID').optional().nullable(),
  imageUrl: z.string().url('Invalid image URL').optional().nullable(),
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

/** Update category schema */
export const updateCategorySchema = z.object({
  nameEn: z.string().trim().min(1).max(100).optional(),
  nameAr: z.string().trim().min(1).max(100).optional(),
  descriptionEn: z.string().trim().max(2000).optional().nullable(),
  descriptionAr: z.string().trim().max(2000).optional().nullable(),
  parentId: z.string().uuid('Invalid parent category ID').optional().nullable(),
  imageUrl: z.string().url('Invalid image URL').optional().nullable(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

/** Reorder categories schema */
export const reorderCategoriesSchema = z.object({
  items: z
    .array(
      z.object({
        id: uuidSchema,
        sortOrder: z.number().int().min(0),
      }),
    )
    .min(1, 'At least one item is required'),
});

/** Category ID param schema */
export const categoryIdParamSchema = z.object({
  id: uuidSchema,
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type ReorderCategoriesInput = z.infer<typeof reorderCategoriesSchema>;
