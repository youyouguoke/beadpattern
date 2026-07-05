import { describe, it, expect, beforeEach } from 'vitest';
import { env } from 'cloudflare:test';
import app from '../src/index';

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

async function publishPattern(slug: string) {
  return app.fetch(
    new Request(`${baseUrl}/patterns/${slug}/publish`, {
      method: 'POST',
    }),
    env
  );
}

async function resetSlug(slug: string) {
  const db = env.DB;
  const row = await db.prepare('SELECT id FROM patterns WHERE slug = ?').bind(slug).first<{ id: string }>();
  if (!row) return;
  await db.batch([
    db.prepare('DELETE FROM pattern_search WHERE rowid = (SELECT rowid FROM patterns WHERE id = ?)').bind(row.id),
    db.prepare('DELETE FROM pattern_tags WHERE pattern_id = ?').bind(row.id),
    db.prepare('DELETE FROM pattern_steps WHERE pattern_id = ?').bind(row.id),
    db.prepare('DELETE FROM patterns WHERE id = ?').bind(row.id),
  ]);
}

describe('Search API', () => {
  const slug = 'searchable-unicorn';

  beforeEach(async () => {
    await resetSlug(slug);
    const res = await createPattern({
      title: 'Searchable Unicorn',
      slug,
      description: 'A magical unicorn with rainbow colors.',
      difficulty: 'medium',
      grid_size: '4x4',
      color_palette: ['#FF0000', '#00FF00', '#0000FF'],
    });
    if (res.status !== 201) {
      const err = await res.text();
      console.error('search setup create error:', err);
    }
    await publishPattern(slug);
  });

  it('finds pattern by title keyword', async () => {
    const res = await app.fetch(new Request(`${baseUrl}/search?q=unicorn`), env);
    const body = (await res.json()) as { success: boolean; data: { patterns: { data: Array<{ slug: string }> } } };
    expect(body.success).toBe(true);
    expect(body.data.patterns.data.some((p) => p.slug === slug)).toBe(true);
  });

  it('finds pattern by description keyword', async () => {
    const res = await app.fetch(new Request(`${baseUrl}/search?q=magical`), env);
    const body = (await res.json()) as { success: boolean; data: { patterns: { data: Array<{ slug: string }> } } };
    expect(body.data.patterns.data.some((p) => p.slug === slug)).toBe(true);
  });

  it('returns empty for unrelated query', async () => {
    const res = await app.fetch(new Request(`${baseUrl}/search?q=xyznotfound`), env);
    const body = (await res.json()) as { success: boolean; data: { patterns: { data: Array<{ slug: string }> } } };
    expect(body.data.patterns.data).toEqual([]);
  });
});
