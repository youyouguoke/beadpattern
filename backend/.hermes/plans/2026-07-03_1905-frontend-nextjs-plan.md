# Frontend-Focused Development Plan for BeadPatternAI

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:**
Transform the existing Next.js app at `/root/projects/BeadPatternAI/built/my-app` from a mock-data showcase into a CMS-backed, SEO-first frontend powered by the planned backend at `/root/projects/BeadPatternAI/backend`.

**Scope:**
Frontend only (Next.js App Router). The backend team (NestJS/Prisma/PostgreSQL) is responsible for the APIs described below, but this plan documents exactly what the frontend needs from them.

**Tech Stack:**
- Next.js App Router + React Server Components
- Tailwind CSS (already in use)
- TypeScript
- Backend: NestJS + Prisma + PostgreSQL (planned)

---

## Current State

- Existing Next.js app: `/root/projects/BeadPatternAI/built/my-app`
- Current data layer: `src/lib/patternService.ts` returns hard-coded mock arrays (`basePatterns`, `categories`, `collections`) and functions (`getPattern`, `getCategories`, `getAllPatterns`, `searchPatterns`).
- Existing routes (all client-rendered or static):
  - `/` — Home
  - `/pattern/[slug]` — Pattern detail (uses `PatternDetail` client component)
  - `/category/[slug]` — Category archive (uses `PatternArchive`)
  - `/collection/[slug]` — Collection archive (uses `PatternArchive`)
  - `/search?q=` — Search results (uses `PatternArchive`)
  - `/generate` — AI generator UI
- SEO: Only the home page has static `metadata`. Pattern/category pages share a single generic `metadata` object and do not use dynamic `generateMetadata`.
- Performance: Pattern archive and pattern detail fetch data in `useEffect` (CSR), which is not SEO-friendly.

---

## Backend API Contracts Required (v1 — CMS without AI)

The frontend requires the following REST endpoints. The backend team should implement these in NestJS as described in the backend planning documents (CMS Architecture, Engineering Skeleton, Bulk System).

### 1. Patterns

| Method | Endpoint | Query Params | Response | Notes |
|--------|----------|--------------|----------|-------|
| GET | `/api/patterns` | `tag`, `difficulty`, `sort`, `page`, `limit` | Paginated list of patterns | `sort` values: `latest`, `popular` |
| GET | `/api/patterns/:slug` | — | Full pattern + steps + tags + seo | Must include `status: published` only |
| POST | `/api/patterns` | — | Created pattern | Admin/CMS only |
| PUT | `/api/patterns/:id` | — | Updated pattern | Admin/CMS only |
| POST | `/api/patterns/:id/publish` | — | Published pattern | Admin/CMS only |

### 2. Tags / Categories

| Method | Endpoint | Response | Notes |
|--------|----------|----------|-------|
| GET | `/api/tags` | List of tags with `slug`, `name`, `type`, `count` | Used for category/tag pages |
| GET | `/api/tags/:slug` | Tag details + paginated patterns | Used for `/tag/[slug]` |

### 3. Difficulty

| Method | Endpoint | Response | Notes |
|--------|----------|----------|-------|
| GET | `/api/difficulty/:level` | Patterns filtered by difficulty | Level: `easy`, `medium`, `hard` |

### 4. Search

| Method | Endpoint | Query Params | Response | Notes |
|--------|----------|--------------|----------|-------|
| GET | `/api/search` | `q` | Patterns + tags + suggestions | v1 can be SQL `FULLTEXT` on title/description |

### 5. Recommendations

| Method | Endpoint | Response | Notes |
|--------|----------|----------|-------|
| GET | `/api/recommend/:patternId` | Related patterns | Rule-based: same tag, same difficulty, trending |

### 6. Admin / CMS

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/admin/upload-image` | Upload cover/step images |
| POST | `/api/bulk/import` | CSV/JSON bulk import preview |
| POST | `/api/bulk/create` | Bulk create patterns |
| POST | `/api/bulk/publish` | Bulk publish patterns |

### 7. SEO Support

| Endpoint | Purpose |
|----------|---------|
| GET `/api/sitemap/patterns` | All published pattern slugs for sitemap |
| GET `/api/sitemap/tags` | All tag slugs for sitemap |
| GET `/api/sitemap/difficulty` | All difficulty levels for sitemap |

---

## Frontend Data Model Alignment

The current frontend `Pattern` interface (`src/lib/patternService.ts`) must align with the backend `Pattern` entity. The key mappings are:

| Frontend Field | Backend Field | Notes |
|----------------|---------------|-------|
| `slug` | `slug` | Unique, URL-safe |
| `title` | `title` | H1 + meta title base |
| `description` | `description` | SEO paragraph |
| `difficulty` | `difficulty` | `easy`, `medium`, `hard` |
| `coverImage` / `img` | `coverImage` | WebP, CDN URL |
| `finished` | `finishedImage` | Finished photo URL |
| `grid` | `grid` | e.g. `24x24` |
| `colors` | derived from palette | Count of palette entries |
| `beadCount` | `beadCount` | Total beads |
| `palette` | `palette` | Array of `{hex, name, count, code}` |
| `steps` | `manualSteps` | Array of step descriptions |
| `tags` | `tags` | Array of tag names/slugs |
| `related` | computed by `/api/recommend/:id` | Related pattern previews |

---

## Frontend Route Plan

Convert the existing routes to App Router server components where possible. Use `generateMetadata` for SEO.

| Route | Type | Data Source | Notes |
|-------|------|-------------|-------|
| `/` | Server Component | `/api/patterns?sort=popular`, `/api/tags` | Already exists; make data fetch server-side |
| `/pattern/[slug]` | Server Component + `generateMetadata` | `/api/patterns/:slug` | Replace CSR `PatternDetail` with server-rendered page |
| `/tag/[slug]` | Server Component + `generateMetadata` | `/api/tags/:slug` | New route; replaces some `/category` usage |
| `/category/[slug]` | Server Component + `generateMetadata` | `/api/patterns?tag=:slug` | Keep existing route, align with backend tag API |
| `/difficulty/[level]` | Server Component + `generateMetadata` | `/api/difficulty/:level` | New route |
| `/search` | Server Component | `/api/search?q=` | Already exists; make server-side |
| `/sitemap.xml` | Route Handler | `/api/sitemap/*` | Dynamic sitemap |
| `/robots.txt` | Static / Route Handler | — | Already exists conceptually |
| `/admin/patterns` | Client Component | Admin APIs | CMS editor UI |
| `/admin/patterns/new` | Client Component | POST `/api/patterns` | Pattern creation form |
| `/admin/bulk` | Client Component | `/api/bulk/*` | CSV/JSON bulk import UI |

---

## Phase 1: Foundation — Connect Data Layer (MVP)

### Task 1: Create API client module

**Objective:** Centralize all backend API calls in a single typed service layer.

**Files:**
- Create: `/root/projects/BeadPatternAI/built/my-app/src/lib/api.ts`

**Content:**
```ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export async function fetchPatterns(query: Record<string, string> = {}) { ... }
export async function fetchPattern(slug: string) { ... }
export async function fetchTags() { ... }
export async function fetchTag(slug: string) { ... }
export async function searchPatterns(q: string) { ... }
export async function fetchRelated(patternId: string) { ... }
```

**Verification:**
- Run `tsc --noEmit` in `/root/projects/BeadPatternAI/built/my-app` — no type errors.
- Add a temporary `app/api/health/route.ts` that calls `fetchPatterns({limit:'1'})` and returns JSON if backend is reachable.

### Task 2: Update pattern service to use backend API

**Objective:** Make `src/lib/patternService.ts` fetch from backend instead of returning mock data.

**Files:**
- Modify: `/root/projects/BeadPatternAI/built/my-app/src/lib/patternService.ts`

**Changes:**
- Replace `basePatterns` fallback with calls to `fetchPatterns` / `fetchPattern`.
- Keep mock data as a local fallback when `NEXT_PUBLIC_API_URL` is unset and `NODE_ENV === development`.
- Update `getPattern`, `getAllPatterns`, `searchPatterns`, `getCategories` to call API clients.

**Verification:**
- Start the Next.js dev server: `npm run dev` (or `pnpm dev` / `yarn dev`).
- Visit `http://localhost:3000/pattern/cute-frog` and confirm it renders using backend data (or mock fallback if backend is unavailable).

### Task 3: Add environment configuration

**Objective:** Configure API base URL for dev/staging/prod.

**Files:**
- Modify: `/root/projects/BeadPatternAI/built/my-app/.env.local` (create if missing)
- Modify: `/root/projects/BeadPatternAI/built/my-app/.env.example` (create if missing)

**Content:**
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
```

**Verification:**
- Confirm `process.env.NEXT_PUBLIC_API_URL` is read by `src/lib/api.ts`.

---

## Phase 2: SEO-First Page Routes

### Task 4: Convert pattern page to SSR with dynamic metadata

**Objective:** Make `/pattern/[slug]` server-rendered and SEO-optimized.

**Files:**
- Modify: `/root/projects/BeadPatternAI/built/my-app/src/app/pattern/[slug]/page.tsx`
- Create: `/root/projects/BeadPatternAI/built/my-app/src/components/pattern/PatternServer.tsx`

**Changes:**
- Implement `generateMetadata({ params })` in `page.tsx` that fetches `/api/patterns/:slug` and returns:
  - `title`
  - `description`
  - `openGraph` images (cover image)
  - `alternates.canonical`
- Convert page body to a server component that passes data to the existing `PatternDetail` client component for interactive tabs.
- Remove `useEffect` data fetch from `PatternDetail` when used inside the server page (or create a server-first wrapper).

**Verification:**
- View page source (`Ctrl+U`) — `<title>` and `<meta name="description">` should match the pattern.
- Use `curl http://localhost:3000/pattern/cute-frog` and grep for `<title>`.

### Task 5: Convert tag/category page to SSR with dynamic metadata

**Objective:** Make `/category/[slug]` and `/tag/[slug]` server-rendered.

**Files:**
- Modify: `/root/projects/BeadPatternAI/built/my-app/src/app/category/[slug]/page.tsx`
- Create: `/root/projects/BeadPatternAI/built/my-app/src/app/tag/[slug]/page.tsx`
- Modify: `/root/projects/BeadPatternAI/built/my-app/src/components/archive/PatternArchive.tsx`

**Changes:**
- In `category/[slug]/page.tsx` and `tag/[slug]/page.tsx`, implement `generateMetadata` using `/api/tags/:slug`.
- Server-fetch the tag and its patterns, then pass to `PatternArchive`.
- Update `PatternArchive` to accept `initialPatterns`, `initialTag`, and `searchQuery` as props so it can render server-side before hydration.

**Verification:**
- Visit `/category/animals` and view source — title should be `Animals Bead Patterns - BeadPatternAI`.
- Visit `/tag/kawaii` (if backend supports it) and confirm SSR.

### Task 6: Convert home page to SSR

**Objective:** Fetch trending patterns and categories on the server.

**Files:**
- Modify: `/root/projects/BeadPatternAI/built/my-app/src/app/page.tsx`
- Modify: `/root/projects/BeadPatternAI/built/my-app/src/components/home/TrendingPatterns.tsx`
- Modify: `/root/projects/BeadPatternAI/built/my-app/src/components/home/ExploreCategories.tsx`

**Changes:**
- In `page.tsx`, await `fetchPatterns({ sort: 'popular', limit: '8' })` and `fetchTags()`.
- Pass fetched data as props to `TrendingPatterns` and `ExploreCategories`.
- Remove `useEffect` data fetching from these components when server data is provided, or keep a fallback for client-side filtering.

**Verification:**
- View source of home page — HTML should contain actual pattern titles and category names, not loading placeholders.

### Task 7: Convert search page to SSR

**Objective:** Make `/search?q=` server-rendered with search results.

**Files:**
- Modify: `/root/projects/BeadPatternAI/built/my-app/src/app/search/page.tsx`
- Modify: `/root/projects/BeadPatternAI/built/my-app/src/components/archive/PatternArchive.tsx`

**Changes:**
- In `search/page.tsx`, read `searchParams.q` and call `/api/search?q=`.
- Pass results to `PatternArchive` as `initialPatterns`.
- Implement `generateMetadata` using the query.

**Verification:**
- Visit `/search?q=frog` and view source — results should be in the HTML.

---

## Phase 3: SEO Infrastructure

### Task 8: Add dynamic sitemap.xml

**Objective:** Generate sitemap from backend slugs.

**Files:**
- Create: `/root/projects/BeadPatternAI/built/my-app/src/app/sitemap.xml/route.ts`

**Content:**
```ts
export async function GET() {
  const [patterns, tags] = await Promise.all([
    fetchSitemapPatterns(),
    fetchSitemapTags(),
  ]);
  // build XML
}
```

**Verification:**
- Visit `/sitemap.xml` and confirm it lists `/pattern/*`, `/tag/*`, and `/difficulty/*` URLs.

### Task 9: Add robots.txt route

**Objective:** Serve robots.txt with sitemap reference.

**Files:**
- Create: `/root/projects/BeadPatternAI/built/my-app/src/app/robots.txt/route.ts`

**Verification:**
- Visit `/robots.txt` and confirm `Sitemap:` line is present.

### Task 10: Add JSON-LD structured data to pattern pages

**Objective:** Improve search result appearance with structured data.

**Files:**
- Modify: `/root/projects/BeadPatternAI/built/my-app/src/app/pattern/[slug]/page.tsx`

**Changes:**
- Inject `<script type="application/ld+json">` with `HowTo` schema (steps) and `ImageObject` schema.

**Verification:**
- Use Google's Rich Results Test by pasting the page URL or HTML.

---

## Phase 4: CMS Admin UI (Frontend)

### Task 11: Create admin pattern list page

**Objective:** Allow operators to view and manage patterns.

**Files:**
- Create: `/root/projects/BeadPatternAI/built/my-app/src/app/admin/patterns/page.tsx`
- Create: `/root/projects/BeadPatternAI/built/my-app/src/components/admin/PatternTable.tsx`

**Data source:** `GET /api/patterns?status=draft,published`

**Verification:**
- Visit `/admin/patterns` and confirm a table of patterns loads.

### Task 12: Create pattern editor form

**Objective:** Allow operators to create and edit patterns.

**Files:**
- Create: `/root/projects/BeadPatternAI/built/my-app/src/app/admin/patterns/new/page.tsx`
- Create: `/root/projects/BeadPatternAI/built/my-app/src/app/admin/patterns/[id]/edit/page.tsx`
- Create: `/root/projects/BeadPatternAI/built/my-app/src/components/admin/PatternForm.tsx`

**Fields:**
- Title, slug, description, difficulty, status
- Cover image upload (POST `/api/admin/upload-image`)
- Step builder (repeater for description + optional image)
- Tag selector (fetch from `/api/tags`)
- SEO preview panel

**Verification:**
- Create a new pattern and verify it appears in `/admin/patterns` and on the frontend after publish.

### Task 13: Create bulk upload UI

**Objective:** Allow operators to import patterns from CSV/JSON.

**Files:**
- Create: `/root/projects/BeadPatternAI/built/my-app/src/app/admin/bulk/page.tsx`
- Create: `/root/projects/BeadPatternAI/built/my-app/src/components/admin/BulkUploader.tsx`

**API flow:**
1. Upload file → POST `/api/bulk/preview`
2. Show preview table
3. Confirm → POST `/api/bulk/create`
4. Publish → POST `/api/bulk/publish`

**Verification:**
- Upload a CSV with 5 patterns and confirm all are created and published.

---

## Phase 5: Performance & Polish

### Task 14: Optimize images with Next.js `<Image>`

**Objective:** Replace `<img>` tags with `<Image>` where possible for automatic optimization.

**Files:**
- Modify: `/root/projects/BeadPatternAI/built/my-app/src/components/archive/PatternArchive.tsx`
- Modify: `/root/projects/BeadPatternAI/built/my-app/src/components/pattern/PatternDetail.tsx`
- Modify: `/root/projects/BeadPatternAI/built/my-app/src/components/home/*`

**Note:** External image URLs may require `next.config.js` `images.remotePatterns` entries.

**Verification:**
- Run Lighthouse on `/pattern/cute-frog` — LCP should be < 2.5s.

### Task 15: Add ISR / caching strategy

**Objective:** Cache public pages without stale content.

**Files:**
- Modify: `/root/projects/BeadPatternAI/built/my-app/src/app/pattern/[slug]/page.tsx`
- Modify: `/root/projects/BeadPatternAI/built/my-app/src/app/category/[slug]/page.tsx`
- Modify: `/root/projects/BeadPatternAI/built/my-app/src/app/tag/[slug]/page.tsx`

**Changes:**
- Add `export const revalidate = 3600;` to public pages.
- Use `fetch(..., { next: { revalidate: 3600 } })` for API calls.
- Admin pages should use `cache: 'no-store'`.

**Verification:**
- Confirm that a published pattern change becomes visible within the revalidation window.

### Task 16: Add error and loading states

**Objective:** Improve UX for slow or failed API calls.

**Files:**
- Create: `/root/projects/BeadPatternAI/built/my-app/src/app/pattern/[slug]/error.tsx`
- Create: `/root/projects/BeadPatternAI/built/my-app/src/app/pattern/[slug]/loading.tsx`
- Create similar for `/category/[slug]`, `/tag/[slug]`, `/search`.

**Verification:**
- Simulate API failure and confirm error boundary catches it.

---

## Verification Checklist (MVP)

- [ ] `/pattern/[slug]` is SSR and has dynamic `<title>`/`<meta>`/OG tags.
- [ ] `/category/[slug]` and `/tag/[slug]` are SSR with dynamic metadata.
- [ ] Home page lists backend-fetched patterns and categories in server HTML.
- [ ] `/search?q=` returns backend results in server HTML.
- [ ] `/sitemap.xml` lists all published patterns and tags.
- [ ] `/robots.txt` references the sitemap.
- [ ] Admin can create, edit, publish, and bulk-import patterns.
- [ ] Pattern detail page includes JSON-LD structured data.
- [ ] Lighthouse LCP < 2.5s on pattern pages.
- [ ] No hard-coded mock data is used in production routes.

---

## Risks & Open Questions

1. **Backend availability:** The frontend should degrade gracefully to mock data if `NEXT_PUBLIC_API_URL` is not set during early development.
2. **Image domains:** All external image URLs (CDN, R2, uploads) must be listed in `next.config.js` `images.remotePatterns`.
3. **Route collisions:** Existing `/category/[slug]` and planned `/tag/[slug]` may overlap. Decide whether to keep both or redirect `/category/*` to `/tag/*`.
4. **Admin auth:** The backend must provide authentication before admin routes are exposed publicly. The frontend should gate `/admin/*` behind a login check (e.g., middleware or session cookie).
5. **Search v1 vs v2:** v1 uses SQL `FULLTEXT`. If backend switches to ElasticSearch later, the frontend API contract should remain the same.

---

## Open Backend Dependencies (Reminders)

- `/api/patterns` paginated response shape must include `items`, `total`, `page`, `limit`.
- `/api/patterns/:slug` must return `title`, `description`, `difficulty`, `coverImage`, `finishedImage`, `grid`, `beadCount`, `palette`, `steps`, `tags`, `related`.
- `/api/tags` and `/api/tags/:slug` must return `slug`, `name`, `type`, `count`, and paginated patterns.
- `/api/search` must return patterns matching query for v1.
- `/api/admin/upload-image` must accept multipart/form-data and return a CDN URL.
- `/api/bulk/*` endpoints must support CSV/JSON preview, create, and publish.
- `/api/sitemap/*` endpoints must return all published slugs and tags.

---

## Summary for Backend Team

This plan extracts the frontend requirements from the backend planning documents. The backend team should prioritize:

1. **Pattern CRUD + publish API** (blocks Phase 1 and 2).
2. **Tag API** (blocks Phase 2).
3. **Search API** (blocks Phase 2 search page).
4. **Upload + bulk APIs** (blocks Phase 4 admin).
5. **Sitemap endpoints** (blocks Phase 3).

Once these are ready, the frontend can be switched from mock data to real data with minimal changes to the UI components.
