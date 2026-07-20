# BeadPatternAI Pixel Art Template Engine v1.0

## 1. 诊断结论

当前生成器的问题不是 renderer，而是 **grid 生成逻辑**。

旧流程：`subject → 随机 sine 网格 → 渲染`  
结果：几何图标 / emoji，没有语义特征，没有可拼性。

新流程：

```
Subject Concept
      ↓
Template Engine (animal / character / object)
      ↓
Layer Composer (silhouette + ears + eyes + nose + shadow + whiskers + ...)
      ↓
Style Engine (cute / sleepy / kawaii / retro / detailed)
      ↓
Grid (32×32 ~ 64×64)
      ↓
Renderer (cover + finished)
      ↓
Quality Gate
      ↓
Upload to R2 + Update D1
```

## 2. 核心设计原则

| 原则 | 说明 |
|------|------|
| 按类型分配尺寸 | Emoji/Icon 16×16；Simple 24×24；Animal 32×32；Character/Scene 48×48；Detailed 64×64 |
| 模板驱动 | 动物共用同一套模板（cat/dog/panda/fox/bunny），变体由 style 控制 |
| 分层结构 | 背景 → 阴影 → 身体 → 脸部 → 五官 → 装饰 → 描边 |
| 颜色规范 | 主色 + 高光 + 阴影 + 轮廓 + 点缀色 |
| 对称性 | 默认垂直对称，允许打破对称的元素（如蝴蝶结、文字） |
| 可拼性 | 每个颜色区域连续，避免单像素孤立点；颜色数 ≤ 8 个 |

## 3. 数据模型

### 3.1 Template (YAML/JSON)

```yaml
# templates/animals/cat.yaml
name: cat
base_shape: cat_head
canvas:
  default: 32x32
  variants:
    - { name: mini, size: 24x24 }
    - { name: standard, size: 32x32 }
    - { name: detailed, size: 48x48 }

palette:
  base: { black: '#1a1a1a', white: '#f5f5f5', shadow: '#7a7a7a', highlight: '#ffffff', accent: '#f06292' }
  variants:
    - { name: orange, main: '#ff9800', shadow: '#e65100' }
    - { name: gray, main: '#9e9e9e', shadow: '#424242' }

layers:
  - id: silhouette
    type: ellipse
    anchor: center
    width: 22
    height: 18
    color: main
  - id: ears
    type: triangles
    positions: [left_top, right_top]
    color: main
    inner_color: highlight
  - id: shadow
    type: ellipse
    anchor: center_bottom
    width: 18
    height: 6
    color: shadow
  - id: eyes
    type: sleepy
    color: black
  - id: nose
    type: circle
    color: accent
  - id: whiskers
    type: lines
    color: black
    enabled: true
  - id: mouth
    type: curve
    color: black
    enabled: false
```

### 3.2 Style Configuration

```yaml
styles:
  cute:
    head_ratio: 1.0
    eye_size: medium
    eye_style: open
    blush: true
    whiskers: true
  sleepy:
    head_ratio: 0.9
    eye_style: closed_line
    mouth: tiny_smile
    blush: false
  kawaii:
    head_ratio: 1.1
    eye_style: large_sparkle
    blush: true
    bow: true
  retro:
    outline: thick
    dither: true
    palette: limited_8
```

### 3.3 Runtime Config

```ts
interface PatternConfig {
  subject: string;      // 'cat'
  style: string;        // 'sleepy'
  title: string;        // 'Sleepy Cat'
  size: 'mini' | 'standard' | 'detailed';
  palette_name?: string; // 'orange', 'gray', 'tuxedo'
  // derived
  gridSize: number;
  palette: BeadColor[];
}
```

## 4. 模板列表（第一批 100 个 Pattern 的素材库）

### 4.1 Animals (20 templates × 5 styles = 100)

| 模板 | 风格变体 |
|------|----------|
| cat | cute, sleepy, kawaii, black, retro |
| dog | cute, playful, kawaii, puppy, retro |
| panda | cute, sleepy, kawaii, retro, chibi |
| fox | cute, sleepy, kawaii, arctic, retro |
| bunny | cute, kawaii, sleepy, easter, retro |
| bear | cute, sleepy, kawaii, polar, retro |
| penguin | cute, kawaii, sleepy, retro, baby |
| owl | cute, sleepy, kawaii, retro, wise |
| frog | cute, kawaii, prince, retro, sleepy |
| hamster | cute, kawaii, sleepy, retro, chibi |
| hedgehog | cute, kawaii, sleepy, retro, autumn |
| chick | cute, kawaii, sleepy, easter, retro |
| whale | cute, kawaii, retro, sleepy, rainbow |
| dolphin | cute, kawaii, retro, sleepy, rainbow |
| turtle | cute, kawaii, retro, sleepy, ninja |
| lion | cute, kawaii, retro, sleepy, baby |
| giraffe | cute, kawaii, retro, sleepy, rainbow |
| koala | cute, kawaii, sleepy, retro, baby |
| cow | cute, kawaii, retro, sleepy, pink |
| pig | cute, kawaii, sleepy, retro, baby |

### 4.2 非动物（第二阶段）

- food, plant, character, holiday, object, fantasy 等分类。

## 5. Grid Composer 算法

### 5.1 步骤

1. **初始化 canvas**：根据 size 创建二维数组，填充背景色。
2. **绘制 silhouette**：根据模板和类型（ellipse / rect / composite）填充主色。
3. **绘制阴影层**：在身体下半部分叠加阴影色，制造体积感。
4. **绘制五官**：
   - 眼睛：根据 style 选择 `open`, `closed_line`, `large_sparkle`, `wink` 等
   - 鼻子：通常为粉色圆点
   - 胡须：左右对称的短线
   - 嘴巴：微笑或 tiny_smile
5. **绘制耳朵**：三角形或圆角三角形，可选内耳高光。
6. **添加装饰**：蝴蝶结、腮红、帽子等。
7. **强制描边**：轮廓色 1px 描边，增强识别度。
8. **后处理**：对称修复、颜色量化、孤立点清理。

### 5.2 眼睛样式库

| style | grid 形状 | 描述 |
|-------|-----------|------|
| open | 2x2 实心方块 | 黑色瞳孔 |
| closed_line | 2x3 水平线 | 闭眼 `- -` |
| sleepy_arc | 3x2 弧线 | 弯月形闭眼 |
| large_sparkle | 3x3 含高光 | 可爱大眼 |
| wink | 左开右闭 | 单眼眨眼 |
| tiny_dot | 1x1 | 极简 |

## 6. 颜色系统

### 6.1 每类图案最小颜色数

| 类型 | 最少颜色 | 建议颜色 |
|------|----------|----------|
| Simple icon | 3 | 3-4 |
| Animal (cute) | 5 | 5-7 |
| Animal (detailed) | 6 | 7-8 |
| Character | 6 | 8-10 |
| Scene | 7 | 10-12 |

### 6.2 标准色名

```ts
const BEAD_COLORS = {
  black: '#1a1a1a',
  white: '#f5f5f5',
  highlight: '#ffffff',
  shadow_gray: '#757575',
  dark_gray: '#424242',
  pink: '#f06292',
  red: '#d32f2f',
  orange: '#ff9800',
  yellow: '#ffeb3b',
  green: '#4caf50',
  blue: '#2196f3',
  purple: '#9c27b0',
  brown: '#795548',
  beige: '#f5deb3',
};
```

## 7. Quality Gate

### 7.1 必须检查项

| 检查项 | 规则 | 权重 |
|--------|------|------|
| 颜色数 | 在推荐范围内 | 10 |
| 连通性 | 每个颜色区域有 ≥ 80% 是 4-连通 | 20 |
| 对称性 | 默认垂直对称 | 15 |
| 轮廓完整性 | 外轮廓闭合 | 15 |
| 语义检查 | 根据 subject 必须存在关键特征 | 25 |
| 无孤立点 | 单像素噪点比例 < 1% | 10 |
| 风格一致性 | 眼睛/腮红/嘴巴组合符合 style | 5 |

### 7.2 动物语义检查表

```ts
const ANIMAL_RULES = {
  cat: { ear_count: 2, eye: true, nose: true, face_symmetry: true, whiskers: true },
  dog: { ear_count: 2, eye: true, nose: true, face_symmetry: true, mouth: true },
  panda: { ear_count: 2, eye_patches: 2, eye: true, nose: true },
  fox: { ear_count: 2, eye: true, nose: true, tail: true },
  // ...
};
```

分数 < 70 拒绝，重新生成下一个变体。

## 8. 文件结构

```
scripts/image-gen-v3/
├── templates/
│   ├── animals/
│   │   ├── cat.yaml
│   │   ├── dog.yaml
│   │   ├── panda.yaml
│   │   └── ...
│   ├── characters/
│   ├── food/
│   └── objects/
├── styles/
│   ├── cute.yaml
│   ├── sleepy.yaml
│   ├── kawaii.yaml
│   ├── retro.yaml
│   └── detailed.yaml
├── src/
│   ├── composer.ts
│   ├── template-loader.ts
│   ├── style-engine.ts
│   ├── eye-library.ts
│   ├── palette.ts
│   ├── quality-gate.ts
│   ├── renderer.ts
│   └── cli.ts
├── output/
└── tests/
```

## 9. CLI 接口

```bash
# 生成单个示例
npx tsx scripts/image-gen-v3/src/cli.ts generate \
  --subject cat \
  --style sleepy \
  --size standard \
  --output ./tmp/sleepy-cat.png

# 批量生成 100 个动物
npx tsx scripts/image-gen-v3/src/cli.ts batch \
  --manifest scripts/image-gen-v3/data/animals-100.json \
  --output ./out
```

## 10. 输出规范

每个生成的 pattern 必须包含：

```json
{
  "slug": "sleepy-cat",
  "title": "Sleepy Cat",
  "subject": "cat",
  "style": "sleepy",
  "grid_size": "32x32",
  "grid_data": [["#1a1a1a", ...], ...],
  "color_palette": [
    { "name": "black", "hex": "#1a1a1a", "count": 120 },
    { "name": "white", "hex": "#f5f5f5", "count": 560 },
    { "name": "shadow_gray", "hex": "#757575", "count": 80 },
    { "name": "pink", "hex": "#f06292", "count": 24 }
  ],
  "cover_image_url": "...",
  "finished_image_url": "...",
  "quality_score": 85,
  "quality_reasons": ["ear_count=2", "eye_feature=closed_line", "whiskers=true", "face_symmetry=true"]
}
```

## 11. 第一阶段实施计划

| 步骤 | 工作 | 预计产出 |
|------|------|----------|
| 1 | 实现 Template Loader + Canvas + Layer Composer | 能画 32×32 动物头像 |
| 2 | 实现 cat / dog / panda 模板 + 5 个 style | 3 个示例的 15 张图 |
| 3 | 实现 Quality Gate + 眼睛/胡须库 | 自动拒绝低质量输出 |
| 4 | 集成 renderer 输出 cover/finished | 和后端格式一致 |
| 5 | 批量生成 20 动物 × 5 风格 = 100 patterns | 替换前 100 个 seed |
| 6 | 上传 R2 + 更新 D1 | 网站上新图案生效 |

## 12. 本次先做 3 个示例的改进版

为验证新设计，先对 `sleepy-cat`, `cute-panda`, `playful-dog` 做：

- grid 放大到 32×32
- 增加眼睛、胡须、阴影层
- 颜色从 3-4 色增加到 5-6 色
- 强制垂直对称和闭合轮廓

然后重新生成图片，上传 R2，更新 D1，供用户确认是否进入批量阶段。
