0. 设计目标（非常重要）

这个编辑器不是“表单”，而是：

🎯 结构化内容生产 + SEO优化 + 图片组织 + Step构建器

核心目标
1分钟创建一个pattern
支持批量内容生产
保证SEO结构一致性
降低运营成本 10x
支持未来 AI 接入（但现在不用）
1. 🧱 编辑器整体结构
Pattern Editor

├── Basic Info Panel
├── SEO Preview Panel
├── Step Builder (核心)
├── Image Manager
├── Tag Selector
├── Preview (Live Page)
2. 🧠 编辑器核心数据模型（前端视角）
PatternDraft {
  title: string
  slug: string
  description: string

  difficulty: 'easy' | 'medium' | 'hard'

  coverImage: string

  steps: Step[]

  tags: Tag[]

  seoTitle: string
  seoDescription: string
}
3. 🧱 UI模块设计
3.1 Basic Info Panel（基础信息）
内容：
Title
Slug（自动生成）
Description
Difficulty
关键功能：
🔹 slug自动生成
Cute Panda Bead Pattern
→ cute-panda-bead-pattern
UI结构：
[Title input]
[Slug preview]
[Description textarea]
[Difficulty dropdown]
3.2 SEO Preview Panel（关键）
目的：

❗让运营“看到Google会怎么展示”

显示：
Title: Cute Panda Bead Pattern – Easy Guide
Description: Learn how to create...
URL: /pattern/cute-panda-bead-pattern
SEO实时生成：
seoTitle = `${title} - Easy Bead Pattern`
seoDescription = description.slice(0, 160)
3.3 Step Builder（核心模块🔥）
这是整个系统最重要的部分
Step结构：
Step {
  stepNumber: number
  description: string
  image?: string
}
UI设计：
Step 1
[description input]
[image upload]

Step 2
[description input]
[image upload]

[+ Add Step]
关键能力：
✔ 拖拽排序（必须）
reorder steps
✔ 自动编号
stepNumber 自动更新
✔ 图片绑定
每一步绑定 image
UX优化点：

❗Step builder必须像“Notion + Figma结合体”

3.4 Image Manager（图片系统）
功能：
upload image
drag & drop
preview
reuse image
存储结构：
pattern/{id}/cover.webp
pattern/{id}/step-1.webp
UI：
[Upload]
[Gallery grid]
[Drag to step]
3.5 Tag Selector（SEO核心）
功能：
search tags
multi-select
auto-suggest
UI：
[+ add tag]
[cute]
[panda]
[kawaii]
自动建议逻辑：
if title contains "panda"
→ suggest tag: panda, animal
3.6 Live Preview（非常关键🔥）
作用：

❗让你看到最终 Google 页面

展示：
H1
image
description
steps
related patterns
4. 🧠 编辑器核心交互流程
Open Editor
  ↓
Fill Basic Info
  ↓
Add Steps
  ↓
Upload Images
  ↓
Select Tags
  ↓
SEO Preview check
  ↓
Save Draft / Publish
5. 🚀 批量生产能力（关键）
5.1 Duplicate Pattern
clone existing pattern → modify subject
5.2 Template System（核心）
Template {
  subject: "panda"
  steps: baseSteps
  tags: baseTags
}
5.3 一键生成变体
panda → cat → dog
cute → kawaii → pixel
6. 🧱 状态系统（必须有）
DRAFT
READY
PUBLISHED
ARCHIVED
7. 🔁 编辑器数据流
UI Input
  ↓
PatternDraft State
  ↓
Validation
  ↓
API Save
  ↓
DB
  ↓
SEO Page Render
8. 🧠 SEO绑定（关键设计）

编辑器必须直接控制SEO字段：

自动生成：
seoTitle = `${title} - Easy Bead Pattern`
seoDescription = first 160 chars
slug = kebab-case(title)
9. ⚡ 性能设计（很重要）
必须：
debounce autosave
local draft cache
optimistic UI
autosave：
setTimeout(() => saveDraft(), 1000)
10. 📈 编辑器 = SEO生产机器
你要理解：

这个编辑器不是工具，是：

🚀 “SEO content factory interface”

一次操作的价值：
操作	SEO产出
create pattern	1 page
add tags	5+ pages via clusters
publish	sitemap update
internal linking	ranking boost
11. 🧠 最关键设计原则（总结）
❗必须记住3点：
1️⃣ 内容结构标准化

所有 pattern 必须一致结构

2️⃣ Step是核心资产

不是description，是“步骤”

3️⃣ SEO字段必须内建

不能手动写SEO