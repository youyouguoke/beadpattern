import { Hono, type Context } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { getDB } from '../lib/db';
import { generateId, normalizeSlug } from '../lib/slug';
import { success, paginated } from '../lib/response';
import { AppError } from '../lib/errors';
import { CreatePatternSchema, UpdatePatternSchema, ListPatternsQuerySchema } from '../lib/schemas';
import { generateSEO } from '../lib/seo';
import { normalizeColorPalette, enrichPaletteFromGrid, computeStats } from '../lib/colors';
import type { Bindings } from '../lib/env';
import type { Pattern, PatternStep, Tag, PatternColor } from '../types';

const patterns = new Hono<{ Bindings: Bindings }>();

async function resolveTagIds(db: ReturnType<typeof getDB>, tagSlugs?: string[], tagIds?: string[]): Promise<string[]> {
  const ids = new Set<string>(tagIds ?? []);
  if (tagSlugs && tagSlugs.length > 0) {
    const placeholders = tagSlugs.map(() => '?').join(',');
    const tags = await db.query<Tag>(`SELECT id FROM tags WHERE slug IN (${placeholders})`, tagSlugs);
    for (const t of tags) ids.add(t.id);
  }
  return Array.from(ids);
}

function parseJsonField<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

async function getPatternWithDetails(db: ReturnType<typeof getDB>, slug: string) {
  const pattern = await db.queryOne<Pattern>('SELECT * FROM patterns WHERE slug = ?', [slug]);
  if (!pattern) return null;

  const steps = await db.query<PatternStep>(
    'SELECT * FROM pattern_steps WHERE pattern_id = ? ORDER BY step_number',
    [pattern.id]
  );

  const tags = await db.query<Tag>(
    `SELECT t.* FROM tags t
     JOIN pattern_tags pt ON pt.tag_id = t.id
     WHERE pt.pattern_id = ?`,
    [pattern.id]
  );

  const analytics = await db.queryOne<{ views: number; likes: number; shares: number; downloads: number; updated_at: string }>(
    'SELECT * FROM analytics WHERE pattern_id = ?',
    [pattern.id]
  );

  const rawPalette = parseJsonField<string[] | PatternColor[] | null>(pattern.color_palette as string | null, []);
  const grid = parseJsonField<(string | number)[][] | null>(pattern.grid_data as string | null, null);
  const palette = enrichPaletteFromGrid(normalizeColorPalette(rawPalette ?? []), grid);

  return {
    pattern: {
      ...pattern,
      color_palette: palette,
      grid_data: grid,
      color_count: palette.length,
      estimated_beads: grid ? grid.flat().length : (pattern.estimated_beads ?? 0),
    },
    steps: steps.map((s) => ({
      ...s,
      grid_data: parseJsonField<Record<string, unknown> | null>(s.grid_data as string | null, null),
    })),
    tags,
    analytics,
  };
}

// List patterns
patterns.get('/', zValidator('query', ListPatternsQuerySchema), async (c) => {
  const db = getDB(c.env);
  const query = c.req.valid('query');
  const { tag, difficulty, status, sort, page, limit } = query;
  const offset = (page - 1) * limit;

  let where: string[] = [];
  const params: unknown[] = [];

  if (status) {
    where.push('p.status = ?');
    params.push(status);
  } else {
    where.push("p.status = 'published'");
  }

  if (difficulty) {
    where.push('p.difficulty = ?');
    params.push(difficulty);
  }

  if (tag) {
    where.push('EXISTS (SELECT 1 FROM pattern_tags pt JOIN tags t ON t.id = pt.tag_id WHERE pt.pattern_id = p.id AND t.slug = ?)');
    params.push(tag);
  }

  let orderBy = 'p.created_at DESC';
  if (sort === 'popular' || sort === 'views') {
    orderBy = 'COALESCE(a.views, 0) DESC';
  }

  let countSql = `SELECT COUNT(*) as count FROM patterns p LEFT JOIN analytics a ON a.pattern_id = p.id`;
  let dataSql = `SELECT p.id, p.slug, p.title, p.description, p.difficulty, p.status, p.cover_image, p.grid_size, p.color_palette, p.color_count, p.estimated_beads, p.created_at, p.updated_at, COALESCE(a.views, 0) as views, COALESCE(a.likes, 0) as likes, COALESCE(a.downloads, 0) as downloads FROM patterns p LEFT JOIN analytics a ON a.pattern_id = p.id`;

  if (where.length > 0) {
    const clause = ' WHERE ' + where.join(' AND ');
    countSql += clause;
    dataSql += clause;
  }

  countSql = countSql.replace('LEFT JOIN analytics a ON a.pattern_id = p.id', '');
  countSql = countSql.replace('FROM patterns p', 'FROM patterns p LEFT JOIN analytics a ON a.pattern_id = p.id');
  // Simpler count: just use patterns table
  countSql = `SELECT COUNT(*) as count FROM patterns p` + (where.length > 0 ? ' WHERE ' + where.join(' AND ') : '');

  const countRow = await db.queryOne<{ count: number }>(countSql, params);
  const total = countRow?.count ?? 0;

  dataSql += ` ORDER BY ${orderBy} LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  const rows = await db.query<Record<string, unknown>>(dataSql, params);
  const items = rows.map((r) => {
    const rawPalette = parseJsonField<string[] | PatternColor[] | null>(r.color_palette as string | null, []);
    const palette = normalizeColorPalette(rawPalette ?? []);
    return {
      id: r.id as string,
      slug: r.slug as string,
      title: r.title as string,
      description: r.description as string | null,
      difficulty: r.difficulty as string,
      status: r.status as string,
      cover_image: r.cover_image as string | null,
      grid_size: r.grid_size as string | null,
      color_palette: palette,
      color_count: palette.length,
      estimated_beads: (r.estimated_beads as number | null) ?? 0,
      created_at: r.created_at as string,
      updated_at: r.updated_at as string,
      views: r.views as number,
      likes: r.likes as number,
      downloads: r.downloads as number,
    };
  });

  return c.json(paginated(items, { page, limit, total }));
});

// Create pattern
patterns.post('/', zValidator('json', CreatePatternSchema), async (c) => {
  const db = getDB(c.env);
  const body = c.req.valid('json');
  const id = generateId();
  const slug = body.slug ?? normalizeSlug(body.title);

  const existing = await db.queryOne<Pattern>('SELECT id FROM patterns WHERE slug = ?', [slug]);
  if (existing) throw new AppError('Pattern slug already exists', 'PATTERN_DUPLICATE', 409);

  const seo = generateSEO({ title: body.title, description: body.description ?? null, tags: [] });

  const grid = body.grid_data as (string | number)[][] | undefined;
  const palette = normalizeColorPalette(body.color_palette as string[] | PatternColor[] | undefined);
  const enrichedPalette = grid ? enrichPaletteFromGrid(palette, grid) : palette;
  const stats = grid ? computeStats(grid) : { color_count: body.color_count, estimated_beads: body.estimated_beads };

  await db.insert('patterns', {
    id,
    slug,
    title: body.title,
    description: body.description ?? null,
    difficulty: body.difficulty,
    status: 'draft',
    cover_image: body.cover_image ?? null,
    grid_size: body.grid_size ?? null,
    grid_data: grid ? JSON.stringify(grid) : null,
    estimated_beads: stats.estimated_beads ?? null,
    color_count: stats.color_count ?? enrichedPalette.length,
    color_palette: enrichedPalette.length > 0 ? JSON.stringify(enrichedPalette) : null,
    seo_title: body.seo_title ?? seo.title,
    seo_description: body.seo_description ?? seo.description,
    seo_keywords: body.seo_keywords ?? seo.keywords,
  });

  // Steps
  if (body.steps && body.steps.length > 0) {
    for (let i = 0; i < body.steps.length; i++) {
      const s = body.steps[i];
      await db.insert('pattern_steps', {
        id: generateId(),
        pattern_id: id,
        step_number: i + 1,
        description: s.description ?? null,
        image: s.image ?? null,
        grid_data: s.grid_data ? JSON.stringify(s.grid_data) : null,
      });
    }
  }

  // Tags
  const resolvedTagIds = await resolveTagIds(db, body.tag_slugs, body.tag_ids);
  for (const tagId of resolvedTagIds) {
    await db.insert('pattern_tags', { pattern_id: id, tag_id: tagId });
  }

  // Analytics
  await db.insert('analytics', { pattern_id: id });

  const result = await getPatternWithDetails(db, slug);
  return c.json(success(result), 201);
});

// Get pattern
patterns.get('/:slug', async (c) => {
  const db = getDB(c.env);
  const slug = c.req.param('slug');
  const result = await getPatternWithDetails(db, slug);
  if (!result) throw new AppError('Pattern not found', 'PATTERN_NOT_FOUND', 404);
  return c.json(success(result));
});

// Update pattern
patterns.put('/:id', zValidator('json', UpdatePatternSchema), async (c) => {
  const db = getDB(c.env);
  const id = c.req.param('id');
  const body = c.req.valid('json');

  const existing = await db.queryOne<Pattern>('SELECT * FROM patterns WHERE id = ?', [id]);
  if (!existing) throw new AppError('Pattern not found', 'PATTERN_NOT_FOUND', 404);

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (body.title !== undefined) updates.title = body.title;
  if (body.description !== undefined) updates.description = body.description;
  if (body.difficulty !== undefined) updates.difficulty = body.difficulty;
  if (body.cover_image !== undefined) updates.cover_image = body.cover_image;
  if (body.finished_image !== undefined) updates.finished_image = body.finished_image;
  if (body.cover_image_r2_key !== undefined) updates.cover_image_r2_key = body.cover_image_r2_key;
  if (body.image_updated_at !== undefined) updates.image_updated_at = body.image_updated_at;
  else if (body.finished_image !== undefined || body.cover_image !== undefined || body.cover_image_r2_key !== undefined) {
    updates.image_updated_at = new Date().toISOString();
  }
  if (body.grid_size !== undefined) updates.grid_size = body.grid_size;
  if (body.estimated_beads !== undefined) updates.estimated_beads = body.estimated_beads;
  if (body.color_count !== undefined) updates.color_count = body.color_count;
  if (body.color_palette !== undefined || body.grid_data !== undefined) {
    const gridFromBody = body.grid_data as (string | number)[][] | undefined;
    const grid = gridFromBody !== undefined ? gridFromBody : parseJsonField<(string | number)[][] | null>(existing.grid_data as string | null, null);
    const palette = normalizeColorPalette(body.color_palette as string[] | PatternColor[] | undefined ?? parseJsonField<string[] | PatternColor[] | null>(existing.color_palette as string | null, []) ?? []);
    const enrichedPalette = grid ? enrichPaletteFromGrid(palette, grid) : palette;
    const stats = grid ? computeStats(grid) : { color_count: enrichedPalette.length, estimated_beads: body.estimated_beads ?? existing.estimated_beads };
    updates.color_palette = enrichedPalette.length > 0 ? JSON.stringify(enrichedPalette) : null;
    updates.grid_data = grid ? JSON.stringify(grid) : existing.grid_data;
    if (body.color_count === undefined) updates.color_count = stats.color_count;
    if (body.estimated_beads === undefined) updates.estimated_beads = stats.estimated_beads;
  }
  if (body.color_count !== undefined) updates.color_count = body.color_count;
  if (body.estimated_beads !== undefined) updates.estimated_beads = body.estimated_beads;
  if (body.status !== undefined) updates.status = body.status;

  // Recompute SEO if needed
  const tags = await db.query<Tag>(
    `SELECT t.* FROM tags t JOIN pattern_tags pt ON pt.tag_id = t.id WHERE pt.pattern_id = ?`,
    [id]
  );
  if (body.title !== undefined || body.description !== undefined) {
    const seo = generateSEO({ title: (body.title ?? existing.title) as string, description: body.description ?? existing.description, tags });
    if (body.seo_title === undefined) updates.seo_title = seo.title;
    if (body.seo_description === undefined) updates.seo_description = seo.description;
    if (body.seo_keywords === undefined) updates.seo_keywords = seo.keywords;
  }
  if (body.seo_title !== undefined) updates.seo_title = body.seo_title;
  if (body.seo_description !== undefined) updates.seo_description = body.seo_description;
  if (body.seo_keywords !== undefined) updates.seo_keywords = body.seo_keywords;

  // Update image fields before persisting
  if (body.finished_image !== undefined) updates.finished_image = body.finished_image;
  if (body.cover_image_r2_key !== undefined) updates.cover_image_r2_key = body.cover_image_r2_key;
  if (body.image_updated_at !== undefined) updates.image_updated_at = body.image_updated_at;
  else if (body.finished_image !== undefined || body.cover_image !== undefined || body.cover_image_r2_key !== undefined) {
    updates.image_updated_at = new Date().toISOString();
  }

  await db.update('patterns', updates, { id });

  // update tags
  if (body.tag_ids !== undefined || body.tag_slugs !== undefined) {
    await db.deleteWhere('pattern_tags', { pattern_id: id });
    const resolvedTagIds = await resolveTagIds(db, body.tag_slugs, body.tag_ids);
    for (const tagId of resolvedTagIds) {
      await db.insert('pattern_tags', { pattern_id: id, tag_id: tagId });
    }
  }

  // Update steps
  if (body.steps !== undefined) {
    await db.deleteWhere('pattern_steps', { pattern_id: id });
    for (let i = 0; i < body.steps.length; i++) {
      const s = body.steps[i];
      await db.insert('pattern_steps', {
        id: generateId(),
        pattern_id: id,
        step_number: i + 1,
        description: s.description ?? null,
        image: s.image ?? null,
        grid_data: s.grid_data ? JSON.stringify(s.grid_data) : null,
      });
    }
  }

  const updated = await db.queryOne<Pattern>('SELECT slug FROM patterns WHERE id = ?', [id]);
  const result = await getPatternWithDetails(db, updated!.slug);
  return c.json(success(result));
});

// Publish by slug
patterns.post('/:slug/publish', async (c) => {
  const db = getDB(c.env);
  const slug = c.req.param('slug');
  const now = new Date().toISOString();
  const existing = await db.queryOne<Pattern>('SELECT status FROM patterns WHERE slug = ?', [slug]);
  if (!existing) throw new AppError('Pattern not found', 'PATTERN_NOT_FOUND', 404);
  const isFirstPublish = existing.status !== 'published';
  await db.execute(
    `UPDATE patterns SET
       status = 'published',
       version = version + 1,
       published_at = CASE WHEN published_at IS NULL THEN ? ELSE published_at END,
       updated_at = ?
     WHERE slug = ?`,
    [now, now, slug]
  );
  const result = await getPatternWithDetails(db, slug);
  if (!result) throw new AppError('Pattern not found', 'PATTERN_NOT_FOUND', 404);
  return c.json(success({ ...result, first_publish: isFirstPublish }));
});

// Archive
patterns.post('/:id/archive', async (c) => {
  const db = getDB(c.env);
  const id = c.req.param('id');
  await db.update('patterns', { status: 'archived', updated_at: new Date().toISOString() }, { id });
  const updated = await db.queryOne<Pattern>('SELECT slug FROM patterns WHERE id = ?', [id]);
  if (!updated) throw new AppError('Pattern not found', 'PATTERN_NOT_FOUND', 404);
  const result = await getPatternWithDetails(db, updated.slug);
  return c.json(success(result));
});

// Delete
patterns.delete('/:id', async (c) => {
  const db = getDB(c.env);
  const id = c.req.param('id');
  await db.deleteWhere('patterns', { id });
  return c.json(success({ deleted: true }));
});

function getClientFingerprint(c: Context): string {
  const clientId = c.req.query('client_id');
  if (clientId) return clientId;
  const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown';
  const ua = c.req.header('user-agent') || 'unknown';
  // Simple hash of IP + first 8 chars of UA
  return `${ip}:${ua.slice(0, 8)}`;
}

async function hasRecentAction(
  db: ReturnType<typeof getDB>,
  patternId: string,
  actionType: 'view' | 'like',
  fingerprint: string,
  windowMinutes: number
): Promise<boolean> {
  const row = await db.queryOne<{ count: number }>(
    `SELECT COUNT(*) as count FROM action_logs
     WHERE pattern_id = ? AND action_type = ? AND fingerprint = ?
       AND datetime(created_at) > datetime('now', '-${windowMinutes} minutes')`,
    [patternId, actionType, fingerprint]
  );
  return (row?.count ?? 0) > 0;
}

async function logAction(
  db: ReturnType<typeof getDB>,
  patternId: string,
  actionType: 'view' | 'like' | 'download' | 'share',
  fingerprint: string
): Promise<void> {
  await db.insert('action_logs', {
    id: generateId(),
    pattern_id: patternId,
    action_type: actionType,
    fingerprint,
    created_at: new Date().toISOString(),
  });
}

// View
patterns.post('/:slug/view', async (c) => {
  const db = getDB(c.env);
  const slug = c.req.param('slug');
  const pattern = await db.queryOne<Pattern>('SELECT id FROM patterns WHERE slug = ?', [slug]);
  if (!pattern) throw new AppError('Pattern not found', 'PATTERN_NOT_FOUND', 404);

  const fingerprint = getClientFingerprint(c);
  if (await hasRecentAction(db, pattern.id, 'view', fingerprint, 5)) {
    return c.json(success({ viewed: true, skipped: true }));
  }
  await logAction(db, pattern.id, 'view', fingerprint);

  await db.execute(
    `INSERT INTO analytics (pattern_id, views) VALUES (?, 1)
     ON CONFLICT(pattern_id) DO UPDATE SET views = views + 1, updated_at = ?`,
    [pattern.id, new Date().toISOString()]
  );
  return c.json(success({ viewed: true }));
});

// Like
patterns.post('/:slug/like', async (c) => {
  const db = getDB(c.env);
  const slug = c.req.param('slug');
  const pattern = await db.queryOne<Pattern>('SELECT id FROM patterns WHERE slug = ?', [slug]);
  if (!pattern) throw new AppError('Pattern not found', 'PATTERN_NOT_FOUND', 404);

  const fingerprint = getClientFingerprint(c);
  const alreadyLiked = await db.queryOne<{ count: number }>(
    `SELECT COUNT(*) as count FROM action_logs
     WHERE pattern_id = ? AND action_type = 'like' AND fingerprint = ?`,
    [pattern.id, fingerprint]
  );
  if ((alreadyLiked?.count ?? 0) > 0) {
    return c.json(success({ liked: false, reason: 'already_liked' }));
  }
  await logAction(db, pattern.id, 'like', fingerprint);

  await db.execute(
    `INSERT INTO analytics (pattern_id, likes) VALUES (?, 1)
     ON CONFLICT(pattern_id) DO UPDATE SET likes = likes + 1, updated_at = ?`,
    [pattern.id, new Date().toISOString()]
  );
  return c.json(success({ liked: true }));
});

// Download
patterns.post('/:slug/download', async (c) => {
  const db = getDB(c.env);
  const slug = c.req.param('slug');
  const pattern = await db.queryOne<Pattern>('SELECT id FROM patterns WHERE slug = ?', [slug]);
  if (!pattern) throw new AppError('Pattern not found', 'PATTERN_NOT_FOUND', 404);

  await db.execute(
    `INSERT INTO analytics (pattern_id, downloads) VALUES (?, 1)
     ON CONFLICT(pattern_id) DO UPDATE SET downloads = downloads + 1, updated_at = ?`,
    [pattern.id, new Date().toISOString()]
  );
  return c.json(success({ downloaded: true }));
});

// Share
patterns.post('/:slug/share', async (c) => {
  const db = getDB(c.env);
  const slug = c.req.param('slug');
  const pattern = await db.queryOne<Pattern>('SELECT id FROM patterns WHERE slug = ?', [slug]);
  if (!pattern) throw new AppError('Pattern not found', 'PATTERN_NOT_FOUND', 404);

  await db.execute(
    `INSERT INTO analytics (pattern_id, shares) VALUES (?, 1)
     ON CONFLICT(pattern_id) DO UPDATE SET shares = shares + 1, updated_at = ?`,
    [pattern.id, new Date().toISOString()]
  );
  return c.json(success({ shared: true }));
});

export default patterns;
