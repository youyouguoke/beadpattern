0. Agent 总体分层

系统被拆为 8 个并行开发 Agent：

A1  Domain & DB Agent
A2  Pattern Core API Agent
A3  AI Queue & Worker Agent
A4  Search (Elastic) Agent
A5  Recommendation Agent
A6  SEO & Sitemap Agent
A7  Admin System Agent
A8  Storage & Media Agent
1. 🧱 A1 — Domain & Database Agent（基础结构 Agent）
🎯 职责

负责：

DDD模型落地
数据库设计
Prisma/SQL schema
migration
enum / type system
📦 输出物
1. DB Schema（必交付）
patterns
pattern_images
tags
pattern_tags
ai_jobs
seo_pages
analytics
2. ORM Model（Prisma 或 TypeORM）
3. Shared Types
PatternStatus
Difficulty
AIGenerationType
4. Index Design
SQL index
ES mapping input（给A4）
🔗 依赖

❌ 无依赖（第一优先启动）

✅ 验收标准
可执行 migration
可创建 pattern
所有 enum 一致
与 API Agent 完全对齐
2. 🧩 A2 — Pattern Core API Agent
🎯 职责

负责所有 Pattern CRUD + 用户读取 API

📦 API 范围
Pattern APIs
GET /patterns
GET /patterns/:slug
POST /patterns (admin)
PUT /patterns/:id
DELETE /patterns/:id
POST /patterns/:id/publish
📦 输出物
REST Controller
Service Layer
DTO validation
Pagination logic
Filter logic
🧠 核心逻辑
list query

支持：

tag filter
difficulty filter
sort (latest/popular)
🔗 依赖
A1 DB schema
A6 SEO（optional join）
✅ 验收标准
10k数据下查询稳定
slug访问 < 100ms（cache前）
filter组合可用
3. 🤖 A3 — AI Queue & Worker Agent（核心系统）
🎯 职责

负责：

AI任务队列
worker执行
prompt系统
retry机制
job状态流转
📦 输出物
Queue System
BullMQ / RabbitMQ implementation
AI Workers
generate_title_worker
generate_image_worker
generate_steps_worker
generate_seo_worker
Job Lifecycle
queued → running → done → failed → retry
🧠 AI Pipeline
pattern.created
   ↓
title → tags → description → cover → steps → seo
🔗 依赖
A1 DB
A8 Storage
A6 SEO (optional output)
⚠️ 关键约束
❌ 不允许直接 publish pattern
❌ 不允许写业务逻辑
✔ 只能产出 AI结果
✅ 验收标准
job 可重试
worker 可横向扩展
AI失败不影响系统
4. 🔎 A4 — Search (ElasticSearch) Agent
🎯 职责

负责：

ES index设计
indexing pipeline
search API
query optimization
📦 输出物
ES Index
patterns_index

fields:

title
description
tags
difficulty
popularity_score
API
GET /search?q=
GET /search/suggest
Index Pipeline
DB → event → index worker → ES
🔗 依赖
A1 DB
A3 events
⚠️ 关键点
must support fuzzy search
must support tag boosting
must support popularity boost
✅ 验收标准
100k数据查询 < 200ms
typo tolerance OK
tag match boost生效
5. 🎯 A5 — Recommendation Agent
🎯 职责

负责推荐系统：

similar patterns
trending patterns
personalized scoring（v1 rule-based）
📦 输出物
APIs
GET /recommend/:patternId
GET /trending
GET /home-feed
🧠 Score Model
score =
views*0.4 +
likes*0.3 +
ctr*0.2 +
freshness*0.1
🔗 依赖
A2 Pattern API
A1 analytics
A4 search data
✅ 验收标准
trending 可实时刷新（10min cache）
推荐结果稳定不抖动
6. 📈 A6 — SEO & Sitemap Agent
🎯 职责

负责所有 SEO能力：

meta生成
structured data
sitemap
internal linking
SEO scoring
📦 输出物
SEO Fields Generator
title
description
keywords
OG image logic
Sitemap Generator
/sitemap.xml
JSON-LD Schema
Pattern schema
Breadcrumb schema
🔗 依赖
A2 Pattern API
A3 AI SEO output
✅ 验收标准
每个 pattern 都有唯一 SEO page
sitemap自动更新
Google-friendly structure
7. 🛠 A7 — Admin System Agent
🎯 职责

后台管理系统：

pattern管理
AI job monitor
tag管理
review system
📦 输出物
Admin APIs
/admin/patterns
/admin/ai-jobs
/admin/tags
/admin/review
🧠 核心功能
re-run AI job
force publish
reject pattern
edit SEO
🔗 依赖
A2
A3
A6
✅ 验收标准
能完整控制 pattern 生命周期
AI job可手动干预
8. 🧩 A8 — Storage & Media Agent
🎯 职责

负责：

object storage
image upload
CDN path
media optimization
📦 输出物
Storage Structure
/patterns/{id}/cover.webp
/patterns/{id}/step_x.webp
APIs
POST /upload/image
GET /media/:id
🧠 功能
image compression
webp conversion
CDN url mapping
🔗 依赖
A3 AI Worker
✅ 验收标准
上传延迟 < 2s
自动生成 webp
CDN可访问
🚀 9. Agent 并行开发顺序
Phase 1（基础）
A1 → A8
Phase 2（核心业务）
A2 → A3
Phase 3（增长系统）
A4 → A5 → A6
Phase 4（管理系统）
A7
🔥 10. 全局事件总线（必须统一）

所有 Agent 必须使用：

pattern.created
ai.job.completed
pattern.published
index.updated
seo.generated
🧱 11. Agent 通信规则（非常重要）
❌ 禁止
直接调用其他 Agent内部逻辑
直接写跨模块数据库
绕过 event system
✅ 必须
API communication
Event-driven updates
Shared schema from A1
📊 12. 成功标准（全系统）

当系统完成时必须满足：

100k patterns无性能下降
AI生成完全异步
搜索 < 200ms
SEO页面自动生成
admin可控全流程
推荐系统稳定