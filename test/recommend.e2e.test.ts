import { describe, it, expect, beforeEach } from 'vitest';
import { env } from 'cloudflare:test';
import app from '../src/index';
import { testPattern } from './fixtures';

const baseUrl = 'http://localhost/api';

async function createPattern(payload: Record<string, unknown>) {
  return app.fetch(
    new Request(`${baseUrl}/patterns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),
    env
  );
}

async function json(res: Response) {
  return res.json();
}

async function resetSlug(slug: string) {
  const db = env.DB;
  const row = await db.prepare('SELECT id FROM patterns WHERE slug = ?').bind(slug).first<{ id: string }>();
  if (!row) return;
  await db.batch([
    db.prepare('DELETE FROM pattern_tags WHERE pattern_id = ?').bind(row.id),
    db.prepare('DELETE FROM pattern_steps WHERE pattern_id = ?').bind(row.id),
    db.prepare('DELETE FROM pattern_faqs WHERE pattern_id = ?').bind(row.id),
    db.prepare('DELETE FROM patterns WHERE id = ?').bind(row.id),
  ]);
}

describe('GET /api/recommend/:slug', () => {
  beforeEach(async () => {
    await resetSlug(testPattern.slug);
    await resetSlug('test-pixel-rec-2');
  });

  it('returns recommended patterns with grid_size, color_count, estimated_beads, color_palette', async () => {
    const res = await createPattern(testPattern);
    expect(res.status).toBe(201);

    const secondary = { ...testPattern, slug: 'test-pixel-rec-2', title: 'Secondary Pixel' };
    const res2 = await createPattern(secondary);
    expect(res2.status).toBe(201);

    const recRes = await app.fetch(new Request(`${baseUrl}/recommend/${testPattern.slug}`), env);
    expect(recRes.status).toBe(200);
    const body = (await json(recRes)) as { success: boolean; data: Array<Record<string, unknown>> };
    expect(body.success).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);

    const first = body.data[0];
    expect(first).toHaveProperty('grid_size');
    expect(first).toHaveProperty('color_count');
    expect(first).toHaveProperty('estimated_beads');
    expect(first).toHaveProperty('color_palette');
    expect(typeof first.estimated_beads).toBe('number');
    expect(first.estimated_beads).toBeGreaterThan(0);
  });
});
