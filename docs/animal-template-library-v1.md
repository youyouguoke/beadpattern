# BeadPatternAI Animal Template Library v1.0

## 目标

为 Pixel Art Template Engine 提供第一批可复用的动物模板，覆盖 20 个常见动物，每个动物支持 5 种风格变体，合计可生成 100 个高质量拼豆图案。

## 模板数据模型

```json
{
  "id": "cat",
  "name": "Cat",
  "category": "animals",
  "subject": "cat",
  "canvas": { "width": 32, "height": 32 },
  "recommended_sizes": ["24x24", "32x32", "48x48"],
  "default_palette": {
    "black": "#1a1a1a",
    "white": "#f5f5f5",
    "shadow": "#7a7a7a",
    "highlight": "#ffffff",
    "pink": "#f06292",
    "orange": "#ff9800"
  },
  "layers": [
    { "name": "silhouette", "type": "silhouette", "shape": "cat_head" },
    { "name": "ears", "type": "feature", "shape": "triangles", "count": 2 },
    { "name": "eyes", "type": "feature", "style": "style_eye" },
    { "name": "nose", "type": "feature", "shape": "circle" },
    { "name": "whiskers", "type": "detail", "enabled": true },
    { "name": "mouth", "type": "detail", "enabled": "style_mouth" },
    { "name": "blush", "type": "detail", "enabled": "style_blush" },
    { "name": "shadow", "type": "shadow", "enabled": true }
  ],
  "quality_rules": {
    "required": ["ears", "eyes", "nose"],
    "min_colors": 4,
    "symmetry": true
  }
}
```

## 20 个动物模板清单

| 序号 | ID | 名称 | 关键特征 | 默认尺寸 |
|------|-----|-------|----------|----------|
| 1 | cat | Cat | 尖耳朵、胡须、闭眼/睁眼 | 32x32 |
| 2 | dog | Dog | 垂耳/尖耳、鼻子、舌头 | 32x32 |
| 3 | panda | Panda | 黑眼圈、圆耳朵、黑白 | 32x32 |
| 4 | fox | Fox | 尖耳、尖鼻、蓬松尾巴 | 32x32 |
| 5 | rabbit | Rabbit | 长耳朵、大门牙 | 32x32 |
| 6 | bear | Bear | 圆耳朵、圆脸 | 32x32 |
| 7 | penguin | Penguin | 黑白身体、黄色嘴 | 32x32 |
| 8 | owl | Owl | 大眼睛、耳羽 | 32x32 |
| 9 | frog | Frog | 大眼、宽嘴、绿色 | 32x32 |
| 10 | turtle | Turtle | 壳、四肢、绿色 | 32x32 |
| 11 | koala | Koala | 大耳朵、圆鼻、灰色 | 32x32 |
| 12 | lion | Lion | 鬃毛、圆脸 | 32x32 |
| 13 | tiger | Tiger | 条纹、圆耳 | 32x32 |
| 14 | elephant | Elephant | 大耳朵、长鼻子 | 40x40 |
| 15 | giraffe | Giraffe | 长脖子、斑点 | 40x40 |
| 16 | whale | Whale | 流线型、喷水 | 40x32 |
| 17 | dolphin | Dolphin | 流线型、背鳍 | 40x32 |
| 18 | bee | Bee | 黄黑条纹、翅膀 | 32x32 |
| 19 | butterfly | Butterfly | 对称翅膀、触角 | 32x32 |
| 20 | hedgehog | Hedgehog | 刺、小脸 | 32x32 |

## 风格变体（5 种）

每个动物模板可应用以下风格：

| 风格 | 特点 | 参数 |
|------|------|------|
| cute | 大头、圆眼、腮红 | head_scale=1.2, eye_size=large, blush=true |
| sleepy | 闭眼、微笑嘴、放松 | eye_style=closed, mouth=tiny_smile, blush=false |
| kawaii | 超大眼、高光、装饰 | eye_style=sparkle, highlight=true, bow=true |
| simple | 最小颜色、无细节 | colors=3, detail=false, outline=thin |
| detailed | 阴影、纹理、48x48 | shadow=true, texture=true, grid=48 |

## 100 Pattern 组合公式

```
20 animals × 5 styles = 100 patterns
```

示例命名：
- `sleepy-cat` → cat + sleepy
- `cute-panda` → panda + cute
- `kawaii-fox` → fox + kawaii
- `simple-dog` → dog + simple
- `detailed-owl` → owl + detailed

## 后续扩展

下一阶段将依次补充：
- Food Library（10 模板）
- Flower/Plant Library（10 模板）
- Object/Library（10 模板）
- Fantasy/Character Library（10 模板）

形成 300 Pattern 的完整模板体系。

## 文件位置

- 文档：`docs/animal-template-library-v1.md`
- 模板数据：`scripts/image-gen-v3/templates/animals/*.json`
- 风格数据：`scripts/image-gen-v3/templates/styles/*.json`
- Composer 实现：`scripts/image-gen-v3/src/composer.py`
- Renderer 实现：`scripts/image-gen-v3/src/renderer.py`
- 输出示例：`/tmp/bead-template-v3/`
