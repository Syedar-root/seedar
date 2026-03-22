# PanelEditor 重构计划：配置组件映射表方案

## 目标

将 PanelEditor 中散落的条件判断逻辑重构为配置映射表模式，提升代码的可维护性和扩展性。

---

## 实现步骤

### 1. 扩展 types.ts - 添加统一 Props 接口

**文件**: `apps/web-client/src/modules/panel/components/panelEditor/types.ts`

**改动**:
- 新增 `ConfigPanelProps` 接口，统一所有配置组件的 Props

```typescript
import type { DragItem } from "../dndHelper/dragZone/dragZone";

export interface ConfigPanelProps {
  fields: DragItem[];
  metrics: DragItem[];
  config: PanelEditorConfig;
  onChange: (config: Partial<PanelEditorConfig>) => void;
}
```

---

### 2. 创建配置映射表 configRegistry.ts

**文件**: `apps/web-client/src/modules/panel/components/panelEditor/configRegistry.ts` (新建)

**内容**:
- 定义 `PANEL_CONFIG_REGISTRY` 映射表
- 导出 `getConfigComponents` 函数

```typescript
import type { DisplayPanelType, ConfigPanelProps } from './types';
import { ChartConfigPanel } from './components/configPanels/chartConfigPanel';
import { TableConfigPanel } from './components/configPanels/tableConfigPanel';
import { CardConfigPanel } from './components/configPanels/cardConfigPanel';
import { PieSpecialConfig } from './components/configPanels/specialConfigs/pieSpecialConfig';
import { ScatterSpecialConfig } from './components/configPanels/specialConfigs/scatterSpecialConfig';
import { RadarSpecialConfig } from './components/configPanels/specialConfigs/radarSpecialConfig';

type ConfigComponent = React.FC<ConfigPanelProps>;

interface PanelConfig {
  components: ConfigComponent[];
}

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

export function getConfigComponents(type: DisplayPanelType): ConfigComponent[] {
  return PANEL_CONFIG_REGISTRY[type]?.components || [];
}
```

---

### 3. 创建配置面板组件目录结构

**目录**: `apps/web-client/src/modules/panel/components/panelEditor/components/configPanels/`

#### 3.1 创建 chartConfigPanel.tsx

图表通用配置包装器，组合 FieldMapper、LabelConfigurator、ColorPicker。

#### 3.2 创建 tableConfigPanel.tsx

表格配置面板（placeholder）。

#### 3.3 创建 cardConfigPanel.tsx

卡片配置面板（placeholder）。

#### 3.4 创建 specialConfigs 目录

- `pieSpecialConfig.tsx` - 饼图专用配置（placeholder）
- `scatterSpecialConfig.tsx` - 散点图专用配置（placeholder）
- `radarSpecialConfig.tsx` - 雷达图专用配置（placeholder）

#### 3.5 创建 index.ts

统一导出所有配置面板组件。

---

### 4. 重构 panelEditor.tsx

**文件**: `apps/web-client/src/modules/panel/components/panelEditor/panelEditor.tsx`

**改动**:
- 移除条件判断逻辑
- 使用 `getConfigComponents` 获取配置组件
- 简化 JSX 渲染逻辑

---

## 文件变更清单

| 操作 | 文件路径 |
|------|----------|
| 修改 | `types.ts` |
| 新建 | `configRegistry.ts` |
| 新建 | `components/configPanels/index.ts` |
| 新建 | `components/configPanels/chartConfigPanel.tsx` |
| 新建 | `components/configPanels/tableConfigPanel.tsx` |
| 新建 | `components/configPanels/cardConfigPanel.tsx` |
| 新建 | `components/configPanels/specialConfigs/pieSpecialConfig.tsx` |
| 新建 | `components/configPanels/specialConfigs/scatterSpecialConfig.tsx` |
| 新建 | `components/configPanels/specialConfigs/radarSpecialConfig.tsx` |
| 修改 | `panelEditor.tsx` |

---

## 预期效果

### 改造前

```tsx
{fieldConfig && <FieldMapper ... />}
{currentType !== "table" && currentType !== "card" && (
  <>
    <LabelConfigurator ... />
    <ColorPicker ... />
  </>
)}
```

### 改造后

```tsx
{configComponents.map((Component, index) => (
  <Component
    key={index}
    fields={fields}
    metrics={metrics}
    config={currentConfig}
    onChange={handleConfigChange}
  />
))}
```

---

## 扩展示例

新增类型只需在 `configRegistry.ts` 添加一行：

```typescript
const PANEL_CONFIG_REGISTRY = {
  // ...existing
  gauge: { components: [ChartConfigPanel, GaugeSpecialConfig] },
};
```
