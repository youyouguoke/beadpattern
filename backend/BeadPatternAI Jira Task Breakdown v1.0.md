🧭 0. 总体规划
🟢 总周期（建议）
Sprint 1：基础CMS跑通（7天）
Sprint 2：SEO + 前端页面（7天）
Sprint 3：Bulk系统 + 编辑器（7–10天）
Sprint 4：优化 + 稳定性（5天）
🧱 EPIC 1 — Backend Core CMS（必须先做）
🟢 BE-1: Prisma Database Setup

类型：Task
优先级：P0
依赖：无

内容：
初始化 NestJS + Prisma
创建 PostgreSQL schema
migration setup
子任务：
Pattern model
Step model
Tag model
PatternTag model
验收标准：
prisma migrate 成功
DB可查询
🟢 BE-2: Pattern CRUD Module

优先级：P0

内容：
Pattern Controller
Pattern Service
Pattern Repository
API：
GET /patterns
GET /patterns/:slug
POST /patterns
POST /patterns/:id/publish
验收：
可以创建/查询/发布 pattern
🟢 BE-3: Step System (Embedded Content)

优先级：P0

内容：
Step CRUD (nested under pattern)
step ordering
image support
验收：
pattern 可包含 steps
steps 可排序
🟢 BE-4: Tag System

优先级：P1

内容：
tag CRUD
pattern-tag relation
tag query API
API：
GET /tags
POST /tags
🟡 BE-5: Media Upload Service

优先级：P1

内容：
upload endpoint
local/S3 abstraction
return CDN URL
API：
POST /media/upload
🧱 EPIC 2 — SEO System Backend
🟡 BE-6: SEO Metadata Generator
内容：
auto title generator
meta description generator
slug normalization
输出：
SEO object for frontend
🟡 BE-7: Sitemap Generator
内容：
/sitemap.xml
/pattern-sitemap.xml
/tag-sitemap.xml
🧱 EPIC 3 — Bulk Content System（核心增长模块🔥）
🔴 BE-8: Bulk Import API

优先级：P0

API：
POST /bulk/import
POST /bulk/preview
POST /bulk/create
功能：
CSV/JSON parsing
validation engine
🔴 BE-9: Bulk Content Generator
内容：
auto pattern creation
auto step generation
tag inference
slug generation
规则：
1 input → 1 pattern
auto SEO fields
🔴 BE-10: Bulk Publish System
API：
POST /bulk/publish
功能：
batch publish patterns
trigger sitemap update
🧱 EPIC 4 — Frontend SEO System
🟢 FE-1: Pattern SEO Page

优先级：P0

Route：
/pattern/[slug]
要求：
SSR
SEO metadata
steps render
related patterns
🟢 FE-2: Tag SEO Page
Route：
/tag/[slug]
内容：
intro SEO text
pattern grid
internal links
🟢 FE-3: Home Page SEO Hub
内容：
trending patterns
tag clusters
internal link distribution
🟡 FE-4: SEO Metadata System
内容：
generateMetadata()
title/description rules
🧱 EPIC 5 — Pattern Editor（运营系统🔥）
🟡 FE-5: Pattern Editor Core
模块：
Basic Info Form
Step Builder
Tag Selector
Image Upload
SEO Preview
🟡 FE-6: Step Builder UI
功能：
add/remove steps
reorder (drag & drop)
image attach per step
🟡 FE-7: Live SEO Preview
内容：
simulate Google snippet
preview slug + title
🧱 EPIC 6 — Bulk UI System
🔴 FE-8: Bulk Upload Page
功能：
CSV upload
JSON upload
preview table
🔴 FE-9: Bulk Review Table
UI：

| title | slug | tags | status |

🔴 FE-10: Bulk Execution UI
功能：
create batch
publish batch
🧱 EPIC 7 — Internal Linking System
🟡 BE-11: Link Graph Builder
功能：
same tag linking
same subject linking
related pattern fetch
🟡 FE-11: Related Patterns Component
功能：
render internal links
SEO boosting navigation
🧱 EPIC 8 — Infrastructure & Performance
🟡 INF-1: Sitemap Auto Refresh
on publish trigger
regenerate sitemap
🟡 INF-2: Caching Layer
pattern cache
tag cache
ISR setup
🟡 INF-3: Image Optimization
WebP conversion
CDN ready structure
🧭 Sprint规划（非常关键）
🚀 Sprint 1（7天）— CMS能跑
BE-1 DB
BE-2 Pattern CRUD
BE-3 Steps
FE-1 Pattern page

👉 目标：能发布pattern + 能访问页面

🚀 Sprint 2（7天）— SEO完整
Tag system
SEO metadata
Tag page
Home page
🚀 Sprint 3（7–10天）— Bulk系统🔥
Bulk import
Bulk generator
Bulk publish
Bulk UI
🚀 Sprint 4（5天）— 优化
internal linking
sitemap
performance
📊 MVP完成标准（非常重要）
✔ 必须达到：
CMS可用
pattern可发布
SEO页面可被Google抓取
bulk导入100条数据
tag系统可运行
🧠 最关键一句话（给团队）

❗先跑通“内容生产 + SEO页面 + bulk导入”，再优化体验