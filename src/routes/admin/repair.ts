import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { getDB } from '../../lib/db';
import { success } from '../../lib/response';
import type { Bindings } from '../../lib/env';

import { seedAssociations } from './repair-seed-data';

const repair = new Hono<{ Bindings: Bindings }>();

const RepairAssociationsBodySchema = z.object({
  dry_run: z.boolean().optional().default(false),
});

repair.post('/pattern-associations', zValidator('json', RepairAssociationsBodySchema), async (c) => {
  const db = getDB(c.env);
  const { dry_run } = c.req.valid('json');

  // Load all pattern IDs/slugs from the DB
  const patterns = await db.query<{ id: string; slug: string; title: string }>('SELECT id, slug, title FROM patterns');
  const patternSlugToId = new Map(patterns.map((p) => [p.slug, p.id]));

  // Load all categories/tags from the DB
  const categories = await db.query<{ id: string; slug: string }>('SELECT id, slug FROM categories');
  const tags = await db.query<{ id: string; slug: string }>('SELECT id, slug FROM tags');
  const categorySlugToId = new Map(categories.map((c) => [c.slug, c.id]));
  const tagSlugToId = new Map(tags.map((t) => [t.slug, t.id]));

  // Load all expected category/tag associations from the bundled seed data
  const seedData = { patterns: seedAssociations };

  const stats = {
    patterns: patterns.length,
    categoryRowsCreated: 0,
    tagRowsCreated: 0,
    collectionRowsCreated: 0,
    categoryRowsSkipped: 0,
    tagRowsSkipped: 0,
    collectionRowsSkipped: 0,
    missingCategories: [] as string[],
    missingTags: [] as string[],
    missingCollections: [] as string[],
  };

  const uniqueMissingCategories = new Set<string>();
  const uniqueMissingTags = new Set<string>();
  const uniqueMissingCollections = new Set<string>();

  // Existing collections
  const existingCollections = await db.query<{ id: string; slug: string }>('SELECT id, slug FROM collections');
  const collectionSlugToId = new Map(existingCollections.map((c) => [c.slug, c.id]));

  for (const item of seedData.patterns) {
    const patternId = patternSlugToId.get(item.slug);
    if (!patternId) continue;

    // Categories
    for (const cs of item.category_slugs ?? []) {
      const cid = categorySlugToId.get(cs);
      if (!cid) {
        uniqueMissingCategories.add(cs);
        continue;
      }
      const existing = await db.queryOne<{ c: number }>(
        'SELECT COUNT(*) as c FROM pattern_categories WHERE pattern_id = ? AND category_id = ?',
        [patternId, cid]
      );
      if (!existing || existing.c === 0) {
        if (!dry_run) {
          await db.insert('pattern_categories', { pattern_id: patternId, category_id: cid });
        }
        stats.categoryRowsCreated++;
      } else {
        stats.categoryRowsSkipped++;
      }
    }

    // Tags
    for (const ts of item.tag_slugs ?? []) {
      const tid = tagSlugToId.get(ts);
      if (!tid) {
        uniqueMissingTags.add(ts);
        continue;
      }
      const existing = await db.queryOne<{ c: number }>(
        'SELECT COUNT(*) as c FROM pattern_tags WHERE pattern_id = ? AND tag_id = ?',
        [patternId, tid]
      );
      if (!existing || existing.c === 0) {
        if (!dry_run) {
          await db.insert('pattern_tags', { pattern_id: patternId, tag_id: tid });
        }
        stats.tagRowsCreated++;
      } else {
        stats.tagRowsSkipped++;
      }
    }

    // Collections
    for (const cs of item.collection_slugs ?? []) {
      const cid = collectionSlugToId.get(cs);
      if (!cid) {
        uniqueMissingCollections.add(cs);
        continue;
      }
      const existing = await db.queryOne<{ c: number }>(
        'SELECT COUNT(*) as c FROM pattern_collections WHERE pattern_id = ? AND collection_id = ?',
        [patternId, cid]
      );
      if (!existing || existing.c === 0) {
        if (!dry_run) {
          await db.insert('pattern_collections', { pattern_id: patternId, collection_id: cid, display_order: 0 });
        }
        stats.collectionRowsCreated++;
      } else {
        stats.collectionRowsSkipped++;
      }
    }
  }

  stats.missingCategories = Array.from(uniqueMissingCategories);
  stats.missingTags = Array.from(uniqueMissingTags);
  stats.missingCollections = Array.from(uniqueMissingCollections);

  return c.json(success({ dry_run, ...stats }));
});

export default repair;
