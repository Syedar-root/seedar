# Chart 组件重构计划

## 目标
将 Chart 组件重构为统一的图表组件，并将 VChart 的所有原始 props 包装到一个 `vchartProps` 对象中。

## 需求
1. 创建统一的 `Chart` 组件（替代 LineChart、BarChart、PieChart）
2. 将 VChart 的所有原始 props 包装到 `vchartProps` 对象中
3. 使用方式：`<Chart vchartProps={{ spec, width, height, ... }} />`
4. 移除 node_modules 依赖，改为 peerDependencies

## 实施步骤

### 步骤 1: 创建统一的 Chart 组件
**文件**: `packages/ui-react/src/components/charts/Chart.tsx`

```tsx
import { Chart as VChart } from '@visactor/react-vchart';
import type { ISpec } from '@visactor/vchart';

export interface ChartProps {
  vchartProps: React.ComponentProps<typeof VChart>;
}

export const Chart: React.FC<ChartProps> = (props) => {
  const { vchartProps } = props;
  return <VChart {...vchartProps} />;
};
```

### 步骤 2: 更新类型定义
**文件**: `packages/ui-react/src/types/chart.ts`

删除所有自定义类型定义，只导出 VChart 的类型：

```ts
export type { ISpec } from '@visactor/vchart';
```

### 步骤 3: 更新图表组件导出
**文件**: `packages/ui-react/src/components/charts/index.ts`

```ts
export { Chart } from './Chart';
```

### 步骤 4: 更新主入口文件
**文件**: `packages/ui-react/src/index.tsx`

修改导出：
- 移除 `ChartContainer` 导出（如果不再使用）
- 移除 `LineChart`、`BarChart`、`PieChart` 导出
- 添加 `Chart` 导出
- 移除自定义图表类型导出，只导出 `ISpec`

### 步骤 5: 更新 package.json
**文件**: `packages/ui-react/package.json`

将所有依赖改为 `peerDependencies`：

```json
{
  "peerDependencies": {
    "react": ">=18.0.0",
    "react-dom": ">=18.0.0",
    "@seedar/types": "workspace:*",
    "@seedar/ui-core": "workspace:*",
    "@tanstack/react-query": "^5.0.0",
    "@visactor/react-vchart": "^2.0.17",
    "@visactor/vchart": "^2.0.17"
  },
  "devDependencies": {
    "@types/react": "^18.3.27",
    "@types/react-dom": "^18.3.7"
  }
}
```

### 步骤 6: 更新 TypeScript 配置
**文件**: `tsconfig.base.json`

移除 `@seedar/ui-react` 的路径映射（因为现在使用 peerDependencies）：

```json
{
  "paths": {
    "@seedar/ui-core": ["./packages/ui-core/src/index.ts"]
  }
}
```

### 步骤 7: 清理旧文件
删除以下文件：
- `packages/ui-react/src/components/charts/LineChart.tsx`
- `packages/ui-react/src/components/charts/BarChart.tsx`
- `packages/ui-react/src/components/charts/PieChart.tsx`

### 步骤 8: 清理依赖
运行以下命令清理 node_modules：

```bash
cd packages/ui-react
pnpm install
```

## 使用示例

重构后的使用方式：

```tsx
import { Chart } from '@seedar/ui-react';

// 折线图
<Chart 
  vchartProps={{
    spec: {
      type: 'line',
      data: { values: data },
      series: [{
        type: 'line',
        xField: 'date',
        yField: 'value'
      }]
    },
    width: 600,
    height: 400,
    theme: 'light'
  }}
/>

// 柱状图
<Chart 
  vchartProps={{
    spec: {
      type: 'bar',
      data: { values: data },
      series: [{
        type: 'bar',
        xField: 'category',
        yField: 'amount'
      }]
    },
    width: 600,
    height: 400
  }}
/>

// 饼图
<Chart 
  vchartProps={{
    spec: {
      type: 'pie',
      data: { values: data },
      series: [{
        type: 'pie',
        categoryField: 'name',
        valueField: 'count'
      }]
    },
    width: 600,
    height: 400
  }}
/>
```

## 优势

1. **统一的 API** - 只有一个 Chart 组件
2. **完整的 VChart 支持** - 所有 VChart 的 props 都可以通过 `vchartProps` 传递
3. **类型安全** - 完整的 TypeScript 类型支持
4. **类似 shadcn** - 不打包，直接引用源码
5. **无 node_modules** - 所有依赖都是 peerDependencies
6. **灵活性** - 用户可以自由配置任何图表类型和选项
