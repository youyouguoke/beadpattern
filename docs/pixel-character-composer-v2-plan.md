# Pixel Character Composer v2.0 (PCCv2)

## 1. 背景

v1.1 的问题是 **Template Grammar 太弱**：本质上是 shape generator，不是 character designer。导致生成的动物都是 emoji/icon 级别：
- 只有头，缺少身体、姿态、pose
- 眼睛是单个像素点，没有层次
- 耳朵是方块，没有垂感/形态
- 缺少 head/body/feature/accessory 分层

**结论**：暂停 LightEngine，先升级 Composer 的结构表达能力。

---

## 2. v2.0 架构

```
Animal Concept
     ↓
Character Skeleton  (head_ratio, body_ratio, pose)
     ↓
Silhouette Builder  (head ellipse + body ellipse + ears + tail)
     ↓
Feature Placement   (eyes, nose, mouth, blush, whiskers)
     ↓
Color Blocking      (base color, shadow, highlight, accent)
     ↓
Pixel Artist Engine v1.1 (retoucher, 不改结构)
```

### 2.1 Character Skeleton 数据结构

```python
{
    "type": "panda",
    "body": {
        "head_ratio": 0.55,     # head 占整体高度比例
        "body_ratio": 0.45,     # body 占整体高度比例
        "pose": "sitting"       # sitting | standing | lying | waving | hugging
    },
    "features": {
        "eye_distance": 0.28,   # 两眼中心距离 / head 宽度
        "nose_y": 0.58,         # 鼻子在 head 中的纵向位置
        "ear_type": "round",    # round | pointy | floppy | tufted
        "ear_size": 0.35,       # 耳朵半径 / head 半径
        "body_shape": "oval"    # oval | round | pear
    },
    "accessories": ["belly", "arms", "feet"]
}
```

### 2.2 Anatomy Engine 设计

所有动物共享同一套解剖层：

| Layer | 描述 | 可配置项 |
|-------|------|----------|
| `silhouette` | 整体轮廓：头 + 身体 + 耳朵 + 尾巴 | pose, head_ratio, body_ratio |
| `base` | 主体填充色 | 动物专属 |
| `patch` | 斑纹/眼圈/耳朵内侧 | 熊猫眼圈、狗耳朵 |
| `face` | 脸部区域（ usually 白色或浅色） | 嘴套、眉心 |
| `feature` | 五官：眼、鼻、嘴、腮红 | 多种变体 |
| `shading` | 阴影/高光 | 不依赖 LightEngine |
| `outline` | 外轮廓线 | 黑色 |

### 2.3 Feature Morphing 变体库

#### 眼睛变体
- `dot`：单点（v1.1）
- `round`：2x2 圆形 + 高光
- `big`：3x3 大眼 + 多层 + 泪光
- `sleepy_line`：闭眼线
- `sleepy_curve`：弯月眼
- `wink`：单眨眼
- `heart`：爱心眼
- `sparkle`：星星眼

#### 耳朵变体
- `round`：圆耳（bear, panda）
- `pointy`：尖耳（cat, fox, rabbit）
- `floppy`：垂耳（dog, rabbit）
- `tufted`：簇状耳（owl）
- `none`：无耳（penguin）

#### 嘴巴变体
- `tiny`：小嘴
- `smile`：微笑弧线
- `open`：张嘴（可加舌头）
- `cat`：猫嘴 W
- `tongue`：吐舌
- `laugh`：大笑

#### 身体姿态
- `sitting`：坐姿（腿收在身体下）
- `standing`：站姿（四脚站立）
- `lying`：趴姿
- `waving`：挥手
- `hugging`：抱心
- `eating`：吃东西（熊猫吃竹子）

---

## 3. Golden Characters 20 Samples

| 动物 | 姿态/变体 | 数量 |
|------|----------|------|
| Cat | sitting, standing, waving | 3 |
| Panda | sitting, eating bamboo, waving | 3 |
| Rabbit | sitting, floppy, standing | 3 |
| Dog | sitting, puppy, corgi/shiba | 3 |
| Fox | sitting, standing, waving | 3 |
| Penguin | standing, waving, lying | 3 |
| Bear | sitting, standing | 2 |
| Koala | sitting | 1 |
| Owl | perching | 1 |
| Frog | sitting | 1 |

共 20 个 Golden Samples。

---

## 4. 接受标准（Regression）

| 指标 | v1.1 基线 | v2.0 目标 | 验证方法 |
|------|-----------|-----------|----------|
| Shape score | 当前 | +10% | QualityValidator.shape_score |
| Feature score | 当前 | +10% | QualityValidator.feature_score |
| Craftability | 当前 | 不降低 | CraftabilityChecker |
| Visual inspection | emoji/icon | Pinterest/Etsy 级别 | 人工检查 20 samples |

---

## 5. 实现路径

1. 在 `scripts/image-gen-v3/` 下创建 `composer_v2.py`
2. 保留 `COLORS`, `HEX_MAP`, `render_grid`, `to_hex_grid`, `to_color_palette` 兼容
3. 新增 `CharacterSkeleton`, `AnatomyEngine`, `FeatureMorphing`
4. 重写 6 个 Golden 动物的 compose 函数，加入 body/pose/ear/mouth 变体
5. 生成 20 个样本，跑 regression 测试
6. 输出 cover/finished 图片和 JSON meta

---

## 6. 不破坏的地方

- `grid_data` 格式：仍然输出 hex grid 列表
- `color_palette` 格式：仍然输出 `[{name, hex, count}]`
- `render_grid` 输入：仍然接受字符 grid
- 下游 `Pixel Artist Engine`：继续作为 retoucher，不修改结构
- `QualityValidator` / `CraftabilityChecker`：复用，但增强 feature score

---

## 7. 关键洞察

最终质量 = 70% 结构 + 20% 色彩 + 10% 光影。

v1.1 结构 60 分，加 LightEngine 最多 70 分。
v2.0 结构升级后可直接到 85 分。

所以：先暂停 LightEngine，把 Composer 做成 **character designer**，而不是 shape generator。
