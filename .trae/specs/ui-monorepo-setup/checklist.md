# 验收检查清单

## 阶段一：基础设施搭建

### 1.1 packages 目录结构
- [x] 1.1.1 `packages/` 目录已创建
- [x] 1.1.2 `packages/ui-core/` 目录已创建
- [x] 1.1.3 `packages/ui-core/src/config/` 目录已创建
- [x] 1.1.4 `packages/ui-core/src/types/` 目录已创建
- [x] 1.1.5 `packages/ui-core/src/utils/` 目录已创建
- [x] 1.1.6 `packages/ui-react/` 目录已创建
- [x] 1.1.7 `packages/ui-react/src/components/charts/` 目录已创建
- [x] 1.1.8 `packages/ui-react/src/components/common/` 目录已创建
- [x] 1.1.9 `packages/ui-react/src/hooks/` 目录已创建

### 1.2 pnpm-workspace.yaml
- [x] 1.2.1 文件存在于项目根目录
- [x] 1.2.2 包含 `packages: ['packages/*', 'apps/*']` 配置
- [x] 1.2.3 文件格式正确（有效的 YAML）

### 1.3 TypeScript 路径别名
- [x] 1.3.1 tsconfig.json 包含 `compilerOptions.paths`
- [x] 1.3.2 `@seedar/ui-core` 映射到 `./packages/ui-core/src/index.ts`
- [x] 1.3.3 `@seedar/ui-react` 映射到 `./packages/ui-react/src/index.tsx`
- [x] 1.3.4 `compilerOptions.baseUrl` 设置为 `"."`
- [x] 1.3.5 `include` 数组包含 `packages/**/*`

---

## 阶段二：公共核心包 (ui-core)

### 2.1 ui-core/package.json
- [x] 2.1.1 文件存在于 `packages/ui-core/package.json`
- [x] 2.1.2 `name` 设置为 `@seedar/ui-core`
- [x] 2.1.3 `main` 指向 `src/index.ts`
- [x] 2.1.4 `types` 指向 `src/index.ts`
- [x] 2.1.5 `dependencies` 包含 `@visactor/vchart`

### 2.2 主题配置 (config/theme.ts)
- [x] 2.2.1 文件存在于 `packages/ui-core/src/config/theme.ts`
- [x] 2.2.2 导出了 `ThemeType` 类型定义
- [x] 2.2.3 导出了 `DEFAULT_THEME` 常量
- [x] 2.2.4 支持 light/dark 主题

### 2.3 默认配置 (config/defaults.ts)
- [x] 2.3.1 文件存在于 `packages/ui-core/src/config/defaults.ts`
- [x] 2.3.2 导出了 `DEFAULT_CHART_CONFIG` 对象
- [x] 2.3.3 配置包含 padding、animation、tooltip、legends

### 2.4 基础类型定义 ()
- [xtypes/chart.ts] 2.4.1 文件存在于 `packages/ui-core/src/types/chart.ts`
- [x] 2.4.2 导出了 `ChartData` 类型
- [x] 2.4.3 导出了 `ChartSize` 类型
- [x] 2.4.4 导出了 `BaseChartProps` 接口
- [x] 2.4.5 导出了 `LineChartProps` 接口
- [x] 2.4.6 导出了 `BarChartProps` 接口
- [x] 2.4.7 导出了 `PieChartProps` 接口

### 2.5 工具函数 (utils/)
- [x] 2.5.1 `packages/ui-core/src/utils/data.ts` 存在
- [x] 2.5.2 导出了 `validateData` 函数
- [x] 2.5.3 导出了 `transformData` 函数
- [x] 2.5.4 `packages/ui-core/src/utils/format.ts` 存在
- [x] 2.5.5 导出了 `formatNumber` 函数
- [x] 2.5.6 导出了 `formatPercent` 函数

### 2.6 统一导出 (index.ts)
- [x] 2.6.1 文件存在于 `packages/ui-core/src/index.ts`
- [x] 2.6.2 正确导出 config 模块
- [x] 2.6.3 正确导出 types 模块
- [x] 2.6.4 正确导出 utils 模块

---

## 阶段三：React 组件包 (ui-react)

### 3.1 ui-react/package.json
- [x] 3.1.1 文件存在于 `packages/ui-react/package.json`
- [x] 3.1.2 `name` 设置为 `@seedar/ui-react`
- [x] 3.1.3 `main` 指向 `src/index.tsx`
- [x] 3.1.4 `types` 指向 `src/index.tsx`
- [x] 3.1.5 `peerDependencies` 包含 `react` 和 `react-dom`
- [x] 3.1.6 `dependencies` 包含 `@seedar/ui-core: workspace:*`

### 3.2 ChartContainer 组件
- [x] 3.2.1 文件存在于 `packages/ui-react/src/components/common/ChartContainer.tsx`
- [x] 3.2.2 正确导出 `ChartContainer` 组件
- [x] 3.2.3 支持 `width` 属性
- [x] 3.2.4 支持 `height` 属性
- [x] 3.2.5 支持 `children` 插槽

### 3.3 LineChart 折线图组件
- [x] 3.3.1 文件存在于 `packages/ui-react/src/components/charts/LineChart.tsx`
- [x] 3.3.2 正确导出 `LineChart` 组件
- [x] 3.3.3 支持 `data` 属性
- [x] 3.3.4 支持 `xField` 属性
- [x] 3.3.5 支持 `yField` 属性
- [x] 3.3.6 支持 `seriesName` 属性
- [x] 3.3.7 使用 `useMemo` 优化配置

### 3.4 BarChart 柱状图组件
- [x] 3.4.1 文件存在于 `packages/ui-react/src/components/charts/BarChart.tsx`
- [x] 3.4.2 正确导出 `BarChart` 组件
- [x] 3.4.3 支持必要的图表属性
- [x] 3.4.4 图表类型配置为 'bar'

### 3.5 PieChart 饼图组件
- [x] 3.5.1 文件存在于 `packages/ui-react/src/components/charts/PieChart.tsx`
- [x] 3.5.2 正确导出 `PieChart` 组件
- [x] 3.5.3 支持必要的图表属性
- [x] 3.5.4 图表类型配置为 'pie'

### 3.6 charts 统一导出
- [x] 3.6.1 文件存在于 `packages/ui-react/src/components/charts/index.ts`
- [x] 3.6.2 导出 `LineChart`
- [x] 3.6.3 导出 `BarChart`
- [x] 3.6.4 导出 `PieChart`

### 3.7 自定义 Hooks
- [x] 3.7.1 `packages/ui-react/src/hooks/useChartData.ts` 存在
- [x] 3.7.2 导出 `useChartData` hook
- [x] 3.7.3 `packages/ui-react/src/hooks/useChartTheme.ts` 存在
- [x] 3.7.4 导出 `useChartTheme` hook
- [x] 3.7.5 `packages/ui-react/src/hooks/index.ts` 导出所有 hooks

### 3.8 统一导出 (index.tsx)
- [x] 3.8.1 文件存在于 `packages/ui-react/src/index.tsx`
- [x] 3.8.2 导出 `ChartContainer`
- [x] 3.8.3 导出图表组件（LineChart, BarChart, PieChart）
- [x] 3.8.4 导出 hooks
- [x] 3.8.5 重新导出 ui-core 的类型

---

## 阶段四：应用集成与验证

### 4.1 依赖安装
- [x] 4.1.1 `pnpm install` 执行成功
- [x] 4.1.2 workspace 链接正确建立
- [x] 4.1.3 `@seedar/ui-core` 可正确导入
- [x] 4.1.4 `@seedar/ui-react` 可正确导入

### 4.2 测试页面
- [ ] 4.2.1 测试页面文件已创建
- [ ] 4.2.2 可成功导入图表组件
- [ ] 4.2.3 测试数据准备完整

### 4.3 开发热更新
- [ ] 4.3.1 `pnpm dev` 启动成功
- [ ] 4.3.2 测试页面正常显示
- [ ] 4.3.3 修改组件源码后应用自动刷新

### 4.4 生产构建
- [ ] 4.4.1 `pnpm build` 构建成功
- [ ] 4.4.2 构建产物无错误
- [ ] 4.4.3 图表功能在生产环境正常

---

## 阶段五：代码质量

### 5.1 TypeScript
- [x] 5.1.1 无 TypeScript 编译错误
- [x] 5.1.2 类型推断正确

### 5.2 代码规范
- [x] 5.2.1 代码风格与项目一致
- [x] 5.2.2 命名规范统一
- [x] 5.2.3 无冗余代码
