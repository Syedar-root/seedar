# 任务清单

## 阶段一：基础设施搭建

### 1.1 创建 packages 目录结构
- [x] 1.1.1 创建 `packages/` 目录
- [x] 1.1.2 创建 `packages/ui-core/` 目录
- [x] 1.1.3 创建 `packages/ui-core/src/` 目录及子目录结构：
  - `packages/ui-core/src/config/`
  - `packages/ui-core/src/types/`
  - `packages/ui-core/src/utils/`
- [x] 1.1.4 创建 `packages/ui-react/` 目录
- [x] 1.1.5 创建 `packages/ui-react/src/` 目录及子目录结构：
  - `packages/ui-react/src/components/charts/`
  - `packages/ui-react/src/components/common/`
  - `packages/ui-react/src/hooks/`

### 1.2 配置 pnpm-workspace.yaml
- [x] 1.2.1 在项目根目录创建 `pnpm-workspace.yaml` 文件
- [x] 1.2.2 添加以下内容：
  ```yaml
  packages:
    - 'packages/*'
    - 'apps/*'
  ```
- [x] 1.2.3 验证文件格式正确

### 1.3 配置 TypeScript 路径别名
- [x] 1.3.1 读取现有根目录 `tsconfig.json` 文件
- [x] 1.3.2 在 `compilerOptions.paths` 中添加：
  ```json
  "@seedar/ui-core": ["./packages/ui-core/src/index.ts"],
  "@seedar/ui-react": ["./packages/ui-react/src/index.tsx"]
  ```
- [x] 1.3.3 确保 `compilerOptions.baseUrl` 设置为 `"."`
- [x] 1.3.4 更新 `include` 数组，添加 `packages/**/*`

---

## 阶段二：公共核心包 (ui-core) 开发

### 2.1 创建 ui-core/package.json
- [x] 2.1.1 在 `packages/ui-core/` 目录创建 `package.json`
- [x] 2.1.2 配置内容：
  ```json
  {
    "name": "@seedar/ui-core",
    "version": "1.0.0",
    "type": "module",
    "main": "src/index.ts",
    "types": "src/index.ts",
    "exports": {
      ".": "./src/index.ts"
    },
    "dependencies": {
      "@visactor/vchart": "^2.0.17"
    }
  }
  ```
- [x] 2.1.3 验证 package.json 格式正确

### 2.2 实现主题配置 (config/theme.ts)
- [x] 2.2.1 创建 `packages/ui-core/src/config/theme.ts`
- [x] 2.2.2 定义主题类型：
  ```typescript
  export type ThemeType = 'light' | 'dark' | 'auto';
  ```
- [x] 2.2.3 创建默认主题配置对象：
  ```typescript
  export const DEFAULT_THEME: ThemeType = 'light';
  ```
- [x] 2.2.4 创建深色主题配置对象
- [x] 2.2.5 导出主题相关的常量

### 2.3 实现默认配置 (config/defaults.ts)
- [x] 2.3.1 创建 `packages/ui-core/src/config/defaults.ts`
- [x] 2.3.2 从 `@visactor/vchart` 导入类型
- [x] 2.3.3 定义全局默认图表配置：
  ```typescript
  export const DEFAULT_CHART_CONFIG = {
    padding: [16, 16, 16, 16],
    animation: {
      appear: { duration: 600, easing: 'cubicOut' },
    },
    tooltip: { visible: true, trigger: 'item' },
    legends: { visible: true },
  };
  ```
- [x] 2.3.4 导出默认配置对象

### 2.4 实现基础类型定义 (types/chart.ts)
- [x] 2.4.1 创建 `packages/ui-core/src/types/chart.ts`
- [x] 2.4.2 定义图表数据类型：
  ```typescript
  export type ChartData = Record<string, any>[];
  ```
- [x] 2.4.3 定义图表尺寸类型：
  ```typescript
  export type ChartSize = number | string;
  ```
- [x] 2.4.4 定义基础图表 Props 接口：
  ```typescript
  export interface BaseChartProps {
    data: ChartData;
    width?: ChartSize;
    height?: ChartSize;
    theme?: ThemeType;
    padding?: number[];
  }
  ```
- [x] 2.4.5 定义折线图 Props 接口：
  ```typescript
  export interface LineChartProps extends BaseChartProps {
    xField: string;
    yField: string;
    seriesName?: string;
  }
  ```
- [x] 2.4.6 同样定义 BarChartProps、PieChartProps 等

### 2.5 实现工具函数 (utils/)
- [x] 2.5.1 创建 `packages/ui-core/src/utils/data.ts`
- [x] 2.5.2 实现数据验证函数 `validateData(data: any[]): boolean`
- [x] 2.5.3 实现数据转换函数 `transformData(data: any[], mapping: Record<string, string>): any[]`
- [x] 2.5.4 创建 `packages/ui-core/src/utils/format.ts`
- [x] 2.5.5 实现数字格式化函数 `formatNumber(value: number, decimals?: number): string`
- [x] 2.5.6 实现百分比格式化函数 `formatPercent(value: number, decimals?: number): string`

### 2.6 创建统一导出 (index.ts)
- [x] 2.6.1 创建 `packages/ui-core/src/index.ts`
- [x] 2.6.2 导出 config 模块：
  ```typescript
  export * from './config/theme';
  export * from './config/defaults';
  ```
- [x] 2.6.3 导出 types 模块：
  ```typescript
  export * from './types/chart';
  ```
- [x] 2.6.4 导出 utils 模块：
  ```typescript
  export * from './utils/data';
  export * from './utils/format';
  ```

---

## 阶段三：React 组件包 (ui-react) 开发

### 3.1 创建 ui-react/package.json
- [x] 3.1.1 在 `packages/ui-react/` 目录创建 `package.json`
- [x] 3.1.2 配置内容：
  ```json
  {
    "name": "@seedar/ui-react",
    "version": "1.0.0",
    "type": "module",
    "main": "src/index.tsx",
    "types": "src/index.tsx",
    "exports": {
      ".": "./src/index.tsx"
    },
    "peerDependencies": {
      "react": ">=18.0.0",
      "react-dom": ">=18.0.0"
    },
    "dependencies": {
      "@seedar/ui-core": "workspace:*",
      "@visactor/react-vchart": "^2.0.17",
      "@visactor/vchart": "^2.0.17"
    }
  }
  ```

### 3.2 创建 ChartContainer 通用组件
- [x] 3.2.1 创建 `packages/ui-react/src/components/common/ChartContainer.tsx`
- [x] 3.2.2 引入 React 及其类型
- [x] 3.2.3 定义 ChartContainerProps 接口：
  ```typescript
  interface ChartContainerProps {
    width?: number | string;
    height?: number | string;
    children: React.ReactNode;
  }
  ```
- [x] 3.2.4 实现组件：
  ```typescript
  export const ChartContainer: React.FC<ChartContainerProps> = ({
    width = '100%',
    height = 400,
    children,
  }) => {
    return (
      <div style={{ width, height }}>
        {children}
      </div>
    );
  };
  ```
- [x] 3.2.5 创建 `packages/ui-react/src/components/common/index.ts` 导出组件

### 3.3 创建 LineChart 折线图组件
- [x] 3.3.1 创建 `packages/ui-react/src/components/charts/LineChart.tsx`
- [x] 3.3.2 引入必要依赖：
  ```typescript
  import { useMemo } from 'react';
  import { ReactVChart } from '@visactor/react-vchart';
  import { LineChartProps, DEFAULT_CHART_CONFIG } from '@seedar/ui-core';
  ```
- [x] 3.3.3 实现 LineChart 组件：
  ```typescript
  export const LineChart: React.FC<LineChartProps> = (props) => {
    const {
      data,
      width,
      height,
      theme,
      xField,
      yField,
      seriesName = '数据',
    } = props;

    const chartOption = useMemo(
      () => ({
        ...DEFAULT_CHART_CONFIG,
        type: 'line',
        data,
        xField,
        yField,
        series: [{ name: seriesName, type: 'line' }],
      }),
      [data, xField, yField, seriesName]
    );

    return <ReactVChart option={chartOption} width={width} height={height} />;
  };
  ```
- [x] 3.3.4 导出组件类型

### 3.4 创建 BarChart 柱状图组件
- [x] 3.4.1 创建 `packages/ui-react/src/components/charts/BarChart.tsx`
- [x] 3.4.2 引入必要依赖
- [x] 3.4.3 实现 BarChart 组件（参考 LineChart 结构）
- [x] 3.4.4 图表类型设置为 'bar'

### 3.5 创建 PieChart 饼图组件
- [x] 3.5.1 创建 `packages/ui-react/src/components/charts/PieChart.tsx`
- [x] 3.5.2 引入必要依赖
- [x] 3.5.3 实现 PieChart 组件：
  - 图表类型设置为 'pie'
  - 调整数据字段为 categoryField 和 percentField

### 3.6 创建 charts 统一导出
- [x] 3.6.1 创建 `packages/ui-react/src/components/charts/index.ts`
- [x] 3.6.2 导出所有图表组件：
  ```typescript
  export { LineChart } from './LineChart';
  export { BarChart } from './BarChart';
  export { PieChart } from './PieChart';
  ```

### 3.7 创建自定义 Hooks
- [x] 3.7.1 创建 `packages/ui-react/src/hooks/useChartData.ts`:
  - 实现数据验证逻辑
  - 实现数据转换逻辑
  - 返回处理后的数据
- [x] 3.7.2 创建 `packages/ui-react/src/hooks/useChartTheme.ts`:
  - 实现主题切换逻辑
  - 返回当前主题配置
- [x] 3.7.3 创建 `packages/ui-react/src/hooks/index.ts` 导出所有 hooks

### 3.8 创建统一导出 (index.tsx)
- [x] 3.8.1 创建 `packages/ui-react/src/index.tsx`
- [x] 3.8.2 导出组件：
  ```typescript
  export { ChartContainer } from './components/common';
  export * from './components/charts';
  ```
- [x] 3.8.3 导出 hooks：
  ```typescript
  export * from './hooks';
  ```
- [x] 3.8.4 从 ui-core 重新导出类型：
  ```typescript
  export type { 
    BaseChartProps, 
    LineChartProps,
    BarChartProps,
    PieChartProps,
    ChartData,
    ChartSize 
  } from '@seedar/ui-core';
  ```

---

## 阶段四：应用集成与验证

### 4.1 安装依赖
- [x] 4.1.1 在项目根目录执行 `pnpm install`
- [x] 4.1.2 验证 workspace 链接成功
- [x] 4.1.3 检查 @seedar/ui-core 和 @seedar/ui-react 是否正确链接

### 4.2 创建测试页面
- [ ] 4.2.1 在现有应用中创建测试页面 `TestCharts.tsx`
- [ ] 4.2.2 导入图表组件：
  ```typescript
  import { LineChart, BarChart, PieChart } from '@seedar/ui-react';
  ```
- [ ] 4.2.3 准备测试数据：
  ```typescript
  const lineData = [
    { month: '1月', sales: 120 },
    { month: '2月', sales: 200 },
    { month: '3月', sales: 150 },
  ];
  ```
- [ ] 4.2.4 使用组件渲染图表

### 4.3 验证开发热更新
- [ ] 4.3.1 启动开发服务器 `pnpm dev`
- [ ] 4.3.2 打开测试页面，确认图表正常显示
- [ ] 4.3.3 修改 LineChart 组件源码（如修改默认宽度）
- [ ] 4.3.4 验证应用自动刷新，修改生效

### 4.4 验证生产构建
- [ ] 4.4.1 执行生产构建 `pnpm build`
- [ ] 4.4.2 检查构建是否成功
- [ ] 4.4.3 验证构建产物中包含正确的组件代码

---

## 任务依赖关系

```
1.1 (创建目录) → 1.2 (pnpm-workspace) → 1.3 (TypeScript配置)
                                              ↓
2.1 (ui-core package.json) ← 1.3
         ↓
2.2-2.6 (ui-core 各个模块实现)
         ↓
3.1 (ui-react package.json) ← 2.6
         ↓
3.2-3.8 (ui-react 各个组件和hooks实现)
         ↓
4.1 (安装依赖) ← 3.8
         ↓
4.2-4.4 (集成测试和验证)
```

---

## 注意事项

1. 每个任务完成后及时更新 checklist.md
2. 遇到问题及时记录并解决
3. 确保 TypeScript 类型检查无错误
4. 保持代码风格与现有项目一致
