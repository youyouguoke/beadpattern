import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { getDB } from '../../lib/db';
import { success, paginated } from '../../lib/response';
import { AppError } from '../../lib/errors';
import { CreateCollectionSchema, UpdateCollectionSchema } from '../../lib/schemas';
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
    where.push('(title LIKE ? OR slug LIKE ?)');
    params.push(`%${q}%`, `%${q}%`);
  }
  if (published === 'true' || published === '1') {
    where.push('published = 1');
  } else if (published === 'false' || published === '0') {
    where.push('published = 0');
  }
  const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';
  const countRow = await db.queryOne<{ count: number }>(`SELECT COUNT(*) as count FROM collections ${whereClause}`, params);
  const total = countRow?.count ?? 0;
  const rows = await db.query<Collection>(
    `SELECT * FROM collections ${whereClause} ORDER BY display_order ASC, title ASC LIMIT ? OFFSET ?`,
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
  const collection = await db.queryOne<Collection>('SELECT * FROM collections WHERE id = ?', [id]);
  return c.json(success(collection), 201);
});

collections.get('/:id', async (c) => {
  const db = getDB(c.env);
  const id = c.req.param('id');
  const collection = await db.queryOne<Collection>('SELECT * FROM collections WHERE id = ?', [id]);
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
  const collection = await db.queryOne<Collection>('SELECT * FROM collections WHERE id = ?', [id]);
  return c.json(success(collection));
});

collections.delete('/:id', async (c) => {
  const db = getDB(c.env);
  const id = c.req.param('id');
  await db.deleteWhere('collections', { id });
  return c.json(success({ deleted: true }));
});

collections.post('/:id/patterns', async (c) => {
  const db = getDB(c.env);
  const collectionId = c.req.param('id');
  const collection = await db.queryOne<Collection>('SELECT id FROM collections WHERE id = ?', [collectionId]);
  if (!collection) throw new AppError('Collection not found', 'COLLECTION_NOT_FOUND', 404);
  const body = await c.req.json<{ pattern_ids?: string[]; remove_pattern_ids?: string[] }>();
  const { pattern_ids, remove_pattern_ids } = body;

  if (remove_pattern_ids && remove_pattern_ids.length > 0) {
    const placeholders = remove_pattern_ids.map(() => '?').join(',');
    await db.execute(`DELETE FROM pattern_collections WHERE collection_id = ? AND pattern_id IN (${placeholders})`, [collectionId, ...remove_pattern_ids]);
  }

  if (pattern_ids && pattern_ids.length > 0) {
    for (const patternId of pattern_ids) {
      await db.execute(
        'INSERT OR IGNORE INTO pattern_collections (pattern_id, collection_id, display_order) VALUES (?, ?, 0)',
        [patternId, collectionId]
      );
    }
  }

  return c.json(success({ collection_id: collectionId, pattern_ids, removed: remove_pattern_ids }));
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
  const patterns = await db.query<{ id: string; slug: string; title: string; cover_image: string | null; status: string; created_at: string }>(
    `SELECT p.id, p.slug, p.title, p.cover_image, p.status, p.created_at
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
