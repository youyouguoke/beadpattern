# BeadPatternAI CMS Import Specification v1.0

This document defines the backend schema and import contract for the **BeadPatternAI Content Seed Pack v2.0**.
It is the authoritative reference for Phase 1–3 data production and for the Next.js CMS front-end (admin UI).

---

## 1. Overview

The backend exposes a single admin import endpoint:

```
POST /api/admin/seed-import
Authorization: Bearer <ADMIN_API_KEY>
Content-Type: application/json
```

Payload shape:

```json
{
  "dry_run": false,
  "patterns": [ /* ... 1..500 patterns ... */ ]
}
```

- `dry_run: true` validates the payload and returns the list of slugs that would be created/updated without writing to D1.
- Patterns are imported as `status = 'draft'` by default. Publishing is a separate step via `/api/admin/patterns/:id/publish` or `/api/admin/patterns/bulk-publish`.

---

## 2. Pattern Import JSON Schema

### 2.1 Required fields

| Field | Type | Notes |
|---|---|---|
| `title` | string | Max 200 chars. Used to derive `slug` if not provided. |

### 2.2 Identity fields

| Field | Type | Notes |
|---|---|---|
| `id` | UUID string | Optional. Stable UUID across re-imports. |
| `slug` | string | Optional. Auto-derived from `title` if missing. Must be unique. |
| `subject` | string | Main subject, e.g. `Panda`, `Flower`, `Mario`. |
| `description` | string | Max 5000 chars. |

### 2.3 Categorization fields

| Field | Type | Notes |
|---|---|---|
| `category_slugs` | string[] | Must match existing `categories.slug`. |
| `collection_slugs` | string[] | Must match existing `collections.slug`. One pattern can belong to many collections. |
| `tag_slugs` | string[] | Must match existing `tags.slug`. |
| `style` | string | e.g. `cute`, `kawaii`, `pixel-art`. |
| `season` | string | e.g. `halloween`, `christmas`, `summer`. |
| `difficulty` | enum | `easy`, `medium`, `hard`. Default `easy`. |

### 2.4 Grid / beads fields

| Field | Type | Notes |
|---|---|---|
| `grid_size` | string | e.g. `29x29`. |
| `grid_data` | array of array of (string | number) | 2D grid. Color values can be hex strings or palette indices. |
| `estimated_beads` | integer | Optional. Auto-computed from `grid_data` if provided. |
| `color_count` | integer | Optional. Auto-computed from `grid_data` if provided. |
| `color_palette` | array of hex string or color object | See section 2.6. |
| `estimated_time` | string | e.g. `15 min`. |

### 2.5 Production metadata fields

| Field | Type | Notes |
|---|---|---|
| `seo_priority` | integer 1–100 | Default `50`. Higher = more important. |
| `publish_order` | integer ≥ 0 | Default `0`. Order within editorial calendar. |
| `grid_status` | enum | `missing`, `designing`, `review`, `ready`. Default `missing`. |
| `grid_designer` | string | Designer / AI tool name. |
| `grid_version` | integer ≥ 1 | Default `1`. |
| `grid_review_required` | boolean | Default `false`. |

### 2.6 Color palette format

Two forms accepted:

```json
"color_palette": ["#000000", "#ffffff", "#12ab56"]
```

or with metadata:

```json
"color_palette": [
  { "name": "Black", "hex": "#000000", "count": 42 },
  { "name": "White", "hex": "#ffffff", "count": 120 }
]
```

- 3-digit hex (`#fff`) is expanded to 6-digit (`#ffffff`).
- If `grid_data` is provided, bead counts are recomputed from the grid and override `count`.

### 2.7 SEO fields

| Field | Type | Notes |
|---|---|---|
| `seo_title` | string | Max 200. Auto-generated from title if empty. |
| `seo_description` | string | Max 1000. Auto-generated if empty. |
| `seo_keywords` | string | Comma-separated. Auto-generated if empty. |
| `canonical` | string | Optional canonical URL. |

### 2.8 Related content fields

#### FAQs

```json
"faqs": [
  {
    "question": "How many beads are required?",
    "answer": "About 420 beads for this 21x21 design.",
    "display_order": 0
  }
]
```

#### Related patterns

```json
"related_slugs": ["koala-pattern", "sloth-pattern", "bear-pattern"]
```

- Each slug must exist in the same import batch **or** already exist in the database.
- If a related slug is not found, the import succeeds but records a warning in the per-row `errors` array.

#### Programmatic SEO variants

```json
"seo_variants": [
  {
    "variant": "Panda Perler Bead Pattern",
    "landing_slug": "panda-perler-bead-pattern",
    "search_intent": "informational",
    "display_order": 0
  }
]
```

Valid `search_intent` values: `informational`, `commercial`, `transactional`, `navigational`.

### 2.9 Image references

Images are not uploaded through this endpoint. Instead, provide public URLs that will be stored as `cover_image` / `finished_image`:

| Field | Type | Notes |
|---|---|---|
| `cover_image_url` | URL string | Stored as `patterns.cover_image`. |
| `finished_image_url` | URL string | Stored as `patterns.finished_image`. |

To upload real files to R2, use `POST /api/admin/media/upload-image` and then reference the returned `media.id` in the pattern update.

---

## 3. Slug rules

- Lowercase.
- Alphanumeric and hyphens only.
- Accents and special characters are stripped.
- Multiple spaces / special chars collapse to a single hyphen.
- Leading/trailing hyphens are trimmed.
- Max 200 characters.
- Must be unique across all patterns.

Example:

```
"Cute Panda! 🐼" -> "cute-panda"
```

---

## 4. Tag / Category / Collection rules

### Tags
- `tag_slugs` are looked up by `tags.slug`.
- Unknown slugs produce a warning but do not fail the import.
- A pattern can have any number of tags.

### Categories
- A pattern can belong to zero or more categories.
- `category_slugs` are looked up by `categories.slug`.
- Existing category assignments are replaced on re-import.

### Collections
- A pattern can belong to zero or more collections.
- `collection_slugs` are looked up by `collections.slug`.
- Existing collection assignments are replaced on re-import.

---

## 5. Import response

```json
{
  "success": true,
  "data": {
    "dry_run": false,
    "total": 2,
    "results": [
      {
        "index": 0,
        "id": "uuid",
        "slug": "cute-panda",
        "title": "Cute Panda",
        "status": "created",
        "errors": []
      }
    ]
  }
}
```

---

## 6. Audit / readiness

Every imported pattern gets a `pattern_audit` row. The CMS can display:

| Field | Meaning |
|---|---|
| `missing_cover` | No `cover_image_url` provided. |
| `missing_faq` | No `faqs` provided. |
| `missing_collection` | No `collection_slugs` provided. |
| `missing_related` | No `related_slugs` provided. |
| `missing_internal_links` | Same as `missing_related` until link graph is built. |
| `ready` | Score ≥ 80 (cover + FAQ + collection + related + grid all present). |
| `published` | Whether the pattern has been published. |
| `score` | 0–100 readiness score. |

---

## 7. Excel → JSON mapping

| Excel file | JSON field(s) | Notes |
|---|---|---|
| `01_Master_Patterns.xlsx` | All pattern-level fields | One row per pattern. |
| `02_Category_Dictionary.xlsx` | `category_slugs` | Pre-created via CMS or import seed. |
| `03_Collections.xlsx` | `collection_slugs` | Pre-created via CMS or import seed. |
| `04_Tag_Dictionary.xlsx` | `tag_slugs` | Pre-created via CMS or import seed. |
| `05_Pattern_Tag_Map.xlsx` | `tag_slugs` | Joined by pattern slug. |
| `06_Pattern_Collection_Map.xlsx` | `collection_slugs` | Joined by pattern slug. |
| `07_SEO_Metadata.xlsx` | `seo_title`, `seo_description`, `seo_keywords`, `canonical` | Joined by pattern slug. |
| `08_FAQ_Library.xlsx` | `faqs` | Grouped by pattern slug. |
| `09_Related_Patterns.xlsx` | `related_slugs` | Grouped by pattern slug. |
| `10_Internal_Link_Graph.xlsx` | `related_slugs` | Same as related. |
| `11_Image_Production_Plan.xlsx` | `cover_image_url`, `finished_image_url` | URLs only. |
| `12_Grid_Production_Plan.xlsx` | `grid_status`, `grid_designer`, `grid_version`, `grid_review_required` | Joined by pattern slug. |

---

## 8. Workflow recommendation

1. **Prepare dictionaries first**: categories, collections, tags. Ensure slugs exist in the database.
2. **Generate 20 sample patterns** and import with `dry_run: true` to validate slugs and relations.
3. **Import sample patterns** (`dry_run: false`), review audit scores.
4. **Scale to 300 patterns** in batches of 50–100.
5. **Publish in batches** via `/api/admin/patterns/bulk-publish` when content is ready.

---

## 9. File locations

| Artifact | Path |
|---|---|
| Migration SQL | `src/migrations/0012_seed_schema.sql` |
| Test schema | `test/migrations.ts` |
| TypeScript types | `src/types.ts` |
| Import route | `src/routes/admin/seed-import.ts` |
| This spec | `docs/CMS_Import_Specification_v1.0.md` |

---

## 10. Authentication

This endpoint is protected by the same admin auth middleware as all `/api/admin/*` routes:

```
Authorization: Bearer <ADMIN_API_KEY>
```

The `ADMIN_API_KEY` is set via `wrangler secret put ADMIN_API_KEY` in production.

---

Last updated: 2025-07-08
