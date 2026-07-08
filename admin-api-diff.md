比较后端接口清单与前端 adminService.ts 的实际映射，差异如下。问题最多的是 **Bulk Import 和 SEO 路径不匹配**，以及前端请求字段与后端 schema 字段不一致。

# 前后端 admin 接口差异清单

## 1. Dashboard ✅ 一致
- 后端：`GET /api/admin/dashboard`
- 前端：`request("/dashboard")` ✅

## 2. Patterns 部分一致

| 后端接口 | 前端方法 | 状态 |
|---|---|---|
| `GET /api/admin/patterns` | `listPatterns()` ✅ 一致 | 一致 |
| `PUT /api/admin/patterns/:id/status` | `updatePattern()` 用 `PUT /patterns/:id` | ❌ 不匹配，但后端也没有 `/patterns/:id` 这个路由 |
| `POST /api/admin/patterns/:id/publish` | 缺少 | ❌ |
| `POST /api/admin/patterns/:id/archive` | 缺少 | ❌ |
| `POST /api/admin/patterns/bulk-publish` | `bulkPublish()` ✅ 一致 | 一致 |
| `POST /api/admin/patterns/bulk-archive` | `bulkArchive()` ✅ 一致 | 一致 |
| `DELETE /api/admin/patterns/bulk-delete` | `bulkDelete()` 用 `POST /patterns/bulk-delete` | ❌ 方法不一致，后端是 DELETE |
| `GET /api/admin/patterns/:id/health` | `getPattern()` 调用的是 `/patterns/:id`（不存在） | ❌ |

**Schema 字段差异**：
- 后端请求字段用 `slug`、`title`、`description`、`status` 等；前端 `AdminPattern` 接口定义里 camelCase 字段 (`coverImage`, `finishedImage`, `seoTitle` 等)，但后端 `/patterns` 只返回 `Pattern` 的 snake_case 字段。没有统一 mapper。

## 3. Collections ✅ 基本一致
- 后端：`GET /api/admin/collections`, `POST /api/admin/collections`, `GET /api/admin/collections/:id`, `PUT /api/admin/collections/:id`, `DELETE /api/admin/collections/:id`, `POST /api/admin/collections/:id/patterns`, `GET /api/admin/collections/:id/patterns`
- 前端全部对应 ✅
- 但前端 `AdminCollection` 字段与后端 `Collection` 可能有字段差异（如 `displayOrder` vs `display_order`），目前没有 mapper。

## 4. Categories ✅ 基本一致
- 后端：`GET /api/admin/categories`, `POST /api/admin/categories`, `GET /api/admin/categories/:id`, `PUT /api/admin/categories/:id`, `DELETE /api/admin/categories/:id`, `POST /api/admin/categories/:id/patterns`, `GET /api/admin/categories/:id/patterns`
- 前端缺少 `getCategory(id)` 和 `addPatternsToCategory` / `removePatternsFromCategory` 操作，但现有方法路径一致。
- 字段：`AdminCategory` 有 `icon`/`count`，后端 `categories` 表没有 `icon` 字段，需要确认。

## 5. Tags 部分不一致

| 后端 | 前端 | 状态 |
|---|---|---|
| `GET /api/admin/tags` | `listTags()` ✅ | 一致 |
| `POST /api/admin/tags` | `createTag()` ✅ | 一致 |
| `PUT /api/admin/tags/:id` | `updateTag()` ✅ | 一致 |
| `POST /api/admin/tags/:id/merge` | `mergeTags(sourceId, targetId)` 请求到 `/tags/merge` | ❌ 路径不一致，前端应改为 `/tags/:id/merge` |
| `DELETE /api/admin/tags/:id` | `deleteTag()` ✅ | 一致 |

**Schema 差异**：后端 `Tag` 有 `type` / `display_order`，前端 `AdminTag` 没有对应字段，需要扩展。

## 6. Media 部分不一致

| 后端 | 前端 | 状态 |
|---|---|---|
| `GET /api/admin/media` | `listMedia()` ✅ | 一致 |
| `POST /api/admin/media` | 缺少 `createMedia` | ❌ 前端无创建方法 |
| `GET /api/admin/media/:id` | 缺少 | ❌ |
| `PUT /api/admin/media/:id` | 缺少 | ❌ |
| `DELETE /api/admin/media/:id` | `deleteMedia()` ✅ | 一致 |
| `GET /api/admin/media/folders` | 缺少 | ❌ 前端没有获取文件夹列表的方法 |

**字段差异**：前端 `AdminMedia` 有 `thumbnail`/`name`/`folder`/`width`/`height`/`usedBy`，后端 `Media` 字段是 `r2_key` / `url` / `type` / `folder` / `size` / `width` / `height` / `used_by`。`thumbnail` 字段不存在，需要 mapper 转换或新增。

## 7. Bulk Import ❌ 大量不一致

后端统一挂在 `/api/admin/bulk/*`：
- `GET /api/admin/bulk/jobs`
- `GET /api/admin/bulk/jobs/:id`
- `POST /api/admin/bulk/import/preview`
- `POST /api/admin/bulk/import/create`
- `POST /api/admin/bulk/import/publish`

前端：
- `listBulkJobs()` → `/bulk-jobs` ❌
- `uploadBulkCSV(file)` → `/bulk-jobs` ❌
- `runBulkJob(id, publishNow)` → `/bulk-jobs/:id/run` ❌

需要完全重写前端 Bulk Import 路径与 payload。

## 8. SEO ❌ 大量不一致

后端：
- `GET /api/admin/seo/sitemap`
- `POST /api/admin/seo/sitemap/regenerate`
- `GET /api/admin/seo/metadata`
- `PUT /api/admin/seo/metadata`
- `GET /api/admin/seo/redirects`
- `POST /api/admin/seo/redirects`
- `PUT /api/admin/seo/redirects/:id`
- `DELETE /api/admin/seo/redirects/:id`
- `PUT /api/admin/seo/robots`

前端：
- `listRedirects()` → `/redirects` ❌ 应改为 `/seo/redirects`
- `createRedirect(data)` → `/redirects` ❌
- `deleteRedirect(id)` → `/redirects/:id` ❌
- `listMetadata()` → `/metadata` ❌ 应改为 `/seo/metadata`
- `updateMetadata(data)` → `/metadata` ❌ 应改为 `/seo/metadata`
- `regenerateSitemap()` → `/sitemap/regenerate` ❌ 应改为 `/seo/sitemap/regenerate`
- 缺少 `getSitemap()` 调用 `/seo/sitemap`
- 缺少 `updateRedirect(id, data)`
- 缺少 `updateRobots()`

**字段差异**：前端 `AdminRedirect` 用 `oldUrl` / `newUrl` / `type`，后端 `redirects` 表用 `old_path` / `new_path` / `code`。需要统一字段名。

## 9. Analytics 部分不一致

后端：
- `GET /api/admin/analytics/patterns`
- `GET /api/admin/analytics/patterns/:id`
- `GET /api/admin/analytics/search-keywords`

前端：
- `getPatternStats(id, days)` → `/analytics/patterns/:id?days=...` ✅ 路径一致
- 但后端 `/analytics/patterns/:id` 实际返回的是 `{ pattern, totals, last_7_days, last_30_days }`，前端 `views/downloads/likes/labels` 数组结构与返回不一致。
- 缺少 `listAnalyticsPatterns()` 和 `getSearchKeywords()` 方法。

## 10. Newsletter ❌ 路径不一致

后端：`/api/admin/newsletter/subscribers`、`/api/admin/newsletter/subscribers/export`、`/api/admin/newsletter/subscribers/:id`

前端：
- `listSubscribers()` → `/subscribers` ❌ 应改为 `/newsletter/subscribers`
- `exportSubscribers()` → `/subscribers/export` ❌ 应改为 `/newsletter/subscribers/export`，且后端返回 `{ csv: string }` 而不是 Blob
- `deleteSubscriber(id)` → `/subscribers/:id` ❌ 应改为 `/newsletter/subscribers/:id`

**字段差异**：后端字段是 `subscribed_at`，前端 `createdAt`。需要 mapper。

## 11. Settings ✅ 基本一致
- 后端：`GET /api/admin/settings`，`PUT /api/admin/settings`（body: `{ values: Record<string, string> }`）
- 前端：`listSettings()` → `/settings` ✅，但返回类型 `AdminSetting[]` 是数组，后端实际返回的是 `{ key: value }` 对象。`updateSettings()` 直接传对象，但后端需要 `{ values: ... }`。需要修正。

# 影响面
- 当前前端 adminService 一旦 `isMock = false`（或者 `NEXT_PUBLIC_ADMIN_MOCK` 未设置时默认 false），很多接口会 404 / 405 / 500。
- 后端 Dashboard 是已修复过的主要入口，其余模块尚未联调。

# 下一步建议
1. 统一前端接口路径，使其与后端 `/api/admin/*` 路由完全一致。
2. 为 `collections/categories/tags/media/newsletter/settings` 等模块增加 snake_case ↔ camelCase 的 mapper，确保后端返回字段能正确映射到前端 TypeScript 类型。
3. 删除或修正前端不存在后端路由的方法（如 `updatePattern`、`getPattern`、`runBulkJob`）。
4. 添加缺失的 `getPattern`、`getMedia`、`updateRedirect`、`getSitemap`、`getSearchKeywords` 等方法。
5. 重新测试 `NEXT_PUBLIC_ADMIN_MOCK=false` 模式下的关键接口。
