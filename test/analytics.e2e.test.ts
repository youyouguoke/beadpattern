import { describe, it, expect, beforeEach } from 'vitest';
import { env } from 'cloudflare:test';
import app from '../src/index';

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
  return res.json() as Promise<{ success: boolean; data: { pattern: { id: string; slug: string } } }>;
}

async function resetSlug(slug: string) {
  const db = env.DB;
  const row = await db.prepare('SELECT id FROM patterns WHERE slug = ?').bind(slug).first<{ id: string }>();
  if (!row) return;
  await db.batch([
    db.prepare('DELETE FROM action_logs WHERE pattern_id = ?').bind(row.id),
    db.prepare('DELETE FROM pattern_tags WHERE pattern_id = ?').bind(row.id),
    db.prepare('DELETE FROM pattern_steps WHERE pattern_id = ?').bind(row.id),
    db.prepare('DELETE FROM patterns WHERE id = ?').bind(row.id),
  ]);
}

describe('Analytics API', () => {
  const slug = 'analytics-test';

  beforeEach(async () => {
    await resetSlug(slug);
    await createPattern({
      title: 'Analytics Test',
      slug,
      description: 'Test',
      difficulty: 'easy',
      grid_size: '2x2',
      color_palette: ['#FF0000'],
    });
  });

  async function recordAction(action: 'view' | 'like' | 'download' | 'share', clientId?: string) {
    const url = new URL(`${baseUrl}/patterns/${slug}/${action}`);
    if (clientId) url.searchParams.set('client_id', clientId);
    return app.fetch(
      new Request(url.toString(), { method: 'POST' }),
      env
    );
  }

  it('increments view counter and deduplicates by client_id', async () => {
    await recordAction('view', 'client-A');
    await recordAction('view', 'client-A');
    await recordAction('view', 'client-B');

    const res = await app.fetch(new Request(`${baseUrl}/patterns/${slug}`), env);
    const body = (await res.json()) as { success: boolean; data: { analytics: { views: number } } };
    expect(body.data.analytics.views).toBe(2);
  });

  it('increments download counter', async () => {
    await recordAction('download', 'client-D');
    const res = await app.fetch(new Request(`${baseUrl}/patterns/${slug}`), env);
    const body = (await res.json()) as { success: boolean; data: { analytics: { downloads: number } } };
    expect(body.data.analytics.downloads).toBe(1);
  });

  it('increments share counter', async () => {
    await recordAction('share', 'client-S');
    const res = await app.fetch(new Request(`${baseUrl}/patterns/${slug}`), env);
    const body = (await res.json()) as { success: boolean; data: { analytics: { shares: number } } };
    expect(body.data.analytics.shares).toBe(1);
  });
});
