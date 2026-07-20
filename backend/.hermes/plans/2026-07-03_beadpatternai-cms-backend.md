# BeadPatternAI CMS Backend Implementation Plan (No AI)

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.  
> **Scope:** Backend only. Frontend is out of scope.  
> **Goal:** Build a production-ready Cloudflare Workers + D1 + R2 backend that powers the BeadPatternAI CMS: pattern CRUD, tags, media uploads, bulk imports, SEO/sitemap.

---

## Goal

Deliver a deployable backend service exposing REST APIs for the BeadPatternAI content management system, supporting:

1. Pattern CRUD + publish workflow  
2. Tag taxonomy  
3. Image/media upload to R2  
4. Bulk CSV/JSON pattern import  
5. SEO metadata + `/sitemap.xml`  
6. Search (D1 FULLTEXT / simple query)  

The backend should be **stateless**, run on **Cloudflare Workers**, use **D1** as primary database, **R2** for assets, and **Queues** for async bulk indexing where helpful. No AI generation in this phase.

---

## Architecture

```text
Cloudflare Workers (Hono or native fetch router)
├── D1 database (patterns, tags, pattern_tags, pattern_steps, analytics, bulk_jobs)
├── R2 bucket (pattern images, step images)
├── Queues (async bulk index / image post-processing)
└── REST API consumed by Next.js frontend
```

Router choice: **Hono** (`npm i hono`) — lightweight, Workers-native, TypeScript-first, supports middleware and Zod validation cleanly.

ORM/DB access: **direct D1 SQL** with a thin repository layer. Prisma does not run on Workers, and D1 has its own client in `wrangler`. We'll use a small SQL builder / typed helpers to keep code readable.

Validation: **Zod**.

Testing: **Vitest** + `miniflare` / `@cloudflare/vitest-pool-workers` for integration tests against D1.

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Runtime | Cloudflare Workers |
| Router | Hono |
| Database | D1 (SQLite) |
| Object Storage | R2 |
| Queue | Cloudflare Queues |
| Validation | Zod |
| Language | TypeScript |
| Deploy | Wrangler CLI |
| Test | Vitest + @cloudflare/vitest-pool-workers |

---

## Project Structure

```
/root/projects/BeadPatternAI/bead-pattern-ai-backend/
├── src/
│   ├── index.ts                    # Worker entrypoint
│   ├── app.ts                      # Hono app factory (also used in tests)
│   ├── routes/
│   │   ├── patterns.ts             # Pattern CRUD + search
│   │   ├── tags.ts                 # Tag CRUD
│   │   ├── media.ts                # Upload / proxy from R2
│   │   ├── bulk.ts                 # Bulk import jobs
│   │   ├── seo.ts                  # Sitemap + metadata
│   │   └── health.ts               # Health check
│   ├── lib/
│   │   ├── db.ts                   # D1 client + query helpers
│   │   ├── errors.ts               # AppError + error handler
│   │   ├── env.ts                  # Environment type bindings
│   │   ├── r2.ts                   # R2 upload helpers
│   │   ├── queue.ts                # Queue producer helper
│   │   ├── slug.ts                 # Slug normalization
│   │   └── response.ts             # Standard JSON envelope
│   ├── migrations/
│   │   └── 0001_init.sql           # D1 schema
│   └── types.ts                    # Shared domain types
├── scripts/
│   ├── deploy.sh                   # Deploy + migrate + verify
│   └── verify.sh                   # Post-deploy curl checks
├── wrangler.toml
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── .env.example
```

---

## Database Schema (D1)

Tables:

1. `patterns` — core content
2. `pattern_steps` — ordered step cards
3. `tags` — taxonomy (style, theme, difficulty, animal, object, etc.)
4. `pattern_tags` — many-to-many
5. `analytics` — views/likes/shares per pattern
6. `bulk_jobs` — track CSV/JSON import jobs

Full schema in `src/migrations/0001_init.sql`:

```sql
CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL, -- style, theme, difficulty, animal, object, etc.
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS patterns (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy','medium','hard')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  cover_image TEXT,
  grid_size TEXT,
  estimated_beads INTEGER,
  color_count INTEGER,
  color_palette TEXT, -- JSON array of hex colors
  seo_title TEXT,
  seo_description TEXT,
  seo_keywords TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS pattern_steps (
  id TEXT PRIMARY KEY,
  pattern_id TEXT NOT NULL REFERENCES patterns(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  description TEXT,
  image TEXT,
  grid_data TEXT, -- optional JSON
  UNIQUE (pattern_id, step_number)
);

CREATE TABLE IF NOT EXISTS pattern_tags (
  pattern_id TEXT NOT NULL REFERENCES patterns(id) ON DELETE CASCADE,
  tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (pattern_id, tag_id)
);

CREATE TABLE IF NOT EXISTS analytics (
  pattern_id TEXT PRIMARY KEY REFERENCES patterns(id) ON DELETE CASCADE,
  views INTEGER NOT NULL DEFAULT 0,
  likes INTEGER NOT NULL DEFAULT 0,
  shares INTEGER NOT NULL DEFAULT 0,
  downloads INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS bulk_jobs (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','done','failed')),
  source_type TEXT NOT NULL, -- csv, json
  total_rows INTEGER NOT NULL DEFAULT 0,
  processed_rows INTEGER NOT NULL DEFAULT 0,
  failed_rows INTEGER NOT NULL DEFAULT 0,
  errors TEXT, -- JSON array
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes for performance / SEO
CREATE INDEX IF NOT EXISTS idx_patterns_status ON patterns(status);
CREATE INDEX IF NOT EXISTS idx_patterns_difficulty ON patterns(difficulty);
CREATE INDEX IF NOT EXISTS idx_patterns_created_at ON patterns(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pattern_tags_tag_id ON pattern_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_pattern_steps_pattern_id ON pattern_steps(pattern_id);
CREATE VIRTUAL TABLE IF NOT EXISTS pattern_search USING fts5(title, description, content='patterns', content_rowid='rowid');
```

Note: `pattern_search` FTS5 table is a D1/SQLite virtual table. We will populate it via triggers or explicit rebuild endpoints.

---

## API Contract

### Patterns

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/patterns` | List patterns. Query: `?tag=`, `?difficulty=`, `?status=`, `?sort=latest\|popular\|views`, `?page=`, `?limit=`, `?q=` |
| GET | `/api/patterns/:slug` | Get full pattern + steps + tags + analytics + SEO |
| POST | `/api/patterns` | Create a pattern (with optional steps/tags) |
| PUT | `/api/patterns/:id` | Update pattern |
| POST | `/api/patterns/:id/publish` | Publish a pattern |
| POST | `/api/patterns/:id/archive` | Archive a pattern |
| DELETE | `/api/patterns/:id` | Delete pattern |
| POST | `/api/patterns/:id/view` | Increment view count |
| POST | `/api/patterns/:id/like` | Increment like count |

### Tags

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/tags` | List tags. Query: `?type=` |
| GET | `/api/tags/:slug` | Get tag + associated patterns |
| POST | `/api/tags` | Create tag |
| DELETE | `/api/tags/:id` | Delete tag |

### Media

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/media/upload` | Upload image to R2, return public URL |
| GET | `/api/media/:key` | Proxy / redirect image from R2 (optional; frontend can use public R2 URL) |

### Bulk

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/bulk/import` | Upload CSV/JSON, create `bulk_job` |
| GET | `/api/bulk/jobs/:id` | Get job status |
| POST | `/api/bulk/jobs/:id/process` | (Manual trigger or queue consumer) process the bulk job |

### SEO

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/seo/sitemap.xml` | XML sitemap of all published patterns + tags |
| GET | `/api/seo/patterns/:slug` | SEO metadata JSON for a pattern |
| GET | `/api/search/reindex` | Rebuild FTS5 search index (admin) |

### Health

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | 200 + env summary |
| GET | `/api/health/db` | D1 connectivity check |

---

## Step-by-Step Plan

### Task 1: Scaffold Project

**Objective:** Create a working Cloudflare Workers + TypeScript + Hono project skeleton.

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `wrangler.toml`
- Create: `.env.example`
- Create: `.gitignore`

**Steps:**
1. Create directory `/root/projects/BeadPatternAI/bead-pattern-ai-backend`.
2. Write `package.json` with scripts: `dev`, `deploy`, `typecheck`, `test`, `db:local`, `db:remote`.
3. Add deps: `hono`, `zod`. Add dev deps: `wrangler`, `typescript`, `vitest`, `@cloudflare/vitest-pool-workers`.
4. Write `tsconfig.json` for Workers compatibility (`module: esnext`, `target: esnext`, `types: ["@cloudflare/workers-types"]`).
5. Write `wrangler.toml` with D1, R2, Queues placeholders (real IDs to be filled in Task 10).
6. Write `vitest.config.ts` using `@cloudflare/vitest-pool-workers` with a D1 binding named `DB`.
7. Write `.env.example` and `.gitignore`.

**Verification:**
- Run `npm install`.
- Run `npx wrangler --version`.
- Run `npm run typecheck` should pass (no files yet, so empty). Add a dummy `src/index.ts` that exports `export default { fetch: () => new Response('ok') }`.

---

### Task 2: Core Types and Environment

**Objective:** Define the environment bindings, error types, and standard response helpers.

**Files:**
- Create: `src/types.ts`
- Create: `src/lib/env.ts`
- Create: `src/lib/errors.ts`
- Create: `src/lib/response.ts`

**Steps:**
1. `src/types.ts`: Define `Pattern`, `PatternStep`, `Tag`, `PatternTag`, `Analytics`, `BulkJob`, `PatternListItem`, `Difficulty`, `PatternStatus`.
2. `src/lib/env.ts`: Export `Bindings` type extending `Env` with `DB: D1Database`, `R2: R2Bucket`, `BULK_QUEUE: Queue`, and `APP_ORIGIN`, `SITE_NAME`, `R2_PUBLIC_URL` vars.
3. `src/lib/errors.ts`: Define `AppError` class with `statusCode` and `code`. Add `errorHandler` middleware that returns `{ success: false, error: { code, message } }`.
4. `src/lib/response.ts`: Define `success(data, meta?)` and `paginated(data, pagination)` response wrappers.

**Verification:**
- Add a test `test/lib/response.test.ts` asserting `success({x:1})` equals the envelope shape.
- Add a test for `AppError` with status 400.

---

### Task 3: D1 Database Helpers

**Objective:** Build a typed, thin D1 query layer.

**Files:**
- Create: `src/lib/db.ts`

**Steps:**
1. Export a `DBClient` class that wraps a `D1Database`.
2. Provide methods: `query<T>(sql, params?)`, `queryOne<T>(sql, params?)`, `insert(table, record)`, `update(table, record, where)`, `deleteWhere(table, where)`.
3. Implement a simple SQL builder for `select`, `where`, `orderBy`, `limit`, `offset`.
4. Ensure all queries handle `rowid`/`id` correctly and return typed arrays.

**Verification:**
- Write a test using the D1 pool: create a temp table, insert, query, update, delete.
- Verify results.

---

### Task 4: Database Migration

**Objective:** Write and apply the initial D1 schema.

**Files:**
- Create: `src/migrations/0001_init.sql`

**Steps:**
1. Write `0001_init.sql` containing all tables and indexes from the schema section above.
2. Add an `INSERT INTO tags` seed block for common categories: Animals, Food, Halloween, Christmas, Flowers, Gaming, Fantasy, Seasonal, Easy, Medium, Hard.
3. Run `npx wrangler d1 execute beadpatternai-db --local --file=src/migrations/0001_init.sql` to verify it runs locally.
4. Verify tables and indexes can be listed.

**Verification:**
- `npx wrangler d1 execute beadpatternai-db --local --command="SELECT name FROM sqlite_master WHERE type='table';"` lists tables.

---

### Task 5: Tag Module

**Objective:** Implement CRUD for tags.

**Files:**
- Create: `src/routes/tags.ts`
- Create: `src/lib/slug.ts`
- Test: `test/routes/tags.test.ts`

**Steps:**
1. `src/lib/slug.ts`: Implement `normalizeSlug(text)` and `ensureUniqueSlug(db, baseSlug, table)`.
2. `src/routes/tags.ts`: Hono router with:
   - `GET /api/tags` (filter by type)
   - `POST /api/tags` (validate with Zod, create slug, insert)
   - `GET /api/tags/:slug` (tag + patterns, paginated)
   - `DELETE /api/tags/:id`
3. Zod schemas: `CreateTagSchema` with `name`, `type`, optional `slug`.

**Verification:**
- Test: create a tag, list tags, get tag by slug, delete tag.
- Expect `POST /api/tags` returns `success({ tag: {...} })`.

---

### Task 6: Pattern Core API

**Objective:** Implement pattern CRUD, publish, archive, and detail fetch.

**Files:**
- Create: `src/routes/patterns.ts`
- Create: `src/lib/patterns.ts` (reusable helpers)
- Test: `test/routes/patterns.test.ts`

**Steps:**
1. Zod schemas: `CreatePatternSchema`, `UpdatePatternSchema`, `PatternStepSchema`.
2. `POST /api/patterns`: validate, generate slug, insert pattern, insert steps, insert pattern_tags, insert analytics row.
3. `GET /api/patterns/:slug`: join tags + steps + analytics, return full payload.
4. `PUT /api/patterns/:id`: update mutable fields, regenerate SEO fields if not provided, update `updated_at`.
5. `POST /api/patterns/:id/publish`: set status to `published`.
6. `POST /api/patterns/:id/archive`: set status to `archived`.
7. `DELETE /api/patterns/:id`: cascade delete (handled by FK). Also delete R2 images (optional but good).
8. `GET /api/patterns`: list with filters and pagination.

**Verification:**
- Create pattern → GET by slug → publish → update → archive → delete.
- Test list filters and pagination.

---

### Task 7: Pattern Search & Analytics

**Objective:** Add search and basic analytics endpoints.

**Files:**
- Modify: `src/routes/patterns.ts`
- Create: `src/lib/search.ts`
- Test: `test/routes/search.test.ts`

**Steps:**
1. `src/lib/search.ts`: Build `searchPatterns(db, q, filters)` using D1 FTS5 `pattern_search`.
2. Rebuild helper: `rebuildSearchIndex(db)` truncates and repopulates `pattern_search` from published patterns.
3. In `GET /api/patterns`, when `q` is present, route to `searchPatterns`.
4. Add `POST /api/patterns/:id/view` and `POST /api/patterns/:id/like` to increment `analytics`.
5. Add `GET /api/patterns` sort by `popular` using analytics views.

**Verification:**
- Create patterns, rebuild search index, search with `q=cute`.
- Hit view endpoint, check analytics updated.

---

### Task 8: R2 Media Upload

**Objective:** Allow image uploads to R2 and return public URLs.

**Files:**
- Create: `src/routes/media.ts`
- Create: `src/lib/r2.ts`
- Test: `test/routes/media.test.ts`

**Steps:**
1. `src/lib/r2.ts`: Helper to upload a file to R2 with key `patterns/{patternId}/{filename}` or `uploads/{uuid}.{ext}`.
2. `src/routes/media.ts`:
   - `POST /api/media/upload` accepts multipart/form-data, validates file type (jpg/png/webp), size limit, writes to R2, returns `{ url, key }`.
   - `GET /api/media/:key` proxies the object from R2 (optional).
3. Validation: accept images only, max 5MB, generate safe filename.

**Verification:**
- Integration test: upload a small buffer, assert R2 object exists, assert URL returned.
- In production, R2 public URL must be configured via `R2_PUBLIC_URL` var.

---

### Task 9: Bulk Import System

**Objective:** Enable batch import of patterns from CSV or JSON.

**Files:**
- Create: `src/routes/bulk.ts`
- Create: `src/lib/bulk.ts`
- Test: `test/routes/bulk.test.ts`

**Steps:**
1. `POST /api/bulk/import` accepts multipart file or JSON body. Determine `source_type`.
2. Parse CSV/JSON into rows. Validate each row against a `BulkPatternRowSchema`.
3. Insert a `bulk_jobs` row with `status='pending'`, `total_rows`, and store `source_data` as JSON (in `errors` field temporarily or add `source_data` column).
   - If using CSV, the source text can be stored in a new `source_data TEXT` column.
4. `POST /api/bulk/jobs/:id/process` processes rows one by one: create patterns, steps, tags, analytics. Update `processed_rows`, `failed_rows`, `errors`, and `status`.
5. For large jobs, split into queue messages: send chunks to `BULK_QUEUE`. The queue consumer calls the same processor.
6. `GET /api/bulk/jobs/:id` returns current status.

**Verification:**
- Import JSON with 3 patterns → process → verify patterns created.
- Test CSV import with a header row.
- Test error handling for invalid rows.

---

### Task 10: SEO & Sitemap

**Objective:** Generate sitemap and SEO metadata endpoints.

**Files:**
- Create: `src/routes/seo.ts`
- Create: `src/lib/seo.ts`
- Test: `test/routes/seo.test.ts`

**Steps:**
1. `src/lib/seo.ts`: `generateSEO(pattern, tags)` returns `title`, `description`, `keywords`, `canonical`, `ogImage`.
2. On pattern create/update, if SEO fields are missing, auto-generate them.
3. `GET /api/seo/patterns/:slug` returns SEO metadata.
4. `GET /api/seo/sitemap.xml` generates sitemap with pattern URLs (`/pattern/{slug}`) and tag URLs (`/tag/{slug}`). XML must be valid.
5. `GET /api/search/reindex` (admin-like) rebuilds FTS5 index.

**Verification:**
- Create published pattern → sitemap contains its URL.
- SEO metadata endpoint returns correct JSON-LD-ready data.

---

### Task 11: Wiring & Health

**Objective:** Compose all routers into the Hono app and add health endpoints.

**Files:**
- Create: `src/app.ts`
- Create: `src/index.ts`
- Create: `src/routes/health.ts`

**Steps:**
1. `src/app.ts`: Create Hono app with `Bindings`, attach global error handler, mount routers under `/api`.
2. `src/routes/health.ts`: `GET /api/health` and `GET /api/health/db`.
3. `src/index.ts`: Export `default { fetch: app.fetch }`.

**Verification:**
- Run `npm run test` with all routes integrated.
- Health check returns 200.

---

### Task 12: Wrangler Configuration & Local Deployment

**Objective:** Configure bindings and deploy to local Miniflare/Wrangler dev.

**Files:**
- Modify: `wrangler.toml`
- Create: `scripts/deploy.sh`
- Create: `scripts/verify.sh`

**Steps:**
1. Fill `wrangler.toml` with D1, R2, and Queue bindings (local IDs first).
2. Add `compatibility_date` to a recent date (e.g., `2026-01-21`).
3. Add `[vars]` for `APP_ORIGIN`, `SITE_NAME`, `R2_PUBLIC_URL`.
4. Run `npx wrangler dev` to start locally.
5. Run `scripts/verify.sh` to hit `/api/health` and `/api/tags`.

**Verification:**
- Local dev server responds to `/api/health`.

---

### Task 13: Remote Cloudflare Resource Creation & Deployment

**Objective:** Create real D1, R2, Queue resources and deploy to production.

**Steps:**
1. Run `npx wrangler d1 create beadpatternai-db` and capture `database_id`.
2. Run `npx wrangler r2 bucket create beadpatternai-assets`.
3. Run `npx wrangler queues create beadpatternai-bulk-queue`.
4. Update `wrangler.toml` with real IDs.
5. Set secrets if needed (AI keys not required in this phase). At minimum set `SESSION_SECRET` if auth is added later; otherwise none.
6. Apply remote migration: `npx wrangler d1 migrations apply beadpatternai-db --remote`.
7. Deploy: `npx wrangler deploy`.
8. Run `scripts/verify.sh` with production URL.

**Verification:**
- Production `/api/health` returns 200.
- Production `/api/seo/sitemap.xml` returns valid XML.
- Production R2 upload works (or at least returns a signed URL).

---

## Risks & Tradeoffs

1. **D1 vs PostgreSQL**: D1 is serverless and fits Workers, but has limits (concurrency, no full Postgres features). For CMS MVP it's fine; for 100k+ patterns we may need to migrate or use read replicas.
2. **No Auth in MVP**: Admin endpoints are public. This is acceptable for the first deploy but should be addressed immediately after MVP with Cloudflare Access or API keys.
3. **R2 Public Access**: Requires R2 bucket public access or custom public URL. If not configured, uploads will be stored but not publicly accessible.
4. **FTS5**: D1 supports FTS5 in recent versions, but behavior may differ from PostgreSQL full-text. Need to test locally.
5. **AI Later**: Schema includes `color_palette`, `grid_size`, etc. to ease future AI integration without migration.

## Open Questions

1. Do you want admin authentication in this MVP, or is a simple API-key middleware enough?
2. What is the target domain (`APP_ORIGIN`) and R2 public URL for production?
3. Should bulk import be processed synchronously in the HTTP request, or always via Queue?
4. Do you want soft deletes for patterns instead of hard deletes?
5. Should we pre-seed patterns from the existing frontend data or start with a blank CMS?

---

## Definition of Done

- [ ] `npm run test` passes all tests locally against D1 Miniflare.
- [ ] `npx wrangler deploy` succeeds.
- [ ] `/api/health` returns 200 in production.
- [ ] `/api/patterns` CRUD works end-to-end.
- [ ] `/api/seo/sitemap.xml` returns valid XML containing published patterns and tags.
- [ ] `/api/bulk/import` can create multiple patterns in one request.
- [ ] Media upload returns a valid R2 URL.
- [ ] A `deployment-report.md` is generated in `docs/`.
