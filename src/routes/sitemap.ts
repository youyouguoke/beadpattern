import { Hono } from 'hono';
import { getDB } from '../lib/db';
import { success } from '../lib/response';
import type { Bindings } from '../lib/env';

const sitemap = new Hono<{ Bindings: Bindings }>();

sitemap.get('/patterns', async (c) => {
  const db = getDB(c.env);
  const rows = await db.query<{ slug: string; updated_at: string }>(
    "SELECT slug, updated_at FROM patterns WHERE status = 'published' ORDER BY updated_at DESC"
  );
  return c.json(success(rows));
});

sitemap.get('/tags', async (c) => {
  const db = getDB(c.env);
  const rows = await db.query<{ slug: string }>('SELECT slug FROM tags ORDER BY slug');
  return c.json(success(rows));
});

sitemap.get('/difficulty', async (c) => {
  return c.json(success([
    { slug: 'easy' },
    { slug: 'medium' },
    { slug: 'hard' },
  ]));
});

export default sitemap;
