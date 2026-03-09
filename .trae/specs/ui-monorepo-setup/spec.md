# UI 组件库 Monorepo 架构方案

## 一、背景与目标

当前项目需要将前端 UI 组件抽离到 packages 目录中，采用类似 shadcn/ui 的设计理念，实现组件库的零构建、纯源码交付模式。

## 二、核心变化

### 2.1 目录结构变化

新增以下目录结构：

```
seedar/
├── pnpm-workspace.yaml          # Monorepo 工作空间配置
├── tsconfig.json                # 全局 TypeScript 配置（扩展）
├── apps/                        # 现有业务应用
│   └── web                      # 现有 Web 应用
└── packages/                    # 新增：组件包目录
    ├── ui-core                  # 新增：公共核心（无框架）
    │   ├── src/
    │   │   ├── config/          # 全局配置
    │   │   ├── types/           # 公共类型
    │   │   └── utils/           # 工具函数
    │   └── package.json
    ├── ui-react                 # 新增：React 组件库
    │   ├── src/
    │   │   ├── components/      # React 组件
    │   │   ├── hooks/           # 自定义 Hooks
    │   │   └── index.tsx        # 统一导出
    │   └── package.json
    └── ui-vue                   # 预留：Vue 组件库（未来扩展）
```

### 2.2 关键设计决策

- **零构建模式**：无 Vite/Rollup/Webpack，无 dist 目录
- **纯源码交付**：组件库仅存放 TS/TSX 源码，由业务项目直接编译
- **依赖管理**：使用 pnpm workspace 实现本地包引用
- **解耦设计**：公共核心(ui-core)与框架组件(ui-react)分离

## 三、详细设计

### 3.1 公共核心包 (ui-core)

**目标**：存放无框架依赖的配置、类型定义和工具函数

**目录结构**：

```
packages/ui-core/src/
├── config/
│   ├── theme.ts         # 主题配置
│   └── defaults.ts      # 默认配置
├── types/
│   ├── chart.ts         # 图表相关类型
│   └── common.ts        # 通用类型
├── utils/
│   ├── data.ts          # 数据处理工具
│   └── format.ts        # 格式化工具
└── index.ts             # 统一导出
```

**核心职责**：
- 定义图表基础类型和接口
- 封装 VChart 公共配置
- 提供通用的工具函数
- 可被多个框架组件包复用

### 3.2 React 组件包 (ui-react)

**目标**：基于 ui-core 构建的 React 图表组件库

**目录结构**：

```
packages/ui-react/src/
├── components/
│   ├── charts/
│   │   ├── LineChart.tsx
│   │   ├── BarChart.tsx
│   │   ├── PieChart.tsx
│   │   └── index.ts
│   └── common/
│       ├── ChartContainer.tsx
│       └── index.ts
├── hooks/
│   ├── useChartData.ts
│   └── useChartTheme.ts
├── index.tsx            # 统一导出
└── package.json
```

**组件规范**：
- 每个组件单独一个文件
- 组件 props 继承自 ui-core 基础类型
- 使用 useMemo 优化配置计算
- 支持主题切换和数据更新

### 3.3 工作空间配置

**pnpm-workspace.yaml**：

```yaml
packages:
  - 'packages/*'
  - 'apps/*'
```

**根 tsconfig.json 路径别名**：

```json
{
  "compilerOptions": {
    "paths": {
      "@seedar/ui-core": ["./packages/ui-core/src/index.ts"],
      "@seedar/ui-react": ["./packages/ui-react/src/index.tsx"]
    }
  }
}
```

### 3.4 包配置规范

**ui-core/package.json**：

```json
{
  "name": "@seedar/ui-core",
  "version": "1.0.0",
  "type": "module",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "dependencies": {
    "@visactor/vchart": "^1.14.0"
  }
}
```

**ui-react/package.json**：

```json
{
  "name": "@seedar/ui-react",
  "version": "1.0.0",
  "type": "module",
  "main": "src/index.tsx",
  "types": "src/index.tsx",
  "peerDependencies": {
    "react": ">=18.0.0",
    "react-dom": ">=18.0.0"
  },
  "dependencies": {
    "@seedar/ui-core": "workspace:*",
    "@visactor/react-vchart": "^1.14.0",
    "@visactor/vchart": "^1.14.0"
  }
}
```

## 四、迁移计划

### 4.1 第一阶段：基础设施

- 创建 packages 目录结构
- 配置 pnpm-workspace.yaml
- 配置 tsconfig.json 路径别名
- 创建 ui-core 包基础结构

### 4.2 第二阶段：核心包开发

- 实现 ui-core 公共配置
- 定义基础类型接口
- 封装工具函数

### 4.3 第三阶段：React 组件

- 创建 ui-react 包结构
- 封装基础图表组件（折线图、柱状图、饼图）
- 实现组件导出和使用示例

### 4.4 第四阶段：应用集成

- 在现有 apps/web 中集成组件
- 验证开发热更新
- 验证生产构建

## 五、验收标准

### 5.1 架构验证

- [ ] Monorepo 工作空间正常识别所有包
- [ ] TypeScript 类型提示正常工作
- [ ] 路径别名正确解析

### 5.2 组件验证

- [ ] ui-core 可被 ui-react 正常引用
- [ ] 图表组件可正常渲染
- [ ] 组件支持 props 传递和主题切换

### 5.3 开发体验

- [ ] 修改组件源码，业务应用实时热更新
- [ ] 无需构建命令即可运行
- [ ] IDE 支持完整的代码提示

### 5.4 生产验证

- [ ] 业务应用构建成功
- [ ] 组件功能在生产环境正常
- [ ] 无类型错误和运行时错误
