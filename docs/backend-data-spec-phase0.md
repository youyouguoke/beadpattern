# BeadPatternAI Backend Data Specification (Frontend Phase 0)

> 整理来源：迁移文件 `src/migrations/*.sql` + 路由代码 `src/index.ts` + `src/routes/**/*.ts` + `src/lib/schemas.ts` + `src/lib/health.ts`。

---

## 1. 数据库 Schema 汇总

所有表默认使用 SQLite。时间戳字段使用 `TEXT` ISO-8601 格式，`id` 等主键一般为 `TEXT` UUID 或预生成 slug。布尔字段使用 `BOOLEAN` 实际存储 `0/1`。

### 1.1 patterns

| 字段 | 类型 | 约束/默认值 | 说明 |
|------|------|------------|------|
| `id` | TEXT | PRIMARY KEY | UUID 主键 |
| `slug` | TEXT | NOT NULL UNIQUE | URL 路径段 |
| `title` | TEXT | NOT NULL | 标题 |
| `description` | TEXT | | 描述 |
| `difficulty` | TEXT | NOT NULL | 枚举 `easy/medium/hard`（保留字段） |
| `difficulty_id` | INTEGER | DEFAULT 1 | 外键 → difficulties(id) |
| `status` | TEXT | NOT NULL DEFAULT 'draft' | 枚举 `draft/published/archived` |
| `cover_image` | TEXT | | 封面图 URL |
| `finished_image` | TEXT | | 成品图 URL |
| `cover_image_r2_key` | TEXT | | R2 对象键 |
| `cover_media_id` | TEXT | | 封面 media.id |
| `finished_media_id` | TEXT | | 成品 media.id |
| `gallery_media_ids` | TEXT | JSON 数组 | 图库 media ids |
| `step_media_ids` | TEXT | JSON 数组 | 步骤图 media ids |
| `image_updated_at` | TEXT | | 图片更新时间 ISO |
| `grid_size` | TEXT | | 如 `24x24` |
| `grid_data` | TEXT | JSON 二维数组 | 格子颜色/编号 |
| `estimated_beads` | INTEGER | | 预估珠子数 |
| `color_count` | INTEGER | | 颜色数 |
| `color_palette` | TEXT | JSON 数组 | 调色板（支持 `PatternColor` 对象） |
| `version` | INTEGER | NOT NULL DEFAULT 1 | 发布版本号 |
| `published_at` | TEXT | | 首次发布时间 ISO |
| `seo_title` | TEXT | | 页面标题 |
| `seo_description` | TEXT | | 页面描述 |
| `seo_keywords` | TEXT | | 关键词逗号分隔 |
| `subject` | TEXT | | 题材（seed 字段） |
| `style` | TEXT | | 风格 |
| `season` | TEXT | | 季节/节日 |
| `estimated_time` | TEXT | | 预估制作时间 |
| `seo_priority` | INTEGER | NOT NULL DEFAULT 50 | SEO 优先级 1-100 |
| `publish_order` | INTEGER | NOT NULL DEFAULT 0 | 发布排序 |
| `grid_status` | TEXT | NOT NULL DEFAULT 'missing' | 枚举 `missing/designing/review/ready` |
| `grid_designer` | TEXT | | 格子设计者 |
| `grid_version` | INTEGER | NOT NULL DEFAULT 1 | 格子版本 |
| `grid_review_required` | BOOLEAN | NOT NULL DEFAULT 0 | 是否需要审核 |
| `grid_reviewed_at` | TEXT | | 审核时间 ISO |
| `created_at` | TEXT | NOT NULL DEFAULT datetime('now') | 创建时间 |
| `updated_at` | TEXT | NOT NULL DEFAULT datetime('now') | 更新时间 |

**索引**

- `idx_patterns_status` (status)
- `idx_patterns_difficulty` (difficulty)
- `idx_patterns_created_at` (created_at DESC)
- `idx_patterns_status_created_at` (status, created_at DESC)
- `idx_patterns_difficulty_created_at` (difficulty, created_at DESC)
- `idx_patterns_status_published_at` (status, published_at DESC)
- `idx_patterns_slug` (slug)
- `idx_patterns_difficulty_id` (difficulty_id)
- `idx_patterns_difficulty_id_published_at` (difficulty_id, published_at DESC)
- `idx_patterns_seo_priority` (seo_priority DESC)
- `idx_patterns_publish_order` (publish_order ASC)
- `idx_patterns_subject` (subject)
- `idx_patterns_style` (style)
- `idx_patterns_season` (season)
- `idx_patterns_grid_status` (grid_status)

### 1.2 pattern_steps

| 字段 | 类型 | 约束/默认值 | 说明 |
|------|------|------------|------|
| `id` | TEXT | PRIMARY KEY | |
| `pattern_id` | TEXT | NOT NULL FK patterns(id) ON DELETE CASCADE | |
| `step_number` | INTEGER | NOT NULL | 步骤序号 |
| `description` | TEXT | | 步骤描述 |
| `image` | TEXT | | 图片 URL |
| `grid_data` | TEXT | JSON | 步骤格子数据 |
| UNIQUE | (pattern_id, step_number) | |

索引：`idx_pattern_steps_pattern_id` (pattern_id)

### 1.3 tags

| 字段 | 类型 | 约束/默认值 | 说明 |
|------|------|------------|------|
| `id` | TEXT | PRIMARY KEY | 如 `tag_animals` |
| `name` | TEXT | NOT NULL UNIQUE | 显示名 |
| `slug` | TEXT | NOT NULL UNIQUE | URL slug |
| `type` | TEXT | NOT NULL | 枚举见下 `TagType` |
| `display_order` | INTEGER | NOT NULL DEFAULT 0 | 显示顺序 |
| `created_at` | TEXT | NOT NULL DEFAULT datetime('now') | |

索引：`idx_tags_display_order` (display_order ASC, name ASC)

**TagType 枚举**：`style`, `theme`, `difficulty`, `animal`, `object`, `color`, `season`, `character`

### 1.4 pattern_tags

| 字段 | 类型 | 约束/默认值 | 说明 |
|------|------|------------|------|
| `pattern_id` | TEXT | NOT NULL FK patterns(id) ON DELETE CASCADE | |
| `tag_id` | TEXT | NOT NULL FK tags(id) ON DELETE CASCADE | |
| PRIMARY KEY | (pattern_id, tag_id) | |

索引：`idx_pattern_tags_tag_id` (tag_id), `idx_pattern_tags_tag_pattern` (tag_id, pattern_id)

### 1.5 categories

| 字段 | 类型 | 约束/默认值 | 说明 |
|------|------|------------|------|
| `id` | TEXT | PRIMARY KEY | 如 `cat_animals` |
| `name` | TEXT | NOT NULL UNIQUE | 分类名 |
| `slug` | TEXT | NOT NULL UNIQUE | |
| `description` | TEXT | | |
| `display_order` | INTEGER | NOT NULL DEFAULT 0 | |
| `created_at` | TEXT | NOT NULL DEFAULT datetime('now') | |
| `updated_at` | TEXT | NOT NULL DEFAULT datetime('now') | |

索引：`idx_categories_slug` (slug)

### 1.6 pattern_categories

| 字段 | 类型 | 约束/默认值 | 说明 |
|------|------|------------|------|
| `pattern_id` | TEXT | NOT NULL FK patterns(id) ON DELETE CASCADE | |
| `category_id` | TEXT | NOT NULL FK categories(id) ON DELETE CASCADE | |
| PRIMARY KEY | (pattern_id, category_id) | |

索引：`idx_pattern_categories_category_id` (category_id)

### 1.7 collections

| 字段 | 类型 | 约束/默认值 | 说明 |
|------|------|------------|------|
| `id` | TEXT | PRIMARY KEY | 如 `col_cute_animals` |
| `title` | TEXT | NOT NULL | 合集名 |
| `slug` | TEXT | NOT NULL UNIQUE | |
| `description` | TEXT | | |
| `banner` | TEXT | | 横幅图 URL |
| `display_order` | INTEGER | NOT NULL DEFAULT 0 | |
| `published` | BOOLEAN | NOT NULL DEFAULT 0 | 是否发布 |
| `created_at` | TEXT | NOT NULL DEFAULT datetime('now') | |
| `updated_at` | TEXT | NOT NULL DEFAULT datetime('now') | |

索引：`idx_collections_slug` (slug), `idx_collections_published` (published)

### 1.8 pattern_collections

| 字段 | 类型 | 约束/默认值 | 说明 |
|------|------|------------|------|
| `pattern_id` | TEXT | NOT NULL FK patterns(id) ON DELETE CASCADE | |
| `collection_id` | TEXT | NOT NULL FK collections(id) ON DELETE CASCADE | |
| `display_order` | INTEGER | NOT NULL DEFAULT 0 | 在合集中的显示顺序 |
| PRIMARY KEY | (pattern_id, collection_id) | |

索引：`idx_pattern_collections_collection_id` (collection_id)

### 1.9 difficulties

| 字段 | 类型 | 约束/默认值 | 说明 |
|------|------|------------|------|
| `id` | INTEGER | PRIMARY KEY | 1=easy, 2=medium, 3=hard |
| `name` | TEXT | NOT NULL | 显示名 |
| `slug` | TEXT | NOT NULL UNIQUE | |
| `level` | INTEGER | NOT NULL | 难度等级 |
| `display_order` | INTEGER | NOT NULL | 显示顺序 |

种子数据：`(1,'Easy','easy',1,1)`, `(2,'Medium','medium',2,2)`, `(3,'Hard','hard',3,3)`

### 1.10 pattern_seo

| 字段 | 类型 | 约束/默认值 | 说明 |
|------|------|------------|------|
| `id` | TEXT | PRIMARY KEY | |
| `pattern_id` | TEXT | NOT NULL UNIQUE FK patterns(id) ON DELETE CASCADE | |
| `title` | TEXT | | SEO 标题 |
| `description` | TEXT | | SEO 描述 |
| `keywords` | TEXT | | 关键词 |
| `canonical` | TEXT | | 规范 URL |
| `robots` | TEXT | | robots 指令 |
| `og_image` | TEXT | | Open Graph 图片 |
| `twitter_title` | TEXT | | Twitter 标题 |
| `twitter_description` | TEXT | | Twitter 描述 |
| `twitter_image` | TEXT | | Twitter 图片 |
| `structured_data` | TEXT | 通常为 JSON | 结构化数据 |
| `created_at` | TEXT | NOT NULL DEFAULT datetime('now') | |
| `updated_at` | TEXT | NOT NULL DEFAULT datetime('now') | |

### 1.11 pattern_seo_variants

| 字段 | 类型 | 约束/默认值 | 说明 |
|------|------|------------|------|
| `id` | TEXT | PRIMARY KEY | |
| `pattern_id` | TEXT | NOT NULL FK patterns(id) ON DELETE CASCADE | |
| `variant` | TEXT | NOT NULL | 关键词变体 |
| `landing_slug` | TEXT | NOT NULL | 落地页 slug |
| `search_intent` | TEXT | NOT NULL DEFAULT 'informational' | 枚举 `informational/commercial/transactional/navigational` |
| `display_order` | INTEGER | NOT NULL DEFAULT 0 | |
| `created_at` | TEXT | NOT NULL DEFAULT datetime('now') | |
| UNIQUE | (pattern_id, landing_slug) | |

索引：`idx_pattern_seo_variants_pattern_id` (pattern_id)

### 1.12 pattern_faqs

| 字段 | 类型 | 约束/默认值 | 说明 |
|------|------|------------|------|
| `id` | TEXT | PRIMARY KEY | |
| `pattern_id` | TEXT | NOT NULL FK patterns(id) ON DELETE CASCADE | |
| `question` | TEXT | NOT NULL | 问题 |
| `answer` | TEXT | NOT NULL | 答案 |
| `display_order` | INTEGER | NOT NULL DEFAULT 0 | |
| `created_at` | TEXT | NOT NULL DEFAULT datetime('now') | |
| `updated_at` | TEXT | NOT NULL DEFAULT datetime('now') | |
| UNIQUE | (pattern_id, question) | |

索引：`idx_pattern_faqs_pattern_id` (pattern_id)

### 1.13 pattern_related

| 字段 | 类型 | 约束/默认值 | 说明 |
|------|------|------------|------|
| `id` | TEXT | PRIMARY KEY | |
| `pattern_id` | TEXT | NOT NULL FK patterns(id) ON DELETE CASCADE | |
| `related_pattern_id` | TEXT | NOT NULL FK patterns(id) ON DELETE CASCADE | |
| `related_type` | TEXT | NOT NULL DEFAULT 'similar' | 枚举 `similar/same_collection/same_tag/same_category/manual` |
| `score` | REAL | NOT NULL DEFAULT 0 | 相关度分数 |
| `display_order` | INTEGER | NOT NULL DEFAULT 0 | |
| `created_at` | TEXT | NOT NULL DEFAULT datetime('now') | |
| UNIQUE | (pattern_id, related_pattern_id) | |

索引：`idx_pattern_related_pattern_id` (pattern_id), `idx_pattern_related_related_pattern_id` (related_pattern_id)

### 1.14 pattern_audit

| 字段 | 类型 | 约束/默认值 | 说明 |
|------|------|------------|------|
| `id` | TEXT | PRIMARY KEY | |
| `pattern_id` | TEXT | NOT NULL UNIQUE FK patterns(id) ON DELETE CASCADE | |
| `missing_cover` | BOOLEAN | NOT NULL DEFAULT 1 | 缺少封面 |
| `missing_faq` | BOOLEAN | NOT NULL DEFAULT 1 | 缺少 FAQ |
| `missing_collection` | BOOLEAN | NOT NULL DEFAULT 1 | 缺少合集 |
| `missing_related` | BOOLEAN | NOT NULL DEFAULT 1 | 缺少相关图案 |
| `missing_internal_links` | BOOLEAN | NOT NULL DEFAULT 1 | 缺少内部链接 |
| `ready` | BOOLEAN | NOT NULL DEFAULT 0 | 是否可发布 |
| `published` | BOOLEAN | NOT NULL DEFAULT 0 | 是否已发布 |
| `score` | INTEGER | NOT NULL DEFAULT 0 | 内容完整度分数 0-100 |
| `checked_at` | TEXT | NOT NULL DEFAULT datetime('now') | 检查时间 |
| `created_at` | TEXT | NOT NULL DEFAULT datetime('now') | |
| `updated_at` | TEXT | NOT NULL DEFAULT datetime('now') | |

### 1.15 analytics

| 字段 | 类型 | 约束/默认值 | 说明 |
|------|------|------------|------|
| `pattern_id` | TEXT | PRIMARY KEY FK patterns(id) ON DELETE CASCADE | |
| `views` | INTEGER | NOT NULL DEFAULT 0 | 浏览 |
| `likes` | INTEGER | NOT NULL DEFAULT 0 | 喜欢 |
| `shares` | INTEGER | NOT NULL DEFAULT 0 | 分享 |
| `downloads` | INTEGER | NOT NULL DEFAULT 0 | 下载 |
| `updated_at` | TEXT | NOT NULL DEFAULT datetime('now') | |

### 1.16 analytics_daily / analytics_summary

用于高并发场景分片统计，Phase 0 一般直接读取 `analytics` 汇总。

- `analytics_daily(pattern_id, date, views, likes, shares, downloads, PRIMARY KEY(pattern_id, date))`
- `analytics_summary(pattern_id, views_total, likes_total, shares_total, downloads_total, updated_at)`

### 1.17 media

| 字段 | 类型 | 约束/默认值 | 说明 |
|------|------|------------|------|
| `id` | TEXT | PRIMARY KEY | UUID |
| `r2_key` | TEXT | UNIQUE | R2 对象键 |
| `url` | TEXT | NOT NULL | 可访问 URL |
| `type` | TEXT | CHECK `cover/finished/step/gallery/banner` | 媒体类型 |
| `size` | INTEGER | | 字节数 |
| `width` | INTEGER | | 宽度 |
| `height` | INTEGER | | 高度 |
| `used_by` | TEXT | JSON | 各资源类型引用计数 |
| `folder` | TEXT | | 文件夹分类 |
| `alt_text` | TEXT | | 替代文本 |
| `created_at` | TEXT | NOT NULL DEFAULT datetime('now') | |

索引：`idx_media_folder` (folder), `idx_media_type` (type)

### 1.18 colors / pattern_colors

**colors**

| 字段 | 类型 | 约束/默认值 | 说明 |
|------|------|------------|------|
| `id` | TEXT | PRIMARY KEY | 通常为 hex 小写 |
| `hex` | TEXT | NOT NULL UNIQUE | 六位十六进制，如 `#ffcc00` |
| `name` | TEXT | | 颜色名 |
| `family` | TEXT | | 色系 |

**pattern_colors**

| 字段 | 类型 | 约束/默认值 | 说明 |
|------|------|------------|------|
| `id` | TEXT | PRIMARY KEY | |
| `pattern_id` | TEXT | NOT NULL FK patterns(id) ON DELETE CASCADE | |
| `color_id` | TEXT | NOT NULL FK colors(id) ON DELETE CASCADE | |
| `count` | INTEGER | NOT NULL DEFAULT 0 | 使用该颜色珠子数 |
| UNIQUE | (pattern_id, color_id) | |

索引：`idx_pattern_colors_color_id` (color_id)

### 1.19 bulk_jobs

| 字段 | 类型 | 约束/默认值 | 说明 |
|------|------|------------|------|
| `id` | TEXT | PRIMARY KEY | |
| `status` | TEXT | NOT NULL DEFAULT 'pending' | 枚举 `pending/processing/done/failed` |
| `source_type` | TEXT | NOT NULL | `json` 或 `csv` |
| `total_rows` | INTEGER | NOT NULL DEFAULT 0 | 总行数 |
| `processed_rows` | INTEGER | NOT NULL DEFAULT 0 | 成功数 |
| `failed_rows` | INTEGER | NOT NULL DEFAULT 0 | 失败数 |
| `errors` | TEXT | JSON 数组 | 错误信息 |
| `source_data` | TEXT | | 原始数据（通常 JSON 字符串） |
| `created_at` | TEXT | NOT NULL DEFAULT datetime('now') | |
| `updated_at` | TEXT | NOT NULL DEFAULT datetime('now') | |

### 1.20 action_logs

| 字段 | 类型 | 约束/默认值 | 说明 |
|------|------|------------|------|
| `id` | TEXT | PRIMARY KEY | |
| `pattern_id` | TEXT | NOT NULL FK patterns(id) ON DELETE CASCADE | |
| `action_type` | TEXT | NOT NULL | 如 `view/like/download/share` |
| `fingerprint` | TEXT | NOT NULL | 用户指纹 |
| `created_at` | TEXT | NOT NULL DEFAULT datetime('now') | |

索引：`idx_action_logs_lookup`, `idx_action_logs_created_at`

### 1.21 newsletter_subscribers

| 字段 | 类型 | 约束/默认值 | 说明 |
|------|------|------------|------|
| `email` | TEXT | PRIMARY KEY | |
| `status` | TEXT | NOT NULL DEFAULT 'subscribed' | 枚举 `subscribed/unsubscribed` |
| `source` | TEXT | | 来源 |
| `subscribed_at` | TEXT | | 订阅时间 |
| `created_at` | TEXT | NOT NULL DEFAULT datetime('now') | |

索引：`idx_newsletter_status` (status)

### 1.22 redirects / settings

- **redirects**: `id, old_path UNIQUE, new_path, code CHECK(301/302), created_at, updated_at`, 索引 `idx_redirects_old_path`
- **settings**: `key PRIMARY KEY, value, updated_at`

### 1.23 FTS5 虚拟表

- `pattern_search(fts5 title, description, content='patterns', content_rowid='rowid')`
- 与 `patterns` 表同步的 INSERT/UPDATE/DELETE 触发器。

---

## 2. API Endpoint 列表

### 2.1 Public 路由（挂载在 `/api/*`）

| 方法 | 路径 | 主要用途 |
|------|------|----------|
| GET | `/health` | 健康检查 |
| GET | `/api/patterns` | 列出图案（默认仅 published） |
| POST | `/api/patterns` | 创建图案（同下 admin 路由） |
| GET | `/api/patterns/:slug` | 获取单个图案详情 |
| PUT | `/api/patterns/:id` | 更新图案 |
| POST | `/api/patterns/:slug/publish` | 发布图案 |
| POST | `/api/patterns/:id/archive` | 归档图案 |
| DELETE | `/api/patterns/:id` | 删除图案 |
| POST | `/api/patterns/:slug/view` | 记录浏览（5 分钟去重） |
| POST | `/api/patterns/:slug/like` | 记录喜欢（同指纹仅一次） |
| POST | `/api/patterns/:slug/download` | 记录下载 |
| POST | `/api/patterns/:slug/share` | 记录分享 |
| GET | `/api/tags` | 列出标签（含计数） |
| GET | `/api/tags/:id` | 获取单个标签 |
| GET | `/api/difficulty` | 列出难度等级 |
| GET | `/api/search` | 搜索图案 |
| GET | `/api/recommend` | 推荐图案 |
| GET | `/api/sitemap` | 站点地图 |
| POST | `/api/newsletter` | 订阅/取消邮件 |
| POST | `/api/bulk/import/create` | 批量导入（创建 job） |
| POST | `/api/bulk/import/preview` | 批量导入预览 |
| POST | `/api/bulk/import/publish` | 批量发布草稿 |
| GET | `/api/bulk/jobs` | 列出批量任务 |
| GET | `/api/bulk/jobs/:id` | 获取批量任务 |
| GET/POST/PUT/DELETE | `/api/media` 及 `/:id` | 媒体 CRUD |

### 2.2 Admin 路由（挂载在 `/api/admin/*`，需 `requireAdminAuth`）

| 方法 | 路径 | 主要用途 |
|------|------|----------|
| GET | `/api/admin/auth` | 验证管理员身份 |
| GET | `/api/admin/dashboard` | 仪表盘数据 |
| GET | `/api/admin/patterns` | 列出所有图案（含搜索、过滤、排序） |
| POST | `/api/admin/patterns` | 创建图案 |
| GET | `/api/admin/patterns/:id` | 获取单个图案（admin 详情） |
| PUT | `/api/admin/patterns/:id` | 更新图案 |
| DELETE | `/api/admin/patterns/:id` | 删除图案 |
| PUT | `/api/admin/patterns/:id/status` | 更新状态 |
| POST | `/api/admin/patterns/:id/publish` | 发布图案 |
| POST | `/api/admin/patterns/:id/archive` | 归档图案 |
| POST | `/api/admin/patterns/bulk-publish` | 批量发布 |
| POST | `/api/admin/patterns/bulk-archive` | 批量归档 |
| DELETE | `/api/admin/patterns/bulk-delete` | 批量删除 |
| GET | `/api/admin/patterns/:id/health` | 健康评分检查 |
| GET | `/api/admin/categories` | 列出分类 |
| POST | `/api/admin/categories` | 创建分类 |
| GET | `/api/admin/categories/:id` | 获取分类 |
| PUT | `/api/admin/categories/:id` | 更新分类 |
| DELETE | `/api/admin/categories/:id` | 删除分类 |
| POST | `/api/admin/categories/:id/patterns` | 添加/移除图案到分类 |
| GET | `/api/admin/categories/:id/patterns` | 获取分类下的图案 |
| GET | `/api/admin/collections` | 列出合集 |
| POST | `/api/admin/collections` | 创建合集 |
| GET | `/api/admin/collections/:id` | 获取合集 |
| PUT | `/api/admin/collections/:id` | 更新合集 |
| DELETE | `/api/admin/collections/:id` | 删除合集 |
| POST | `/api/admin/collections/:id/patterns` | 添加/移除图案到合集 |
| GET | `/api/admin/collections/:id/patterns` | 获取合集下的图案 |
| GET | `/api/admin/tags` | 列出标签 |
| POST | `/api/admin/tags` | 创建标签 |
| GET | `/api/admin/tags/:id` | 获取标签 |
| PUT | `/api/admin/tags/:id` | 更新标签 |
| POST | `/api/admin/tags/:id/merge` | 合并标签 |
| DELETE | `/api/admin/tags/:id` | 删除标签 |
| GET | `/api/admin/media` | 列出媒体 |
| POST | `/api/admin/media` | 创建媒体记录 |
| GET | `/api/admin/media/:id` | 获取媒体 |
| PUT | `/api/admin/media/:id` | 更新媒体 |
| DELETE | `/api/admin/media/:id` | 删除媒体（检查引用） |
| GET | `/api/admin/media/folders` | 列出媒体文件夹 |
| GET | `/api/admin/bulk/jobs` | 列出批量任务 |
| GET | `/api/admin/bulk/jobs/:id` | 获取批量任务 |
| POST | `/api/admin/bulk/import/preview` | 批量导入预览 |
| POST | `/api/admin/bulk/import/create` | 批量导入创建 |
| POST | `/api/admin/bulk/import/publish` | 批量发布草稿 |
| GET/POST/PUT/DELETE | `/api/admin/seo/*` | SEO 设置/模板 |
| GET/POST | `/api/admin/analytics/*` | 统计数据 |
| GET/POST | `/api/admin/newsletter/*` | 订阅者管理 |
| GET/POST/PUT/DELETE | `/api/admin/settings/*` | 系统设置 |
| POST | `/api/admin/seed-import` | 种子包导入（含 FAQ/Related/Variants/Audit） |

---

## 3. 字段命名规则

### 3.1 数据库字段

全部使用 **snake_case**，如 `cover_media_id`, `gallery_media_ids`, `published_at`, `seo_priority`。

### 3.2 API 输入输出

代码中 `zValidator` schema 定义的字段也使用 **snake_case**，例如 `CreatePatternSchema` 中的 `cover_image`, `cover_media_id`, `gallery_media_ids`, `tag_slugs`, `grid_data`, `color_palette` 等。

- 路由接收 JSON 时，字段名与数据库一致为 **snake_case**。
- 返回 JSON 时，同样使用 **snake_case**（如 `pattern_colors`, `cover_media`, `gallery`, `step_media`, `health_score`）。

### 3.3 转换规则

前端如采用 camelCase，需要自行做转换：

```ts
// 示例：snake_case → camelCase
const frontendPattern = {
  id: pattern.id,
  slug: pattern.slug,
  title: pattern.title,
  coverImage: pattern.cover_image,
  coverMediaId: pattern.cover_media_id,
  galleryMediaIds: pattern.gallery_media_ids,
  stepMediaIds: pattern.step_media_ids,
  gridSize: pattern.grid_size,
  gridData: pattern.grid_data,
  colorPalette: pattern.color_palette,
  colorCount: pattern.color_count,
  estimatedBeads: pattern.estimated_beads,
  seoTitle: pattern.seo_title,
  seoDescription: pattern.seo_description,
  seoKeywords: pattern.seo_keywords,
  publishedAt: pattern.published_at,
  updatedAt: pattern.updated_at,
  createdAt: pattern.created_at,
  gridStatus: pattern.grid_status,
  seoPriority: pattern.seo_priority,
  publishOrder: pattern.publish_order,
  healthScore: pattern.health_score,
};
```

所有向 API 提交的数据也建议按 snake_case 发送。若前端框架或拦截器支持自动转换，建议统一在请求层做 `camelCase → snake_case` 映射。

---

## 4. Bulk Import 接口

### 4.1 文件位置

- `src/routes/admin/bulk.ts`（Admin 端）
- `src/routes/bulk.ts`（Public 端）— 与 admin bulk 实现相同，按代码中 `admin.route('/bulk', bulk)` 挂载到 `/api/admin/bulk`。

### 4.2 请求格式

公共请求体结构：

```json
{
  "source_type": "json" | "csv",
  "source_data": "<JSON 字符串或 CSV 字符串>"
}
```

#### 4.2.1 POST /api/admin/bulk/import/preview

- 请求：同上
- 响应：

```json
{
  "success": true,
  "data": {
    "total": 100,
    "rows": [
      {
        "row": 1,
        "data": {
          "title": "Cute Cat",
          "slug": "cute-cat",
          "description": "A cute cat bead pattern",
          "difficulty": "easy",
          "cover_image": "https://...",
          "grid_size": "24x24",
          "estimated_beads": 576,
          "color_count": 8,
          "color_palette": "#ff0000,#00ff00",
          "tags": "animals,cute",
          "status": "draft"
        },
        "errors": ["Pattern slug already exists"]
      }
    ]
  }
}
```

#### 4.2.2 POST /api/admin/bulk/import/create

- 请求：同上
- 响应：

```json
{
  "success": true,
  "data": {
    "jobId": "uuid",
    "total": 100,
    "processed": 95,
    "failed": 5,
    "errors": ["Row 6: duplicate slug cute-cat", ...]
  }
}
```

#### 4.2.3 POST /api/admin/bulk/import/publish

- 请求：

```json
{
  "slugs": ["cute-cat", "happy-dog"],
  "all": false
}
```

- 响应：

```json
{
  "success": true,
  "data": { "published": 2 }
}
```

### 4.3 单条数据字段（BulkImportRowSchema）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `title` | string | 是 | 图案标题 |
| `slug` | string | 否 | 默认由 title 生成 |
| `description` | string | 否 | 描述 |
| `difficulty` | `easy/medium/hard` 或 1/2/3 | 否 | 默认 `easy` |
| `cover_image` | string(url) | 否 | 封面图 URL |
| `grid_size` | string | 否 | 格子尺寸 |
| `estimated_beads` | number | 否 | 预估珠子数 |
| `color_count` | number | 否 | 颜色数 |
| `color_palette` | string | 否 | 逗号分隔的 hex |
| `tags` | string | 否 | 逗号分隔 tag slug |
| `tag_slugs` | string | 否 | 同 tags |

CSV 格式首行标题为以上字段名，逗号分隔。

### 4.4 Seed Import 接口

路径：`POST /api/admin/seed-import`

请求体字段（SeedPatternSchema）：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | uuid | 否 | 指定 UUID，否则自动生成 |
| `slug` | string | 否 | 默认 title 生成 |
| `title` | string | 是 | 标题 |
| `subject` | string | 否 | 题材 |
| `description` | string | 否 | 描述 |
| `category_slugs` | string[] | 否 | 分类 slug 数组 |
| `collection_slugs` | string[] | 否 | 合集 slug 数组 |
| `tag_slugs` | string[] | 否 | 标签 slug 数组 |
| `style` | string | 否 | 风格 |
| `season` | string | 否 | 季节 |
| `difficulty` | `easy/medium/hard` | 否 | 默认 `easy` |
| `grid_size` | string | 否 | 格子尺寸 |
| `grid_data` | 二维数组 | 否 | 每个元素为 string/number |
| `estimated_beads` | number | 否 | 优先由 grid 计算 |
| `color_count` | number | 否 | 优先由 grid 计算 |
| `color_palette` | (hex\|object)[] | 否 | 见下方颜色输入 |
| `estimated_time` | string | 否 | 预估制作时间 |
| `seo_priority` | number(1-100) | 否 | 默认 50 |
| `publish_order` | number | 否 | 默认 0 |
| `grid_status` | `missing/designing/review/ready` | 否 | 默认 `missing` |
| `grid_designer` | string | 否 | |
| `grid_version` | number | 否 | 默认 1 |
| `grid_review_required` | boolean | 否 | 默认 false |
| `seo_title` | string | 否 | |
| `seo_description` | string | 否 | |
| `seo_keywords` | string | 否 | |
| `canonical` | string | 否 | |
| `faqs` | {question,answer,display_order}[] | 否 | FAQ |
| `related_slugs` | string[] | 否 | 相关图案 slug |
| `seo_variants` | {variant,landing_slug,search_intent,display_order}[] | 否 | SEO 变体 |
| `cover_image_url` | string(url) | 否 | 封面图 URL |
| `finished_image_url` | string(url) | 否 | 成品图 URL |

颜色输入支持两种形式：

```json
["#ff0000", {"name": "Red", "hex": "#ff0000", "count": 10}]
```

请求体包装：

```json
{
  "patterns": [ /* SeedPatternSchema 数组 */ ],
  "dry_run": false
}
```

响应体：

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
        "slug": "cute-cat",
        "title": "Cute Cat",
        "status": "created" | "updated",
        "errors": []
      }
    ]
  }
}
```

---

## 5. Pattern Status / Audit / Difficulty 枚举

### 5.1 pattern.status

- `draft`：草稿
- `published`：已发布
- `archived`：已归档

发布操作会自动：
- 设置 `status = 'published'`
- `version = version + 1`
- 若首次发布，`published_at = COALESCE(published_at, now)`

### 5.2 pattern.grid_status

- `missing`：缺少格子图
- `designing`：设计中
- `review`：审核中
- `ready`：已就绪

### 5.3 difficulty

| 字符串 | 难度 ID | 显示名 |
|--------|--------|--------|
| `easy` | 1 | Easy |
| `medium` | 2 | Medium |
| `hard` | 3 | Hard |

API 接收 `difficulty` 字段可以是字符串 `easy/medium/hard` 或数字 `1/2/3`，后端统一转换为 `difficulty_id` 存储。

### 5.4 pattern_audit 布尔含义

| 字段 | 含义 |
|------|------|
| `missing_cover` | 缺少封面图（1=缺失，0=存在） |
| `missing_faq` | 缺少 FAQ（1=缺失，0=存在） |
| `missing_collection` | 缺少所属合集（1=缺失，0=存在） |
| `missing_related` | 缺少相关图案（1=缺失，0=存在） |
| `missing_internal_links` | 缺少内部链接（1=缺失，0=存在） |
| `ready` | 内容已准备好可发布（1=ready） |
| `published` | 图案已发布（1=published） |
| `score` | 完整度分数，0-100 |

### 5.5 score 计算规则

`seed-import.ts` 中 audit score 的临时规则：

```ts
const hasCover = Boolean(item.cover_image_url);
const hasFaq = Boolean(item.faqs && item.faqs.length > 0);
const hasCollection = Boolean(item.collection_slugs && item.collection_slugs.length > 0);
const hasRelated = Boolean(item.related_slugs && item.related_slugs.length > 0);
const score = [hasCover, hasFaq, hasCollection, hasRelated, Boolean(grid)].filter(Boolean).length * 20;
```

即 5 个检查点，每项 20 分，满分 100。`ready = score >= 80 ? 1 : 0`。

### 5.6 Health Score 计算规则

`src/lib/health.ts` 中定义：

| 检查项 | 通过条件 | 权重 |
|--------|----------|------|
| `cover_image` | 有封面图 | 10 |
| `finished_image` | 有成品图 | 10 |
| `steps_4_or_more` | 步骤数 ≥ 4 | 15 |
| `seo_title` | 有 SEO 标题 | 10 |
| `seo_description` | 有 SEO 描述 | 10 |
| `tags_3_or_more` | 标签数 ≥ 3 | 10 |
| `in_collection` | 已加入合集 | 10 |
| `in_category` | 已加入分类（当前占位 true） | 10 |
| `colors_3_or_more` | 颜色数 ≥ 3 | 10 |
| `description_80_chars` | 描述 ≥ 80 字符 | 5 |
| `faq_present` | 有 FAQ（占位 true） | 0 |

最终 `score = min(100, sum(通过权重))`。

---

## 6. 常用 JSON 字段格式

### 6.1 color_palette

支持 `string[]` 或 `PatternColor[]`：

```json
[
  {"name": "Red", "hex": "#ff0000", "count": 120},
  {"name": "White", "hex": "#ffffff", "count": 80}
]
```

### 6.2 grid_data

二维数组，每个元素是颜色 hex（string）或颜色编号（number）：

```json
[
  ["#000000", "#ffffff", 1],
  ["#ff0000", "#000000", 2]
]
```

### 6.3 gallery_media_ids / step_media_ids

JSON 字符串数组，存储 media.id UUID：

```json
["uuid-1", "uuid-2"]
```

### 6.4 used_by (media)

JSON 对象，记录各资源类型的引用次数：

```json
{"cover": 1, "gallery": 3, "step": 2}
```

---

## 7. 通用响应结构

### 7.1 成功响应

```json
{
  "success": true,
  "data": { ... }
}
```

### 7.2 分页成功响应

```json
{
  "success": true,
  "data": { ...items },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "total_pages": 5
  }
}
```

### 7.3 错误响应

```json
{
  "success": false,
  "error": {
    "code": "PATTERN_NOT_FOUND",
    "message": "Pattern not found"
  }
}
```

---

> 文档整理完成，可用于前端 Phase 0 接口对接与数据建模参考。
