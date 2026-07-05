import type { AppContext } from './context';
import type { StatusCode } from 'hono/utils/http-status';

export interface ApiResponse<T = unknown> {
  success: true;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

export function success<T>(data: T, meta?: ApiResponse<T>['meta']): ApiResponse<T> {
  const response: ApiResponse<T> = { success: true, data };
  if (meta) {
    response.meta = meta;
  }
  return response;
}

export function paginated<T>(data: T[], pagination: { page: number; limit: number; total: number }) {
  const { page, limit, total } = pagination;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return success(data, {
    page,
    limit,
    total,
    totalPages,
  });
}

export function errorResponse(code: string, message: string, status: StatusCode) {
  return (c: AppContext) => {
    c.status(status);
    return c.json({ success: false, error: { code, message } });
  };
}
