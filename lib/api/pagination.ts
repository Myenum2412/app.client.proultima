/**
 * Pagination utilities and types
 */

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface InfiniteQueryResponse<T> {
  data: T[];
  nextCursor?: string | number | null;
  hasMore: boolean;
}

/**
 * Parse pagination parameters from URL search params
 */
export function parsePaginationParams(searchParams: URLSearchParams): { page: number; pageSize: number } {
  const page = searchParams.get("page");
  const pageSize = searchParams.get("pageSize");

  return {
    page: page ? Math.max(1, parseInt(page, 10)) : 1,
    pageSize: pageSize ? Math.max(1, Math.min(100, parseInt(pageSize, 10))) : 20,
  };
}

/**
 * Create paginated response from data array
 */
export function createPaginatedResponse<T>(
  data: T[],
  page: number,
  pageSize: number
): PaginatedResponse<T> {
  const total = data.length;
  const totalPages = Math.ceil(total / pageSize);
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = data.slice(startIndex, endIndex);

  return {
    data: paginatedData,
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
}

/**
 * Create infinite query response from data array
 */
export function createInfiniteResponse<T>(
  data: T[],
  cursor: number | string | null,
  limit: number
): InfiniteQueryResponse<T> {
  const startIndex = cursor ? (typeof cursor === "number" ? cursor : parseInt(cursor, 10)) : 0;
  const endIndex = startIndex + limit;
  const paginatedData = data.slice(startIndex, endIndex);
  const hasMore = endIndex < data.length;
  const nextCursor = hasMore ? endIndex : null;

  return {
    data: paginatedData,
    nextCursor,
    hasMore,
  };
}

