1. 🧱 项目整体结构（必须统一）
bead-pattern-ai-backend/
│
├── src/
│   ├── modules/
│   │   ├── pattern/
│   │   ├── ai/
│   │   ├── search/
│   │   ├── recommendation/
│   │   ├── seo/
│   │   ├── admin/
│   │   ├── storage/
│   │   └── shared/
│   │
│   ├── database/
│   ├── queue/
│   ├── events/
│   ├── config/
│   └── main.ts
│
├── prisma/
├── docker/
├── scripts/
└── .env
2. 🧱 A1 — Prisma Schema（可直接用）
📦 prisma/schema.prisma
model Pattern {
  id          String   @id @default(cuid())
  slug        String   @unique
  title       String
  description String?

  difficulty  String
  status      String

  coverImage  String?

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  images      PatternImage[]
  tags        PatternTag[]
  aiJobs      AIJob[]
  seo         SEOPage?
  analytics   PatternAnalytics?
}
model PatternImage {
  id         String @id @default(cuid())
  patternId  String
  type       String
  url        String
  sortOrder  Int

  pattern    Pattern @relation(fields: [patternId], references: [id])
}
model Tag {
  id    String @id @default(cuid())
  name  String
  slug  String @unique
}
model PatternTag {
  patternId String
  tagId     String

  pattern Pattern @relation(fields: [patternId], references: [id])
  tag     Tag     @relation(fields: [tagId], references: [id])

  @@id([patternId, tagId])
}
model AIJob {
  id         String @id @default(cuid())
  patternId  String

  type       String
  status     String

  prompt     String?
  resultUrl  String?

  retryCount Int @default(0)

  createdAt  DateTime @default(now())
}
model SEOPage {
  id          String @id @default(cuid())
  patternId   String @unique

  title       String
  description String
  keywords    String

  canonical   String

  pattern Pattern @relation(fields: [patternId], references: [id])
}
3. 🚀 A2 — Pattern Module（NestJS骨架）
📁 structure
modules/pattern/
├── pattern.controller.ts
├── pattern.service.ts
├── pattern.repository.ts
├── dto/
└── pattern.module.ts
📌 Controller
@Controller('patterns')
export class PatternController {
  constructor(private readonly service: PatternService) {}

  @Get()
  getAll(@Query() query) {
    return this.service.findAll(query);
  }

  @Get(':slug')
  getOne(@Param('slug') slug: string) {
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
📌 Service
@Injectable()
export class PatternService {
  constructor(private repo: PatternRepository) {}

  async findAll(query) {
    return this.repo.list(query);
  }

  async findBySlug(slug: string) {
    return this.repo.findBySlug(slug);
  }

  async create(dto) {
    const pattern = await this.repo.create(dto);

    // trigger AI pipeline
    await eventBus.emit('pattern.created', {
      patternId: pattern.id
    });

    return pattern;
  }

  async publish(id: string) {
    return this.repo.update(id, { status: 'published' });
  }
}
4. 🤖 A3 — AI Queue（BullMQ）
📁 structure
modules/ai/
├── ai.module.ts
├── ai.service.ts
├── workers/
│   ├── title.worker.ts
│   ├── image.worker.ts
│   ├── seo.worker.ts
├── queue/
└── prompts/
📌 Queue setup
import { Queue } from 'bullmq';

export const aiQueue = new Queue('ai', {
  connection: { host: 'localhost', port: 6379 }
});
📌 Add Job
await aiQueue.add('generate_title', {
  patternId,
  prompt
});
📌 Worker Example
new Worker('ai', async job => {
  switch (job.name) {
    case 'generate_title':
      return await generateTitle(job.data);

    case 'generate_image':
      return await generateImage(job.data);

    case 'generate_seo':
      return await generateSEO(job.data);
  }
});
📌 AI Pipeline Flow
pattern.created
   ↓
generate_title
   ↓
generate_tags
   ↓
generate_image
   ↓
generate_seo
   ↓
pattern.review
5. 🔎 A4 — ElasticSearch Module
📌 index mapping
{
  "mappings": {
    "properties": {
      "title": { "type": "text" },
      "description": { "type": "text" },
      "tags": { "type": "keyword" },
      "difficulty": { "type": "keyword" },
      "popularity": { "type": "float" }
    }
  }
}
📌 Search service
async search(query: string) {
  return this.es.search({
    index: 'patterns',
    query: {
      multi_match: {
        query,
        fields: ['title', 'description', 'tags']
      }
    }
  });
}
6. 🧠 Event System（核心 glue）
📌 event bus
export const eventBus = new EventEmitter();
📌 usage
eventBus.on('pattern.created', async (payload) => {
  await aiQueue.add('generate_title', payload);
});
7. 🧾 A8 — Storage Module
📌 upload service
async upload(file: Buffer, path: string) {
  const url = await s3.putObject({
    Bucket: 'patterns',
    Key: path,
    Body: file
  });

  return url;
}
📌 structure
/patterns/{id}/cover.webp
/patterns/{id}/step_1.webp
8. 📈 A5 — Recommendation (Rule-based v1)
function score(p) {
  return (
    p.views * 0.4 +
    p.likes * 0.3 +
    p.ctr * 0.2 +
    p.freshness * 0.1
  );
}
9. 🧠 A6 — SEO Generator
📌 SEO builder
export function generateSEO(pattern) {
  return {
    title: `${pattern.title} | Bead Patterns AI`,
    description: pattern.description,
    keywords: pattern.tags.join(',')
  };
}
10. 🛠 A7 — Admin Module
📌 endpoints
GET    /admin/patterns
GET    /admin/ai-jobs
POST   /admin/retry-job
POST   /admin/force-publish
11. 🚀 启动顺序（非常关键）
1. PostgreSQL
2. Redis
3. NestJS API
4. AI Workers
5. ElasticSearch
6. Storage
12. 🧪 最小可运行闭环（MVP Flow）

只要这条链跑通就成功：

POST /patterns
   ↓
pattern.created event
   ↓
AI queue
   ↓
image + seo generated
   ↓
stored in DB + S3
   ↓
GET /patterns/:slug
🔥 下一步（强烈建议继续）

我可以继续帮你补：

👉 1. AI Prompt 系统（非常关键）
title prompt
SEO prompt
image prompt（稳定出图）
👉 2. 完整 Worker 实现（可直接上线）
OpenAI / SD integration
retry / fallback
cost control
👉 3. Docker Compose 一键启动
postgres + redis + es + backend
👉 4. 前端 API 契约（Next.js）
SSR SEO page
pattern page structure