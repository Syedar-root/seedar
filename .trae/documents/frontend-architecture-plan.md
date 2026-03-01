# 前端架构搭建实施计划

## 一、项目概述

根据 `temp.md` 配置方案，在 `d:\projects\seedar\apps\web-client\` 目录下搭建一个支持微前端预埋的前端架构。

**技术栈**：React 18 + Vite 5 + TypeScript + React Router v6 + Zustand + mitt + Tailwind CSS + SCSS Modules + shadcn/ui

---

## 二、实施步骤

### 步骤 1：安装核心依赖

在 `d:\projects\seedar\apps\web-client\` 目录下执行：

```bash
# 安装路由、状态管理、通信
pnpm add react-router-dom zustand mitt
```

### 步骤 2：安装样式相关依赖

```bash
# 安装 Tailwind CSS 和 SCSS
pnpm add -D tailwindcss postcss autoprefixer sass

# 初始化 Tailwind 配置
npx tailwindcss init -p
```

### 步骤 3：初始化 shadcn/ui

```bash
# 初始化 shadcn/ui（按需添加组件）
pnpm dlx shadcn-ui@latest init
```

### 步骤 4：创建目录结构

在 `src/` 目录下创建以下结构：

```
src/
├── modules/          # 业务模块（未来=微前端子应用）
│   ├── user/        # 用户模块（示例）
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── store/
│   │   └── index.ts
│   └── ...          # 其他业务模块
├── core/             # 全局核心（未来=主应用）
│   ├── router/      # 路由聚合
│   │   └── index.tsx
│   ├── store/       # 全局状态
│   │   └── index.ts
│   ├── bridge.ts    # 通信桥（mitt）
│   └── request.ts   # 统一请求
├── components/       # shadcn/ui 组件存放目录
│   └── ui/          # shadcn 组件
├── shared/          # 公共工具/hooks
│   ├── utils/
│   ├── hooks/
│   └── types/
├── styles/          # 全局重置样式
│   └── global.scss
├── layouts/         # 布局组件
│   └── AppLayout.tsx
├── App.tsx          # 应用入口
└── main.tsx         # 主入口文件
```

### 步骤 5：配置 Tailwind CSS

修改 `tailwind.config.js`：

```javascript
export default {
  content: ['./src/**/*.{ts,tsx}'],
  corePlugins: { preflight: false },
  theme: { extend: {} },
  plugins: [],
};
```

### 步骤 6：配置 Vite

修改 `vite.config.ts`：

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  build: { rollupOptions: { input: { main: 'index.html' } } },
});
```

### 步骤 7：配置 TypeScript 路径别名

修改 `tsconfig.json`，添加路径别名配置：

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

### 步骤 8：创建全局样式文件

创建 `src/styles/global.scss`，添加必要的全局样式重置。

### 步骤 9：创建核心模块

#### 9.1 创建通信桥 `src/core/bridge.ts`

使用 mitt 创建事件总线，用于模块间通信（预埋微前端通信）。

#### 9.2 创建全局状态 `src/core/store/index.ts`

使用 Zustand 创建全局状态管理。

#### 9.3 创建路由配置 `src/core/router/index.tsx`

配置 React Router v6，支持模块化路由。

#### 9.4 创建统一请求 `src/core/request.ts`

封装 Axios，添加请求/响应拦截器。

### 步骤 10：创建示例模块

创建一个示例业务模块（如 user 模块），验证架构可行性：

- `src/modules/user/pages/UserPage.tsx`
- `src/modules/user/store/userStore.ts`
- `src/modules/user/services/userApi.ts`
- `src/modules/user/index.ts`

### 步骤 11：清理旧代码

删除或重写原有的：
- `src/App.tsx`
- `src/main.tsx`（移除调试代码）
- `src/index.css`

---

## 三、配置文件清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `package.json` | 修改 | 添加依赖 |
| `tailwind.config.js` | 新建 | Tailwind 配置 |
| `postcss.config.js` | 新建 | PostCSS 配置 |
| `vite.config.ts` | 修改 | 添加路径别名 |
| `tsconfig.json` | 修改 | 添加路径别名 |
| `src/styles/global.scss` | 新建 | 全局样式 |
| `src/core/bridge.ts` | 新建 | 事件总线 |
| `src/core/store/index.ts` | 新建 | 全局状态 |
| `src/core/router/index.tsx` | 新建 | 路由配置 |
| `src/core/request.ts` | 新建 | 统一请求 |
| `src/components/ui/*` | 新建 | shadcn 组件 |
| `src/layouts/AppLayout.tsx` | 新建 | 应用布局 |
| `src/modules/user/*` | 新建 | 示例模块 |
| `src/App.tsx` | 重写 | 应用入口 |
| `src/main.tsx` | 重写 | 主入口 |

---

## 四、开发规范（微前端保命规则）

1. **所有业务样式必须用 `.module.scss`**
2. **禁止全局 CSS、禁止修改 body/html**
3. **跨模块交互只能用 `core/bridge.ts`（mitt）**
4. **状态分两层：全局(core) + 模块私有(modules)**
5. **shadcn 组件只在当前模块使用，不跨模块硬编码引用**

---

## 五、验证清单

- [ ] 核心依赖安装成功
- [ ] Tailwind CSS 配置正确
- [ ] shadcn/ui 初始化成功
- [ ] 目录结构创建完成
- [ ] Vite 开发服务器启动正常
- [ ] 路由配置正常工作
- [ ] 全局状态管理正常
- [ ] 模块间通信机制正常
- [ ] 示例模块运行正常
