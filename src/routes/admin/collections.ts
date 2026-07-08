import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { getDB } from '../../lib/db';
import { success, paginated } from '../../lib/response';
import { AppError } from '../../lib/errors';
import { CreateCollectionSchema, UpdateCollectionSchema, CollectionAssignPatternsSchema } from '../../lib/schemas';
import { normalizeSlug, generateId } from '../../lib/slug';
import type { Bindings } from '../../lib/env';
import type { Collection } from '../../types';

const collections = new Hono<{ Bindings: Bindings }>();

collections.get('/', async (c) => {
  const db = getDB(c.env);
  const page = Number(c.req.query('page') ?? 1);
  const limit = Number(c.req.query('limit') ?? 20);
  const offset = (page - 1) * limit;
  const q = c.req.query('q');
  const published = c.req.query('published');
  const where: string[] = [];
  const params: unknown[] = [];
  if (q) {
    where.push('(c.title LIKE ? OR c.slug LIKE ?)');
    params.push(`%${q}%`, `%${q}%`);
  }
  if (published === 'true' || published === '1') {
    where.push('c.published = 1');
  } else if (published === 'false' || published === '0') {
    where.push('c.published = 0');
  }
  const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';
  const countRow = await db.queryOne<{ count: number }>(
    `SELECT COUNT(*) as count FROM collections c ${whereClause}`,
    params
  );
  const total = countRow?.count ?? 0;
  const rows = await db.query<Collection & { pattern_count: number }>(
    `SELECT c.*, COUNT(pc.pattern_id) AS pattern_count
     FROM collections c
     LEFT JOIN pattern_collections pc ON pc.collection_id = c.id
     ${whereClause}
     GROUP BY c.id
     ORDER BY c.display_order ASC, c.title ASC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  return c.json(paginated(rows, { page, limit, total }));
});

collections.post('/', zValidator('json', CreateCollectionSchema), async (c) => {
  const db = getDB(c.env);
  const body = c.req.valid('json');
  const id = generateId();
  const slug = body.slug ?? normalizeSlug(body.title);
  try {
    await db.insert('collections', {
      id,
      title: body.title,
      slug,
      description: body.description ?? null,
      banner: body.banner ?? null,
      display_order: body.display_order ?? 0,
      published: body.published ? 1 : 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('UNIQUE')) throw new AppError('Collection slug already exists', 'COLLECTION_DUPLICATE', 409);
    throw err;
  }

  if (body.pattern_slugs && body.pattern_slugs.length > 0) {
    const rows = await db.query<{ id: string; slug: string }>(
      `SELECT id, slug FROM patterns WHERE slug IN (${body.pattern_slugs.map(() => '?').join(',')})`,
      body.pattern_slugs
    );
    const foundSlugs = new Set(rows.map((r) => r.slug));
    const missing = body.pattern_slugs.filter((s) => !foundSlugs.has(s));
    if (missing.length > 0) throw new AppError('Unknown pattern slugs: ' + missing.join(', '), 'PATTERNS_NOT_FOUND', 400);
    for (let i = 0; i < rows.length; i++) {
      await db.insert('pattern_collections', {
        id: generateId(),
        pattern_id: rows[i].id,
        collection_id: id,
        display_order: i,
      });
    }
  }

  const collection = await db.queryOne<Collection & { pattern_count: number }>(
    `SELECT c.*, COUNT(pc.pattern_id) AS pattern_count
     FROM collections c
     LEFT JOIN pattern_collections pc ON pc.collection_id = c.id
     WHERE c.id = ?
     GROUP BY c.id`,
    [id]
  );
  return c.json(success(collection), 201);
});

collections.get('/by-slug/:slug', async (c) => {
  const db = getDB(c.env);
  const slug = c.req.param('slug');
  const collection = await db.queryOne<Collection>('SELECT * FROM collections WHERE slug = ?', [slug]);
  if (!collection) throw new AppError('Collection not found', 'COLLECTION_NOT_FOUND', 404);
  const patterns = await db.query<{ id: string; slug: string; title: string; cover_image: string | null; status: string; difficulty: string; created_at: string }>(
    `SELECT p.id, p.slug, p.title, p.cover_image, p.status, p.difficulty, p.created_at
     FROM pattern_collections pc
     JOIN patterns p ON p.id = pc.pattern_id
     WHERE pc.collection_id = ?
     ORDER BY pc.display_order ASC, p.created_at DESC`,
    [collection.id]
  );
  return c.json(success({ ...collection, patterns }));
});

collections.get('/:id', async (c) => {
  const db = getDB(c.env);
  const id = c.req.param('id');
  const collection = await db.queryOne<Collection & { pattern_count: number }>(
    `SELECT c.*, COUNT(pc.pattern_id) AS pattern_count
     FROM collections c
     LEFT JOIN pattern_collections pc ON pc.collection_id = c.id
     WHERE c.id = ?
     GROUP BY c.id`,
    [id]
  );
  if (!collection) throw new AppError('Collection not found', 'COLLECTION_NOT_FOUND', 404);
  return c.json(success(collection));
});

collections.put('/:id', zValidator('json', UpdateCollectionSchema), async (c) => {
  const db = getDB(c.env);
  const id = c.req.param('id');
  const body = c.req.valid('json');
  const existing = await db.queryOne<Collection>('SELECT id FROM collections WHERE id = ?', [id]);
  if (!existing) throw new AppError('Collection not found', 'COLLECTION_NOT_FOUND', 404);
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.title !== undefined) updates.title = body.title;
  if (body.slug !== undefined) updates.slug = body.slug;
  if (body.description !== undefined) updates.description = body.description;
  if (body.banner !== undefined) updates.banner = body.banner;
  if (body.display_order !== undefined) updates.display_order = body.display_order;
  if (body.published !== undefined) updates.published = body.published ? 1 : 0;
  await db.update('collections', updates, { id });
  const collection = await db.queryOne<Collection & { pattern_count: number }>(
    `SELECT c.*, COUNT(pc.pattern_id) AS pattern_count
     FROM collections c
     LEFT JOIN pattern_collections pc ON pc.collection_id = c.id
     WHERE c.id = ?
     GROUP BY c.id`,
    [id]
  );
  return c.json(success(collection));
});

collections.delete('/:id', async (c) => {
  const db = getDB(c.env);
  const id = c.req.param('id');
  const existing = await db.queryOne<Collection>('SELECT id FROM collections WHERE id = ?', [id]);
  if (!existing) throw new AppError('Collection not found', 'COLLECTION_NOT_FOUND', 404);
  await db.execute('DELETE FROM pattern_collections WHERE collection_id = ?', [id]);
  await db.deleteWhere('collections', { id });
  return c.json(success({ deleted: true }));
});

collections.post('/:id/patterns', zValidator('json', CollectionAssignPatternsSchema), async (c) => {
  const db = getDB(c.env);
  const collectionId = c.req.param('id');
  const collection = await db.queryOne<Collection>('SELECT id FROM collections WHERE id = ?', [collectionId]);
  if (!collection) throw new AppError('Collection not found', 'COLLECTION_NOT_FOUND', 404);
  const { pattern_slugs } = c.req.valid('json');

  if (pattern_slugs.length === 0) {
    await db.execute('DELETE FROM pattern_collections WHERE collection_id = ?', [collectionId]);
    return c.json(success({ collection_id: collectionId, assigned: 0, patterns: [] }));
  }

  const rows = await db.query<{ id: string; slug: string }>(
    `SELECT id, slug FROM patterns WHERE slug IN (${pattern_slugs.map(() => '?').join(',')})`,
    pattern_slugs
  );
  const foundSlugs = new Set(rows.map((r) => r.slug));
  const missing = pattern_slugs.filter((s) => !foundSlugs.has(s));
  if (missing.length > 0) throw new AppError('Unknown pattern slugs: ' + missing.join(', '), 'PATTERNS_NOT_FOUND', 400);

  await db.execute('DELETE FROM pattern_collections WHERE collection_id = ?', [collectionId]);
  for (let i = 0; i < rows.length; i++) {
    await db.insert('pattern_collections', {
      id: generateId(),
      pattern_id: rows[i].id,
      collection_id: collectionId,
      display_order: i,
    });
  }

  const patterns = await db.query<{ id: string; slug: string; title: string; cover_image: string | null }>(
    `SELECT p.id, p.slug, p.title, p.cover_image
     FROM pattern_collections pc
     JOIN patterns p ON p.id = pc.pattern_id
     WHERE pc.collection_id = ?
     ORDER BY pc.display_order ASC`,
    [collectionId]
  );
  return c.json(success({ collection_id: collectionId, assigned: rows.length, patterns }));
});

collections.get('/:id/patterns', async (c) => {
  const db = getDB(c.env);
  const collectionId = c.req.param('id');
  const page = Number(c.req.query('page') ?? 1);
  const limit = Number(c.req.query('limit') ?? 20);
  const offset = (page - 1) * limit;
  const countRow = await db.queryOne<{ count: number }>(
    'SELECT COUNT(*) as count FROM pattern_collections WHERE collection_id = ?',
    [collectionId]
  );
  const total = countRow?.count ?? 0;
  const patterns = await db.query<{ id: string; slug: string; title: string; cover_image: string | null; status: string; difficulty: string; created_at: string }>(
    `SELECT p.id, p.slug, p.title, p.cover_image, p.status, p.difficulty, p.created_at
     FROM pattern_collections pc
     JOIN patterns p ON p.id = pc.pattern_id
     WHERE pc.collection_id = ?
     ORDER BY pc.display_order ASC, p.created_at DESC
     LIMIT ? OFFSET ?`,
    [collectionId, limit, offset]
  );
  return c.json(paginated(patterns, { page, limit, total }));
});

export default collections;
