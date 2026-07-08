import { describe, it, expect, beforeAll } from 'vitest';
import { env } from 'cloudflare:test';
import app from '../src/index';
import { samplePatterns } from '../scripts/content-seed/generate-sample';

const baseUrl = 'http://localhost/api';
const ADMIN_API_KEY = 'admin-beadpatternai-studio';

async function adminRequest(method: string, path: string, body?: Record<string, unknown>, token?: string) {
  const headers: Record<string, string> = { Authorization: `Bearer ${token ?? ADMIN_API_KEY}` };
  if (body) headers['Content-Type'] = 'application/json';
  return app.fetch(
    new Request(`${baseUrl}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined }),
    { ...env, ADMIN_API_KEY }
  );
}

describe('Seed Import', () => {
  beforeAll(() => {
    if (!(env as Record<string, unknown>).ADMIN_API_KEY) {
      (env as Record<string, unknown>).ADMIN_API_KEY = ADMIN_API_KEY;
    }
  });

  it('seed-import sample dry run succeeds', async () => {
    const res = await adminRequest('POST', '/admin/seed-import', { dry_run: true, patterns: samplePatterns });
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.success).toBe(true);
    expect(body.data.dry_run).toBe(true);
    expect(body.data.total).toBe(samplePatterns.length);
    expect(body.data.results.every((r: any) => r.errors.length === 0)).toBe(true);
  });

  it('seed-import sample writes and verifies audit', async () => {
    const res = await adminRequest('POST', '/admin/seed-import', { dry_run: false, patterns: samplePatterns });
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.success).toBe(true);
    for (const r of body.data.results) {
      if (r.errors.length > 0) console.log('seed-import errors', r.slug, r.errors);
    }
    expect(body.data.results.every((r: any) => r.errors.length === 0)).toBe(true);

    const count = await env.DB.prepare('SELECT COUNT(*) as c FROM patterns').first();
    expect((count as any).c).toBeGreaterThanOrEqual(samplePatterns.length);

    const audit = await env.DB.prepare('SELECT * FROM pattern_audit LIMIT 1').all();
    expect(audit.results?.length).toBeGreaterThan(0);
  });
});
