0. 系统目标（重新定义）

这个版本的系统目标只有一个：

🎯 在没有 AI 的情况下，稳定支撑 1k → 100k Pattern 内容增长 + SEO流量获取

核心能力
手动创建 Pattern（CMS）
SEO 可索引页面
可扩展标签系统
可搜索（基础版）
可运营（后台）
可后续无痛接 AI
1. 🧱 CMS 领域模型（简化版 DDD）
1.1 Pattern（核心内容实体）
Pattern {
  id: string
  slug: string                // SEO核心
  title: string
  description: string

  difficulty: 'easy' | 'medium' | 'hard'

  status: 'draft' | 'published' | 'archived'

  coverImage: string
  galleryImages: string[]

  manualSteps: PatternStep[]

  createdAt: Date
  updatedAt: Date
}
1.2 PatternStep（手动步骤）
PatternStep {
  stepNumber: number
  description: string
  image?: string
  gridData?: any
}
1.3 Tag（SEO核心资产）
Tag {
  id: string
  name: string
  slug: string

  type: 'style' | 'theme' | 'difficulty' | 'animal' | 'object'
}
1.4 PatternTag（多对多）
PatternTag {
  patternId: string
  tagId: string
}
1.5 Analytics（轻量版）
PatternAnalytics {
  patternId: string

  views: number
  likes: number
  shares: number

  updatedAt: Date
}
2. 🗄 数据库设计（CMS优化版）
2.1 patterns
field	type	index
id	string	PK
slug	string	UNIQUE ✔
title	string	FULLTEXT ✔
description	text	FULLTEXT ✔
difficulty	enum	✔
status	enum	✔
cover_image	string	
created_at	datetime	✔
2.2 pattern_steps
field	type
id	PK
pattern_id	FK
step_number	int
description	text
image	string

index

(pattern_id, step_number)
2.3 tags
slug index（SEO）
2.4 pattern_tags
composite PK
2.5 analytics
pattern_id PK
3. 🌐 CMS API 设计（核心）
3.1 Pattern APIs
GET /patterns
?tag=kawaii
?difficulty=easy
?sort=latest
?page=1
GET /patterns/:slug（SEO核心页）

返回：

{
  "pattern": {},
  "steps": [],
  "tags": [],
  "seo": {}
}
POST /patterns（CMS核心）
{
  "title": "",
  "slug": "",
  "description": "",
  "difficulty": "easy",
  "coverImage": "",
  "steps": []
}
PUT /patterns/:id
POST /patterns/:id/publish
DELETE /patterns/:id
3.2 Tag APIs
GET /tags
POST /tags
DELETE /tags
3.3 Admin CMS APIs
GET /admin/patterns
POST /admin/patterns
POST /admin/upload-image
4. 🧭 CMS核心页面结构（SEO关键）
4.1 Pattern Page（最重要）
/pattern/[slug]
页面结构：
1️⃣ Hero
title
cover image
tags
2️⃣ Description
SEO paragraph（必须自然文本）
3️⃣ Steps Section
step-by-step grid
4️⃣ Related Patterns
same tag
5️⃣ FAQ（SEO）
4.2 Tag Page（流量入口）
/tag/[slug]

内容：

tag description（SEO）
pattern list
pagination
4.3 Home Page（流量聚合）

模块：

trending patterns
newest patterns
difficulty sections
tag cloud
5. 🔍 搜索（轻量版，不用ES）
v1 用 SQL FULLTEXT
SELECT *
FROM patterns
WHERE title LIKE '%keyword%'
   OR description LIKE '%keyword%'
v2 可升级 ES

（现在不需要）

6. 🧠 SEO设计（核心增长引擎）
6.1 URL结构（必须固定）
/pattern/{slug}
/tag/{slug}
6.2 SEO Metadata
metaTitle = `${title} - Bead Pattern Ideas`
metaDescription = description
6.3 内链系统（非常重要）

每个 pattern 必须：

link 同 tag pattern
link difficulty page
link related patterns
7. 📦 图片系统（CMS版本）
存储结构
/patterns/{id}/cover.webp
/patterns/{id}/step-1.webp
CDN策略
Cloudflare R2 / S3
WebP统一格式
lazy loading
8. 🧾 Admin CMS 系统设计
8.1 功能模块
Pattern Editor
Markdown + Form hybrid
step builder UI
Tag Manager
create / edit / merge tags
Media Manager
upload images
auto compress
Publish System
draft → published
9. 🚀 CMS 数据流（关键）
Admin creates pattern
   ↓
save DB (draft)
   ↓
add steps
   ↓
upload images
   ↓
publish
   ↓
SEO page generated
   ↓
indexed by Google
10. 📈 CMS增长模型（重点）
流量来源结构：
来源	占比
Google long-tail	60%
Tag pages	20%
Internal linking	20%
核心增长点：
slug质量
tag体系
internal linking
page speed
content depth
11. 🧱 为什么这个版本是“必须先做的”
❌ AI版本问题：
不稳定
成本高
不可控
影响开发节奏
✅ CMS版本优势：
立即可上线
可被Google收录
可开始SEO积累
可人工优化内容质量
AI未来可无痛接入
12. 🧠 最重要的架构结论

🧱 AI不是产品核心
CMS + SEO 才是流量核心