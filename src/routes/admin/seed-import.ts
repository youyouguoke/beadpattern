import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { getDB } from '../../lib/db';
import { success } from '../../lib/response';
import { generateId, normalizeSlug } from '../../lib/slug';
import { normalizeColorPalette, enrichPaletteFromGrid, computeStats } from '../../lib/colors';
import { generateSEO } from '../../lib/seo';
import type { Bindings } from '../../lib/env';
import type { PatternColor } from '../../types';

const seedImport = new Hono<{ Bindings: Bindings }>();

// Matches normalized hex from AI generators (3 or 6 digits).
const HexSchema = z.string().regex(/^#[0-9A-Fa-f]{3}([0-9A-Fa-f]{3})?$/);

const ColorInputSchema = z.union([
  HexSchema,
  z.object({
    name: z.string().max(100),
    hex: HexSchema,
    count: z.number().int().nonnegative().optional(),
  }),
]);

const SeedPatternSchema = z.object({
  // Identity
  id: z.string().uuid().optional(),
  slug: z.string().min(1).max(200).optional(),
  title: z.string().min(1).max(200),
  subject: z.string().max(100).optional(),
  description: z.string().max(5000).optional(),

  // Categorization
  category_slugs: z.array(z.string()).optional(),
  collection_slugs: z.array(z.string()).optional(),
  tag_slugs: z.array(z.string()).optional(),

  // Editorial
  style: z.string().max(50).optional(),
  season: z.string().max(50).nullable().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional().default('easy'),

  // Grid / beads
  grid_size: z.string().max(50).optional(),
  grid_data: z.array(z.array(z.union([z.string(), z.number()]))).optional(),
  estimated_beads: z.number().int().nonnegative().optional(),
  color_count: z.number().int().nonnegative().optional(),
  color_palette: z.array(ColorInputSchema).optional(),
  estimated_time: z.string().max(50).optional(),

  // Production metadata
  seo_priority: z.number().int().min(1).max(100).optional().default(50),
  publish_order: z.number().int().nonnegative().optional().default(0),
  grid_status: z.enum(['missing', 'designing', 'review', 'ready']).optional().default('missing'),
  grid_designer: z.string().max(100).optional(),
  grid_version: z.number().int().positive().optional().default(1),
  grid_review_required: z.boolean().optional().default(false),

  // SEO
  seo_title: z.string().max(200).optional(),
  seo_description: z.string().max(1000).optional(),
  seo_keywords: z.string().max(1000).optional(),
  canonical: z.string().max(500).optional(),

  // Related content
  faqs: z.array(z.object({
    question: z.string().min(1).max(500),
    answer: z.string().min(1).max(5000),
    display_order: z.number().int().optional(),
  })).optional(),

  related_slugs: z.array(z.string()).optional(),

  seo_variants: z.array(z.object({
    variant: z.string().min(1).max(200),
    landing_slug: z.string().min(1).max(200),
    search_intent: z.enum(['informational', 'commercial', 'transactional', 'navigational']).optional(),
    display_order: z.number().int().optional(),
  })).optional(),

  // Image plan (references only - actual upload via media routes)
  cover_image_url: z.string().url().max(1000).optional(),
  finished_image_url: z.string().url().max(1000).optional(),
  cover_media_id: z.string().uuid().optional(),
  finished_media_id: z.string().uuid().optional(),
});

const SeedImportBodySchema = z.object({
  patterns: z.array(SeedPatternSchema).min(1).max(500),
  dry_run: z.boolean().optional().default(false),
});

type SeedPattern = z.infer<typeof SeedPatternSchema>;

function hexTo6(hex: string): string {
  const h = hex.toLowerCase();
  if (h.length === 4 && h[0] === '#') {
    const [r, g, b] = h.slice(1).split('');
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  return h;
}

function normalizePaletteInput(input: SeedPattern['color_palette']): PatternColor[] {
  if (!input) return [];
  const normalized = input.map((c): PatternColor => {
    if (typeof c === 'string') return { name: 'Color', hex: hexTo6(c), count: 0 };
    return { name: c.name ?? 'Color', hex: hexTo6(c.hex), count: c.count ?? 0 };
  });
  return normalizeColorPalette(normalized as PatternColor[]);
}

seedImport.post('/', zValidator('json', SeedImportBodySchema), async (c) => {
  const db = getDB(c.env);
  const body = c.req.valid('json');
  const now = new Date().toISOString();

  const results: {
    index: number;
    id: string;
    slug: string;
    title: string;
    status: 'created' | 'updated';
    errors: string[];
  }[] = [];

  try {
    // Preload lookup maps
    const [categories, collections, tags, existingPatterns, media] = await Promise.all([
      db.query<{ id: string; slug: string }>('SELECT id, slug FROM categories'),
      db.query<{ id: string; slug: string }>('SELECT id, slug FROM collections'),
      db.query<{ id: string; slug: string }>('SELECT id, slug FROM tags'),
      db.query<{ id: string; slug: string }>('SELECT id, slug FROM patterns'),
      db.query<{ id: string; url: string }>('SELECT id, url FROM media'),
    ]);

    const categoryMap = new Map(categories.map((r) => [r.slug, r.id]));
    const collectionMap = new Map(collections.map((r) => [r.slug, r.id]));
    const tagMap = new Map(tags.map((r) => [r.slug, r.id]));
    const existingSlugMap = new Map(existingPatterns.map((r) => [r.slug, r.id]));
    const mediaMap = new Map(media.map((m) => [m.id, m.url]));

    for (let i = 0; i < body.patterns.length; i++) {
      const item = body.patterns[i];
      const errors: string[] = [];
      const slug = item.slug ?? normalizeSlug(item.title);

      if (!slug) {
        errors.push('Could not derive slug from title');
        results.push({ index: i, id: '', slug, title: item.title, status: 'created', errors });
        continue;
      }

      const grid = item.grid_data ?? null;
      const palette = normalizePaletteInput(item.color_palette);
      const enrichedPalette = grid ? enrichPaletteFromGrid(palette, grid) : palette;
      const stats = grid ? computeStats(grid) : {
        color_count: enrichedPalette.length || item.color_count || 0,
        estimated_beads: item.estimated_beads || 0,
      };

      const existingId = existingSlugMap.get(slug);
      const patternId = existingId ?? (item.id ?? generateId());

      const autoSeo = generateSEO({ title: item.title, description: item.description ?? null, tags: [] });

      // Resolve media references: if cover_media_id is provided, pull public_url from media table
      let coverImageUrl = item.cover_image_url ?? null;
      let finishedImageUrl = item.finished_image_url ?? null;
      let coverMediaId = item.cover_media_id ?? null;
      let finishedMediaId = item.finished_media_id ?? null;

      if (coverMediaId) {
        const mediaUrl = mediaMap.get(coverMediaId);
        if (mediaUrl) {
          coverImageUrl = mediaUrl;
        } else {
          errors.push(`Unknown cover media id: ${coverMediaId}`);
          coverMediaId = null;
        }
      }
      if (finishedMediaId) {
        const mediaUrl = mediaMap.get(finishedMediaId);
        if (mediaUrl) {
          finishedImageUrl = mediaUrl;
        } else {
          errors.push(`Unknown finished media id: ${finishedMediaId}`);
          finishedMediaId = null;
        }
      }

      const patternRecord: Record<string, unknown> = {
        id: patternId,
        slug,
        title: item.title,
        description: item.description ?? null,
        subject: item.subject ?? null,
        style: item.style ?? null,
        season: item.season ?? null,
        difficulty: item.difficulty,
        difficulty_id: item.difficulty === 'easy' ? 1 : item.difficulty === 'medium' ? 2 : 3,
        status: 'draft',
        version: 1,
        published_at: null,
        cover_image: coverImageUrl,
        finished_image: finishedImageUrl,
        cover_image_r2_key: null,
        cover_media_id: coverMediaId,
        finished_media_id: finishedMediaId,
        gallery_media_ids: null,
        step_media_ids: null,
        image_updated_at: null,
        grid_size: item.grid_size ?? null,
        grid_data: grid ? JSON.stringify(grid) : null,
        estimated_beads: stats.estimated_beads || item.estimated_beads || null,
        color_count: stats.color_count || item.color_count || null,
        color_palette: enrichedPalette.length > 0 ? JSON.stringify(enrichedPalette) : null,
        grid_status: item.grid_status,
        grid_designer: item.grid_designer ?? null,
        grid_version: item.grid_version,
        grid_review_required: item.grid_review_required ? 1 : 0,
        grid_reviewed_at: null,
        estimated_time: item.estimated_time ?? null,
        seo_priority: item.seo_priority,
        publish_order: item.publish_order,
        seo_title: item.seo_title ?? autoSeo.title,
        seo_description: item.seo_description ?? autoSeo.description,
        seo_keywords: item.seo_keywords ?? autoSeo.keywords,
        created_at: now,
        updated_at: now,
      };

      if (body.dry_run) {
        results.push({ index: i, id: patternId, slug, title: item.title, status: existingId ? 'updated' : 'created', errors });
        continue;
      }

      if (existingId) {
        delete patternRecord.id;
        delete patternRecord.created_at;
        await db.update('patterns', patternRecord, { id: existingId });
      } else {
        await db.insert('patterns', patternRecord);
        await db.insert('analytics', { pattern_id: patternId, views: 0, likes: 0, shares: 0, downloads: 0, updated_at: now });
      }

      const resolvedPatternId = existingId ?? patternId;

      // Categories
      if (item.category_slugs && item.category_slugs.length > 0) {
        await db.deleteWhere('pattern_categories', { pattern_id: resolvedPatternId });
        for (const cs of item.category_slugs) {
          const cid = categoryMap.get(cs);
          if (cid) await db.insert('pattern_categories', { pattern_id: resolvedPatternId, category_id: cid });
          else errors.push(`Unknown category slug: ${cs}`);
        }
      }

      // Collections
      if (item.collection_slugs && item.collection_slugs.length > 0) {
        await db.deleteWhere('pattern_collections', { pattern_id: resolvedPatternId });
        for (const cs of item.collection_slugs) {
          const cid = collectionMap.get(cs);
          if (cid) await db.insert('pattern_collections', { pattern_id: resolvedPatternId, collection_id: cid, display_order: 0 });
          else errors.push(`Unknown collection slug: ${cs}`);
        }
      }

      // Tags
      if (item.tag_slugs && item.tag_slugs.length > 0) {
        await db.deleteWhere('pattern_tags', { pattern_id: resolvedPatternId });
        for (const ts of item.tag_slugs) {
          const tid = tagMap.get(ts);
          if (tid) await db.insert('pattern_tags', { pattern_id: resolvedPatternId, tag_id: tid });
          else errors.push(`Unknown tag slug: ${ts}`);
        }
      }

      // Track new slug for this batch so same-batch related references can resolve later
      if (!existingSlugMap.has(slug)) {
        existingSlugMap.set(slug, resolvedPatternId);
      }

      // SEO record
      await db.deleteWhere('pattern_seo', { pattern_id: resolvedPatternId });
      await db.insert('pattern_seo', {
        id: generateId(),
        pattern_id: resolvedPatternId,
        title: item.seo_title ?? autoSeo.title,
        description: item.seo_description ?? autoSeo.description,
        keywords: item.seo_keywords ?? autoSeo.keywords,
        canonical: item.canonical ?? null,
        robots: null,
        og_image: null,
        twitter_title: null,
        twitter_description: null,
        twitter_image: null,
        structured_data: null,
        created_at: now,
        updated_at: now,
      });

      // FAQs
      if (item.faqs && item.faqs.length > 0) {
        await db.deleteWhere('pattern_faqs', { pattern_id: resolvedPatternId });
        for (let fi = 0; fi < item.faqs.length; fi++) {
          const f = item.faqs[fi];
          await db.insert('pattern_faqs', {
            id: generateId(),
            pattern_id: resolvedPatternId,
            question: f.question,
            answer: f.answer,
            display_order: f.display_order ?? fi,
            created_at: now,
            updated_at: now,
          });
        }
      }

      // Related patterns (resolved in a second pass if target doesn't exist yet)
      if (item.related_slugs && item.related_slugs.length > 0) {
        await db.deleteWhere('pattern_related', { pattern_id: resolvedPatternId });
        for (let ri = 0; ri < item.related_slugs.length; ri++) {
          const relatedSlug = item.related_slugs[ri];
          const relatedId = existingSlugMap.get(relatedSlug);
          if (relatedId) {
            await db.insert('pattern_related', {
              id: generateId(),
              pattern_id: resolvedPatternId,
              related_pattern_id: relatedId,
              related_type: 'manual',
              score: 0,
              display_order: ri,
              created_at: now,
            });
          } else {
            errors.push(`Related pattern slug not found: ${relatedSlug}`);
          }
        }
      }

      // SEO variants
      if (item.seo_variants && item.seo_variants.length > 0) {
        await db.deleteWhere('pattern_seo_variants', { pattern_id: resolvedPatternId });
        for (let vi = 0; vi < item.seo_variants.length; vi++) {
          const v = item.seo_variants[vi];
          await db.insert('pattern_seo_variants', {
            id: generateId(),
            pattern_id: resolvedPatternId,
            variant: v.variant,
            landing_slug: v.landing_slug,
            search_intent: v.search_intent ?? 'informational',
            display_order: v.display_order ?? vi,
            created_at: now,
          });
        }
      }

      // Audit row
      const hasCover = Boolean(coverImageUrl) || Boolean(coverMediaId);
      const hasFaq = Boolean(item.faqs && item.faqs.length > 0);
      const hasCollection = Boolean(item.collection_slugs && item.collection_slugs.length > 0);
      const hasRelated = Boolean(item.related_slugs && item.related_slugs.length > 0);
      const score = [hasCover, hasFaq, hasCollection, hasRelated, Boolean(grid)].filter(Boolean).length * 20;

      await db.execute(
        `INSERT INTO pattern_audit (id, pattern_id, missing_cover, missing_faq, missing_collection, missing_related, missing_internal_links, ready, published, score, checked_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(pattern_id) DO UPDATE SET
           missing_cover = excluded.missing_cover,
           missing_faq = excluded.missing_faq,
           missing_collection = excluded.missing_collection,
           missing_related = excluded.missing_related,
           missing_internal_links = excluded.missing_internal_links,
           ready = excluded.ready,
           published = excluded.published,
           score = excluded.score,
           checked_at = excluded.checked_at,
           updated_at = excluded.updated_at`,
        [
          generateId(),
          resolvedPatternId,
          hasCover ? 0 : 1,
          hasFaq ? 0 : 1,
          hasCollection ? 0 : 1,
          hasRelated ? 0 : 1,
          hasRelated ? 0 : 1,
          score >= 80 ? 1 : 0,
          0,
          score,
          now,
          now,
          now,
        ]
      );

      results.push({ index: i, id: resolvedPatternId, slug, title: item.title, status: existingId ? 'updated' : 'created', errors });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('SEED_IMPORT_ERROR', message, err instanceof Error ? err.stack : '');
    return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message, detail: err instanceof Error ? err.stack : undefined } }, 500);
  }

  return c.json(success({
    dry_run: body.dry_run,
    total: body.patterns.length,
    results,
  }));
});

export default seedImport;
