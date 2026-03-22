# Legend 配置组件实现计划

## 概述

实现一个简化版的 Legend（图例）配置组件，支持 5 个核心配置项：visible、orient、layout、title、filter。

## 配置项设计

```typescript
interface LegendConfig {
  visible: boolean;           // 是否显示图例
  orient: 'left' | 'top' | 'right' | 'bottom';  // 图例位置
  layout: 'horizontal' | 'vertical';            // 布局方向
  title?: string;             // 标题文本
  filter: boolean;            // 是否启用数据筛选
}
```

## 实现步骤

### 步骤 1：更新类型定义

**文件**: `apps/web-client/src/modules/panel/components/panelEditor/types.ts`

- 添加 `LegendConfig` 接口定义
- 在 `PanelEditorConfig` 接口中添加 `legend?: LegendConfig` 字段
- 添加 `LEGEND_ORIENT_OPTIONS` 和 `LEGEND_LAYOUT_OPTIONS` 常量

### 步骤 2：创建 LegendConfigurator 组件

**新建目录**: `apps/web-client/src/modules/panel/components/panelEditor/components/legendConfigurator/`

**新建文件**:
- `legendConfigurator.tsx` - 组件实现
- `legendConfigurator.module.scss` - 样式文件
- `index.ts` - 导出文件

**组件功能**:
1. 显示开关 (visible)
2. 位置选择 (orient) - 下拉选择
3. 布局选择 (layout) - 下拉选择
4. 标题输入 (title) - 文本输入框
5. 筛选开关 (filter)

**UI 布局**:
```
┌─────────────────────────────┐
│ 图例配置                     │
├─────────────────────────────┤
│ ☑ 显示图例                   │
├─────────────────────────────┤
│ 位置：[下拉: 上/下/左/右]     │
│ 布局：[下拉: 水平/垂直]       │
├─────────────────────────────┤
│ 标题：[文本输入框]           │
├─────────────────────────────┤
│ ☑ 启用数据筛选               │
└─────────────────────────────┘
```

### 步骤 3：集成到 ChartConfigPanel

**文件**: `apps/web-client/src/modules/panel/components/panelEditor/components/configPanels/chartConfigPanel.tsx`

- 导入 `LegendConfigurator` 组件
- 在 `ChartConfigPanel` 中添加 `LegendConfigurator` 组件
- 传递 `config.legend` 和 `onChange` 回调

### 步骤 4：更新 VChart Transformer

**文件**: `packages/ui-react/src/components/charts/transformer.ts`

- 在 `transformToVChartSpec` 函数中添加 legend 配置转换逻辑
- 将 `LegendConfig` 转换为 VChart 的 `legends` spec 格式

### 步骤 5：添加默认值

**文件**: `apps/web-client/src/modules/panel/components/panelEditor/types.ts`

- 添加 `DEFAULT_LEGEND_CONFIG` 常量，定义默认配置

## 文件变更清单

| 文件路径 | 操作 | 说明 |
|---------|------|------|
| `apps/web-client/.../panelEditor/types.ts` | 修改 | 添加 LegendConfig 类型和常量 |
| `apps/web-client/.../legendConfigurator/legendConfigurator.tsx` | 新建 | 组件实现 |
| `apps/web-client/.../legendConfigurator/legendConfigurator.module.scss` | 新建 | 样式文件 |
| `apps/web-client/.../legendConfigurator/index.ts` | 新建 | 导出文件 |
| `apps/web-client/.../configPanels/chartConfigPanel.tsx` | 修改 | 集成 LegendConfigurator |
| `packages/ui-react/.../charts/transformer.ts` | 修改 | 添加 legend 转换逻辑 |

## 依赖关系

- 参考 `labelConfigurator` 组件的实现模式
- 使用现有的样式变量和类名约定
- 遵循 `ConfigPanelProps` 接口规范
