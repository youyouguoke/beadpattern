import { describe, it, expect, beforeAll } from 'vitest';
import { env } from 'cloudflare:test';
import app from '../src/index';

const baseUrl = 'http://localhost/api';
const ADMIN_API_KEY = 'admin-beadpatternai-studio';

async function adminRequest(method: string, path: string, body?: Record<string, unknown>, token?: string) {
  const headers: Record<string, string> = { Authorization: `Bearer ${token ?? ADMIN_API_KEY}` };
  if (body) {
    headers['Content-Type'] = 'application/json';
  }
  const res = await app.fetch(
    new Request(`${baseUrl}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    }),
    { ...env, ADMIN_API_KEY }
  );
  return res;
}

async function json(res: Response) {
  return res.json();
}

describe('Admin Auth', () => {
  beforeAll(async () => {
    if (!(env as Record<string, unknown>).ADMIN_API_KEY) {
      (env as Record<string, unknown>).ADMIN_API_KEY = ADMIN_API_KEY;
    }
  });

  it('rejects requests without Authorization', async () => {
    const res = await app.fetch(new Request(`${baseUrl}/admin/dashboard`), env);
    expect(res.status).toBe(401);
    const body = await json(res) as { success: boolean; error: { code: string } };
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('rejects invalid Bearer token', async () => {
    const res = await adminRequest('GET', '/admin/dashboard', undefined, 'wrong-key');
    expect(res.status).toBe(401);
  });

  it('accepts valid Bearer token', async () => {
    const res = await adminRequest('GET', '/admin/auth');
    expect(res.status).toBe(200);
    const body = await json(res) as { success: boolean; data: { authenticated: boolean } };
    expect(body.success).toBe(true);
    expect(body.data.authenticated).toBe(true);
  });

  it('lists admin dashboard with auth', async () => {
    const res = await adminRequest('GET', '/admin/dashboard');
    expect(res.status).toBe(200);
    const body = await json(res) as { success: boolean; data: unknown };
    expect(body.success).toBe(true);
  });
});
