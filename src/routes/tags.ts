import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { getDB } from '../lib/db';
import { normalizeSlug, generateId } from '../lib/slug';
import { success, paginated } from '../lib/response';
import { AppError } from '../lib/errors';
import type { Tag } from '../types';
import { CreateTagSchema } from '../lib/schemas';
import type { Bindings } from '../lib/env';

const tags = new Hono<{ Bindings: Bindings }>();

// List tags
 tags.get('/', async (c) => {
  const type = c.req.query('type');
  const db = getDB(c.env);

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
     ${type ? 'WHERE t.type = ?' : ''}
     GROUP BY t.id
     ORDER BY t.display_order ASC, t.name ASC`,
    type ? [type] : []
  );
  return c.json(success(rows));
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

// Get tag + patterns
 tags.get('/:slug', async (c) => {
  const slug = c.req.param('slug');
  const db = getDB(c.env);

  const tag = await db.queryOne<Tag>('SELECT * FROM tags WHERE slug = ?', [slug]);
  if (!tag) throw new AppError('Tag not found', 'TAG_NOT_FOUND', 404);

  const page = Number(c.req.query('page') ?? 1);
  const limit = Number(c.req.query('limit') ?? 20);
  const offset = (page - 1) * limit;

  const countRow = await db.queryOne<{ count: number }>(
    `SELECT COUNT(*) as count FROM pattern_tags pt
     JOIN patterns p ON p.id = pt.pattern_id
     WHERE pt.tag_id = ? AND p.status = 'published'`,
    [tag.id]
  );
  const total = countRow?.count ?? 0;

  const patterns = await db.query<
    { id: string; slug: string; title: string; cover_image: string | null; difficulty: string; created_at: string }
  >(
    `SELECT p.id, p.slug, p.title, p.cover_image, p.difficulty, p.created_at
     FROM pattern_tags pt
     JOIN patterns p ON p.id = pt.pattern_id
     WHERE pt.tag_id = ? AND p.status = 'published'
     ORDER BY p.created_at DESC
     LIMIT ? OFFSET ?`,
    [tag.id, limit, offset]
  );

  return c.json(success({ tag, patterns: paginated(patterns, { page, limit, total }) }));
});

// Delete tag
 tags.delete('/:id', async (c) => {
  const id = c.req.param('id');
  const db = getDB(c.env);

  await db.deleteWhere('tags', { id });
  return c.json(success({ deleted: true }));
});

export default tags;
