import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { getDB } from '../../lib/db';
import { success, paginated } from '../../lib/response';
import { AppError } from '../../lib/errors';
import { CreateCategorySchema, UpdateCategorySchema } from '../../lib/schemas';
import { normalizeSlug, generateId } from '../../lib/slug';
import type { Bindings } from '../../lib/env';
import type { Category } from '../../types';

const categories = new Hono<{ Bindings: Bindings }>();

categories.get('/', async (c) => {
  const db = getDB(c.env);
  const page = Number(c.req.query('page') ?? 1);
  const limit = Number(c.req.query('limit') ?? 20);
  const offset = (page - 1) * limit;
  const q = c.req.query('q');
  const where: string[] = [];
  const params: unknown[] = [];
  if (q) {
    where.push('(name LIKE ? OR slug LIKE ?)');
    params.push(`%${q}%`, `%${q}%`);
  }
  const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';
  const countRow = await db.queryOne<{ count: number }>(`SELECT COUNT(*) as count FROM categories ${whereClause}`, params);
  const total = countRow?.count ?? 0;
  const rows = await db.query<Category>(
    `SELECT * FROM categories ${whereClause} ORDER BY display_order ASC, name ASC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  return c.json(paginated(rows, { page, limit, total }));
});

categories.post('/', zValidator('json', CreateCategorySchema), async (c) => {
  const db = getDB(c.env);
  const body = c.req.valid('json');
  const id = generateId();
  const slug = body.slug ?? normalizeSlug(body.name);
  try {
    await db.insert('categories', {
      id,
      name: body.name,
      slug,
      description: body.description ?? null,
      display_order: body.display_order ?? 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('UNIQUE')) throw new AppError('Category name or slug already exists', 'CATEGORY_DUPLICATE', 409);
    throw err;
  }
  const category = await db.queryOne<Category>('SELECT * FROM categories WHERE id = ?', [id]);
  return c.json(success(category), 201);
});

categories.get('/:id', async (c) => {
  const db = getDB(c.env);
  const id = c.req.param('id');
  const category = await db.queryOne<Category>('SELECT * FROM categories WHERE id = ?', [id]);
  if (!category) throw new AppError('Category not found', 'CATEGORY_NOT_FOUND', 404);
  return c.json(success(category));
});

categories.put('/:id', zValidator('json', UpdateCategorySchema), async (c) => {
  const db = getDB(c.env);
  const id = c.req.param('id');
  const body = c.req.valid('json');
  const existing = await db.queryOne<Category>('SELECT id FROM categories WHERE id = ?', [id]);
  if (!existing) throw new AppError('Category not found', 'CATEGORY_NOT_FOUND', 404);
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.name !== undefined) updates.name = body.name;
  if (body.slug !== undefined) updates.slug = body.slug;
  if (body.description !== undefined) updates.description = body.description;
  if (body.display_order !== undefined) updates.display_order = body.display_order;
  await db.update('categories', updates, { id });
  const category = await db.queryOne<Category>('SELECT * FROM categories WHERE id = ?', [id]);
  return c.json(success(category));
});

categories.delete('/:id', async (c) => {
  const db = getDB(c.env);
  const id = c.req.param('id');
  await db.deleteWhere('categories', { id });
  return c.json(success({ deleted: true }));
});

categories.post('/:id/patterns', async (c) => {
  const db = getDB(c.env);
  const categoryId = c.req.param('id');
  const category = await db.queryOne<Category>('SELECT id FROM categories WHERE id = ?', [categoryId]);
  if (!category) throw new AppError('Category not found', 'CATEGORY_NOT_FOUND', 404);
  const body = await c.req.json<{ pattern_ids?: string[]; remove_pattern_ids?: string[] }>();
  const { pattern_ids, remove_pattern_ids } = body;

  if (remove_pattern_ids && remove_pattern_ids.length > 0) {
    const placeholders = remove_pattern_ids.map(() => '?').join(',');
    await db.execute(`DELETE FROM pattern_categories WHERE category_id = ? AND pattern_id IN (${placeholders})`, [categoryId, ...remove_pattern_ids]);
  }

  if (pattern_ids && pattern_ids.length > 0) {
    for (const patternId of pattern_ids) {
      await db.execute(
        'INSERT OR IGNORE INTO pattern_categories (pattern_id, category_id) VALUES (?, ?)',
        [patternId, categoryId]
      );
    }
  }

  return c.json(success({ category_id: categoryId, pattern_ids, removed: remove_pattern_ids }));
});

categories.get('/:id/patterns', async (c) => {
  const db = getDB(c.env);
  const categoryId = c.req.param('id');
  const page = Number(c.req.query('page') ?? 1);
  const limit = Number(c.req.query('limit') ?? 20);
  const offset = (page - 1) * limit;
  const countRow = await db.queryOne<{ count: number }>(
    'SELECT COUNT(*) as count FROM pattern_categories WHERE category_id = ?',
    [categoryId]
  );
  const total = countRow?.count ?? 0;
  const patterns = await db.query<{ id: string; slug: string; title: string; cover_image: string | null; status: string; created_at: string }>(
    `SELECT p.id, p.slug, p.title, p.cover_image, p.status, p.created_at
     FROM pattern_categories pc
     JOIN patterns p ON p.id = pc.pattern_id
     WHERE pc.category_id = ?
     ORDER BY p.created_at DESC
     LIMIT ? OFFSET ?`,
    [categoryId, limit, offset]
  );
  return c.json(paginated(patterns, { page, limit, total }));
});

export default categories;
