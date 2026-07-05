import { describe, it, expect, beforeEach } from 'vitest';
import { env } from 'cloudflare:test';
import app from '../src/index';
import { testPattern, testPatternLegacyPalette } from './fixtures';

const baseUrl = 'http://localhost/api';

async function createPattern(payload: Record<string, unknown>) {
  const res = await app.fetch(
    new Request(`${baseUrl}/patterns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),
    env
  );
  return res;
}

async function getPattern(slug: string) {
  return app.fetch(new Request(`${baseUrl}/patterns/${slug}`), env);
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
    db.prepare('DELETE FROM patterns WHERE id = ?').bind(row.id),
  ]);
}

describe('Patterns API', () => {
  beforeEach(async () => {
    await resetSlug(testPattern.slug);
    await resetSlug(testPatternLegacyPalette.slug);
  });

  describe('POST /api/patterns', () => {
    it('creates a pattern with full color objects and grid_data', async () => {
      const res = await createPattern(testPattern);
      if (res.status !== 201) {
        const err = await res.text();
        console.error('create pattern error:', err);
      }
      expect(res.status).toBe(201);
      const body = (await json(res)) as { success: boolean; data: { pattern: Record<string, unknown> } };
      expect(body.success).toBe(true);
      expect(body.data.pattern.color_palette).toEqual([
        { name: 'Red', code: 'R01', hex: '#FF0000', count: 3 },
        { name: 'Green', code: 'G01', hex: '#00FF00', count: 4 },
        { name: 'Blue', code: 'B01', hex: '#0000FF', count: 2 },
      ]);
      expect(body.data.pattern.grid_data).toEqual(testPattern.grid_data);
      expect(body.data.pattern.color_count).toBe(3);
      expect(body.data.pattern.estimated_beads).toBe(9);
    });

    it('accepts legacy string color_palette and derives counts from grid', async () => {
      const res = await createPattern(testPatternLegacyPalette);
      expect(res.status).toBe(201);
      const body = (await json(res)) as { success: boolean; data: { pattern: Record<string, unknown> } };
      expect(body.success).toBe(true);
      const palette = body.data.pattern.color_palette as Array<Record<string, unknown>>;
      expect(palette[0].name).toBe('Color 1');
      expect(palette[0].count).toBe(2);
      expect(palette[1].count).toBe(2);
    });
  });

  describe('GET /api/patterns/:slug', () => {
    it('returns normalized color palette and grid_data', async () => {
      await createPattern(testPattern);
      const res = await getPattern(testPattern.slug);
      expect(res.status).toBe(200);
      const body = (await json(res)) as { success: boolean; data: { pattern: Record<string, unknown> } };
      expect(body.data.pattern.color_palette).toEqual([
        { name: 'Red', code: 'R01', hex: '#FF0000', count: 3 },
        { name: 'Green', code: 'G01', hex: '#00FF00', count: 4 },
        { name: 'Blue', code: 'B01', hex: '#0000FF', count: 2 },
      ]);
      expect(body.data.pattern.grid_data).toEqual(testPattern.grid_data);
    });
  });
});
