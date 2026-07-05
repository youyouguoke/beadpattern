# BeadPatternAI 前端测试

本测试套件覆盖前端核心数据服务与关键组件的交互场景。

## 测试框架

- **Jest** + **ts-jest**（TypeScript 支持）
- **jsdom**（浏览器环境模拟）
- **@testing-library/react**（组件渲染与查询）
- **@testing-library/user-event**（用户交互模拟）
- **@testing-library/jest-dom**（DOM 断言）

## 文件结构

```
src/__tests__/
├── setupTests.ts                         # 测试环境初始化（localStorage mock）
├── lib/
│   └── patternService.test.ts            # 数据服务单元测试
└── components/
    ├── Footer.test.tsx                   # Footer Newsletter 订阅交互
    ├── BeadPatternGenerator.test.tsx     # AI 生成器交互
    ├── PatternDetail.test.tsx            # 详情页加载与 Save 按钮
    └── PatternArchive.test.tsx           # 归档/搜索/分类展示
```

## 运行方式

```bash
# 运行所有测试
cd /root/projects/BeadPatternAI/built/my-app
npm test

# 监听模式
npm run test:watch

# CI 模式（含覆盖率）
npm run test:ci

# 只运行单个测试文件
npx jest --testPathPattern="patternService.test.ts"
```

## 测试场景说明

### 1. patternService（数据服务）

验证所有数据服务函数与后端 API 的交互行为：

| 测试 | 覆盖点 |
|------|--------|
| `getAllPatterns` | 返回后端数据；网络失败时回退 mock |
| `getPattern` | 根据 slug 获取详情，合并 tags/analytics |
| `getTrendingPatterns` | 请求 `sort=popular`，返回不超过 8 条 |
| `getCollections` | 从 `/api/tags` 构建集合列表 |
| `getCategories` | 过滤掉 `difficulty` 类型标签 |
| `getCategoryBySlug` | 后端无匹配时回退 mock categories |
| `getRelatedPatterns` | 调用 `/api/recommend` |
| `createPattern` | POST 创建图案，成功/失败处理 |
| `searchPatterns` | 调用搜索接口并返回结果 |

### 2. Footer Newsletter

| 测试 | 场景 |
|------|------|
| 渲染表单 | 邮箱输入框和提交按钮存在 |
| 成功订阅 | 显示 "Thanks for subscribing!" 并清空输入 |
| 重复订阅 | 显示 "You're already subscribed!" |
| 订阅失败 | 后端返回错误，显示对应错误消息 |
| 网络异常 | fetch 抛错，显示 "Network error" |
| 空邮箱 | 不触发提交，不调用 fetch |

### 3. BeadPatternGenerator（AI 生成器）

| 测试 | 场景 |
|------|------|
| 渲染表单 | 标题、生成按钮存在 |
| 加载状态 | 点击生成后按钮禁用并显示 "Drafting your pattern..." |
| 生成成功 | 显示 View Pattern / Color Chart / Share 按钮 |
| 生成失败 | 后端失败时显示 "Generation failed" |

### 4. PatternDetail（详情页）

| 测试 | 场景 |
|------|------|
| 加载详情 | 渲染标题、Save 按钮 |
| Save 切换 | 点击 Save 变 Saved，再次点击取消保存 |

### 5. PatternArchive（归档/搜索/分类）

| 测试 | 场景 |
|------|------|
| 渲染搜索标题 | 传入 `searchQuery` 时显示对应查询标题 |
| 展示图案 | 后端返回图案后正确渲染 |
| 分类过滤 | 传入 `categorySlug` 时只显示匹配该分类的图案 |

## 注意事项

- 所有组件测试通过 `jest.mock` 或 `global.fetch` mock 避免真实网络请求。
- `localStorage` 在 `setupTests.ts` 中被替换为内存实现，避免污染真实存储。
- 组件测试中使用 `waitFor` 处理异步状态更新。

## 当前状态

- 已安装测试依赖：`jest`, `ts-jest`, `jsdom`, `@testing-library/*`。
- `jest.config.ts` 已配置 TypeScript 和路径映射。
- 测试脚本已加入 `package.json`：
  - `npm test`
  - `npm run test:watch`
  - `npm run test:ci`
- **全部 28 个测试用例通过。**
