# Panel 模块图表配置文档

## 概述

Panel 模块是 Seedar 项目中负责数据可视化展示的核心模块，支持多种图表类型的配置与管理。本文档详细介绍该模块支持的图表类型、字段配置规则以及各项配置项的含义，帮助开发者理解图表配置系统的设计与实现。

## 目录结构

```
apps/web-client/src/modules/panel/
├── components/
│   ├── panelEditor/              # 图表配置编辑器核心
│   │   ├── components/
│   │   │   ├── colorPicker/      # 颜色选择器
│   │   │   ├── configPanels/     # 各图表类型配置面板
│   │   │   │   ├── chartConfigPanel.tsx       # 通用图表配置
│   │   │   │   ├── tableConfigPanel.tsx       # 表格配置
│   │   │   │   ├── cardConfigPanel.tsx        # 卡片配置
│   │   │   │   └── specialConfigs/            # 特殊图表专属配置
│   │   │   │       ├── pieSpecialConfig.tsx   # 饼图专属
│   │   │   │       ├── scatterSpecialConfig.tsx # 散点图专属
│   │   │   │       └── radarSpecialConfig.tsx  # 雷达图专属
│   │   │   ├── fieldMapper/      # 字段映射器
│   │   │   ├── labelConfigurator/ # 标签配置器
│   │   │   ├── legendConfigurator/ # 图例配置器
│   │   │   └── typeSelector/     # 图表类型选择器
│   │   ├── configRegistry.ts     # 配置组件注册表
│   │   ├── panelEditor.tsx       # 配置编辑器主组件
│   │   └── types.ts             # 类型定义
│   ├── queryZone/               # 查询区域组件
│   ├── aside/                   # 侧边栏组件
│   └── ...
├── hooks/
│   ├── usePreviewSpec.ts        # 生成预览规格的 Hook
│   ├── usePanelEditorState.ts   # 编辑器状态管理
│   └── ...
└── pages/
    └── panelPage.tsx            # 面板页面
```

## 支持的图表类型

Panel 模块支持以下 8 种图表类型，通过 `DisplayPanelType` 类型定义：

| 类型标识符 | 显示名称 | 说明 |
|------------|----------|------|
| `table` | 表格 | 表格形式展示数据 |
| `card` | 卡片 | 卡片形式展示数据 |
| `line` | 折线图 | 用于展示数据趋势 |
| `bar` | 柱状图 | 用于展示数据对比 |
| `area` | 面积图 | 用于展示数据趋势及总量 |
| `pie` | 饼图 | 用于展示数据占比 |
| `scatter` | 散点图 | 用于展示数据分布 |
| `radar` | 雷达图 | 用于展示多维度数据 |

## 配置注册机制

### 配置组件注册表

系统通过 `configRegistry.ts` 中的 `PANEL_CONFIG_REGISTRY` 对象管理不同图表类型对应的配置组件：

```typescript
const PANEL_CONFIG_REGISTRY: Record<DisplayPanelType, PanelConfig> = {
  table: { components: [TableConfigPanel] },
  card: { components: [CardConfigPanel] },
  line: { components: [ChartConfigPanel] },
  bar: { components: [ChartConfigPanel] },
  area: { components: [ChartConfigPanel] },
  pie: { components: [ChartConfigPanel, PieSpecialConfig] },
  scatter: { components: [ChartConfigPanel, ScatterSpecialConfig] },
  radar: { components: [ChartConfigPanel, RadarSpecialConfig] },
};
```

从上述配置可以看出：
- **表格和卡片** 使用专用的配置面板（当前为空实现）
- **折线图、柱状图、面积图** 使用通用图表配置面板
- **饼图、散点图、雷达图** 使用通用图表配置面板 + 专属配置组件（当前专属配置为空）

## 字段配置详解

### PanelEditorConfig 接口

```typescript
interface PanelEditorConfig {
  type?: ChartType;           // 图表类型
  xField?: string;             // X轴字段
  yField?: string;             // Y轴字段
  seriesField?: string;        // 系列字段
  categoryField?: string;      // 分类字段
  valueField?: string;         // 数值字段
  sizeField?: string;          // 大小字段
  color?: string[];            // 颜色数组
  label?: LabelConfig;         // 标签配置
  legends?: LegendConfig;       // 图例配置
}
```

### 各图表类型字段配置

系统通过 `CHART_FIELD_CONFIGS` 定义不同图表类型的必填和可选字段：

```typescript
export const CHART_FIELD_CONFIGS: Record<ChartType, ChartFieldConfig> = {
  line: { required: ["xField", "yField"], optional: ["seriesField"] },
  bar: { required: ["xField", "yField"], optional: ["seriesField"] },
  area: { required: ["xField", "yField"], optional: ["seriesField"] },
  pie: { required: ["categoryField", "valueField"], optional: [] },
  scatter: {
    required: ["xField", "yField"],
    optional: ["seriesField", "sizeField"],
  },
  radar: {
    required: ["categoryField", "valueField"],
    optional: ["seriesField"],
  },
};
```

#### 字段说明

| 字段名称 | 中文名称 | 适用图表类型 |
|----------|----------|--------------|
| `xField` | X轴字段 | line, bar, area, scatter |
| `yField` | Y轴字段 | line, bar, area, scatter |
| `seriesField` | 系列字段 | line, bar, area, scatter, radar |
| `categoryField` | 分类字段 | pie, radar |
| `valueField` | 数值字段 | pie, radar |
| `sizeField` | 大小字段 | scatter |

#### 配置对照表

| 图表类型 | 必填字段 | 可选字段 | 用途说明 |
|----------|----------|----------|----------|
| **折线图 (line)** | xField, yField | seriesField | xField为X轴数据，yField为Y轴数据，seriesField用于多系列分组 |
| **柱状图 (bar)** | xField, yField | seriesField | 同折线图，用于分类数据对比 |
| **面积图 (area)** | xField, yField | seriesField | 同折线图，强调数据总量趋势 |
| **饼图 (pie)** | categoryField, valueField | 无 | categoryField为分类项，valueField为对应数值 |
| **散点图 (scatter)** | xField, yField | seriesField, sizeField | xField/yField为坐标，seriesField分组，sizeField控制点大小 |
| **雷达图 (radar)** | categoryField, valueField | seriesField | categoryField为维度名称，valueField为各维度数值 |

## 通用配置项

### 颜色配置

#### ColorPicker 组件

颜色配置用于设置图表的配色方案，支持自定义添加、修改和删除颜色。

```typescript
interface ColorPickerProps {
  colors: string[];           // 颜色数组
  onChange: (colors: string[]) => void;  // 颜色变更回调
}
```

#### 默认颜色

系统预设了 8 种默认颜色：

```typescript
export const DEFAULT_COLORS = [
  "#5470c6",  // 蓝色
  "#91cc75",  // 绿色
  "#fac858",  // 黄色
  "#ee6666",  // 红色
  "#73c0de",  // 浅蓝色
  "#3ba272",  // 深绿色
  "#fc8452",  // 橙色
  "#9a60b4",  // 紫色
];
```

#### 功能特性

- **修改颜色**：点击颜色块可打开系统颜色选择器
- **添加颜色**：支持动态添加新的颜色到调色板
- **删除颜色**：支持删除不需要的颜色
- **实时预览**：颜色变更后立即反映在图表上

### 标签配置

#### LabelConfigurator 组件

数据标签是显示在图表数据点上的文本标注。

```typescript
interface LabelConfig {
  visible: boolean;  // 是否显示标签
}
```

#### 功能特性

- **显示控制**：通过复选框开关标签的显示/隐藏
- **简化设计**：当前版本仅支持开关控制，更详细的标签样式配置待实现

### 图例配置

#### LegendConfigurator 组件

图例用于解释图表中各数据系列或分类的含义。

```typescript
interface LegendConfig {
  visible: boolean;           // 是否显示图例
  orient: LegendOrient;        // 图例位置
  layout: LegendLayout;        // 图例布局方向
  title?: string;              // 图例标题（可选）
}

type LegendOrient = "left" | "top" | "right" | "bottom";
type LegendLayout = "horizontal" | "vertical";
```

#### 配置选项

**位置选项 (LegendOrient)**：

| 值 | 标签 | 说明 |
|-----|------|------|
| `top` | 上 | 图例显示在图表上方 |
| `bottom` | 下 | 图例显示在图表下方 |
| `left` | 左 | 图例显示在图表左侧 |
| `right` | 右 | 图例显示在图表右侧 |

**布局选项 (LegendLayout)**：

| 值 | 标签 | 说明 |
|-----|------|------|
| `horizontal` | 水平 | 图例项水平排列 |
| `vertical` | 垂直 | 图例项垂直排列 |

#### 自动布局规则

当选择 `left` 或 `right` 位置时，布局自动切换为 `vertical`（垂直）；当选择 `top` 或 `bottom` 位置时，布局自动切换为 `horizontal`（水平）。

#### 功能特性

- **显示控制**：通过复选框开关图例的显示/隐藏
- **位置调整**：支持下、上、左、右四个位置
- **布局调整**：支持水平和垂直两种布局方式
- **标题设置**：支持自定义图例标题（可选）

## 字段映射器

### FieldMapper 组件

字段映射器是图表配置的核心组件，负责将数据集中的字段映射到图表的各个维度。

```typescript
interface FieldMapperProps {
  fields: DragItem[];           // 维度字段列表
  metrics: DragItem[];           // 指标字段列表
  config: PanelEditorConfig;     // 当前配置
  fieldConfig: ChartFieldConfig; // 当前图表类型的字段配置
  onChange: (config: Partial<PanelEditorConfig>) => void;
}
```

#### 字段分组

字段选择器中的字段分为两组：

1. **维度**：来自 `fields` 列表，代表数据的维度属性（如时间、地区、产品类别等）
2. **指标**：来自 `metrics` 列表，代表数据的量化指标（如销售额、数量、增长率等）

#### 选择器交互

- **必填字段**：标记为必填（显示红色星号 `*`），用户必须选择
- **可选字段**：不标记必填状态，用户可选择是否配置
- **清空操作**：支持将已选字段清空（选择空值）

## 配置状态管理

### usePanelEditorState Hook

管理面板编辑器的整体状态，包括：

- 已拖拽的维度字段 (`dropFields`)
- 已拖拽的指标字段 (`dropMetrics`)
- 已拖拽的筛选条件 (`dropFilters`)
- 当前展示类型 (`displayType`)
- 当前编辑器配置 (`editorConfig`)
- 临时数据 (`tempData`)
- 面板数据 (`panelData`)

### usePreviewSpec Hook

根据当前的展示类型和编辑器配置生成预览规格 (`previewSpec`)，用于渲染图表。

**生成逻辑**：

```typescript
const baseSpec = {
  type: displayType,
};

if (editorConfig.color?.length) {
  baseSpec.color = editorConfig.color;
}

if (editorConfig.label?.visible) {
  baseSpec.label = { visible: true };
}

if (editorConfig.legends?.visible) {
  baseSpec.legends = {
    visible: true,
    orient: editorConfig.legends.orient,
    layout: editorConfig.legends.layout,
    ...(editorConfig.legends.title && {
      title: { visible: true, text: editorConfig.legends.title },
    }),
  };
}
```

## 图表类型切换时的配置重置

当用户切换图表类型时，系统通过 `resetConfigForType` 函数智能迁移配置：

1. **保留颜色配置**：始终保留用户自定义的颜色配置
2. **表格/卡片切换**：仅保留颜色配置，清空其他配置
3. **图表类型切换**：根据新图表类型的字段配置，过滤保留兼容的字段映射

## 特殊图表专属配置（待实现）

当前版本中，以下专属配置组件为空实现：

### PieSpecialConfig（饼图专属配置）

```typescript
export const PieSpecialConfig: React.FC<ConfigPanelProps> = () => {
  return null;
};
```

**潜在扩展方向**：
- 饼图环形/实心切换
- 饼图起始角度设置
- 标签连接线样式
- 百分比/实际值显示切换

### ScatterSpecialConfig（散点图专属配置）

```typescript
export const ScatterSpecialConfig: React.FC<ConfigPanelProps> = () => {
  return null;
};
```

**潜在扩展方向**：
- 点大小范围设置
- 气泡效果开关
- 回归线显示
- 趋势线配置

### RadarSpecialConfig（雷达图专属配置）

```typescript
export const RadarSpecialConfig: React.FC<ConfigPanelProps> = () => {
  return null;
};
```

**潜在扩展方向**：
- 雷达形状（多边形/圆形）
- 网格线样式
- 区域填充透明度
- 坐标轴标签位置

## 配置示例

### 折线图配置示例

```javascript
{
  type: "line",
  xField: "orderDate",
  yField: "salesAmount",
  seriesField: "region",
  color: ["#5470c6", "#91cc75", "#fac858"],
  label: { visible: true },
  legends: {
    visible: true,
    orient: "top",
    layout: "horizontal",
    title: "地区销售趋势"
  }
}
```

### 饼图配置示例

```javascript
{
  type: "pie",
  categoryField: "productCategory",
  valueField: "revenue",
  color: ["#5470c6", "#91cc75", "#fac858", "#ee6666", "#73c0de"],
  label: { visible: true },
  legends: {
    visible: true,
    orient: "right",
    layout: "vertical"
  }
}
```

### 散点图配置示例

```javascript
{
  type: "scatter",
  xField: "advertisingBudget",
  yField: "salesRevenue",
  seriesField: "marketingChannel",
  sizeField: "marketSize",
  color: ["#5470c6", "#91cc75"],
  legends: {
    visible: true,
    orient: "bottom",
    layout: "horizontal"
  }
}
```

## 总结

Panel 模块的图表配置系统采用模块化设计，通过注册机制灵活支持多种图表类型。核心配置包括：

1. **字段映射**：将数据字段映射到图表维度
2. **颜色配置**：自定义图表配色方案
3. **标签配置**：控制数据点标签的显示
4. **图例配置**：控制图例的位置、布局和标题

未来可通过扩展 `specialConfigs` 下的专属配置组件，为各类图表添加更丰富的定制选项。
