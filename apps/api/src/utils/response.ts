import type { ApiResponse, ApiError, PaginationMeta } from '@crp/shared';

export function successResponse<T>(data: T, meta?: PaginationMeta): ApiResponse<T> {
  return {
    success: true,
    data,
    ...(meta && { meta }),
  };
}

export function errorResponse(code: string, message: string, details?: Record<string, string[]>): ApiResponse {
  const error: ApiError = { code, message };
  if (details) {
    error.details = details;
  }
  return {
    success: false,
    error,
  };
}

export function paginationMeta(page: number, limit: number, total: number): PaginationMeta {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}
