# 修复 React Query QueryClientProvider 缺失问题

## 问题描述

浏览器报错：`No QueryClient set, use QueryClientProvider to set one`

**根本原因：**
- `UserPage.tsx` 中使用了 `useQuery` hook（来自 `@tanstack/react-query`）
- 应用根组件 `App.tsx` 和入口文件 `main.tsx` 中没有使用 `QueryClientProvider` 包裹应用
- React Query 需要通过 `QueryClientProvider` 提供 `QueryClient` 上下文，所有使用 React Query hooks 的组件必须在其子组件树中

## 修复方案

在 `main.tsx` 中添加 `QueryClientProvider` 来包裹整个应用，确保所有使用 React Query hooks 的组件都能访问到 `QueryClient`。

## 实施步骤

### 步骤 1：修改 main.tsx 文件

**文件路径：** `d:\projects\seedar\apps\web-client\src\main.tsx`

**具体修改：**

1. 在文件顶部添加导入语句：
   ```typescript
   import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
   ```

2. 在 `ApiClient.init(apiConfig)` 之后，创建 `QueryClient` 实例：
   ```typescript
   const queryClient = new QueryClient({
     defaultOptions: {
       queries: {
         refetchOnWindowFocus: false,
         retry: 1,
         staleTime: 5 * 60 * 1000, // 5分钟
       },
     },
   });
   ```

3. 修改 `ReactDOM.createRoot(root).render()` 部分，用 `QueryClientProvider` 包裹 `<App />`：
   ```typescript
   ReactDOM.createRoot(root).render(
     <React.StrictMode>
       <QueryClientProvider client={queryClient}>
         <App />
       </QueryClientProvider>
     </React.StrictMode>
   );
   ```

### 步骤 2：验证修复

1. 保存修改后的文件
2. 检查浏览器控制台，确认错误已解决
3. 确认 `UserPage` 页面能正常加载并显示数据

## 预期结果

- 浏览器不再报错 "No QueryClient set"
- `UserPage` 组件中的 `useQuery` hook 能正常工作
- 应用可以正常使用所有 React Query 相关的功能（useQuery、useMutation 等）
