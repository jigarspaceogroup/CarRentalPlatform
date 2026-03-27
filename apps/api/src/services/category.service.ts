import { prisma } from '../db/client';
import { AppError } from '../utils/app-error';
import type {
  CreateCategoryInput,
  UpdateCategoryInput,
  ReorderCategoriesInput,
} from '../validation/category.schema';

interface CategoryWithSubs {
  id: string;
  parentId: string | null;
  nameEn: string;
  nameAr: string;
  descriptionEn: string | null;
  descriptionAr: string | null;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  subcategories: CategoryWithSubs[];
}

/**
 * Build a tree structure from a flat list of categories.
 */
function buildTree(categories: CategoryWithSubs[]): CategoryWithSubs[] {
  const map = new Map<string, CategoryWithSubs>();
  const roots: CategoryWithSubs[] = [];

  // Index all categories by ID
  for (const cat of categories) {
    map.set(cat.id, { ...cat, subcategories: [] });
  }

  // Build parent-child relationships
  for (const cat of categories) {
    const node = map.get(cat.id)!;
    if (cat.parentId && map.has(cat.parentId)) {
      map.get(cat.parentId)!.subcategories.push(node);
    } else {
      roots.push(node);
    }
  }

  // Sort subcategories by sortOrder
  for (const node of map.values()) {
    node.subcategories.sort((a, b) => a.sortOrder - b.sortOrder);
  }

  return roots.sort((a, b) => a.sortOrder - b.sortOrder);
}

/**
 * List all categories as a tree structure (admin).
 * Includes both active and inactive categories.
 */
export async function listAll() {
  const categories = await prisma.vehicleCategory.findMany({
    orderBy: { sortOrder: 'asc' },
    include: { subcategories: true },
  });

  // Flatten and build tree
  const flat = categories.map((c) => ({
    ...c,
    subcategories: [] as CategoryWithSubs[],
  }));

  return buildTree(flat);
}

/**
 * List only active categories as a tree structure (public).
 */
export async function listPublic() {
  const categories = await prisma.vehicleCategory.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  });

  const flat = categories.map((c) => ({
    ...c,
    subcategories: [] as CategoryWithSubs[],
  }));

  return buildTree(flat);
}

/**
 * Get a single category by ID.
 */
export async function getById(id: string) {
  const category = await prisma.vehicleCategory.findUnique({
    where: { id },
    include: {
      parent: {
        select: { id: true, nameEn: true, nameAr: true },
      },
      subcategories: {
        orderBy: { sortOrder: 'asc' },
        select: {
          id: true,
          nameEn: true,
          nameAr: true,
          imageUrl: true,
          sortOrder: true,
          isActive: true,
        },
      },
      _count: {
        select: { vehicles: true },
      },
    },
  });

  if (!category) {
    throw AppError.notFound('Category not found');
  }

  return category;
}

/**
 * Create a new vehicle category.
 */
export async function create(data: CreateCategoryInput) {
  // Validate parentId exists if provided
  if (data.parentId) {
    const parent = await prisma.vehicleCategory.findUnique({
      where: { id: data.parentId },
    });
    if (!parent) {
      throw AppError.badRequest('Parent category not found');
    }
  }

  return prisma.vehicleCategory.create({
    data: {
      nameEn: data.nameEn,
      nameAr: data.nameAr,
      descriptionEn: data.descriptionEn ?? null,
      descriptionAr: data.descriptionAr ?? null,
      parentId: data.parentId ?? null,
      imageUrl: data.imageUrl ?? null,
      sortOrder: data.sortOrder,
      isActive: data.isActive,
    },
  });
}

/**
 * Update an existing vehicle category.
 */
export async function update(id: string, data: UpdateCategoryInput) {
  const existing = await prisma.vehicleCategory.findUnique({ where: { id } });
  if (!existing) {
    throw AppError.notFound('Category not found');
  }

  // Validate parentId if being changed
  if (data.parentId !== undefined) {
    if (data.parentId) {
      // Prevent setting parent to self
      if (data.parentId === id) {
        throw AppError.badRequest('A category cannot be its own parent');
      }
      const parent = await prisma.vehicleCategory.findUnique({
        where: { id: data.parentId },
      });
      if (!parent) {
        throw AppError.badRequest('Parent category not found');
      }
      // Prevent circular references: check if the proposed parent is a descendant
      const descendants = await getDescendantIds(id);
      if (descendants.includes(data.parentId)) {
        throw AppError.badRequest('Cannot set a descendant as parent (circular reference)');
      }
    }
  }

  return prisma.vehicleCategory.update({
    where: { id },
    data: {
      ...(data.nameEn !== undefined && { nameEn: data.nameEn }),
      ...(data.nameAr !== undefined && { nameAr: data.nameAr }),
      ...(data.descriptionEn !== undefined && { descriptionEn: data.descriptionEn }),
      ...(data.descriptionAr !== undefined && { descriptionAr: data.descriptionAr }),
      ...(data.parentId !== undefined && { parentId: data.parentId }),
      ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
      ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
  });
}

/**
 * Delete a category. Blocks if vehicles are assigned.
 */
export async function remove(id: string) {
  const category = await prisma.vehicleCategory.findUnique({
    where: { id },
    include: {
      _count: {
        select: { vehicles: true, subcategories: true },
      },
    },
  });

  if (!category) {
    throw AppError.notFound('Category not found');
  }

  if (category._count.vehicles > 0) {
    throw AppError.conflict(
      `Cannot delete category: ${category._count.vehicles} vehicle(s) are assigned to it`,
    );
  }

  if (category._count.subcategories > 0) {
    throw AppError.conflict(
      `Cannot delete category: ${category._count.subcategories} subcategory(ies) exist under it`,
    );
  }

  await prisma.vehicleCategory.delete({ where: { id } });
}

/**
 * Bulk update sortOrder for multiple categories.
 */
export async function reorder(items: ReorderCategoriesInput['items']) {
  await prisma.$transaction(
    items.map((item) =>
      prisma.vehicleCategory.update({
        where: { id: item.id },
        data: { sortOrder: item.sortOrder },
      }),
    ),
  );
}

/**
 * Recursively collect descendant category IDs.
 */
async function getDescendantIds(categoryId: string): Promise<string[]> {
  const children = await prisma.vehicleCategory.findMany({
    where: { parentId: categoryId },
    select: { id: true },
  });

  const ids: string[] = [];
  for (const child of children) {
    ids.push(child.id);
    const grandchildren = await getDescendantIds(child.id);
    ids.push(...grandchildren);
  }
  return ids;
}
