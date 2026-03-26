# Empty 组件添加 fill 尺寸实现计划

## 需求概述
为 Empty 组件添加 `fill` 尺寸选项，使组件可以充满其父容器，适合全屏或大区域的空状态展示。

## 实现步骤

### 1. 更新类型定义 (Empty.tsx)
- 在 `EmptySize` 类型中添加 `"fill"` 选项
- 类型定义：`export type EmptySize = "small" | "medium" | "large" | "fill";`

### 2. 更新样式文件 (Empty.module.scss)
- 添加 `.fill` 样式类
- 样式特性：
  - 设置 `flex: 1` 或 `height: 100%` 使其充满容器
  - 保持居中对齐
  - 图标尺寸：与 `large` 一致（80px）
  - 文字尺寸：与 `large` 一致
  - 内边距：适当调整以适应全屏场景

### 3. 更新导出文件 (index.ts)
- 确认 `EmptySize` 类型已正确导出（已包含）

## 技术细节

### fill 样式设计
```scss
.fill {
  flex: 1;
  min-height: 100%;
  padding: var(--spacing-xl) var(--spacing-lg);

  .iconWrapper {
    width: 80px;
    height: 80px;
    margin-bottom: var(--spacing-lg);
  }

  .title {
    font-size: var(--font-xl);
  }

  .description {
    font-size: var(--font-base);
  }

  .action {
    margin-top: var(--spacing-xl);
  }
}
```

## 使用示例
```tsx
// 充满父容器
<div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
  <Empty size="fill" type="noData" />
</div>

// 或者
<div style={{ height: '500px' }}>
  <Empty size="fill" type="error" />
</div>
```

## 文件变更清单
1. `Empty.tsx` - 更新类型定义
2. `Empty.module.scss` - 添加 fill 样式
