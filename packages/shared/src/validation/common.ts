import { z } from 'zod';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '../constants/app';

/** UUID validation */
export const uuidSchema = z.string().uuid();

/** Pagination query schema */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
});

/** Sort query schema */
export const sortSchema = z.object({
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

/** Search query schema */
export const searchSchema = z.object({
  search: z.string().trim().optional(),
});

/** Date range schema */
export const dateRangeSchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
}).refine(
  (data) => data.endDate > data.startDate,
  { message: 'End date must be after start date' }
);

/** Bilingual text schema */
export const bilingualTextSchema = z.object({
  en: z.string().trim().min(1, 'English text is required'),
  ar: z.string().trim().min(1, 'Arabic text is required'),
});

/** Optional bilingual text schema */
export const optionalBilingualTextSchema = z.object({
  en: z.string().trim().optional(),
  ar: z.string().trim().optional(),
});
