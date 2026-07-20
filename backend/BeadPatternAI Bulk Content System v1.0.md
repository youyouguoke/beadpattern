0. 系统目标（非常关键）

你这个系统的目标不是“导入数据”，而是：

🚀 把“Pattern生产”变成批量流水线

核心能力
CSV / JSON 批量导入
自动生成 Pattern + Steps + Tags
自动 SEO 字段生成
自动 slug 生成
批量发布（Draft → Published）
自动 sitemap 更新
1. 🧱 系统整体架构
        ┌────────────────────────┐
        │ CSV / JSON Import      │
        └──────────┬─────────────┘
                   ↓
        ┌────────────────────────┐
        │ Validation Engine      │
        └──────────┬─────────────┘
                   ↓
        ┌────────────────────────┐
        │ Content Generator      │
        │ (Pattern + Steps)      │
        └──────────┬─────────────┘
                   ↓
        ┌────────────────────────┐
        │ SEO Generator          │
        └──────────┬─────────────┘
                   ↓
        ┌────────────────────────┐
        │ Batch Writer (DB)      │
        └──────────┬─────────────┘
                   ↓
        ┌────────────────────────┐
        │ Sitemap / Publish      │
        └────────────────────────┘
2. 📥 输入系统（CSV / JSON）
2.1 CSV格式（核心）
title,subject,style,difficulty,tags
Cute Panda, panda, cute, easy, animal;kawaii
Pixel Cat, cat, pixel, medium, animal;pixel
2.2 JSON格式（更推荐）
[
  {
    "title": "Cute Panda Bead Pattern",
    "subject": "panda",
    "style": "cute",
    "difficulty": "easy",
    "tags": ["animal", "kawaii"]
  }
]
3. 🧠 Validation Engine（防垃圾数据）
3.1 校验规则
IF title empty → reject
IF subject empty → reject
IF duplicate slug → auto modify
3.2 自动修复
duplicate slug → add -1, -2
missing tags → auto infer
missing difficulty → default: easy
4. 🧩 Content Generator Engine（核心🔥）
4.1 Pattern自动生成
pattern = {
  title,
  slug: slugify(title),
  description: generateDescription(subject),
  difficulty,
  coverImage: generateCover(subject)
}
4.2 Step自动生成（关键）
Step模板规则：
Step 1: outline base shape
Step 2: fill main color
Step 3: add details
Step 4: finalize design
自动生成逻辑：
steps = baseStepTemplate(subject)
示例：
panda → black/white pixel layout
cat → ears + face structure
heart → symmetric fill
5. 🏷 Tag Generator（SEO关键）
5.1 自动规则
subject → animal
style → cute/pixel/kawaii
difficulty → easy/medium
5.2 自动扩展
panda → animal, kawaii, cute
pixel cat → pixel, animal
6. 🔍 SEO Generator（核心增长点）
6.1 自动SEO Title
Cute Panda Bead Pattern – Easy Step-by-Step Guide
6.2 自动Description
Learn how to create a cute panda bead pattern with simple steps. Perfect for beginners.
6.3 slug生成
Cute Panda Bead Pattern
→ cute-panda-bead-pattern
7. 🧱 Batch Writer（批量写入数据库）
7.1 Prisma批量插入
await prisma.pattern.createMany({
  data: patterns
});
7.2 Step批量写入
await prisma.patternStep.createMany({
  data: steps
});
🚀 优化策略：
chunk 100 items
transaction batch write
8. 🚀 Bulk Publish System（发布系统）
8.1 状态流转
DRAFT → READY → PUBLISHED
8.2 批量发布
POST /bulk/publish

{
  patternIds: [...]
}
8.3 自动触发：
sitemap update
internal link refresh
9. 🔗 自动内链生成（关键🔥）
9.1 规则
same subject → link
same style → link
same difficulty → link
9.2 自动生成：
panda pattern → link to other panda patterns
10. 📦 Bulk API设计（后端接口）
10.1 上传数据
POST /bulk/import
10.2 预览生成结果
POST /bulk/preview
10.3 批量创建
POST /bulk/create
10.4 批量发布
POST /bulk/publish
11. 🧠 Bulk UI（前端页面）
页面结构：
Bulk Upload Page

[Upload CSV/JSON]

Preview Table

[Generated Patterns List]

[Confirm Create]

[Publish All]
Preview表格：
Title	Slug	Tags	Status
12. 📈 系统增长能力（关键）
放大模型：
1 CSV (100 items)
→ 100 patterns
→ 100 SEO pages
→ 500+ internal links
→ 1000+ index entries
13. 🧠 Bulk系统核心价值（一定要理解）
❗它不是导入工具，而是：

🚀 “SEO内容工业生产线”

你现在拥有：
模块	状态
CMS	完成
SEO系统	完成
Editor	完成
Bulk系统	正在完成
14. ⚠️ 最关键设计原则
❌ 不要：
手动创建 pattern
单条输入运营
无结构数据
✅ 要：
所有内容必须来源 bulk / template
所有 pattern必须可复制扩展
所有 SEO字段自动生成