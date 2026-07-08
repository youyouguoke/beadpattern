import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { getDB } from '../../lib/db';
import { success, paginated } from '../../lib/response';
import { AppError } from '../../lib/errors';
import { AdminPatternQuerySchema, BulkPublishSchema, BulkArchiveSchema, BulkDeleteSchema, UpdateStatusSchema, CreatePatternSchema, UpdatePatternSchema } from '../../lib/schemas';
import { computeHealthScore } from '../../lib/health';
import type { Bindings } from '../../lib/env';
import type { MinimalSeo, Pattern, Tag, PatternStep, PatternSeo, Category, Collection } from '../../types';

function uuidv4() {
  return crypto.randomUUID();
}

const patterns = new Hono<{ Bindings: Bindings }>();

function difficultyToId(difficulty: string | number): 1 | 2 | 3 {
  if (typeof difficulty === 'number') {
    if (difficulty === 2) return 2;
    if (difficulty === 3) return 3;
    return 1;
  }
  switch (difficulty?.toLowerCase()) {
    case 'medium':
      return 2;
    case 'hard':
      return 3;
    case 'easy':
    default:
      return 1;
  }
}

function difficultyFromId(id: number): 'easy' | 'medium' | 'hard' {
  if (id === 2) return 'medium';
  if (id === 3) return 'hard';
  return 'easy';
}

async function getPatternHealthData(db: ReturnType<typeof getDB>, id: string) {
  const pattern = await db.queryOne<Pattern>('SELECT * FROM patterns WHERE id = ?', [id]);
  if (!pattern) return null;
  const steps = await db.query<{ step_number: number }>('SELECT step_number FROM pattern_steps WHERE pattern_id = ?', [id]);
  const tags = await db.query<{ tag_id: string }>('SELECT tag_id FROM pattern_tags WHERE pattern_id = ?', [id]);
  const collections = await db.query<{ collection_id: string }>('SELECT collection_id FROM pattern_collections WHERE pattern_id = ?', [id]);
  const seo = await db.queryOne<MinimalSeo>('SELECT title, description FROM pattern_seo WHERE pattern_id = ?', [id]);
  const colors = await db.query<{ count: number }>('SELECT count FROM pattern_colors WHERE pattern_id = ?', [id]);
  return { pattern, steps, tags, collections, seo, colors };
}

async function healthForPattern(db: ReturnType<typeof getDB>, pattern: Pattern) {
  const data = await getPatternHealthData(db, pattern.id);
  if (!data) return { score: 0, checks: [] };
  return computeHealthScore(
    data.pattern,
    data.steps as { step_number: number }[],
    data.tags,
    data.collections as { collection_id: string }[],
    data.seo,
    data.colors
  );
}

type AuditRow = {
  missing_cover: number;
  missing_faq: number;
  missing_collection: number;
  missing_related: number;
  missing_internal_links: number;
  ready: number;
  published: number;
  score: number;
};

async function toAdminPattern(db: ReturnType<typeof getDB>, row: Pattern & { views?: number; likes?: number; downloads?: number }) {
  const tags = await db.query<Tag>(
    `SELECT t.* FROM tags t JOIN pattern_tags pt ON pt.tag_id = t.id WHERE pt.pattern_id = ? ORDER BY t.name`,
    [row.id]
  );
  const categories = await db.query<Category>(
    `SELECT c.* FROM categories c JOIN pattern_categories pc ON pc.category_id = c.id WHERE pc.pattern_id = ? ORDER BY c.name`,
    [row.id]
  );
  const collections = await db.query<Collection>(
    `SELECT c.* FROM collections c JOIN pattern_collections pc ON pc.collection_id = c.id WHERE pc.pattern_id = ? ORDER BY c.title`,
    [row.id]
  );
  const steps = await db.query<PatternStep>(
    'SELECT * FROM pattern_steps WHERE pattern_id = ? ORDER BY step_number ASC',
    [row.id]
  );
  const seo = await db.queryOne<PatternSeo>('SELECT * FROM pattern_seo WHERE pattern_id = ?', [row.id]);
  const audit = await db.queryOne<AuditRow>('SELECT missing_cover, missing_faq, missing_collection, missing_related, missing_internal_links, ready, published, score FROM pattern_audit WHERE pattern_id = ?', [row.id]);
  const health = await healthForPattern(db, row);
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description ?? '',
    subject: row.subject ?? '',
    style: row.style ?? '',
    season: row.season ?? '',
    difficulty: difficultyFromId(row.difficulty_id),
    grid_size: row.grid_size ?? '24x24',
    grid_status: row.grid_status ?? 'missing',
    estimated_beads: row.estimated_beads ?? 0,
    bead_count: row.estimated_beads ?? 0,
    color_count: row.color_count ?? 0,
    color_palette: row.color_palette ? JSON.parse(row.color_palette) : [],
    estimated_time: row.estimated_time ?? '',
    grid_designer: row.grid_designer ?? '',
    grid_version: row.grid_version ?? 1,
    grid_review_required: Boolean(row.grid_review_required),
    seo_priority: row.seo_priority ?? 50,
    publish_order: row.publish_order ?? 0,
    status: row.status,
    cover_image: row.cover_image ?? '',
    finished_image: row.finished_image ?? '',
    cover_media_id: row.cover_media_id ?? undefined,
    finished_media_id: row.finished_media_id ?? undefined,
    gallery_media_ids: row.gallery_media_ids ? JSON.parse(row.gallery_media_ids) : [],
    step_media_ids: row.step_media_ids ? JSON.parse(row.step_media_ids) : [],
    tags: tags.map((t) => ({ name: t.name, slug: t.slug })),
    categories: categories.map((c) => ({ name: c.name, slug: c.slug })),
    collections: collections.map((c) => ({ title: c.title, slug: c.slug })),
    steps: steps.map((s) => ({
      id: s.id,
      step_number: s.step_number,
      description: s.description ?? '',
      image: s.image ?? '',
      grid_data: s.grid_data ? JSON.parse(s.grid_data) : undefined,
    })),
    seo_title: seo?.title ?? row.seo_title ?? '',
    seo_description: seo?.description ?? row.seo_description ?? '',
    keywords: seo?.keywords ? seo.keywords.split(',').map((k) => k.trim()) : (row.seo_keywords ? row.seo_keywords.split(',').map((k) => k.trim()) : []),
    views: row.views ?? 0,
    likes: row.likes ?? 0,
    downloads: row.downloads ?? 0,
    created_at: row.created_at,
    updated_at: row.updated_at,
    health_score: health.score,
    health_checks: health.checks,
    audit: audit
      ? {
          missing_cover: Boolean(audit.missing_cover),
          missing_faq: Boolean(audit.missing_faq),
          missing_collection: Boolean(audit.missing_collection),
          missing_related: Boolean(audit.missing_related),
          missing_internal_links: Boolean(audit.missing_internal_links),
          ready: Boolean(audit.ready),
          published: row.status === 'published',
          score: audit.score,
        }
      : null,
  };
}

function generateSlug(title: string, existing?: string) {
  if (existing) return existing;
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 200);
}

patterns.get('/', zValidator('query', AdminPatternQuerySchema), async (c) => {
  const db = getDB(c.env);
  const query = c.req.valid('query');
  const { status, difficulty, collection, category, tag, q, grid_status, seo_ready, sort, page, limit } = query;
  const offset = (page - 1) * limit;

  const where: string[] = [];
  const params: unknown[] = [];

  if (status) {
    where.push('p.status = ?');
    params.push(status);
  }
  if (difficulty) {
    const diff = typeof difficulty === 'string' ? difficulty : 'easy';
    const diffId = diff === 'easy' ? 1 : diff === 'medium' ? 2 : 3;
    where.push('p.difficulty_id = ?');
    params.push(diffId);
  }
  if (collection) {
    where.push('EXISTS (SELECT 1 FROM pattern_collections pc JOIN collections col ON col.id = pc.collection_id WHERE pc.pattern_id = p.id AND (col.slug = ? OR col.id = ?))');
    params.push(collection, collection);
  }
  if (category) {
    where.push('EXISTS (SELECT 1 FROM pattern_categories pct JOIN categories cat ON cat.id = pct.category_id WHERE pct.pattern_id = p.id AND (cat.slug = ? OR cat.id = ?))');
    params.push(category, category);
  }
  if (tag) {
    where.push('EXISTS (SELECT 1 FROM pattern_tags pt JOIN tags t ON t.id = pt.tag_id WHERE pt.pattern_id = p.id AND (t.slug = ? OR t.id = ?))');
    params.push(tag, tag);
  }
  if (q) {
    where.push('(p.title LIKE ? OR p.description LIKE ? OR p.slug LIKE ?)');
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }
  if (grid_status) {
    where.push('p.grid_status = ?');
    params.push(grid_status);
  }
  if (seo_ready === 'true') {
    where.push('EXISTS (SELECT 1 FROM pattern_audit pa WHERE pa.pattern_id = p.id AND pa.ready = 1)');
  } else if (seo_ready === 'false') {
    where.push('(NOT EXISTS (SELECT 1 FROM pattern_audit pa WHERE pa.pattern_id = p.id AND pa.ready = 1) OR NOT EXISTS (SELECT 1 FROM pattern_audit pa WHERE pa.pattern_id = p.id))');
  }

  const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';

  const countSql = `SELECT COUNT(*) as count FROM patterns p ${whereClause}`;
  const countRow = await db.queryOne<{ count: number }>(countSql, params);
  const total = countRow?.count ?? 0;

  let orderBy = 'p.created_at DESC';
  if (sort === 'updated') orderBy = 'p.updated_at DESC';
  else if (sort === 'views') orderBy = 'COALESCE(a.views, 0) DESC';
  else if (sort === 'downloads') orderBy = 'COALESCE(a.downloads, 0) DESC';

  const dataSql = `SELECT p.id, p.slug, p.title, p.description, p.subject, p.style, p.season, p.difficulty, p.difficulty_id, p.status, p.version, p.published_at, p.cover_image, p.finished_image, p.cover_image_r2_key, p.cover_media_id, p.finished_media_id, p.gallery_media_ids, p.step_media_ids, p.image_updated_at, p.grid_size, p.grid_data, p.estimated_beads, p.color_count, p.color_palette, p.estimated_time, p.grid_status, p.grid_designer, p.grid_version, p.grid_review_required, p.seo_priority, p.publish_order, p.seo_title, p.seo_description, p.seo_keywords, p.created_at, p.updated_at, COALESCE(a.views, 0) as views, COALESCE(a.likes, 0) as likes, COALESCE(a.downloads, 0) as downloads FROM patterns p LEFT JOIN analytics a ON a.pattern_id = p.id ${whereClause} ORDER BY ${orderBy} LIMIT ? OFFSET ?`;
  const rows = await db.query<Pattern & { views: number; likes: number; downloads: number }>(dataSql, [...params, limit, offset]);

  const items = await Promise.all(rows.map(async (r) => {
    const pattern = await toAdminPattern(db, r);
    return pattern;
  }));

  return c.json(paginated(items, { page, limit, total }));
});

patterns.post('/', zValidator('json', CreatePatternSchema), async (c) => {
  const db = getDB(c.env);
  const body = c.req.valid('json');
  const now = new Date().toISOString();
  const id = uuidv4();
  const slug = generateSlug(body.title, body.slug);

  const existing = await db.queryOne<{ id: string }>('SELECT id FROM patterns WHERE slug = ?', [slug]);
  if (existing) throw new AppError('Slug already exists', 'SLUG_EXISTS', 409);

  const difficultyId = difficultyToId(body.difficulty ?? 'easy');
  const colorPalette = body.color_palette ? JSON.stringify(body.color_palette) : null;

  await db.insert('patterns', {
    id,
    slug,
    title: body.title,
    description: body.description ?? null,
    difficulty: difficultyFromId(difficultyId),
    difficulty_id: difficultyId,
    status: 'draft',
    cover_image: body.cover_image ?? null,
    finished_image: body.finished_image ?? null,
    cover_image_r2_key: body.cover_image_r2_key ?? null,
    cover_media_id: body.cover_media_id ?? null,
    finished_media_id: body.finished_media_id ?? null,
    gallery_media_ids: body.gallery_media_ids ? JSON.stringify(body.gallery_media_ids) : null,
    step_media_ids: body.step_media_ids ? JSON.stringify(body.step_media_ids) : null,
    image_updated_at: body.image_updated_at ?? null,
    grid_size: body.grid_size ?? null,
    grid_data: body.grid_data ? JSON.stringify(body.grid_data) : null,
    estimated_beads: body.estimated_beads ?? null,
    color_count: body.color_count ?? null,
    color_palette: colorPalette,
    seo_title: body.seo_title ?? null,
    seo_description: body.seo_description ?? null,
    seo_keywords: body.seo_keywords ?? null,
    created_at: now,
    updated_at: now,
    version: 1,
    published_at: null,
  });

  await db.insert('analytics', { pattern_id: id, views: 0, likes: 0, shares: 0, downloads: 0, updated_at: now });

  // Steps
  if (body.steps && body.steps.length > 0) {
    for (let i = 0; i < body.steps.length; i++) {
      const step = body.steps[i];
      await db.insert('pattern_steps', {
        id: uuidv4(),
        pattern_id: id,
        step_number: i + 1,
        description: step.description ?? null,
        image: step.image ?? null,
        grid_data: step.grid_data ? JSON.stringify(step.grid_data) : null,
      });
    }
  }

  // Tags
  if (body.tag_slugs && body.tag_slugs.length > 0) {
    const tagRows = await db.query<Tag>('SELECT id, slug FROM tags WHERE slug IN (' + body.tag_slugs.map(() => '?').join(',') + ')', body.tag_slugs);
    for (const tag of tagRows) {
      await db.insert('pattern_tags', { pattern_id: id, tag_id: tag.id });
    }
  }

  // SEO
  if (body.seo_title || body.seo_description || body.canonical || body.robots || body.og_image || body.twitter_title || body.structured_data) {
    await db.insert('pattern_seo', {
      id: uuidv4(),
      pattern_id: id,
      title: body.seo_title ?? null,
      description: body.seo_description ?? null,
      keywords: body.seo_keywords ?? null,
      canonical: body.canonical ?? null,
      robots: body.robots ?? null,
      og_image: body.og_image ?? null,
      twitter_title: body.twitter_title ?? null,
      twitter_description: body.twitter_description ?? null,
      twitter_image: body.twitter_image ?? null,
      structured_data: body.structured_data ?? null,
      created_at: now,
      updated_at: now,
    });
  }

  const row = await db.queryOne<Pattern>('SELECT * FROM patterns WHERE id = ?', [id]);
  if (!row) throw new AppError('Pattern not found after creation', 'INTERNAL_ERROR', 500);
  const pattern = await toAdminPattern(db, row);
  return c.json(success(pattern), 201);
});

patterns.get('/:id', async (c) => {
  const db = getDB(c.env);
  const id = c.req.param('id');
  const row = await db.queryOne<Pattern>('SELECT * FROM patterns WHERE id = ?', [id]);
  if (!row) throw new AppError('Pattern not found', 'PATTERN_NOT_FOUND', 404);
  const pattern = await toAdminPattern(db, row);
  return c.json(success(pattern));
});

patterns.put('/:id', zValidator('json', UpdatePatternSchema), async (c) => {
  const db = getDB(c.env);
  const id = c.req.param('id');
  const existing = await db.queryOne<Pattern>('SELECT * FROM patterns WHERE id = ?', [id]);
  if (!existing) throw new AppError('Pattern not found', 'PATTERN_NOT_FOUND', 404);

  const body = c.req.valid('json');
  const now = new Date().toISOString();
  const updates: Record<string, unknown> = { updated_at: now };

  if (body.title !== undefined) updates.title = body.title;
  if (body.slug !== undefined) updates.slug = body.slug;
  if (body.description !== undefined) updates.description = body.description ?? null;
  if (body.difficulty !== undefined) {
    const difficultyId = difficultyToId(body.difficulty);
    updates.difficulty_id = difficultyId;
    updates.difficulty = difficultyFromId(difficultyId);
  }
  if (body.status !== undefined) {
    updates.status = body.status;
    if (body.status === 'published') {
      updates.published_at = existing.published_at ?? now;
      updates.version = existing.version + 1;
    }
  }
  if (body.cover_image !== undefined) updates.cover_image = body.cover_image ?? null;
  if (body.finished_image !== undefined) updates.finished_image = body.finished_image ?? null;
  if (body.cover_image_r2_key !== undefined) updates.cover_image_r2_key = body.cover_image_r2_key ?? null;
  if (body.cover_media_id !== undefined) updates.cover_media_id = body.cover_media_id ?? null;
  if (body.finished_media_id !== undefined) updates.finished_media_id = body.finished_media_id ?? null;
  if (body.gallery_media_ids !== undefined) updates.gallery_media_ids = body.gallery_media_ids ? JSON.stringify(body.gallery_media_ids) : null;
  if (body.step_media_ids !== undefined) updates.step_media_ids = body.step_media_ids ? JSON.stringify(body.step_media_ids) : null;
  if (body.image_updated_at !== undefined) updates.image_updated_at = body.image_updated_at ?? null;
  if (body.grid_size !== undefined) updates.grid_size = body.grid_size ?? null;
  if (body.grid_data !== undefined) updates.grid_data = body.grid_data ? JSON.stringify(body.grid_data) : null;
  if (body.estimated_beads !== undefined) updates.estimated_beads = body.estimated_beads ?? null;
  if (body.color_count !== undefined) updates.color_count = body.color_count ?? null;
  if (body.color_palette !== undefined) updates.color_palette = body.color_palette ? JSON.stringify(body.color_palette) : null;
  if (body.seo_title !== undefined) updates.seo_title = body.seo_title ?? null;
  if (body.seo_description !== undefined) updates.seo_description = body.seo_description ?? null;
  if (body.seo_keywords !== undefined) updates.seo_keywords = body.seo_keywords ?? null;

  await db.update('patterns', updates, { id });

  // Steps
  if (body.steps !== undefined) {
    await db.deleteWhere('pattern_steps', { pattern_id: id });
    for (let i = 0; i < body.steps.length; i++) {
      const step = body.steps[i];
      await db.insert('pattern_steps', {
        id: uuidv4(),
        pattern_id: id,
        step_number: i + 1,
        description: step.description ?? null,
        image: step.image ?? null,
        grid_data: step.grid_data ? JSON.stringify(step.grid_data) : null,
      });
    }
  }

  // Tags
  if (body.tag_slugs !== undefined) {
    await db.deleteWhere('pattern_tags', { pattern_id: id });
    if (body.tag_slugs.length > 0) {
      const tagRows = await db.query<Tag>('SELECT id, slug FROM tags WHERE slug IN (' + body.tag_slugs.map(() => '?').join(',') + ')', body.tag_slugs);
      for (const tag of tagRows) {
        await db.insert('pattern_tags', { pattern_id: id, tag_id: tag.id });
      }
    }
  }

  // SEO
  if (body.seo_title !== undefined || body.seo_description !== undefined || body.seo_keywords !== undefined || body.canonical !== undefined || body.robots !== undefined || body.og_image !== undefined || body.twitter_title !== undefined || body.twitter_description !== undefined || body.twitter_image !== undefined || body.structured_data !== undefined) {
    const existingSeo = await db.queryOne<{ id: string }>('SELECT id FROM pattern_seo WHERE pattern_id = ?', [id]);
    const seoRecord: Record<string, unknown> = {
      title: body.seo_title ?? null,
      description: body.seo_description ?? null,
      keywords: body.seo_keywords ?? null,
      canonical: body.canonical ?? null,
      robots: body.robots ?? null,
      og_image: body.og_image ?? null,
      twitter_title: body.twitter_title ?? null,
      twitter_description: body.twitter_description ?? null,
      twitter_image: body.twitter_image ?? null,
      structured_data: body.structured_data ?? null,
      updated_at: now,
    };
    if (existingSeo) {
      await db.update('pattern_seo', seoRecord, { id: existingSeo.id });
    } else {
      await db.insert('pattern_seo', { id: uuidv4(), pattern_id: id, ...seoRecord, created_at: now });
    }
  }

  const row = await db.queryOne<Pattern>('SELECT * FROM patterns WHERE id = ?', [id]);
  if (!row) throw new AppError('Pattern not found after update', 'INTERNAL_ERROR', 500);
  const pattern = await toAdminPattern(db, row);
  return c.json(success(pattern));
});

patterns.delete('/:id', async (c) => {
  const db = getDB(c.env);
  const id = c.req.param('id');
  const existing = await db.queryOne<{ id: string }>('SELECT id FROM patterns WHERE id = ?', [id]);
  if (!existing) throw new AppError('Pattern not found', 'PATTERN_NOT_FOUND', 404);
  await db.deleteWhere('patterns', { id });
  return c.json(success({ deleted: true }));
});

patterns.put('/:id/status', zValidator('json', UpdateStatusSchema), async (c) => {
  const db = getDB(c.env);
  const id = c.req.param('id');
  const { status } = c.req.valid('json');
  const existing = await db.queryOne<Pattern>('SELECT id FROM patterns WHERE id = ?', [id]);
  if (!existing) throw new AppError('Pattern not found', 'PATTERN_NOT_FOUND', 404);
  const updates: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
  if (status === 'published') {
    updates.published_at = new Date().toISOString();
    updates.version = await db.queryOne<{ version: number }>('SELECT version FROM patterns WHERE id = ?', [id]).then((r) => (r?.version ?? 0) + 1);
  }
  await db.update('patterns', updates, { id });
  return c.json(success({ id, status }));
});

patterns.post('/:id/publish', async (c) => {
  const db = getDB(c.env);
  const id = c.req.param('id');
  const existing = await db.queryOne<Pattern>('SELECT id, status FROM patterns WHERE id = ?', [id]);
  if (!existing) throw new AppError('Pattern not found', 'PATTERN_NOT_FOUND', 404);
  const now = new Date().toISOString();
  await db.execute(
    'UPDATE patterns SET status = \'published\', version = version + 1, published_at = COALESCE(published_at, ?), updated_at = ? WHERE id = ?',
    [now, now, id]
  );
  return c.json(success({ id, status: 'published' }));
});

patterns.post('/:id/unpublish', async (c) => {
  const db = getDB(c.env);
  const id = c.req.param('id');
  const existing = await db.queryOne<Pattern>('SELECT id FROM patterns WHERE id = ?', [id]);
  if (!existing) throw new AppError('Pattern not found', 'PATTERN_NOT_FOUND', 404);
  await db.update('patterns', { status: 'draft', updated_at: new Date().toISOString() }, { id });
  return c.json(success({ id, status: 'draft' }));
});

patterns.post('/:id/archive', async (c) => {
  const db = getDB(c.env);
  const id = c.req.param('id');
  const existing = await db.queryOne<Pattern>('SELECT id FROM patterns WHERE id = ?', [id]);
  if (!existing) throw new AppError('Pattern not found', 'PATTERN_NOT_FOUND', 404);
  await db.update('patterns', { status: 'archived', updated_at: new Date().toISOString() }, { id });
  return c.json(success({ id, status: 'archived' }));
});

patterns.post('/bulk-publish', zValidator('json', BulkPublishSchema), async (c) => {
  const db = getDB(c.env);
  const { ids, all, slugs } = c.req.valid('json');
  const now = new Date().toISOString();
  let sql = "UPDATE patterns SET status = 'published', version = version + 1, published_at = COALESCE(published_at, ?), updated_at = ? WHERE status = 'draft'";
  const params: unknown[] = [now, now];
  if (!all && ((ids && ids.length > 0) || (slugs && slugs.length > 0))) {
    const conditions: string[] = [];
    if (ids && ids.length > 0) {
      conditions.push('id IN (' + ids.map(() => '?').join(',') + ')');
      params.push(...ids);
    }
    if (slugs && slugs.length > 0) {
      conditions.push('slug IN (' + slugs.map(() => '?').join(',') + ')');
      params.push(...slugs);
    }
    sql += ' AND (' + conditions.join(' OR ') + ')';
  }
  const result = await db.execute(sql, params) as { meta?: { changes?: number } };
  return c.json(success({ published: result.meta?.changes ?? 0 }));
});

patterns.post('/bulk-archive', zValidator('json', BulkArchiveSchema), async (c) => {
  const db = getDB(c.env);
  const { ids, all, slugs } = c.req.valid('json');
  const now = new Date().toISOString();
  let sql = "UPDATE patterns SET status = 'archived', updated_at = ?";
  const params: unknown[] = [now];
  if (!all && ((ids && ids.length > 0) || (slugs && slugs.length > 0))) {
    const conditions: string[] = [];
    if (ids && ids.length > 0) {
      conditions.push('id IN (' + ids.map(() => '?').join(',') + ')');
      params.push(...ids);
    }
    if (slugs && slugs.length > 0) {
      conditions.push('slug IN (' + slugs.map(() => '?').join(',') + ')');
      params.push(...slugs);
    }
    sql += ' WHERE ' + conditions.join(' OR ');
  }
  const result = await db.execute(sql, params) as { meta?: { changes?: number } };
  return c.json(success({ archived: result.meta?.changes ?? 0 }));
});

patterns.delete('/bulk-delete', zValidator('json', BulkDeleteSchema), async (c) => {
  const db = getDB(c.env);
  const { ids } = c.req.valid('json');
  if (!ids || ids.length === 0) return c.json(success({ deleted: 0 }));
  const placeholders = ids.map(() => '?').join(',');
  const result = await db.execute(`DELETE FROM patterns WHERE id IN (${placeholders})`, ids) as { meta?: { changes?: number } };
  return c.json(success({ deleted: result.meta?.changes ?? 0 }));
});

patterns.get('/:id/health', async (c) => {
  const db = getDB(c.env);
  const id = c.req.param('id');
  const data = await getPatternHealthData(db, id);
  if (!data) throw new AppError('Pattern not found', 'PATTERN_NOT_FOUND', 404);
  const health = computeHealthScore(
    data.pattern,
    data.steps as { step_number: number }[],
    data.tags,
    data.collections as { collection_id: string }[],
    data.seo,
    data.colors
  );
  return c.json(success(health));
});

export default patterns;
