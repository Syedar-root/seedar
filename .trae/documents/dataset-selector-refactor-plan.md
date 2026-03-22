# 数据集选择器组件拆分与样式优化计划

## 目标

将 `panelPage.tsx` 中的数据集选择功能拆分为独立、可复用的 `DatasetSelector` 组件，并优化样式设计以提升用户体验。

## 背景

当前 `panelPage.tsx` 中包含两种视图：
1. **数据集选择视图** - 当没有 `panelId` 时显示，用于创建新看板
2. **看板编辑视图** - 当有 `panelId` 时显示，用于编辑现有看板

数据集选择视图的代码直接内嵌在页面中，样式定义在 `panel.module.scss` 中，不利于复用和维护。

## 实施步骤

### 步骤 1: 创建组件目录结构

创建新目录和文件：
```
apps/web-client/src/modules/panel/components/datasetSelector/
├── datasetSelector.tsx        # 组件主文件
├── datasetSelector.module.scss # 样式文件
└── index.ts                   # 导出文件
```

### 步骤 2: 实现 DatasetSelector 组件

**组件接口设计：**
```typescript
interface DatasetSelectorProps {
  datasets: DatasetResponse[];
  onSelect: (dataset: DatasetResponse) => void;
  isLoading?: boolean;
}
```

**功能特性：**
- [x] 前端实时搜索过滤（按名称/描述）
- [x] 空状态提示（区分"无数据"和"搜索无结果"）
- [x] 加载状态展示
- [x] 显示数据集详细信息（字段数、指标数、数据源）

### 步骤 3: 样式设计（遵循 UI/UX Pro Max 指南）

| 设计原则 | 实现方式 |
|---------|---------|
| 间距系统 | 4/8/12/16/20/24/32px 递增节奏 |
| 触摸目标 | 卡片最小高度 160px，按钮区域充足 |
| 动画时长 | 150-200ms 过渡动画 |
| 对比度 | 主色 #007bff，文字对比度 > 4.5:1 |
| 响应式 | 移动端单列布局，桌面端自适应网格 |
| 交互反馈 | 悬停上浮 + 阴影 + 边框变色 |

**样式特性：**
- 渐变背景容器
- 圆角卡片设计（12px）
- 搜索框聚焦动效
- 卡片悬停动画（上浮 4px + 阴影）
- 图标装饰（数据库图标）
- 响应式断点（640px）

### 步骤 4: 修改 panelPage.tsx

**变更内容：**
1. 添加 `DatasetSelector` 组件导入
2. 替换内联的数据集选择 JSX 为 `<DatasetSelector />` 组件
3. 移除 `panel.module.scss` 中不再使用的样式类：
   - `.datasetSelector`
   - `.datasetSelectorContent`
   - `.datasetSelectorTitle`
   - `.datasetSelectorDesc`
   - `.datasetList`
   - `.datasetItem`
   - `.datasetItemName`
   - `.datasetItemDesc`

### 步骤 5: 清理旧样式

从 `panel.module.scss` 中移除数据集选择器相关的旧样式定义。

## 文件变更清单

| 操作 | 文件路径 |
|------|---------|
| 新建 | `components/datasetSelector/datasetSelector.tsx` |
| 新建 | `components/datasetSelector/datasetSelector.module.scss` |
| 新建 | `components/datasetSelector/index.ts` |
| 修改 | `pages/panelPage.tsx` |
| 修改 | `pages/styles/panel.module.scss` |

## 验证清单

- [ ] 组件正确渲染数据集列表
- [ ] 搜索功能正常工作
- [ ] 空状态正确显示
- [ ] 点击卡片触发 onSelect 回调
- [ ] 响应式布局正常
- [ ] 无 TypeScript 类型错误
- [ ] 无 ESLint 警告
