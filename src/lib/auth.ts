import { createMiddleware } from 'hono/factory';
import { AppError } from './errors';
import type { Bindings, Variables } from './env';

export const requireAdminAuth = createMiddleware<
  { Bindings: Bindings; Variables: Variables }
>(async (c, next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError('Unauthorized', 'UNAUTHORIZED', 401);
  }

  const token = authHeader.slice('Bearer '.length).trim();
  const adminKey = c.env.ADMIN_API_KEY;

  if (!adminKey) {
    throw new AppError('Admin auth not configured', 'AUTH_NOT_CONFIGURED', 500);
  }

  // Use timing-safe comparison if available; otherwise use constant-time length
  // then byte compare. Both token and adminKey are strings.
  if (token.length !== adminKey.length) {
    throw new AppError('Unauthorized', 'UNAUTHORIZED', 401);
  }
  let equal = 0;
  for (let i = 0; i < token.length; i++) {
    equal |= token.charCodeAt(i) ^ adminKey.charCodeAt(i);
  }
  if (equal !== 0) {
    throw new AppError('Unauthorized', 'UNAUTHORIZED', 401);
  }

  c.set('isAdmin', true);
  await next();
});
