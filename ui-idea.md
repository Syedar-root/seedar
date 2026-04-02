# 生产级 shadcn/ui 模式 · React VisActor 组件库方案

## （零构建 | 纯源码 | Monorepo | 无打包 | 本地直接引用）

---

## 一、核心理念

完全复刻 **shadcn/ui** 设计思想：

- ✅ **彻底抛弃构建工具**：无 Vite/Rollup/Webpack、无 `dist` 目录、无编译命令
- ✅ **纯源码交付**：组件库仅存放 TS/TSX 源码，由业务项目直接编译
- ✅ **Monorepo 原生支持**：`packages` 存放源码，`apps` 直接导入使用
- ✅ **解耦分离**：公共核心 + React 独立组件包，可单独维护/扩展
- ✅ **生产可用**：热更新、类型安全、无冗余代码、无版本兼容问题

---

## 二、适用场景

- 内部 monorepo 项目共享组件
- 不希望维护打包/发布流程
- 追求极致简洁、源码级复用
- 未来计划做成 shadcn 风格的 CLI 组件库

---

## 三、最终工程结构

```
your-monorepo/
├── pnpm-workspace.yaml    # monorepo 工作空间配置
├── tsconfig.json          # 全局 TypeScript 配置
├── apps/
│   └── react-app          # React 业务应用（直接使用组件）
└── packages/
    ├── visactor-core      # 纯源码公共核心（无框架、双框架复用）
    └── visactor-react     # 纯源码 React 图表组件（独立维护）
```

---

## 四、环境准备

- 安装 `pnpm` (推荐 9.x)
- Node.js >= 18
- TypeScript 环境

---

## 五、完整搭建步骤

### 步骤 1：初始化 Monorepo 根目录

```bash
# 创建根目录
mkdir visactor-shadcn-monorepo && cd visactor-shadcn-monorepo

# 初始化 package.json
pnpm init -y

# 安装全局依赖
pnpm add -D typescript @types/node react react-dom
```

#### 1.1 `pnpm-workspace.yaml`

声明工作空间，让 monorepo 自动关联包

```yaml
packages:
  - 'packages/*'
  - 'apps/*'
```

#### 1.2 根 `tsconfig.json`

全局 TS 配置，统一规范 + 路径别名

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "baseUrl": ".",
    "paths": {
      "@your/visactor-core": ["./packages/visactor-core/src/index.ts"],
      "@your/visactor-react": ["./packages/visactor-react/src/index.tsx"]
    }
  },
  "include": ["packages/**/*", "apps/**/*"],
  "exclude": ["node_modules"]
}
```

---

### 步骤 2：创建公共核心包 `visactor-core`

**纯 TS、无框架、无依赖、纯配置/类型/工具**

```bash
mkdir -p packages/visactor-core/src
cd packages/visactor-core
pnpm init -y
```

#### 2.1 包配置 `package.json`

**零构建配置**，直接指向源码入口

```json
{
  "name": "@your/visactor-core",
  "version": "1.0.0",
  "type": "module",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "files": ["src"],
  "dependencies": {
    "@visactor/vchart": "^1.14.0"
  }
}
```

#### 2.2 核心源码（纯 TS）

`packages/visactor-core/src/config.ts`（全局图表配置）

```typescript
import type { IThemeType } from '@visactor/vchart';

// 生产级默认配置（二次封装核心）
export const DEFAULT_CHART_CONFIG = {
  theme: 'light' as IThemeType,
  padding: [16, 16, 16, 16],
  animation: {
    appear: { duration: 600, easing: 'cubicOut' },
  },
  tooltip: { visible: true, trigger: 'item' },
  legends: { visible: true },
};
```

`packages/visactor-core/src/types.ts`（公共类型）

```typescript
import type { IThemeType } from '@visactor/vchart';

// 所有图表基础 Props
export interface BaseChartProps {
  data: any[];
  width?: number | string;
  height?: number | string;
  theme?: IThemeType;
}
```

`packages/visactor-core/src/index.ts`（统一导出）

```typescript
export * from './config';
export * from './types';
```

---

### 步骤 3：创建 React 组件包 `visactor-react`

**纯 React 源码、零构建、独立维护**

```bash
mkdir -p packages/visactor-react/src/components
cd packages/visactor-react
pnpm init -y

# 安装依赖（仅运行时）
pnpm add @your/visactor-core @visactor/react-vchart @visactor/vchart
```

#### 3.1 包配置 `package.json`

极简配置，**无任何构建脚本**，直接指向源码

```json
{
  "name": "@your/visactor-react",
  "version": "1.0.0",
  "type": "module",
  "main": "src/index.tsx",
  "types": "src/index.tsx",
  "files": ["src"],
  "peerDependencies": {
    "react": ">=18.0.0",
    "react-dom": ">=18.0.0"
  },
  "dependencies": {
    "@your/visactor-core": "workspace:^1.0.0",
    "@visactor/react-vchart": "^1.14.0",
    "@visactor/vchart": "^1.14.0"
  }
}
```

#### 3.2 React 组件源码

`packages/visactor-react/src/components/LineChart.tsx`（生产级折线图）

```tsx
import { useMemo } from 'react';
import { ReactVChart } from '@visactor/react-vchart';
import { DEFAULT_CHART_CONFIG, BaseChartProps } from '@your/visactor-core';

// 组件 Props 类型
export interface LineChartProps extends BaseChartProps {
  xField: string;
  yField: string;
  seriesName?: string;
}

// 封装 VisActor 折线图
export const LineChart = (props: LineChartProps) => {
  const {
    data,
    width,
    height,
    theme,
    xField,
    yField,
    seriesName = '数据',
  } = props;

  // 合并配置 + 性能优化
  const chartOption = useMemo(
    () => ({
      ...DEFAULT_CHART_CONFIG,
      theme: theme ?? DEFAULT_CHART_CONFIG.theme,
      type: 'line',
      data,
      xField,
      yField,
      series: [{ name: seriesName, type: 'line' }],
    }),
    [data, theme, xField, yField, seriesName]
  );

  return <ReactVChart option={chartOption} width={width} height={height} />;
};
```

`packages/visactor-react/src/index.tsx`（组件统一导出）

```tsx
export * from './components/LineChart';
// 后续新增柱状图/饼图，直接在这里导出
// export * from './components/BarChart';
```

---

### 步骤 4：业务应用 `apps/react-app` 接入

**直接导入源码使用，无需构建、无需发布**

#### 4.1 创建 React 项目

```bash
pnpm create vite apps/react-app --template react-ts
cd apps/react-app
pnpm install
```

#### 4.2 安装组件库（本地 Monorepo 直接关联）

```bash
pnpm add @your/visactor-react
```

#### 4.3 业务代码中直接使用

`apps/react-app/src/App.tsx`

```tsx
import { LineChart } from '@your/visactor-react';

function App() {
  // 业务数据
  const chartData = [
    { date: '1月', value: 120 },
    { date: '2月', value: 200 },
    { date: '3月', value: 150 },
    { date: '4月', value: 280 },
  ];

  return (
    <div style={{ padding: 24 }}>
      <h2>VisActor React 图表（shadcn 模式）</h2>
      <LineChart
        data={chartData}
        xField="date"
        yField="value"
        seriesName="销量"
        width={800}
        height={400}
      />
    </div>
  );
}

export default App;
```

#### 4.4 启动项目

```bash
pnpm dev
```

✅ **直接运行**，修改 `packages` 下的组件源码，业务应用**实时热更新**

---

## 六、开发调试规范

1. **无需构建命令**：全程无 `build` / `dev` 打包脚本
2. **热更新**：修改组件源码，apps 自动刷新
3. **类型提示**：全 TS 支持，IDE 自动提示
4. **无冗余文件**：仅保留 `src` 源码，无 `dist` / `node_modules` 冗余

---

## 七、扩展：发布为 shadcn/ui 风格的 CLI 组件库

如果需要对外提供使用，可完全复刻 shadcn/ui 模式：

1. 将 `packages/visactor-react` 推送到 GitHub
2. 开发一个简易 CLI 工具（参考 shadcn/ui）
3. 用户通过命令**一键复制组件源码到自己项目**

```bash
pnpm dlx @your/visactor-cli add line-chart
```

✅ 无需发布 npm、无需安装依赖、直接源码复用

---

## 八、方案核心优势

| 特性     | 优势                           |
| -------- | ------------------------------ |
| 零构建   | 无打包工具、无配置、无编译流程 |
| 纯源码   | 业务项目直接编译，无兼容问题   |
| 热更新   | 组件修改实时生效，开发效率拉满 |
| 解耦分离 | core 公共复用，react 独立维护  |
| 生产可用 | 类型安全、体积最优、无冗余代码 |
| 易扩展   | 无缝新增 Vue 包、无侵入        |

---

## 九、总结

这是**业界最简洁的生产级组件库方案**，完全对齐 shadcn/ui 设计思想：

1. **Monorepo + 纯源码** 实现本地无缝共享
2. **零构建、零配置、零维护成本**
3. React 组件独立封装，公共逻辑抽离复用
4. 直接用于生产环境，未来可轻松扩展为 CLI 组件库
