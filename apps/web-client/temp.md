我直接给你一份**开箱即用、零冗余、完全适配你需求**的最终工程配置单
核心定位：**React + Vite + TS + 微前端预埋 + shadcn/ui + Tailwind + SCSS Modules**
✅ 初期单应用开发
✅ 后期无缝切换 qiankun / Module Federation
✅ 无全局样式污染、无耦合、纯可控架构

# 📋 最终工程配置清单

## 一、核心基础栈（必装）

| 项       | 选型           | 原因                               |
| -------- | -------------- | ---------------------------------- |
| 构建工具 | **Vite 5**     | 极速开发、ESM 原生、微前端兼容最优 |
| 框架     | **React 18**   | 函数式+Hooks，微前端生态最成熟     |
| 语言     | **TypeScript** | 类型安全，微前端跨应用调用必备     |
| 包管理   | **pnpm**       | 依赖干净、monorepo 友好、无冗余    |

---

## 二、路由 / 状态 / 通信（微前端预埋版）

| 功能     | 选型                                       |
| -------- | ------------------------------------------ |
| 路由     | **React Router v6**（模块化配置）          |
| 全局状态 | **Zustand**（无 Provider、微前端天然适配） |
| 模块状态 | 组件 useState / 模块内 Zustand             |
| 应用通信 | **mitt**（轻量事件总线，预埋微前端）       |

---

## 三、样式方案（你指定：无 antd + shadcn + Tailwind + SCSS）

| 项           | 选型                    | 强制规范                       |
| ------------ | ----------------------- | ------------------------------ |
| 无头组件底层 | **Radix UI**            | shadcn/ui 依赖                 |
| 业务组件库   | **shadcn/ui**           | 本地复制、无全局样式、完全可控 |
| 原子样式     | **Tailwind CSS**        | 开发效率最高、无冲突           |
| 复杂样式     | **SCSS + CSS Modules**  | 文件名必须：`xxx.module.scss`  |
| 样式隔离     | CSS Modules（唯一类名） | 微前端零冲突                   |

---

## 四、依赖安装命令（直接复制运行）

### 1. 初始化 Vite+React+TS

```bash
pnpm create vite my-project --template react-ts
cd my-project
pnpm install
```

### 2. 安装核心依赖（路由/状态/通信）

```bash
pnpm add react-router-dom zustand mitt
```

### 3. 安装样式相关（Tailwind + SCSS）

```bash
pnpm add -D tailwindcss postcss autoprefixer sass
npx tailwindcss init -p
```

### 4. 安装 shadcn/ui（后续按需添加组件）

```bash
pnpm dlx shadcn-ui@latest init
```

---

## 五、强制工程目录（微前端可直接拆分）

```
src/
├── modules/          # 业务模块（未来=微前端子应用）
│   ├── user/         # 用户模块
│   ├── order/        # 订单模块
│   └── goods/        # 商品模块
├── core/             # 全局核心（未来=主应用）
│   ├── router/       # 路由聚合
│   ├── store/        # 全局状态
│   ├── bridge.ts     # 通信桥（mitt）
│   └── request.ts    # 统一请求
├── components/       # shadcn/ui 组件存放目录
├── shared/           # 公共工具/hooks
├── styles/           # 全局重置样式（仅1份）
└── main.tsx          # 应用入口
```

---

## 六、关键配置（复制即用）

### 1. tailwind.config.js

```js
export default {
  content: ['./src/**/*.{ts,tsx}'],
  corePlugins: { preflight: false }, // 子应用关闭，主应用开启
  theme: { extend: {} },
  plugins: [],
};
```

### 2. vite.config.ts

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  // 预埋微前端多入口
  build: { rollupOptions: { input: { main: 'index.html' } } },
});
```

---

## 七、开发规范（微前端保命规则）

1. **所有业务样式必须用 `.module.scss`**
2. **禁止全局 CSS、禁止修改 body/html**
3. **跨模块交互只能用 core/bridge.ts（mitt）**
4. **状态分两层：全局(core) + 模块私有(modules)**
5. **shadcn 组件只在当前模块使用，不跨模块硬编码引用**

---

# 🎯 一句话总结

这就是**React 微前端预埋工程的最优标配**
现在开发 = 极速单应用
未来微前端 = 零重构、直接拆分
样式 = 绝对安全、无冲突、完全可控
