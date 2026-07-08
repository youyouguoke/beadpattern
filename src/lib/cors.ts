import { cors } from 'hono/cors';
import type { Hono } from 'hono';
import type { Bindings, Variables } from './env';

const ALLOWED_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'];
const ALLOWED_HEADERS = ['Content-Type', 'Authorization', 'X-Requested-With'];

export function configureCors(app: Hono<{ Bindings: Bindings; Variables: Variables }>) {
  app.use('*', cors({
    origin: (origin, c) => {
      const env = c.env as Bindings;
      if (!origin) return env.APP_ORIGIN ?? '*';
      const allowedOrigins = [
        env.APP_ORIGIN,
        'https://beadpatternai.com',
        'https://www.beadpatternai.com',
        'https://admin.beadpatternai.com',
        'https://beadpatternai.youyouguoke.workers.dev',
        'https://bead-pattern-ai.youyouguoke.workers.dev',
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:8787',
        'http://127.0.0.1:8787',
      ].filter(Boolean);
      if (allowedOrigins.includes(origin)) return origin;
      // Deny unknown origins instead of falling back to wildcard.
      return null;
    },
    allowMethods: ALLOWED_METHODS,
    allowHeaders: ALLOWED_HEADERS,
    credentials: true,
  }));
}
