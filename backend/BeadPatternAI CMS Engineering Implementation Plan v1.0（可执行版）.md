🧱 BeadPatternAI CMS 工程落地（NestJS + Prisma）
0. 最小可运行目标（MVP定义）

你第一阶段只需要做到：

🎯 “可以创建 pattern → 可以展示 pattern → 可以发布 pattern → 可以被SEO访问”

MVP闭环
Admin create pattern
  ↓
Save DB (draft)
  ↓
Add steps + images
  ↓
Publish
  ↓
/pattern/[slug] 可访问
1. 🧱 工程模块拆分（NestJS）
📁 最终结构
src/
 ├── modules/
 │    ├── pattern/        ✅ 核心
 │    ├── tag/            ✅ 分类
 │    ├── media/          ✅ 图片
 │    ├── admin/          ✅ 后台
 │    ├── seo/            ✅ SEO（轻量）
 │    ├── analytics/      (可后置)
 │
 ├── database/
 ├── common/
 ├── config/
 ├── main.ts
2. 🧱 开发顺序（非常重要）
🚨 必须按顺序做，否则会返工
1. database layer (Prisma)
2. pattern module (core)
3. tag module
4. media module
5. SEO page rendering
6. admin module
3. 🗄 Step 1 — Prisma最终版（CMS版）
📌 Pattern（核心）
model Pattern {
  id          String   @id @default(cuid())
  slug        String   @unique
  title       String
  description String

  difficulty  String
  status      String   // draft | published

  coverImage  String?

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  steps       PatternStep[]
  tags        PatternTag[]
}
📌 Step
model PatternStep {
  id          String @id @default(cuid())
  patternId   String
  stepNumber  Int
  description String
  image       String?

  pattern Pattern @relation(fields: [patternId], references: [id])
}
📌 Tag
model Tag {
  id   String @id @default(cuid())
  name String
  slug String @unique
}
📌 PatternTag
model PatternTag {
  patternId String
  tagId     String

  pattern Pattern @relation(fields: [patternId], references: [id])
  tag     Tag     @relation(fields: [tagId], references: [id])

  @@id([patternId, tagId])
}
4. 🚀 Step 2 — Pattern Module（核心开发）
📁 pattern module
pattern/
 ├── pattern.controller.ts
 ├── pattern.service.ts
 ├── pattern.repository.ts
 ├── dto/
 ├── pattern.module.ts
📌 Controller（必须先做）
@Controller('patterns')
export class PatternController {
  constructor(private service: PatternService) {}

  @Get()
  findAll(@Query() query) {
    return this.service.findAll(query);
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.service.findBySlug(slug);
  }

  @Post()
  create(@Body() dto) {
    return this.service.create(dto);
  }

  @Post(':id/publish')
  publish(@Param('id') id: string) {
    return this.service.publish(id);
  }
}
📌 Service（核心逻辑）
@Injectable()
export class PatternService {
  constructor(private repo: PatternRepository) {}

  findAll(query) {
    return this.repo.findAll(query);
  }

  findBySlug(slug: string) {
    return this.repo.findBySlug(slug);
  }

  async create(dto) {
    const pattern = await this.repo.create(dto);
    return pattern;
  }

  publish(id: string) {
    return this.repo.update(id, {
      status: 'published'
    });
  }
}
📌 Repository（数据库层隔离）
@Injectable()
export class PatternRepository {
  constructor(private prisma: PrismaService) {}

  findAll(query) {
    return this.prisma.pattern.findMany({
      where: {
        status: query.status || 'published'
      },
      include: {
        tags: true
      }
    });
  }

  findBySlug(slug: string) {
    return this.prisma.pattern.findUnique({
      where: { slug },
      include: {
        steps: true,
        tags: true
      }
    });
  }

  create(data) {
    return this.prisma.pattern.create({
      data
    });
  }

  update(id, data) {
    return this.prisma.pattern.update({
      where: { id },
      data
    });
  }
}
5. 🏷 Step 3 — Tag Module（SEO基础）
API
GET    /tags
POST   /tags
DELETE /tags/:id
Service逻辑
findAll() {
  return this.prisma.tag.findMany();
}
6. 📦 Step 4 — Media Module（图片系统）
API
POST /media/upload
GET  /media/:id
Upload逻辑
async upload(file) {
  const key = `/patterns/${Date.now()}.webp`;

  const url = await s3.upload({
    Bucket: 'bead',
    Key: key,
    Body: file.buffer
  });

  return url;
}
7. 🌐 Step 5 — SEO Page（轻量版）
Next.js 或 Nest SSR 都可以
页面结构
/pattern/[slug]
数据获取
GET /api/patterns/:slug
页面结构
title
cover image
steps
tags
related patterns
8. 🧑‍💼 Step 6 — Admin Module（运营入口）
API
GET  /admin/patterns
POST /admin/patterns
POST /admin/publish
POST /admin/upload
核心功能
pattern CRUD
step编辑
图片上传
publish控制
9. 🔁 数据流（必须遵守）
Admin UI
  ↓
Pattern API
  ↓
Database
  ↓
SEO Page
  ↓
Google Index
10. 🚨 关键工程规则（非常重要）
❌ 不允许
业务逻辑写在 controller
跳过 repository
pattern + tag 混写
✅ 必须
controller → service → repository
DTO校验
slug唯一
published状态控制SEO可见
11. 📈 MVP验收标准（必须达成）
你可以认为CMS完成当：
✔ 能做到：
创建 pattern
添加 steps
上传图片
绑定 tags
publish
/pattern/[slug]可访问
✔ SEO页面：
slug唯一
meta title正常
页面可被爬虫访问
12. 🧠 最重要认知（这一步很多人错）
❗CMS不是功能，是“内容生产系统”

不是：

CRUD系统

而是：

🎯 “持续生产SEO页面的机器”