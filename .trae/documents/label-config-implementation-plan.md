# Label 配置功能实现计划

## 目标
在图表配置面板中添加基础的 Label（标签）配置功能，样式保持简洁。

## 实现步骤

### 1. 修改类型定义 (`types.ts`)
- 新增 `LabelConfig` 接口
  ```typescript
  export interface LabelConfig {
    visible: boolean;
    position?: 'top' | 'bottom' | 'inside' | 'left' | 'right';
  }
  ```
- 在 `PanelEditorConfig` 中添加 `label?: LabelConfig` 字段

### 2. 创建 LabelConfigurator 组件
- 路径：`components/labelConfigurator/labelConfigurator.tsx`
- 功能：
  - 显示标签开关（checkbox）
  - 位置选择（select 下拉框，仅当 visible 为 true 时显示）
- 样式：复用现有组件的简洁样式风格

### 3. 创建样式文件
- 路径：`components/labelConfigurator/labelConfigurator.module.scss`
- 样式保持简洁，与现有组件风格一致

### 4. 集成到 panelEditor.tsx
- 导入 `LabelConfigurator` 组件
- 在 ColorPicker 上方添加 Label 配置区域
- 仅当图表类型非 table/card 时显示

## 文件清单

| 操作 | 文件路径 |
|------|----------|
| 修改 | `types.ts` |
| 新建 | `components/labelConfigurator/labelConfigurator.tsx` |
| 新建 | `components/labelConfigurator/labelConfigurator.module.scss` |
| 修改 | `panelEditor.tsx` |

## 配置结果示例

```typescript
{
  type: 'bar',
  xField: 'category',
  yField: 'value',
  label: {
    visible: true,
    position: 'top'
  }
}
```
