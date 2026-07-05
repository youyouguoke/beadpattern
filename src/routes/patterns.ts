import { Hono, type Context } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { getDB } from '../lib/db';
import { generateId, normalizeSlug } from '../lib/slug';
import { success, paginated } from '../lib/response';
import { AppError } from '../lib/errors';
import { CreatePatternSchema, UpdatePatternSchema, ListPatternsQuerySchema, difficultyStringToId } from '../lib/schemas';
import { generateSEO } from '../lib/seo';
import { normalizeColorPalette, enrichPaletteFromGrid, computeStats } from '../lib/colors';
import type { Bindings } from '../lib/env';
import type { Pattern, PatternStep, Tag, PatternColor, Color } from '../types';
import { generateId as colorGenerateId } from '../lib/slug';

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

async function resolveDifficultySlug(db: ReturnType<typeof getDB>, difficultyId: number): Promise<string> {
  const row = await db.queryOne<{ slug: string }>('SELECT slug FROM difficulties WHERE id = ?', [difficultyId]);
  return row?.slug ?? 'easy';
}

async function upsertPatternColors(
  db: ReturnType<typeof getDB>,
  patternId: string,
  palette: PatternColor[],
  grid: (string | number)[][] | null
) {
  if (palette.length === 0) {
    await db.execute('DELETE FROM pattern_colors WHERE pattern_id = ?', [patternId]);
    return;
  }

  const enriched = grid ? enrichPaletteFromGrid(palette, grid) : palette;

  // Upsert colors table entries
  for (const c of enriched) {
    const hex = c.hex.toLowerCase();
    const existing = await db.queryOne<Color>('SELECT id FROM colors WHERE hex = ?', [hex]);
    if (!existing) {
      await db.insert('colors', { id: colorGenerateId(), hex, name: c.name ?? null, family: null });
    }
  }

  // Remove stale pattern_colors rows
  await db.execute('DELETE FROM pattern_colors WHERE pattern_id = ?', [patternId]);

  // Insert pattern_colors
  const colorRows = await db.query<Color>('SELECT id, hex FROM colors WHERE hex IN (' + enriched.map(() => '?').join(',') + ')', enriched.map((c) => c.hex.toLowerCase()));
  const colorMap = new Map(colorRows.map((r) => [r.hex.toLowerCase(), r.id]));

  for (const c of enriched) {
    const hex = c.hex.toLowerCase();
    const colorId = colorMap.get(hex);
    if (!colorId) continue;
    await db.insert('pattern_colors', {
      id: colorGenerateId(),
      pattern_id: patternId,
      color_id: colorId,
      count: c.count ?? 0,
    });
  }
}

async function getPatternColors(db: ReturnType<typeof getDB>, patternId: string) {
  return db.query<
    { hex: string; name: string | null; family: string | null; count: number }
  >(
    `SELECT c.hex, c.name, c.family, pc.count
     FROM pattern_colors pc
     JOIN colors c ON c.id = pc.color_id
     WHERE pc.pattern_id = ?
     ORDER BY pc.count DESC, c.hex`,
    [patternId]
  );
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

  const patternColors = await getPatternColors(db, pattern.id);

  const rawPalette = parseJsonField<string[] | PatternColor[] | null>(pattern.color_palette as string | null, []);
  const grid = parseJsonField<(string | number)[][] | null>(pattern.grid_data as string | null, null);
  const palette = enrichPaletteFromGrid(normalizeColorPalette(rawPalette ?? []), grid);

  return {
    pattern: {
      ...pattern,
      difficulty: pattern.difficulty,
      difficulty_id: pattern.difficulty_id,
      color_palette: palette,
      pattern_colors: patternColors,
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
    const diffId = difficultyStringToId(difficulty);
    where.push('p.difficulty_id = ?');
    params.push(diffId);
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

  const grid = body.grid_data as (string | number)[][] | undefined;
  const palette = normalizeColorPalette(body.color_palette as string[] | PatternColor[] | undefined);
  const enrichedPalette = grid ? enrichPaletteFromGrid(palette, grid) : palette;
  const stats = grid ? computeStats(grid) : { color_count: body.color_count, estimated_beads: body.estimated_beads };
  const seo = generateSEO({ title: body.title, description: body.description ?? null, tags: [] });

  await db.insert('patterns', {
    id,
    slug,
    title: body.title,
    description: body.description ?? null,
    difficulty: typeof body.difficulty === 'string' ? body.difficulty : await resolveDifficultySlug(db, body.difficulty as number),
    difficulty_id: difficultyStringToId(body.difficulty),
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

  // Pattern colors from palette and grid
  await upsertPatternColors(db, id, enrichedPalette, grid ?? null);

  // SEO
  const seoId = generateId();
  const seoForInsert = generateSEO({ title: body.title, description: body.description ?? null, tags: [] });
  await db.insert('pattern_seo', {
    id: seoId,
    pattern_id: id,
    title: body.seo_title ?? seoForInsert.title,
    description: body.seo_description ?? seoForInsert.description,
    keywords: body.seo_keywords ?? seoForInsert.keywords,
    canonical: body.canonical ?? null,
    robots: body.robots ?? null,
    og_image: body.og_image ?? null,
    twitter_title: body.twitter_title ?? null,
    twitter_description: body.twitter_description ?? null,
    twitter_image: body.twitter_image ?? null,
    structured_data: body.structured_data ?? null,
  });

  // Pattern colors from palette and grid
  await upsertPatternColors(db, id, enrichedPalette, grid ?? null);

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
  const difficultyVal = body.difficulty;
  if (difficultyVal !== undefined) {
    updates.difficulty_id = difficultyStringToId(difficultyVal);
    updates.difficulty = typeof difficultyVal === 'string' ? difficultyVal : await resolveDifficultySlug(db, difficultyVal);
  }
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

  // Update image fields before persisting
  if (body.finished_image !== undefined) updates.finished_image = body.finished_image;
  if (body.cover_image_r2_key !== undefined) updates.cover_image_r2_key = body.cover_image_r2_key;
  if (body.image_updated_at !== undefined) updates.image_updated_at = body.image_updated_at;
  else if (body.finished_image !== undefined || body.cover_image !== undefined || body.cover_image_r2_key !== undefined) {
    updates.image_updated_at = new Date().toISOString();
  }

  await db.update('patterns', updates, { id });

  // Update pattern_colors if palette or grid changed
  if (body.color_palette !== undefined || body.grid_data !== undefined) {
    const updatedPattern = await db.queryOne<Pattern>('SELECT * FROM patterns WHERE id = ?', [id]);
    if (updatedPattern) {
      const updatedRawPalette = parseJsonField<string[] | PatternColor[] | null>(updatedPattern.color_palette as string | null, []);
      const updatedGrid = parseJsonField<(string | number)[][] | null>(updatedPattern.grid_data as string | null, null);
      const updatedPalette = normalizeColorPalette(updatedRawPalette ?? []);
      const updatedEnrichedPalette = updatedGrid ? enrichPaletteFromGrid(updatedPalette, updatedGrid) : updatedPalette;
      await upsertPatternColors(db, id, updatedEnrichedPalette, updatedGrid);
    }
  }

  // Update SEO metadata if provided or if title/description changed
  if (body.seo_title !== undefined || body.seo_description !== undefined || body.seo_keywords !== undefined ||
      body.canonical !== undefined || body.robots !== undefined || body.og_image !== undefined ||
      body.twitter_title !== undefined || body.twitter_description !== undefined || body.twitter_image !== undefined ||
      body.structured_data !== undefined || body.title !== undefined || body.description !== undefined) {
    const existingSeo = await db.queryOne<{ id: string }>('SELECT id FROM pattern_seo WHERE pattern_id = ?', [id]);
    const seoRecord: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (body.seo_title !== undefined) seoRecord.title = body.seo_title;
    if (body.seo_description !== undefined) seoRecord.description = body.seo_description;
    if (body.seo_keywords !== undefined) seoRecord.keywords = body.seo_keywords;
    if (body.canonical !== undefined) seoRecord.canonical = body.canonical;
    if (body.robots !== undefined) seoRecord.robots = body.robots;
    if (body.og_image !== undefined) seoRecord.og_image = body.og_image;
    if (body.twitter_title !== undefined) seoRecord.twitter_title = body.twitter_title;
    if (body.twitter_description !== undefined) seoRecord.twitter_description = body.twitter_description;
    if (body.twitter_image !== undefined) seoRecord.twitter_image = body.twitter_image;
    if (body.structured_data !== undefined) seoRecord.structured_data = body.structured_data;
    if (existingSeo) {
      await db.update('pattern_seo', seoRecord, { id: existingSeo.id });
    } else {
      const newSeo = generateSEO({ title: updates.title as string ?? existing.title, description: (updates.description ?? existing.description) as string | null, tags: [] });
      await db.insert('pattern_seo', {
        id: generateId(),
        pattern_id: id,
        title: body.seo_title ?? newSeo.title,
        description: body.seo_description ?? newSeo.description,
        keywords: body.seo_keywords ?? newSeo.keywords,
        canonical: body.canonical ?? null,
        robots: body.robots ?? null,
        og_image: body.og_image ?? null,
        twitter_title: body.twitter_title ?? null,
        twitter_description: body.twitter_description ?? null,
        twitter_image: body.twitter_image ?? null,
        structured_data: body.structured_data ?? null,
      });
    }
  }

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
