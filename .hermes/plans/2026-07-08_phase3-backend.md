# Phase 3 Backend Implementation Plan

> **For Hermes:** Use `subagent-driven-development` skill to implement this plan task-by-task.

**Goal:** Build the content-depth and SEO-connective layer for BeadPatternAI: publishable Collections, complete Pattern detail assets (grid/steps/FAQ), and a search/recommendation backend that supports the planned 328-page launch without scaled-content-abuse risk.

Architecture: Extend the existing Hono + D1 backend with four focused workstreams: (1) Collections as first-class SEO surfaces, (2) Pattern detail enrichment (grid_data, steps, FAQs, related patterns), (3) search/index improvements that rank by content quality signals rather than keyword stuffing, (4) real file downloads (PNG/PDF) for frontend Download buttons. All public APIs stay backward-compatible with Phase 2 shapes unless explicitly versioned.

**Tech Stack:** Cloudflare Workers, Hono, D1 SQLite, R2, Wrangler, TypeScript.

---

## Current Context

Phase 2 public APIs are live at `https://api.beadpatternai.com`. Verified endpoints:

- `GET /api/categories` ✅
- `GET /api/collections` ✅ (currently empty — no published collections)
- `GET /api/patterns` ✅
- `GET /api/patterns/:slug` ✅
- `GET /api/search` ✅
- `GET /api/recommend/:slug` ✅
- `GET /api/sitemap` ✅

Data gaps and Phase 2 carryovers blocking the recommended 328-page launch:

1. No published `collections`.
2. Many `patterns.grid_data` are empty (only cover images exist).
3. `pattern_faqs` table is empty.
4. `pattern_steps` table is empty for most patterns.
5. `pattern_related` is only auto-generated, no curated/manual links.
6. `color_palette` is stored as a JSON string in some rows, object in others.
7. **Phase 2 carryover:** `POST /api/patterns/:slug/download` only increments an analytics counter; no actual PNG/PDF file is returned or generated.

---

## Workstream 1: Collections as SEO Surfaces

### Task 1.1: Add admin endpoints to manage collections

**Objective:** Allow admins to create, update, publish, and delete collections; assign/unassign patterns to collections.

**Files:**
- Create: `src/routes/admin/collections.ts`
- Modify: `src/index.ts` to register the new router
- Test: `test/admin/collections.test.ts` (add if test suite exists; otherwise create)

**Step 1: Design schema for admin collection mutations**

```ts
// src/lib/schemas.ts (append)
export const CreateCollectionSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional(),
  banner: z.string().url().max(1000).optional(),
  display_order: z.number().int().optional().default(0),
  published: z.boolean().optional().default(false),
  pattern_slugs: z.array(z.string().min(1)).optional(),
});

export const UpdateCollectionSchema = CreateCollectionSchema.partial();

export const CollectionAssignPatternsSchema = z.object({
  pattern_slugs: z.array(z.string().min(1)),
});
```

**Step 2: Implement CRUD router**

```ts
// src/routes/admin/collections.ts
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { getDB } from '../../lib/db';
import { success, paginated } from '../../lib/response';
import { AppError } from '../../lib/errors';
import { generateId, normalizeSlug } from '../../lib/slug';
import { CreateCollectionSchema, UpdateCollectionSchema, CollectionAssignPatternsSchema } from '../../lib/schemas';
import { requireAdmin } from '../../middleware/auth';
import type { Bindings } from '../../lib/env';

const adminCollections = new Hono<{ Bindings: Bindings }>();
adminCollections.use('*', requireAdmin);

// GET /api/admin/collections
adminCollections.get('/', async (c) => {
  const db = getDB(c.env);
  const rows = await db.query<
    { id: string; slug: string; title: string; description: string | null; banner: string | null; published: number; display_order: number; created_at: string; updated_at: string; pattern_count: number }
  >(
    `SELECT c.*, COUNT(pc.pattern_id) AS pattern_count
     FROM collections c
     LEFT JOIN pattern_collections pc ON pc.collection_id = c.id
     GROUP BY c.id
     ORDER BY c.display_order ASC, c.created_at DESC`
  );
  return c.json(success(rows.map((r) => ({ ...r, published: Boolean(r.published) }))));
});

// GET /api/admin/collections/:slug
adminCollections.get('/:slug', async (c) => {
  const db = getDB(c.env);
  const slug = c.req.param('slug');
  const collection = await db.queryOne<{ id: string; slug: string; title: string; description: string | null; banner: string | null; published: number; display_order: number; created_at: string; updated_at: string }>(
    'SELECT * FROM collections WHERE slug = ?',
    [slug]
  );
  if (!collection) throw new AppError('COLLECTION_NOT_FOUND', 404, 'Collection not found');
  const patterns = await db.query<
    { id: string; slug: string; title: string; cover_image: string | null; difficulty: string }
  >(
    `SELECT p.id, p.slug, p.title, p.cover_image, p.difficulty
     FROM patterns p
     JOIN pattern_collections pc ON pc.pattern_id = p.id
     WHERE pc.collection_id = ?
     ORDER BY pc.display_order ASC, p.created_at DESC`,
    [collection.id]
  );
  return c.json(success({ ...collection, published: Boolean(collection.published), patterns }));
});

// POST /api/admin/collections
adminCollections.post('/', zValidator('json', CreateCollectionSchema), async (c) => {
  const db = getDB(c.env);
  const body = c.req.valid('json');
  const slug = body.slug ?? normalizeSlug(body.title);
  const existing = await db.queryOne<{ id: string }>('SELECT id FROM collections WHERE slug = ?', [slug]);
  if (existing) throw new AppError('DUPLICATE_SLUG', 409, 'Collection slug already exists');

  const id = generateId();
  await db.insert('collections', {
    id,
    slug,
    title: body.title,
    description: body.description ?? null,
    banner: body.banner ?? null,
    display_order: body.display_order ?? 0,
    published: body.published ? 1 : 0,
  });

  if (body.pattern_slugs && body.pattern_slugs.length > 0) {
    const rows = await db.query<{ id: string; slug: string }>(
      `SELECT id, slug FROM patterns WHERE slug IN (${body.pattern_slugs.map(() => '?').join(',')})`,
      body.pattern_slugs
    );
    const foundSlugs = new Set(rows.map((r) => r.slug));
    const missing = body.pattern_slugs.filter((s) => !foundSlugs.has(s));
    if (missing.length > 0) throw new AppError('PATTERNS_NOT_FOUND', 400, `Unknown pattern slugs: ${missing.join(', ')}`);
    for (let i = 0; i < rows.length; i++) {
      await db.insert('pattern_collections', {
        id: generateId(),
        pattern_id: rows[i].id,
        collection_id: id,
        display_order: i,
      });
    }
  }

  const created = await db.queryOne<{ id: string }>('SELECT id FROM collections WHERE id = ?', [id]);
  return c.json(success({ id: created?.id, slug }));
});

// PUT /api/admin/collections/:slug
adminCollections.put('/:slug', zValidator('json', UpdateCollectionSchema), async (c) => {
  const db = getDB(c.env);
  const slug = c.req.param('slug');
  const body = c.req.valid('json');
  const existing = await db.queryOne<{ id: string }>('SELECT id FROM collections WHERE slug = ?', [slug]);
  if (!existing) throw new AppError('COLLECTION_NOT_FOUND', 404, 'Collection not found');

  const updates: Record<string, unknown> = {};
  if (body.title !== undefined) updates.title = body.title;
  if (body.description !== undefined) updates.description = body.description;
  if (body.banner !== undefined) updates.banner = body.banner;
  if (body.display_order !== undefined) updates.display_order = body.display_order;
  if (body.published !== undefined) updates.published = body.published ? 1 : 0;

  await db.execute(
    `UPDATE collections SET ${Object.keys(updates).map((k) => `${k} = ?`).join(', ')} WHERE id = ?`,
    [...Object.values(updates), existing.id]
  );

  return c.json(success({ id: existing.id, slug }));
});

// POST /api/admin/collections/:slug/patterns
adminCollections.post('/:slug/patterns', zValidator('json', CollectionAssignPatternsSchema), async (c) => {
  const db = getDB(c.env);
  const slug = c.req.param('slug');
  const { pattern_slugs } = c.req.valid('json');
  const collection = await db.queryOne<{ id: string }>('SELECT id FROM collections WHERE slug = ?', [slug]);
  if (!collection) throw new AppError('COLLECTION_NOT_FOUND', 404, 'Collection not found');

  const rows = await db.query<{ id: string; slug: string }>(
    `SELECT id, slug FROM patterns WHERE slug IN (${pattern_slugs.map(() => '?').join(',')})`,
    pattern_slugs
  );
  const foundSlugs = new Set(rows.map((r) => r.slug));
  const missing = pattern_slugs.filter((s) => !foundSlugs.has(s));
  if (missing.length > 0) throw new AppError('PATTERNS_NOT_FOUND', 400, `Unknown pattern slugs: ${missing.join(', ')}`);

  await db.execute('DELETE FROM pattern_collections WHERE collection_id = ?', [collection.id]);
  for (let i = 0; i < rows.length; i++) {
    await db.insert('pattern_collections', {
      id: generateId(),
      pattern_id: rows[i].id,
      collection_id: collection.id,
      display_order: i,
    });
  }
  return c.json(success({ assigned: rows.length }));
});

// DELETE /api/admin/collections/:slug
adminCollections.delete('/:slug', async (c) => {
  const db = getDB(c.env);
  const slug = c.req.param('slug');
  const collection = await db.queryOne<{ id: string }>('SELECT id FROM collections WHERE slug = ?', [slug]);
  if (!collection) throw new AppError('COLLECTION_NOT_FOUND', 404, 'Collection not found');
  await db.execute('DELETE FROM pattern_collections WHERE collection_id = ?', [collection.id]);
  await db.execute('DELETE FROM collections WHERE id = ?', [collection.id]);
  return c.json(success({ deleted: slug }));
});

export default adminCollections;
```

**Step 3: Register router**

```ts
// src/index.ts
import adminCollections from './routes/admin/collections';
// ... existing routers
app.route('/api/admin/collections', adminCollections);
```

**Step 4: Test**

Run `npx vitest run test/admin/collections.test.ts` (or equivalent test runner). Expected: tests for create, list, get, update, assign patterns, delete.

**Step 5: Commit**

```bash
git add src/routes/admin/collections.ts src/index.ts src/lib/schemas.ts
git commit -m "feat(admin): collection CRUD and pattern assignment"
```

---

### Task 1.2: Create initial published collections via seed script

**Objective:** Populate 20 SEO-safe collections matching the recommended launch set.

**Files:**
- Create: `scripts/content-seed/collections.json`
- Create: `scripts/content-seed/publish-collections.ts`

**Step 1: Define collection metadata**

```json
// scripts/content-seed/collections.json
[
  {
    "title": "Animal Perler Bead Patterns",
    "slug": "animal-perler-bead-patterns",
    "description": "A curated collection of animal-themed perler bead patterns, from cute pandas to safari lions.",
    "banner": "https://pub-beadpatternai.r2.dev/banners/animal-collection.png",
    "display_order": 1,
    "published": true,
    "pattern_filters": { "category": "animals" }
  },
  {
    "title": "Easy Perler Bead Patterns",
    "slug": "easy-perler-bead-patterns",
    "description": "Beginner-friendly perler bead patterns with small grids and simple color palettes.",
    "banner": "https://pub-beadpatternai.r2.dev/banners/easy-collection.png",
    "display_order": 2,
    "published": true,
    "pattern_filters": { "difficulty": "easy" }
  },
  {
    "title": "Kawaii Perler Bead Patterns",
    "slug": "kawaii-perler-bead-patterns",
    "description": "Adorable kawaii-style bead patterns perfect for cute crafts and accessories.",
    "banner": "https://pub-beadpatternai.r2.dev/banners/kawaii-collection.png",
    "display_order": 3,
    "published": true,
    "pattern_filters": { "tag": "kawaii" }
  }
]
```

**Step 2: Write seed script**

```ts
// scripts/content-seed/publish-collections.ts
import collections from './collections.json';

const API_BASE = process.env.API_BASE || 'https://api.beadpatternai.com';
const ADMIN_KEY = process.env.ADMIN_API_KEY || 'dev-beadpatternai-local-admin-key';

async function main() {
  for (const collection of collections) {
    const filters = collection.pattern_filters as Record<string, string>;
    const search = new URLSearchParams();
    for (const [k, v] of Object.entries(filters)) search.set(k, v);
    const listRes = await fetch(`${API_BASE}/api/patterns?${search.toString()}&limit=50`);
    const listData = await listRes.json();
    const slugs = (listData.data?.items || listData.data || [])
      .slice(0, 20)
      .map((p: { slug: string }) => p.slug);

    const body = { ...collection, pattern_slugs: slugs };
    delete (body as { pattern_filters?: unknown }).pattern_filters;

    const res = await fetch(`${API_BASE}/api/admin/collections`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ADMIN_KEY}`,
      },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    console.log(res.status, collection.slug, data);
  }
}

main();
```

**Step 3: Run locally first**

```bash
cd /root/projects/BeadPatternAI/bead-pattern-ai-backend
npx tsx scripts/content-seed/publish-collections.ts
```

Expected: 20 collections created, each linked to up to 20 relevant patterns.

**Step 4: Run against production**

```bash
API_BASE=https://api.beadpatternai.com ADMIN_API_KEY=*** npx tsx scripts/content-seed/publish-collections.ts
```

**Step 5: Commit**

```bash
git add scripts/content-seed/collections.json scripts/content-seed/publish-collections.ts
git commit -m "feat(content): seed 20 initial published collections"
```

---

## Workstream 2: Pattern Detail Enrichment

### Task 2.1: Fix `color_palette` format inconsistency

**Objective:** Normalize all `patterns.color_palette` values to a JSON array of objects and ensure API returns objects, not strings.

**Files:**
- Create: `src/migrations/0018_fix_color_palette_format.sql`
- Modify: `src/routes/patterns.ts` (ensure `parseJsonField` already added)
- Modify: `src/routes/admin/patterns.ts` if palette normalization differs

**Step 1: Add migration**

```sql
-- src/migrations/0018_fix_color_palette_format.sql
-- Normalize color_palette to JSON array of objects
UPDATE patterns
SET color_palette = '[]'
WHERE color_palette IS NULL OR color_palette = '';

-- If stored as stringified JSON string, wrap once more? No, fix in code first then run backfill.
```

> Note: a safer approach is a backfill script rather than SQL because D1 JSON string handling is tricky.

**Step 2: Add backfill script**

```ts
// scripts/migrations/backfill-color-palette.ts
import { getDB } from '../src/lib/db';

async function main() {
  const env = { DB: process.env.DB as any };
  const db = getDB(env);
  const rows = await db.query<{ id: string; color_palette: string }>('SELECT id, color_palette FROM patterns');
  for (const row of rows) {
    let palette: unknown;
    try {
      palette = JSON.parse(row.color_palette);
    } catch {
      palette = [];
    }
    if (typeof palette === 'string') {
      try {
        palette = JSON.parse(palette);
      } catch {
        palette = [];
      }
    }
    if (!Array.isArray(palette)) palette = [];
    const normalized = (palette as any[]).map((c) => {
      if (typeof c === 'string') return { name: c, hex: c, count: 0 };
      return { name: c.name || c.hex, hex: c.hex, count: c.count || 0 };
    });
    await db.execute('UPDATE patterns SET color_palette = ? WHERE id = ?', [JSON.stringify(normalized), row.id]);
  }
  console.log('Normalized', rows.length, 'rows');
}

main();
```

**Step 3: Apply migration and run backfill**

```bash
npx wrangler d1 migrations apply beadpatternai-db --remote
npx tsx scripts/migrations/backfill-color-palette.ts
```

**Step 4: Verify API returns objects**

```bash
curl https://api.beadpatternai.com/api/patterns?limit=1 | jq '.data[0].color_palette'
```

Expected: array of objects.

**Step 5: Commit**

```bash
git add src/migrations/0018_fix_color_palette_format.sql scripts/migrations/backfill-color-palette.ts
git commit -m "data: normalize color_palette format"
```

---

### Task 2.2: Add pattern step and FAQ endpoints

**Objective:** Allow admins to add steps and FAQs to a pattern; expose them in public pattern detail.

**Files:**
- Modify: `src/routes/patterns.ts` to include `steps` and `faqs` in detail response
- Modify: `src/routes/admin/patterns.ts` to upsert steps and FAQs
- Modify: `src/lib/schemas.ts` to add validation schemas

**Step 1: Add schemas**

```ts
// src/lib/schemas.ts
export const PatternStepInputSchema = z.object({
  step_number: z.number().int().min(1).optional(),
  description: z.string().max(2000).optional(),
  image_url: z.string().url().max(1000).optional(),
  grid_data: z.array(z.array(z.union([z.string(), z.number()]))).optional(),
});

export const PatternFaqInputSchema = z.object({
  question: z.string().min(1).max(500),
  answer: z.string().min(1).max(2000),
  display_order: z.number().int().optional().default(0),
});
```

**Step 2: Upsert steps and FAQs in admin update**

```ts
// src/routes/admin/patterns.ts (inside PUT handler)
if (body.steps !== undefined) {
  await db.execute('DELETE FROM pattern_steps WHERE pattern_id = ?', [id]);
  for (let i = 0; i < body.steps.length; i++) {
    const step = body.steps[i];
    await db.insert('pattern_steps', {
      id: generateId(),
      pattern_id: id,
      step_number: step.step_number ?? i + 1,
      description: step.description ?? null,
      image_url: step.image_url ?? null,
      grid_data: step.grid_data ? JSON.stringify(step.grid_data) : null,
    });
  }
}

if (body.faqs !== undefined) {
  await db.execute('DELETE FROM pattern_faqs WHERE pattern_id = ?', [id]);
  for (let i = 0; i < body.faqs.length; i++) {
    const faq = body.faqs[i];
    await db.insert('pattern_faqs', {
      id: generateId(),
      pattern_id: id,
      question: faq.question,
      answer: faq.answer,
      display_order: faq.display_order ?? i,
    });
  }
}
```

**Step 3: Expose in public detail**

```ts
// src/routes/patterns.ts getPatternWithDetails
const faqs = await db.query<{ question: string; answer: string; display_order: number }>(
  'SELECT question, answer, display_order FROM pattern_faqs WHERE pattern_id = ? ORDER BY display_order ASC',
  [pattern.id]
);

return {
  ...,
  faqs,
};
```

**Step 4: Test and commit**

```bash
git add src/routes/admin/patterns.ts src/routes/patterns.ts src/lib/schemas.ts
git commit -m "feat(patterns): admin steps and FAQs, public detail exposure"
```

---

### Task 2.3: Add `related_patterns` enrichment endpoint

**Objective:** Allow admins to curate related patterns; fallback to automatic similarity if none set.

**Files:**
- Modify: `src/routes/patterns.ts` to include `related_patterns` in detail
- Modify: `src/routes/admin/patterns.ts` to accept `related_slugs`

**Step 1: Add schema**

```ts
export const UpdatePatternSchema = CreatePatternSchema.partial().extend({
  status: z.enum(['draft', 'published', 'archived']).optional(),
  related_slugs: z.array(z.string().min(1)).optional(),
  steps: z.array(PatternStepInputSchema).optional(),
  faqs: z.array(PatternFaqInputSchema).optional(),
});
```

**Step 2: Upsert related patterns**

```ts
if (body.related_slugs !== undefined) {
  await db.execute('DELETE FROM pattern_related WHERE source_pattern_id = ?', [id]);
  const relatedRows = await db.query<{ id: string; slug: string }>(
    `SELECT id, slug FROM patterns WHERE slug IN (${body.related_slugs.map(() => '?').join(',')})`,
    body.related_slugs
  );
  for (const r of relatedRows) {
    await db.insert('pattern_related', {
      id: generateId(),
      source_pattern_id: id,
      related_pattern_id: r.id,
      related_type: 'manual',
    });
  }
}
```

**Step 3: Public detail query**

```ts
const related = await db.query<
  { slug: string; title: string; cover_image: string | null; difficulty: string }
>(
  `SELECT p.slug, p.title, p.cover_image, p.difficulty
   FROM patterns p
   JOIN pattern_related pr ON pr.related_pattern_id = p.id
   WHERE pr.source_pattern_id = ?
   ORDER BY pr.created_at ASC
   LIMIT 8`,
  [pattern.id]
);
```

**Step 4: Commit**

```bash
git add src/routes/patterns.ts src/routes/admin/patterns.ts src/lib/schemas.ts
git commit -m "feat(patterns): curated related patterns"
```

---

## Workstream 3: Search & Quality Signals

### Task 3.1: Add search ranking by content quality

**Objective:** Improve `/api/search` to rank patterns with more complete content higher.

**Files:**
- Modify: `src/routes/search.ts`

**Step 1: Add quality score helper**

```ts
function qualityScore(p: { cover_image: string | null; grid_data: string | null; faq_count: number; step_count: number }): number {
  let score = 0;
  if (p.cover_image) score += 20;
  if (p.grid_data) score += 30;
  score += Math.min(p.faq_count * 10, 30);
  score += Math.min(p.step_count * 5, 20);
  return score;
}
```

**Step 2: Use quality score as tiebreaker**

After fetching candidate rows, sort by:
1. FTS5 rank (if using FTS5)
2. `qualityScore DESC`
3. `created_at DESC`

**Step 3: Commit**

```bash
git add src/routes/search.ts
git commit -m "feat(search): rank by content quality signals"
```

---

### Task 3.2: Add `/api/health/data` diagnostic endpoint

**Objective:** Give admins a quick view of content completeness before launch.

**Files:**
- Modify: `src/routes/health.ts` or create `src/routes/admin/health.ts`

**Step 1: Implement endpoint**

```ts
app.get('/api/admin/health/data', requireAdmin, async (c) => {
  const db = getDB(c.env);
  const total = await db.queryOne<{ count: number }>('SELECT COUNT(*) AS count FROM patterns');
  const withGrid = await db.queryOne<{ count: number }>(
    "SELECT COUNT(*) AS count FROM patterns WHERE grid_data IS NOT NULL AND grid_data != '' AND grid_data != '[]'"
  );
  const withFaq = await db.queryOne<{ count: number }>('SELECT COUNT(*) AS count FROM pattern_faqs');
  const withSteps = await db.queryOne<{ count: number }>('SELECT COUNT(*) AS count FROM pattern_steps');
  const publishedCollections = await db.queryOne<{ count: number }>(
    'SELECT COUNT(*) AS count FROM collections WHERE published = 1'
  );
  return c.json(success({
    totalPatterns: total?.count ?? 0,
    withGrid: withGrid?.count ?? 0,
    withFaq: withFaq?.count ?? 0,
    withSteps: withSteps?.count ?? 0,
    publishedCollections: publishedCollections?.count ?? 0,
  }));
});
```

**Step 2: Commit**

```bash
git add src/routes/admin/health.ts
git commit -m "feat(admin): data completeness health endpoint"
```

---

## Workstream 4: Sitemap & Robots Refinement

### Task 4.1: Split sitemap into index + per-type sitemaps

**Objective:** Keep sitemap manageable as pages grow; avoid scaled-content signals by cleanly organizing URLs.

**Files:**
- Modify: `src/routes/sitemap.ts`

**Step 1: Implement sitemap index**

```ts
app.get('/sitemap.xml', async (c) => {
  const base = c.env.SITE_URL ?? 'https://beadpatternai.com';
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>${base}/sitemaps/patterns.xml</loc></sitemap>
  <sitemap><loc>${base}/sitemaps/collections.xml</loc></sitemap>
  <sitemap><loc>${base}/sitemaps/categories.xml</loc></sitemap>
  <sitemap><loc>${base}/sitemaps/tags.xml</loc></sitemap>
</sitemapindex>`;
  return c.text(xml, 200, { 'Content-Type': 'application/xml' });
});

app.get('/sitemaps/patterns.xml', async (c) => { /* generate pattern sitemap */ });
app.get('/sitemaps/collections.xml', async (c) => { /* generate collection sitemap */ });
app.get('/sitemaps/categories.xml', async (c) => { /* generate category sitemap */ });
app.get('/sitemaps/tags.xml', async (c) => { /* generate tag sitemap */ });
```

**Step 2: Commit**

```bash
git add src/routes/sitemap.ts
git commit -m "feat(sitemap): split into sitemap index and per-type sitemaps"
```

---

## Workstream 5: Admin SEO Audit Improvements

### Task 5.1: Extend audit score to check steps, FAQs, and related patterns

**Objective:** The existing audit score covers cover_image, faqs, collections, related, grid_data. Make sure it also counts steps and curated related patterns.

**Files:**
- Modify: `src/lib/audit.ts` (if exists) or `src/routes/admin/patterns.ts` audit logic

**Step 1: Update audit checks**

```ts
const checks = {
  cover_image: Boolean(pattern.cover_image || pattern.cover_media_id),
  faqs: faqCount >= 2,
  collections: collectionCount >= 1,
  related: relatedCount >= 2,
  grid_data: Boolean(pattern.grid_data && pattern.grid_data !== '[]'),
  steps: stepCount >= 1,
};
const score = Object.values(checks).filter(Boolean).length * (100 / 6);
const ready = score >= 80;
```

**Step 2: Commit**

```bash
git add src/lib/audit.ts
git commit -m "feat(audit): include steps and related patterns in SEO score"
```

---

## Workstream 6: Real Pattern Downloads (PNG/PDF)

### Task 6.1: Add `GET /api/patterns/:slug/download/png`

**Objective:** Return a real PNG download for a pattern, using the existing R2 cover/finished image as the immediate fallback, with optional grid rendering later.

**Files:**
- Modify: `src/routes/patterns.ts`

**Step 1: Add route**

```ts
// src/routes/patterns.ts
patterns.get('/:slug/download/png', async (c) => {
  const db = getDB(c.env);
  const slug = c.req.param('slug');
  const pattern = await db.queryOne<
    { id: string; title: string; cover_image: string | null; finished_image: string | null }
  >(
    'SELECT id, title, cover_image, finished_image FROM patterns WHERE slug = ?',
    [slug]
  );
  if (!pattern) throw new AppError('Pattern not found', 'PATTERN_NOT_FOUND', 404);

  const imageUrl = pattern.finished_image || pattern.cover_image;
  if (!imageUrl) throw new AppError('NO_IMAGE', 404, 'Pattern has no downloadable image');

  // Record the download event
  await db.execute(
    `INSERT INTO analytics (pattern_id, downloads) VALUES (?, 1)
     ON CONFLICT(pattern_id) DO UPDATE SET downloads = downloads + 1, updated_at = ?`,
    [pattern.id, new Date().toISOString()]
  );

  return c.json(success({
    url: imageUrl,
    filename: `${slug}-perler-bead-pattern.png`,
    content_type: 'image/png',
  }));
});
```

**Step 2: Commit**

```bash
git add src/routes/patterns.ts
git commit -m "feat(downloads): add PNG download endpoint"
```

---

### Task 6.2: Add `GET /api/patterns/:slug/download/pdf`

**Objective:** Return a simple PDF download URL for a pattern. Phase 3 uses a lightweight PDF: a single-page document with the pattern title, cover image, grid size, color palette, and a short "How to use" note. This is a real file, not just an analytics bump.

**Files:**
- Create: `src/lib/pdf.ts` or `src/lib/pdf-generate.ts`
- Modify: `src/routes/patterns.ts`
- Modify: `package.json` to add a PDF generation library (e.g. `@pdfme/generator` or `pdf-lib`, if compatible with Workers runtime; otherwise generate a printable HTML and return a public URL)

**Decision:** Cloudflare Workers runtime is limited. Server-side PDF generation libraries often fail or are too heavy. The recommended Phase 3 approach is:

- Generate a downloadable PDF via an external HTML-to-PDF service (e.g. Cloudflare Browser Rendering or a microservice), OR
- Pre-render a print-friendly HTML page and serve it as `/patterns/:slug/print`, then tell frontend to use browser print-to-PDF.

For this plan, use the simplest real backend option: **serve a pre-rendered print page URL** and return it as the PDF download option.

**Step 1: Add printable summary page route**

```ts
// src/routes/patterns.ts
patterns.get('/:slug/print', async (c) => {
  const db = getDB(c.env);
  const slug = c.req.param('slug');
  const pattern = await db.queryOne<
    { id: string; title: string; description: string | null; grid_size: string | null; color_palette: string; cover_image: string | null; finished_image: string | null }
  >(
    'SELECT id, title, description, grid_size, color_palette, cover_image, finished_image FROM patterns WHERE slug = ?',
    [slug]
  );
  if (!pattern) throw new AppError('Pattern not found', 'PATTERN_NOT_FOUND', 404);

  const palette = parseJsonField<{ hex: string; name: string; count: number }[]>(pattern.color_palette, []);
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${pattern.title} - BeadPatternAI</title>
  <style>
    body { font-family: sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
    h1 { font-size: 28px; }
    img { max-width: 100%; border: 1px solid #ddd; }
    .palette { display: flex; gap: 10px; flex-wrap: wrap; margin: 20px 0; }
    .color { width: 40px; height: 40px; border-radius: 50%; border: 1px solid #ccc; }
    .meta { color: #666; margin: 10px 0; }
    .footer { margin-top: 40px; font-size: 12px; color: #999; }
  </style>
</head>
<body>
  <h1>${pattern.title}</h1>
  ${pattern.cover_image ? `<img src="${pattern.cover_image}" alt="${pattern.title}">` : ''}
  <p class="meta">Grid size: ${pattern.grid_size || 'N/A'} | Colors: ${palette.length}</p>
  <p>${pattern.description || ''}</p>
  <div class="palette">
    ${palette.map((c) => `<div class="color" style="background:${c.hex}" title="${c.name || c.hex}"></div>`).join('')}
  </div>
  <div class="footer">Printed from BeadPatternAI.com</div>
</body>
</html>`;
  return c.html(html);
});
```

**Step 2: Add PDF download endpoint returning the print URL**

```ts
// src/routes/patterns.ts
patterns.get('/:slug/download/pdf', async (c) => {
  const db = getDB(c.env);
  const slug = c.req.param('slug');
  const pattern = await db.queryOne<{ id: string; title: string }>(
    'SELECT id, title FROM patterns WHERE slug = ?',
    [slug]
  );
  if (!pattern) throw new AppError('Pattern not found', 'PATTERN_NOT_FOUND', 404);

  await db.execute(
    `INSERT INTO analytics (pattern_id, downloads) VALUES (?, 1)
     ON CONFLICT(pattern_id) DO UPDATE SET downloads = downloads + 1, updated_at = ?`,
    [pattern.id, new Date().toISOString()]
  );

  const base = c.env.PUBLIC_SITE_URL ?? 'https://beadpatternai.com';
  return c.json(success({
    url: `${base}/patterns/${slug}/print`,
    filename: `${slug}-perler-bead-pattern.pdf`,
    content_type: 'text/html', // printable page
    note: 'Open this page in your browser and use Print to PDF',
  }));
});
```

**Step 3: Commit**

```bash
git add src/routes/patterns.ts
git commit -m "feat(downloads): add printable page and PDF download endpoint"
```

---

### Task 6.3: Update analytics action route for downloads

**Objective:** Keep `POST /api/patterns/:slug/download` as a legacy alias for analytics-only events, but ensure it doesn't conflict with `GET /api/patterns/:slug/download/png` and `/pdf`.

**Files:**
- Modify: `src/routes/patterns.ts` (if needed) and `src/routes/actions.ts`

**Step 1: Move analytics-only download to actions router if not already there**

The existing `POST /api/patterns/:slug/download` should remain for backwards compatibility. New `GET /api/patterns/:slug/download/*` routes take precedence for actual downloads.

**Step 2: Commit**

```bash
git commit -m "chore(downloads): keep POST download as analytics alias"
```

---

## Rollout & Verification

### Final deployment checklist

1. Apply D1 migrations: `npx wrangler d1 migrations apply beadpatternai-db --remote`
2. Run color_palette backfill: `npx tsx scripts/migrations/backfill-color-palette.ts`
3. Run collection seed: `npx tsx scripts/content-seed/publish-collections.ts`
4. Deploy backend: `npx wrangler deploy`
5. Verify endpoints:
   - `curl https://api.beadpatternai.com/api/collections`
   - `curl https://api.beadpatternai.com/api/admin/health/data`
   - `curl https://api.beadpatternai.com/api/patterns/cute-panda`
   - `curl https://api.beadpatternai.com/api/patterns/cute-panda/download/png`
   - `curl https://api.beadpatternai.com/api/patterns/cute-panda/download/pdf`
   - `curl https://api.beadpatternai.com/sitemap.xml`

### Success criteria

- `/api/collections` returns at least 20 published collections.
- `/api/patterns?limit=1` returns `color_palette` as object array.
- Pattern detail includes `steps`, `faqs`, and `related_patterns` arrays.
- `/api/admin/health/data` returns non-zero counts for enriched patterns.
- Sitemap is split into index + per-type sitemaps.
- Audit score includes steps and related patterns.
- **NEW:** `GET /api/patterns/:slug/download/png` returns a real image URL.
- **NEW:** `GET /api/patterns/:slug/download/pdf` returns a printable page URL.
- Analytics download count increments on any download action.
