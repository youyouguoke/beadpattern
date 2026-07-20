0. 系统目标与设计原则
0.1 核心目标

BeadPatternAI 是一个：

Pattern 内容生成 + 管理系统（AI + 人工混合）
面向 SEO 的长尾内容平台
支持海量 pattern（10万～100万级）
支持 AI 批量生成 + 审核 + 发布
支持搜索 + 推荐 + 分类浏览
0.2 设计原则
1）DDD + 事件驱动
所有核心模块围绕领域建模
AI / 搜索 / 发布通过事件解耦
2）读写分离优先
写：MySQL/Postgres
读：ElasticSearch + Redis + CDN
3）AI 异步化
所有生成必须走队列，不阻塞 API
4）SEO-first data model
每个 Pattern = 独立 SEO landing page
5）可水平扩展
无状态 API
队列驱动生成
存储与计算分离
1. 领域模型（DDD）
1.1 核心 Domain
🎨 Pattern（核心实体）

表示一个可展示/可SEO的串珠图案

Pattern {
  id: string
  slug: string
  title: string
  description: string

  difficulty: enum('easy','medium','hard')
  styleTags: string[]   // kawaii, pixel, anime, etc
  colorPalette: string[]

  imageCover: string
  imageSteps: string[]

  status: enum('draft','generating','review','published','archived')

  seo: SEOFields

  aiMeta: AIFields

  stats: StatsFields

  createdAt
  updatedAt
}
🧠 AIGenerationJob（AI任务）
AIGenerationJob {
  id
  patternId

  type: 'generate_image' | 'generate_steps' | 'generate_title' | 'generate_seo'

  prompt
  model
  status: 'queued' | 'running' | 'done' | 'failed'

  resultUrl?
  error?

  retryCount
  createdAt
}
🏷 Tag（标签系统）
Tag {
  id
  name
  slug
  type: 'style' | 'theme' | 'color' | 'difficulty'
}
📊 PatternAnalytics
PatternAnalytics {
  patternId
  views
  likes
  ctr
  avgTimeOnPage
  seoScore
}
👤 AdminUser
AdminUser {
  id
  email
  role: 'admin' | 'editor' | 'ai-agent'
}
2. 数据库设计（ERD）
2.1 表结构
patterns
field	type	index
id	varchar PK	YES
slug	varchar UNIQUE	YES
title	varchar	YES(fulltext)
description	text	FULLTEXT
difficulty	tinyint	YES
status	tinyint	YES
cover_image	varchar	
created_at	datetime	YES
pattern_images
field	type
id	PK
pattern_id	FK
type	cover/step/gallery
url	varchar
sort_order	int

index

(pattern_id, type)
pattern_tags
field	type
pattern_id	FK
tag_id	FK

index

composite PK (pattern_id, tag_id)
ai_jobs
field	type	index
id	PK	
pattern_id	FK	YES
type	varchar	YES
status	tinyint	YES
prompt	text	
result_url	varchar	
retry_count	int	
pattern_analytics
field	type	index
pattern_id	PK	YES
views	int	
likes	int	
ctr	float	
updated_at	datetime	
seo_pages
field	type
pattern_id	FK
meta_title	varchar
meta_desc	text
canonical_url	varchar
keywords	text
2.2 索引策略
必须索引：
slug（SEO核心）
tags
difficulty
status
fulltext(title + description)
3. REST API 设计
3.1 Pattern API
GET /api/patterns

支持过滤：

?tag=kawaii
?difficulty=easy
?page=1
&sort=popular
GET /api/patterns/:slug

返回完整 pattern + SEO + images

POST /api/patterns (admin)
POST /api/patterns/:id/publish
3.2 AI API
POST /api/ai/generate
{
  "patternId": "123",
  "type": "generate_image",
  "prompt": "cute bead panda pixel style"
}
GET /api/ai/jobs/:id
3.3 Search API
GET /api/search?q=

返回：

patterns
tags
suggestions
3.4 Recommendation API
GET /api/recommend/:patternId
4. AI 队列与生成流程（核心系统）
4.1 架构
API → Queue (Redis / RabbitMQ) → AI Worker → Storage → DB Update → Event
4.2 Job Flow
Step 1：创建 Pattern
status = draft
Step 2：AI Pipeline
1. generate_title
2. generate_description
3. generate_tags
4. generate_cover_image
5. generate_step_images
6. generate_seo
Step 3：Worker 执行

每个 job：

拉 prompt
调 AI API（OpenAI / SD / Midjourney proxy）
存储到 object storage
更新 DB
Step 4：完成状态
pattern.status = review → published
4.3 队列优先级
类型	优先级
cover image	HIGH
title	HIGH
seo	HIGH
steps	MEDIUM
5. 搜索与推荐架构
5.1 ElasticSearch Index
patterns_index
{
  "title": "text",
  "description": "text",
  "tags": "keyword",
  "difficulty": "keyword",
  "popularity_score": "float"
}
5.2 推荐逻辑（v1）
Hybrid Score
score = 
  views * 0.4 +
  likes * 0.3 +
  CTR * 0.2 +
  freshness * 0.1
5.3 推荐类型
Similar Pattern
Trending
Same tag
AI-based semantic match（后期）
6. 对象存储与文件组织
6.1 Storage 结构
/patterns/{patternId}/
    cover.webp
    step_1.webp
    step_2.webp
    raw_prompt.json
6.2 CDN策略
Cloudflare / S3 + CDN
WebP 优先
Lazy loading
7. 缓存与性能方案
7.1 Redis Cache
key	content
pattern:{slug}	pattern detail
search:{query}	search result
trending	hot patterns
7.2 缓存策略
Pattern detail：TTL 24h
Search：TTL 5min
Trending：TTL 10min
7.3 性能目标
P95 < 200ms
首页 < 100ms（缓存）
8. SEO 支撑能力（核心重点）
8.1 URL 结构
/pattern/{slug}
8.2 SEO字段
meta title
meta description
OG image
structured data (JSON-LD)
8.3 自动 SEO生成

AI生成：

long-tail keywords
FAQ section
alt text
internal links
8.4 Sitemap

自动生成：

/sitemap.xml

按：

pattern pages
tag pages
trending pages
9. 后台管理系统设计
9.1 Admin Dashboard
功能模块
Pattern管理
CRUD
发布/下线
AI重跑
AI Job Monitor
queue状态
error retry
Tag管理
SEO编辑器
9.2 权限系统
admin > editor > ai-agent
9.3 审核流
AI生成 → draft → review → published
10. Agent 开发规范（关键）
10.1 Agent 模块划分
Pattern Generator Agent
创建 pattern
生成 prompt
AI Image Agent
生成图像
上传 storage
SEO Agent
生成 title/meta/keywords
Tagging Agent
自动分类
Recommendation Agent
更新推荐权重
10.2 Agent 输入标准
{
  "patternId": "",
  "context": {},
  "task": ""
}
10.3 Agent 输出标准
{
  "status": "success",
  "result": {},
  "logs": []
}
10.4 Agent 不允许行为
不直接写 DB
不直接 publish
必须通过 API 或 event
11. 事件系统（推荐）
Event List
pattern.created
pattern.ai.completed
pattern.published
ai.job.failed
search.index.updated
12. 扩展能力设计（未来百万级）
12.1 水平扩展点
API stateless
worker scale-out
ES shard
CDN cache
12.2 数据增长策略
数据规模	方案
10k	单库
100k	ES + Redis
1M	分库 + 热冷分离
12.3 冷热分层
hot patterns → Redis
cold → DB only
13. 技术栈建议
Backend
Node.js / NestJS
PostgreSQL
Redis
ElasticSearch
AI
OpenAI / Stable Diffusion API
Queue Worker (BullMQ)
Infra
S3 / Cloudflare R2
CDN
Docker + Kubernetes（后期）
14. 最终架构图（逻辑）
Frontend
   ↓
API Gateway
   ↓
Backend Services
   ↓
Redis / DB / ES
   ↓
AI Queue → AI Workers
   ↓
Object Storage → CDN
15. 总结

这套架构的核心能力：

✅ 支持 AI 批量生成 Pattern
✅ 支持百万级 SEO 页面
✅ 搜索 + 推荐可水平扩展
✅ 完全解耦（API / AI / Search）
✅ 后端 Agent 可并行开发
✅ 不需要重构即可扩展到大规模