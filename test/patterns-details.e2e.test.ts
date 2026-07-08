import { describe, it, expect, beforeEach } from 'vitest';
import { env } from 'cloudflare:test';
import app from '../src/index';
import { testPattern, testPatternWithFaq } from './fixtures';

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
    db.prepare('DELETE FROM pattern_faqs WHERE pattern_id = ?').bind(row.id),
    db.prepare('DELETE FROM pattern_tags WHERE pattern_id = ?').bind(row.id),
    db.prepare('DELETE FROM pattern_steps WHERE pattern_id = ?').bind(row.id),
    db.prepare('DELETE FROM patterns WHERE id = ?').bind(row.id),
  ]);
}

async function seedRelatedFor(patternId: string, relatedIds: string[]) {
  const db = env.DB;
  const rows = relatedIds.map((rid, i) => ({
    pattern_id: patternId,
    related_pattern_id: rid,
    related_type: 'similar',
    score: 1,
    display_order: i,
    created_at: new Date().toISOString(),
  }));
  for (const r of rows) {
    await db
      .prepare(
        'INSERT OR IGNORE INTO pattern_related (id, pattern_id, related_pattern_id, related_type, score, display_order, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
      )
      .bind(crypto.randomUUID(), r.pattern_id, r.related_pattern_id, r.related_type, r.score, r.display_order, r.created_at)
      .run();
  }
}

async function seedFaqRelatedAndCreatePattern() {
  await resetSlug(testPatternWithFaq.slug);
  const payload = { ...testPattern, slug: testPatternWithFaq.slug, title: testPatternWithFaq.title, faqs: testPatternWithFaq.faqs };
  const res = await createPattern(payload);
  if (res.status !== 201) {
    const err = await res.text();
    console.error('create pattern error:', err);
  }
  expect(res.status).toBe(201);
  const body = (await json(res)) as { success: boolean; data: { pattern: { id: string } } };
  return body.data.pattern.id;
}

async function createSecondaryPattern() {
  const secondary = { ...testPatternWithFaq, slug: 'test-pixel-faq-2', title: 'Secondary Pixel' };
  await resetSlug(secondary.slug);
  const res = await createPattern(secondary);
  expect(res.status).toBe(201);
  const body = (await json(res)) as { success: boolean; data: { pattern: { id: string } } };
  return body.data.pattern.id;
}

describe('GET /api/patterns/:slug', () => {
  beforeEach(async () => {
    await resetSlug(testPatternWithFaq.slug);
    await resetSlug('test-pixel-faq-2');
  });

  it('returns 200 with faqs and expanded related patterns', async () => {
    const patternId = await seedFaqRelatedAndCreatePattern();
    const secondaryId = await createSecondaryPattern();
    await seedRelatedFor(patternId, [secondaryId]);

    const res = await getPattern(testPatternWithFaq.slug);
    expect(res.status).toBe(200);
    const body = (await json(res)) as {
      success: boolean;
      data: {
        pattern: Record<string, unknown>;
        faqs: unknown[];
        related: unknown[];
      };
    };
    expect(body.success).toBe(true);
    expect(body.data.pattern.slug).toBe(testPatternWithFaq.slug);
    expect(body.data.faqs.length).toBeGreaterThan(0);
    expect(body.data.related.length).toBeGreaterThan(0);

    const related = body.data.related as Array<Record<string, unknown>>;
    expect(related[0]).toHaveProperty('related_pattern_id');
    expect(related[0]).toHaveProperty('related_type');

    const pattern = body.data.pattern as { related_patterns?: unknown[] };
    expect(pattern.related_patterns).toBeDefined();
    expect((pattern.related_patterns as Array<Record<string, unknown>>).length).toBeGreaterThan(0);
  });
});

describe('GET /api/patterns/:slug/download/pdf', () => {
  beforeEach(async () => {
    await resetSlug(testPatternWithFaq.slug);
    await resetSlug('test-pixel-faq-2');
  });

  it('returns a pdf url', async () => {
    await seedFaqRelatedAndCreatePattern();
    const res = await app.fetch(
      new Request(`${baseUrl}/patterns/${testPatternWithFaq.slug}/download/pdf`),
      env
    );
    expect(res.status).toBe(200);
    const body = (await json(res)) as { success: boolean; data: Record<string, unknown> };
    expect(body.success).toBe(true);
    expect(body.data.url).toMatch(/\.pdf$/);
    expect(body.data.content_type).toBe('application/pdf');
  });
});

describe('GET /api/patterns/:slug/download/png', () => {
  beforeEach(async () => {
    await resetSlug(testPatternWithFaq.slug);
    await resetSlug('test-pixel-faq-2');
  });

  it('returns an svg url', async () => {
    await seedFaqRelatedAndCreatePattern();
    const res = await app.fetch(
      new Request(`${baseUrl}/patterns/${testPatternWithFaq.slug}/download/png`),
      env
    );
    expect(res.status).toBe(200);
    const body = (await json(res)) as { success: boolean; data: Record<string, unknown> };
    expect(body.success).toBe(true);
    expect(body.data.url).toMatch(/\.svg$/);
    expect(body.data.content_type).toBe('image/svg+xml');
  });
});
