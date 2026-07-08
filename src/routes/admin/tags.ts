import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { getDB } from '../../lib/db';
import { success, paginated } from '../../lib/response';
import { AppError } from '../../lib/errors';
import { CreateTagSchema, UpdateTagSchema } from '../../lib/schemas';
import { normalizeSlug, generateId } from '../../lib/slug';
import type { Bindings } from '../../lib/env';
import type { Tag } from '../../types';

const tags = new Hono<{ Bindings: Bindings }>();

// List tags with popularity
 tags.get('/', async (c) => {
  const db = getDB(c.env);
  const type = c.req.query('type');
  const page = Number(c.req.query('page') ?? 1);
  const limit = Number(c.req.query('limit') ?? 100);
  const offset = (page - 1) * limit;

  const where: string[] = [];
  const params: unknown[] = [];
  if (type) {
    where.push('t.type = ?');
    params.push(type);
  }
  const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';

  const countRow = await db.queryOne<{ count: number }>(
    `SELECT COUNT(*) as count FROM tags t ${whereClause}`,
    params
  );
  const total = countRow?.count ?? 0;

  const rows = await db.query<{
    id: string;
    name: string;
    slug: string;
    type: string;
    display_order: number;
    count: number;
  }>(
    `SELECT t.*, COUNT(pt.pattern_id) as count
     FROM tags t
     LEFT JOIN pattern_tags pt ON pt.tag_id = t.id
     LEFT JOIN patterns p ON p.id = pt.pattern_id AND p.status = 'published'
     ${whereClause}
     GROUP BY t.id
     ORDER BY t.display_order ASC, t.name ASC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  return c.json(paginated(rows, { page, limit, total }));
});

// Get single tag
 tags.get('/:id', async (c) => {
  const db = getDB(c.env);
  const id = c.req.param('id');
  const tag = await db.queryOne<Tag>('SELECT * FROM tags WHERE id = ?', [id]);
  if (!tag) throw new AppError('Tag not found', 'TAG_NOT_FOUND', 404);
  return c.json(success(tag));
});

// Create tag
 tags.post('/', zValidator('json', CreateTagSchema), async (c) => {
  const body = c.req.valid('json');
  const db = getDB(c.env);

  const slug = body.slug ?? normalizeSlug(body.name);
  const id = generateId();

  try {
    await db.insert('tags', {
      id,
      name: body.name,
      slug,
      type: body.type,
      display_order: body.display_order ?? 0,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('UNIQUE constraint failed')) {
      throw new AppError('Tag name or slug already exists', 'TAG_DUPLICATE', 409);
    }
    throw err;
  }

  const tag = await db.queryOne<Tag>('SELECT * FROM tags WHERE id = ?', [id]);
  return c.json(success(tag), 201);
});

// Update tag
 tags.put('/:id', zValidator('json', UpdateTagSchema), async (c) => {
  const db = getDB(c.env);
  const id = c.req.param('id');
  const body = c.req.valid('json');
  const existing = await db.queryOne<Tag>('SELECT id FROM tags WHERE id = ?', [id]);
  if (!existing) throw new AppError('Tag not found', 'TAG_NOT_FOUND', 404);
  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.slug !== undefined) updates.slug = body.slug;
  if (body.type !== undefined) updates.type = body.type;
  if (body.display_order !== undefined) updates.display_order = body.display_order;
  await db.update('tags', updates, { id });
  const tag = await db.queryOne<Tag>('SELECT * FROM tags WHERE id = ?', [id]);
  return c.json(success(tag));
});

// Merge tag
 tags.post('/:id/merge', async (c) => {
  const db = getDB(c.env);
  const id = c.req.param('id');
  const body = await c.req.json<{ target_tag_id: string }>();
  const { target_tag_id } = body;
  if (!target_tag_id) throw new AppError('target_tag_id is required', 'BAD_REQUEST', 400);
  const source = await db.queryOne<Tag>('SELECT * FROM tags WHERE id = ?', [id]);
  if (!source) throw new AppError('Source tag not found', 'TAG_NOT_FOUND', 404);
  const target = await db.queryOne<Tag>('SELECT * FROM tags WHERE id = ?', [target_tag_id]);
  if (!target) throw new AppError('Target tag not found', 'TAG_NOT_FOUND', 404);

  // Reassign pattern_tags from source to target, ignore duplicates
  const relations = await db.query<{ pattern_id: string }>('SELECT pattern_id FROM pattern_tags WHERE tag_id = ?', [id]);
  for (const rel of relations) {
    await db.execute(
      'INSERT OR IGNORE INTO pattern_tags (pattern_id, tag_id) VALUES (?, ?)',
      [rel.pattern_id, target_tag_id]
    );
  }
  await db.deleteWhere('pattern_tags', { tag_id: id });
  await db.deleteWhere('tags', { id });
  return c.json(success({ merged: true, source_tag_id: id, target_tag_id }));
});

// Delete tag
 tags.delete('/:id', async (c) => {
  const id = c.req.param('id');
  const db = getDB(c.env);

  await db.deleteWhere('tags', { id });
  return c.json(success({ deleted: true }));
});

export default tags;
