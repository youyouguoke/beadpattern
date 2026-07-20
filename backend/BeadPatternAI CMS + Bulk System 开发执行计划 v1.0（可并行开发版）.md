🧭 0. 总体开发策略（非常重要）

你现在不要“按功能做”，要按：

❗模块并行 + 最小闭环优先 + 先能跑，再优化

🎯 第一阶段目标（MVP上线）

必须做到：

CMS可用 + Pattern可发布 + SEO页面可访问 + Bulk可导入
🧱 1. 后端 Agent 任务拆解（NestJS）
🟢 Agent A — Database & Core Schema（必须先做）
任务：
Prisma 初始化
建立 CMS schema（Pattern / Step / Tag / PatternTag）
migration
seed mock data
输出：
可运行 DB
基础 CRUD ready
🟢 Agent B — Pattern Core Module（最重要）
任务：
Pattern CRUD API
Step CRUD embedded
publish workflow
slug system
API：
GET /patterns
GET /patterns/:slug
POST /patterns
POST /patterns/:id/publish
输出：
CMS核心完成
SEO页面数据来源完成
🟢 Agent C — Tag Module（SEO基础）
任务：
Tag CRUD
pattern-tag relation
tag list API
API：
GET /tags
POST /tags
🟢 Agent D — Media Upload Module
任务：
image upload API
local/S3 abstraction
return CDN url
API：
POST /media/upload
🟡 Agent E — Bulk System（批量生产🔥）
任务：
CSV/JSON import parser
validation engine
bulk create patterns
bulk publish
API：
POST /bulk/import
POST /bulk/preview
POST /bulk/create
POST /bulk/publish
🟡 Agent F — SEO Support Layer
任务：
sitemap generator
slug normalization
meta generator helper
输出：
sitemap.xml
SEO metadata API
🧱 2. 前端 Agent 任务拆解（Next.js）
🟢 Agent G — SEO Pages（核心前端）
任务：
/pattern/[slug]
/tag/[slug]
SSR rendering
SEO metadata
必须：
SSR
no client-only rendering
🟢 Agent H — Home Page + Tag Page
任务：
homepage layout
tag cluster page
internal linking UI
🟡 Agent I — Pattern Editor（运营核心🔥）
任务：
Pattern creation UI
Step builder
Tag selector
SEO preview panel
🟡 Agent J — Bulk Upload UI
任务：
CSV upload
preview table
bulk create trigger
bulk publish button
🧱 3. 并行开发顺序（关键）
🚨 Phase 1（必须先做）
Agent A (DB)
Agent B (Pattern API)
Agent G (SEO page)

👉 这一步完成 = 网站可以跑

Phase 2
Agent C (Tag)
Agent D (Media)
Agent H (Home/Tag UI)
Phase 3
Agent I (Editor)
Agent E (Bulk system)
Agent J (Bulk UI)
Phase 4（优化）
SEO sitemap
internal linking
performance
🧱 4. 技术约束（必须统一）
后端
NestJS
Prisma
PostgreSQL
REST API（先不要 GraphQL）
前端
Next.js App Router
SSR / ISR
Tailwind CSS
图片
WebP
CDN（可后置）
🧠 5. 数据流（必须统一）
Bulk Import / CMS UI
        ↓
   NestJS API
        ↓
     PostgreSQL
        ↓
   SEO Pages (Next.js SSR)
        ↓
     Google Index
📦 6. MVP验收标准（非常重要）
✔ CMS
create pattern
add steps
publish
✔ SEO
/pattern/[slug] 可访问
meta title 正确
SSR正常
✔ Bulk
CSV导入成功
批量生成 pattern
批量发布
✔ Tag
tag page可访问
pattern归类正确
🚨 7. 最重要的开发原则（避免翻车）
❌ 不要做：
AI生成逻辑（现在不需要）
复杂架构（microservice）
过早优化
GraphQL
✅ 必须做：
CRUD先跑通
数据结构稳定
SEO页面优先上线
bulk系统尽快可用
🧠 8. 一句话总结开发策略

🟢 先让系统“能生产1000个页面”
🔵 再优化“怎么生产更快”
🔴 最后才考虑“智能化”