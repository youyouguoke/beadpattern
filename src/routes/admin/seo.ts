import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { getDB } from '../../lib/db';
import { success, paginated } from '../../lib/response';
import { AppError } from '../../lib/errors';
import { CreateRedirectSchema, UpdateRedirectSchema, SeoMetadataUpdateSchema, RobotsUpdateSchema } from '../../lib/schemas';
import { generateId } from '../../lib/slug';
import type { Bindings } from '../../lib/env';
import type { Redirect, Setting } from '../../types';

const seo = new Hono<{ Bindings: Bindings }>();

seo.get('/sitemap', async (c) => {
  const db = getDB(c.env);
  const patterns = await db.queryOne<{ count: number }>("SELECT COUNT(*) as count FROM patterns WHERE status = 'published'");
  const collections = await db.queryOne<{ count: number }>("SELECT COUNT(*) as count FROM collections WHERE published = 1");
  const tags = await db.queryOne<{ count: number }>('SELECT COUNT(*) as count FROM tags');
  const generated = await db.queryOne<{ value: string }>("SELECT value FROM settings WHERE key = 'sitemap_generated_at'");
  return c.json(success({
    patterns: patterns?.count ?? 0,
    collections: collections?.count ?? 0,
    tags: tags?.count ?? 0,
    generated_at: generated?.value ?? null,
  }));
});

seo.post('/sitemap/regenerate', async (c) => {
  const db = getDB(c.env);
  const now = new Date().toISOString();
  await db.execute(
    "INSERT INTO settings (key, value, updated_at) VALUES ('sitemap_generated_at', ?, ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at",
    [now, now]
  );
  return c.json(success({ generated_at: now }));
});

seo.get('/metadata', async (c) => {
  const db = getDB(c.env);
  const keys = ['pattern_template', 'collection_template', 'tag_template'];
  const settings = await db.query<Setting>("SELECT * FROM settings WHERE key IN ('pattern_template', 'collection_template', 'tag_template')");
  const map: Record<string, string> = {};
  for (const s of settings) map[s.key] = s.value ?? '';
  for (const key of keys) if (!(key in map)) map[key] = '';
  return c.json(success(map));
});

seo.put('/metadata', zValidator('json', SeoMetadataUpdateSchema), async (c) => {
  const db = getDB(c.env);
  const body = c.req.valid('json');
  const values: Record<string, string> = {};
  if (body.pattern_template !== undefined) values.pattern_template = body.pattern_template;
  if (body.collection_template !== undefined) values.collection_template = body.collection_template;
  if (body.tag_template !== undefined) values.tag_template = body.tag_template;
  const now = new Date().toISOString();
  for (const [key, value] of Object.entries(values)) {
    await db.execute(
      'INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at',
      [key, value, now]
    );
  }
  return c.json(success(values));
});

seo.get('/redirects', async (c) => {
  const db = getDB(c.env);
  const page = Number(c.req.query('page') ?? 1);
  const limit = Number(c.req.query('limit') ?? 20);
  const offset = (page - 1) * limit;
  const countRow = await db.queryOne<{ count: number }>('SELECT COUNT(*) as count FROM redirects');
  const total = countRow?.count ?? 0;
  const rows = await db.query<Redirect>(
    'SELECT * FROM redirects ORDER BY created_at DESC LIMIT ? OFFSET ?',
    [limit, offset]
  );
  return c.json(paginated(rows, { page, limit, total }));
});

seo.post('/redirects', zValidator('json', CreateRedirectSchema), async (c) => {
  const db = getDB(c.env);
  const body = c.req.valid('json');
  const id = generateId();
  try {
    await db.insert('redirects', {
      id,
      old_path: body.old_path,
      new_path: body.new_path,
      code: body.code,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('UNIQUE')) throw new AppError('Redirect old_path already exists', 'REDIRECT_DUPLICATE', 409);
    throw err;
  }
  const row = await db.queryOne<Redirect>('SELECT * FROM redirects WHERE id = ?', [id]);
  return c.json(success(row), 201);
});

seo.put('/redirects/:id', zValidator('json', UpdateRedirectSchema), async (c) => {
  const db = getDB(c.env);
  const id = c.req.param('id');
  const body = c.req.valid('json');
  const existing = await db.queryOne<Redirect>('SELECT id FROM redirects WHERE id = ?', [id]);
  if (!existing) throw new AppError('Redirect not found', 'REDIRECT_NOT_FOUND', 404);
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.old_path !== undefined) updates.old_path = body.old_path;
  if (body.new_path !== undefined) updates.new_path = body.new_path;
  if (body.code !== undefined) updates.code = body.code;
  await db.update('redirects', updates, { id });
  const row = await db.queryOne<Redirect>('SELECT * FROM redirects WHERE id = ?', [id]);
  return c.json(success(row));
});

seo.delete('/redirects/:id', async (c) => {
  const db = getDB(c.env);
  const id = c.req.param('id');
  await db.deleteWhere('redirects', { id });
  return c.json(success({ deleted: true }));
});

seo.put('/robots', zValidator('json', RobotsUpdateSchema), async (c) => {
  const db = getDB(c.env);
  const body = c.req.valid('json');
  const now = new Date().toISOString();
  const values = {
    robots_allow: JSON.stringify(body.allow ?? []),
    robots_disallow: JSON.stringify(body.disallow ?? []),
    robots_noindex: body.noindex ? 'true' : 'false',
  };
  for (const [key, value] of Object.entries(values)) {
    await db.execute(
      'INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at',
      [key, value, now]
    );
  }
  return c.json(success(values));
});

export default seo;
