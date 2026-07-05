import type { Context } from 'hono';
import type { StatusCode } from 'hono/utils/http-status';

export class AppError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string, code: string, statusCode: number = 500) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
  }
}

export function errorHandler(err: Error, c: Context) {
  if (err instanceof AppError) {
    c.status(err.statusCode as StatusCode);
    return c.json({ success: false, error: { code: err.code, message: err.message } });
  }

  console.error('Unhandled error:', err);
  c.status(500);
  return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
}
