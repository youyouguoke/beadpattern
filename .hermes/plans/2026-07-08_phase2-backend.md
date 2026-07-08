# BeadPatternAI Phase 2 Backend Development Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Implement the backend capabilities needed for Phase 2 (user-facing engagement, content discovery, and admin content management): user actions (like/download/view/share), analytics, related-pattern recommendations, search, collections, and sitemap.

**Architecture:** Keep all business logic in Hono routes under `src/routes/`; use D1 for relational data and analytics; use R2 for media; use a small `src/lib/` layer for shared helpers (schemas, health, analytics). Maintain existing snake_case API contract and progressive-migration fallback.

**Tech Stack:** Cloudflare Workers + Hono + D1 + R2 + Wrangler + TypeScript.

---

## Current State (Phase 1 complete)

- Schema up to migration 0016 supports: patterns, categories, collections, tags, difficulties, media, pattern relationships, audit, analytics, seo, seo variants, steps.
- Admin endpoints: patterns, categories, collections, tags, media, seed-import, bulk import.
- Public endpoints: `/health`, `/api/patterns`, `/api/patterns/:slug`, `/api/tags`, `/api/difficulty`, `/api/search`, `/api/recommend`, `/api/sitemap`.
- R2 public bucket `beadpatternai` and `R2_PUBLIC_URL` configured.
- 300 patterns imported, cover images on R2.

---

## Phase 2 Scope

### P2.1 Public user actions (view/like/download/share)

**Objective:** Allow visitors to interact with patterns and persist these interactions for analytics.

**Files:**
- Create: `src/routes/actions.ts`
- Modify: `src/index.ts` (mount router)
- Modify: `src/lib/schemas.ts` (add action schemas if needed)
- Test: `test/actions.e2e.test.ts`

**Step 1: Define schema**

```ts
// src/lib/schemas.ts
export const ActionTypeSchema = z.enum(['view', 'like', 'download', 'share']);
export const ActionPayloadSchema = z.object({
  type: ActionTypeSchema,
  pattern_slug: z.string().min(1),
  fingerprint: z.string().optional(), // optional deduplication key (e.g. session_id + ip hash)
});
```

**Step 2: Create route**

```ts
// src/routes/actions.ts
import { Hono } from 'hono';
import { getDb } from '../lib/db';
import { ActionPayloadSchema } from '../lib/schemas';
import { zValidator } from '@hono/zod-validator';
import { generateId } from '../lib/id';

const actions = new Hono<{ Bindings: Env }>();

actions.post('/', zValidator('json', ActionPayloadSchema), async (c) => {
  const body = c.req.valid('json');
  const db = getDb(c.env.DB);
  const pattern = await db.first('SELECT id, slug FROM patterns WHERE slug = ?', [body.pattern_slug]);
  if (!pattern) return c.json({ success: false, error: { code: 'PATTERN_NOT_FOUND', message: 'Pattern not found' } }, 404);

  const now = new Date().toISOString();
  const fingerprint = body.fingerprint ?? generateId();

  // Deduplication: only insert action log if no recent same action from same fingerprint
  const recent = await db.first(
    "SELECT 1 FROM action_logs WHERE pattern_id = ? AND action_type = ? AND fingerprint = ? AND created_at > datetime('now', '-1 hour')",
    [pattern.id, body.type, fingerprint]
  );
  if (!recent) {
    await db.insert('action_logs', {
      id: generateId(),
      pattern_id: pattern.id,
      action_type: body.type,
      fingerprint,
      created_at: now,
    });
  }

  // Upsert analytics counters
  const exists = await db.first('SELECT 1 FROM analytics WHERE pattern_id = ?', [pattern.id]);
  if (!exists) {
    await db.insert('analytics', {
      pattern_id: pattern.id,
      views: 0, likes: 0, shares: 0, downloads: 0, updated_at: now,
    });
  }
  const columnMap = { view: 'views', like: 'likes', share: 'shares', download: 'downloads' };
  const col = columnMap[body.type];
  await db.execute(
    `UPDATE analytics SET ${col} = ${col} + 1, updated_at = ? WHERE pattern_id = ?`,
    [now, pattern.id]
  );

  return c.json({ success: true, data: { action: body.type, pattern_id: pattern.id, counted: !recent } });
});

export default actions;
```

**Step 3: Mount in index**

```ts
// src/index.ts
import actionsRoute from './routes/actions';
app.route('/api/actions', actionsRoute);
```

**Step 4: Add migration for action_logs**

Create `src/migrations/0017_add_action_logs.sql`:

```sql
CREATE TABLE IF NOT EXISTS action_logs (
  id TEXT PRIMARY KEY,
  pattern_id TEXT NOT NULL REFERENCES patterns(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  fingerprint TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT datetime('now')
);
CREATE INDEX IF NOT EXISTS idx_action_logs_lookup ON action_logs(pattern_id, action_type, fingerprint, created_at);
CREATE INDEX IF NOT EXISTS idx_action_logs_created_at ON action_logs(created_at);
```

Update `test/migrations.ts` to include this migration.

**Step 5: Test**

```bash
npm run test -- --run
```

Expected: `test/actions.e2e.test.ts` passes (POST /api/actions increments counters, dedup works).

**Step 6: Commit**

```bash
git add src/routes/actions.ts src/index.ts src/lib/schemas.ts src/migrations/0017_add_action_logs.sql test/migrations.ts test/actions.e2e.test.ts
git commit -m "feat: add public actions endpoint (view/like/download/share) with dedup"
```

---

### P2.2 Public pattern list with filters & sorting

**Objective:** Make `/api/patterns` support query params for discovery.

**Files:**
- Modify: `src/lib/schemas.ts` (PatternListQuerySchema)
- Modify: `src/routes/patterns.ts`
- Test: `test/patterns.e2e.test.ts`

**Step 1: Expand query schema**

```ts
// src/lib/schemas.ts
export const PatternListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  difficulty: z.string().optional(),
  category: z.string().optional(),
  collection: z.string().optional(),
  tag: z.string().optional(),
  q: z.string().optional(),
  sort: z.enum(['newest', 'popular', 'recommended', 'publish_order']).default('newest'),
  status: z.enum(['draft', 'published', 'archived']).default('published'),
}).strict();
```

**Step 2: Implement filtered SQL in patterns list**

In `src/routes/patterns.ts` list handler:
- Base query: `FROM patterns p LEFT JOIN analytics a ON a.pattern_id = p.id`
- WHERE `status = ?` (default published)
- Add `AND difficulty_id = ?` if difficulty provided
- Add `AND EXISTS (SELECT 1 FROM pattern_categories pc JOIN categories c ON c.id = pc.category_id WHERE pc.pattern_id = p.id AND c.slug = ?)` if category
- Add collection filter similarly
- Add tag filter similarly
- Add text search: if `q` use FTS5 `pattern_search MATCH ?` or `LIKE` fallback
- Sorting:
  - `newest`: `p.created_at DESC`
  - `popular`: `COALESCE(a.views, 0) DESC`
  - `recommended`: `COALESCE(a.likes, 0) DESC, COALESCE(a.views, 0) DESC`
  - `publish_order`: `p.publish_order ASC, p.created_at DESC`

Return `pagination` block with `page`, `limit`, `total`, `total_pages`.

**Step 3: Test**

```bash
npm run test -- --run
```

Expected: patterns list tests pass with filters and pagination.

**Step 4: Commit**

```bash
git add src/lib/schemas.ts src/routes/patterns.ts test/patterns.e2e.test.ts
git commit -m "feat: public pattern list with filters, sort, pagination"
```

---

### P2.3 Search endpoint (FTS5 + tag fallback)

**Objective:** Make `/api/search` actually search.

**Files:**
- Modify: `src/routes/search.ts`
- Modify: `src/lib/schemas.ts` (SearchQuerySchema)
- Test: `test/search.e2e.test.ts`

**Step 1: Schema**

```ts
export const SearchQuerySchema = z.object({
  q: z.string().min(1),
  page: z.coerce.number().default(1),
  limit: z.coerce.number().max(100).default(20),
});
```

**Step 2: Implement search**

```ts
// src/routes/search.ts
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { getDb } from '../lib/db';
import { SearchQuerySchema } from '../lib/schemas';

const search = new Hono<{ Bindings: Env }>();

search.get('/', zValidator('query', SearchQuerySchema), async (c) => {
  const { q, page, limit } = c.req.valid('query');
  const db = getDb(c.env.DB);
  const offset = (page - 1) * limit;
  const like = `%${q.replace(/%/g, '\\%').replace(/_/g, '\\_')}%`;

  // Try FTS5 first; if not available, fall back to LIKE
  let rows: any[] = [];
  try {
    rows = await db.query(
      `SELECT p.* FROM pattern_search ps
       JOIN patterns p ON p.rowid = ps.rowid
       WHERE pattern_search MATCH ?
       ORDER BY rank
       LIMIT ? OFFSET ?`,
      [q, limit, offset]
    );
  } catch (e) {
    rows = [];
  }

  if (rows.length === 0) {
    rows = await db.query(
      `SELECT DISTINCT p.* FROM patterns p
       LEFT JOIN pattern_tags pt ON pt.pattern_id = p.id
       LEFT JOIN tags t ON t.id = pt.tag_id
       WHERE p.status = 'published' AND (p.title LIKE ? OR p.description LIKE ? OR t.name LIKE ? OR t.slug LIKE ?)
       ORDER BY p.created_at DESC
       LIMIT ? OFFSET ?`,
      [like, like, like, like, limit, offset]
    );
  }

  return c.json({ success: true, data: rows, pagination: { page, limit, total: -1, total_pages: -1 } });
});

export default search;
```

**Step 3: Test**

```bash
npm run test -- --run
```

**Step 4: Commit**

```bash
git add src/routes/search.ts src/lib/schemas.ts test/search.e2e.test.ts
git commit -m "feat: implement search endpoint with fts5 and fallback"
```

---

### P2.4 Recommend endpoint

**Objective:** Make `/api/recommend` return related patterns based on current pattern slug.

**Files:**
- Modify: `src/routes/recommend.ts`
- Modify: `src/lib/schemas.ts` (RecommendQuerySchema)
- Test: `test/recommend.e2e.test.ts`

**Step 1: Schema**

```ts
export const RecommendQuerySchema = z.object({
  slug: z.string().min(1),
  limit: z.coerce.number().max(50).default(10),
});
```

**Step 2: Implement recommend**

Query order:
1. `pattern_related` with `related_type` priority: `same_collection` > `same_category` > `similar` > `manual`
2. Fallback: same category, same collection, same difficulty, excluding self, ordered by views.

Return full pattern objects (or lightweight public shape).

**Step 3: Test**

```bash
npm run test -- --run
```

**Step 4: Commit**

```bash
git add src/routes/recommend.ts src/lib/schemas.ts test/recommend.e2e.test.ts
git commit -m "feat: implement pattern recommendation endpoint"
```

---

### P2.5 Collections public endpoint

**Objective:** Expose published collections and their patterns.

**Files:**
- Create: `src/routes/collections.ts`
- Modify: `src/index.ts`
- Test: `test/collections.e2e.test.ts`

**Step 1: Create route**

```ts
// src/routes/collections.ts
import { Hono } from 'hono';
import { getDb } from '../lib/db';

const collections = new Hono<{ Bindings: Env }>();

collections.get('/', async (c) => {
  const db = getDb(c.env.DB);
  const rows = await db.query(
    `SELECT c.*, COUNT(pc.pattern_id) AS pattern_count
     FROM collections c
     LEFT JOIN pattern_collections pc ON pc.collection_id = c.id
     WHERE c.published = 1
     GROUP BY c.id
     ORDER BY c.display_order ASC, c.created_at DESC`
  );
  return c.json({ success: true, data: rows });
});

collections.get('/:slug', async (c) => {
  const slug = c.req.param('slug');
  const db = getDb(c.env.DB);
  const collection = await db.first('SELECT * FROM collections WHERE slug = ? AND published = 1', [slug]);
  if (!collection) return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Collection not found' } }, 404);
  const patterns = await db.query(
    `SELECT p.* FROM patterns p
     JOIN pattern_collections pc ON pc.pattern_id = p.id
     WHERE pc.collection_id = ? AND p.status = 'published'
     ORDER BY pc.display_order ASC, p.created_at DESC`,
    [collection.id]
  );
  return c.json({ success: true, data: { collection, patterns } });
});

export default collections;
```

**Step 2: Mount**

```ts
app.route('/api/collections', collectionsRoute);
```

**Step 3: Test**

```bash
npm run test -- --run
```

**Step 4: Commit**

```bash
git add src/routes/collections.ts src/index.ts test/collections.e2e.test.ts
git commit -m "feat: public collections list and detail endpoints"
```

---

### P2.6 Sitemap endpoint

**Objective:** Generate `/api/sitemap` XML for SEO.

**Files:**
- Modify: `src/routes/sitemap.ts`
- Test: `test/sitemap.e2e.test.ts`

**Step 1: Implement**

```ts
// src/routes/sitemap.ts
import { Hono } from 'hono';
import { getDb } from '../lib/db';

const sitemap = new Hono<{ Bindings: Env }>();

sitemap.get('/', async (c) => {
  const db = getDb(c.env.DB);
  const baseUrl = c.env.SITE_URL ?? 'https://beadpatternai.com';
  const patterns = await db.query(
    "SELECT slug, updated_at, status FROM patterns WHERE status = 'published' ORDER BY updated_at DESC"
  );
  const collections = await db.query('SELECT slug, updated_at FROM collections WHERE published = 1');
  const categories = await db.query('SELECT slug, updated_at FROM categories');

  const urls = [
    { loc: baseUrl, lastmod: new Date().toISOString() },
    ...patterns.map((p: any) => ({ loc: `${baseUrl}/pattern/${p.slug}`, lastmod: p.updated_at })),
    ...collections.map((c: any) => ({ loc: `${baseUrl}/collection/${c.slug}`, lastmod: c.updated_at })),
    ...categories.map((c: any) => ({ loc: `${baseUrl}/category/${c.slug}`, lastmod: c.updated_at })),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${u.lastmod}</lastmod>\n  </url>`).join('\n')}
</urlset>`;

  c.header('Content-Type', 'application/xml');
  return c.body(xml);
});

export default sitemap;
```

**Step 2: Test**

```bash
npm run test -- --run
```

**Step 3: Commit**

```bash
git add src/routes/sitemap.ts test/sitemap.e2e.test.ts
git commit -m "feat: generate xml sitemap endpoint"
```

---

### P2.7 Admin media library CRUD + used_by tracking

**Objective:** Add DELETE /api/admin/media/:id and GET /api/admin/media/:id/references.

**Files:**
- Modify: `src/routes/admin/media.ts`
- Modify: `src/lib/media-helpers.ts` (create if not exists)
- Test: `test/admin-media.e2e.test.ts`

**Step 1: Add helpers**

Create `src/lib/media-helpers.ts` for updating `used_by` JSON counts.

**Step 2: Implement DELETE**

```ts
adminMedia.delete('/:id', async (c) => {
  const id = c.req.param('id');
  const db = getDb(c.env.DB);
  const row = await db.first('SELECT * FROM media WHERE id = ?', [id]);
  if (!row) return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Media not found' } }, 404);
  const usedBy = JSON.parse(row.used_by ?? '{}');
  if (Object.values(usedBy).some((v) => Number(v) > 0)) {
    return c.json({ success: false, error: { code: 'MEDIA_IN_USE', message: 'Media is referenced by patterns' } }, 409);
  }
  await c.env.R2.delete(row.r2_key);
  await db.deleteWhere('media', { id });
  return c.json({ success: true, data: { id } });
});
```

**Step 3: Implement GET references**

```ts
adminMedia.get('/:id/references', async (c) => {
  const id = c.req.param('id');
  const db = getDb(c.env.DB);
  const refs = await db.query(
    `SELECT 'cover' AS role, p.id, p.slug, p.title FROM patterns p WHERE cover_media_id = ?
     UNION ALL
     SELECT 'finished' AS role, p.id, p.slug, p.title FROM patterns p WHERE finished_media_id = ?
     UNION ALL
     SELECT 'gallery' AS role, p.id, p.slug, p.title FROM patterns p WHERE gallery_media_ids LIKE ?`,
    [id, id, `%"${id}"%`]
  );
  return c.json({ success: true, data: refs });
});
```

**Step 4: Test**

```bash
npm run test -- --run
```

**Step 5: Commit**

```bash
git add src/routes/admin/media.ts src/lib/media-helpers.ts test/admin-media.e2e.test.ts
git commit -m "feat: admin media delete and reference endpoints"
```

---

### P2.8 Admin publish/unpublish/bulk actions

**Objective:** Add single and bulk publish/unpublish endpoints.

**Files:**
- Modify: `src/routes/admin/patterns.ts`
- Test: `test/admin-patterns-publish.e2e.test.ts`

**Step 1: Add single publish endpoint**

```ts
adminPatterns.post('/:id/publish', async (c) => {
  const id = c.req.param('id');
  const db = getDb(c.env.DB);
  const now = new Date().toISOString();
  await db.execute(
    "UPDATE patterns SET status = 'published', published_at = COALESCE(published_at, ?), version = version + 1, updated_at = ? WHERE id = ?",
    [now, now, id]
  );
  await db.execute("UPDATE pattern_audit SET published = 1, ready = 1, updated_at = ? WHERE pattern_id = ?", [now, id]);
  return c.json({ success: true, data: { id, status: 'published' } });
});

adminPatterns.post('/:id/unpublish', async (c) => {
  const id = c.req.param('id');
  const db = getDb(c.env.DB);
  const now = new Date().toISOString();
  await db.execute("UPDATE patterns SET status = 'draft', updated_at = ? WHERE id = ?", [now, id]);
  await db.execute("UPDATE pattern_audit SET published = 0, updated_at = ? WHERE pattern_id = ?", [now, id]);
  return c.json({ success: true, data: { id, status: 'draft' } });
});
```

**Step 2: Add bulk publish**

```ts
adminPatterns.post('/bulk-publish', zValidator('json', BulkIdsSchema), async (c) => {
  const { ids } = c.req.valid('json');
  const db = getDb(c.env.DB);
  const now = new Date().toISOString();
  const placeholders = ids.map(() => '?').join(',');
  await db.execute(
    `UPDATE patterns SET status = 'published', published_at = COALESCE(published_at, ?), version = version + 1, updated_at = ? WHERE id IN (${placeholders})`,
    [now, now, ...ids]
  );
  await db.execute(
    `UPDATE pattern_audit SET published = 1, ready = 1, updated_at = ? WHERE pattern_id IN (${placeholders})`,
    [now, ...ids]
  );
  return c.json({ success: true, data: { count: ids.length } });
});
```

Add `BulkIdsSchema` to `src/lib/schemas.ts`.

**Step 3: Test**

```bash
npm run test -- --run
```

**Step 4: Commit**

```bash
git add src/routes/admin/patterns.ts src/lib/schemas.ts test/admin-patterns-publish.e2e.test.ts
git commit -m "feat: admin publish/unpublish and bulk-publish endpoints"
```

---

### P2.9 Deploy & verify remotely

**Step 1: Apply remote migrations**

```bash
source ~/.cloudflare_env
npx wrangler d1 migrations apply beadpatternai-db --remote
```

**Step 2: Deploy**

```bash
npx wrangler deploy
```

**Step 3: Verify production endpoints**

```bash
curl -s https://bead-pattern-ai.youyouguoke.workers.dev/health
curl -s "https://bead-pattern-ai.youyouguoke.workers.dev/api/patterns?limit=1" | python3 -m json.tool
curl -s "https://bead-pattern-ai.youyouguoke.workers.dev/api/search?q=panda" | python3 -m json.tool
curl -s "https://bead-pattern-ai.youyouguoke.workers.dev/api/collections" | python3 -m json.tool
curl -s "https://bead-pattern-ai.youyouguoke.workers.dev/api/sitemap" | head -20
```

**Step 4: Commit any final docs**

```bash
git add docs/phase2-api.md
git commit -m "docs: phase 2 public api spec"
```

---

## Risks & Open Questions

1. **FTS5 availability**: Cloudflare D1 supports FTS5, but virtual table corruption has been observed. If `pattern_search` is missing, add a migration to create it + triggers. Search will fallback to `LIKE` if needed.
2. **D1 write limits**: Bulk publish with >100 ids should be batched. Keep bulk endpoints at ≤100 ids per request.
3. **R2 public URL**: Ensure new media uploaded via admin still uses `pub-beadpatternai.r2.dev`.
4. **Dedup granularity**: Actions are deduped per fingerprint per hour. Adjust if product wants stricter (per session) or looser (per day) windows.
5. **CORS**: Public actions from frontend domain require `APP_ORIGIN` or explicit CORS. Confirm `cors` middleware already allows frontend origin.

---

## Suggested Task Order

1. P2.1 Actions (foundational for analytics)
2. P2.2 Pattern list filters
3. P2.3 Search
4. P2.4 Recommend
5. P2.5 Collections public
6. P2.6 Sitemap
7. P2.7 Admin media CRUD
8. P2.8 Admin publish/bulk
9. P2.9 Deploy & verify

Ready to execute with subagent-driven-development.
