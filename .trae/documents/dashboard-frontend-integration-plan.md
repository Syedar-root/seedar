# Dashboard模块前端集成计划

## 📋 概述

Server后端已新增Dashboard模块，需要在types、ui-core、ui-react三个包中添加相应的前端支持。

## 🎯 目标

为Dashboard和Panel提供完整的前端类型定义、API调用方法和React Hooks。

---

## 📦 第一阶段：更新types包

### 1.1 创建 `packages/types/src/dashboard/dashboard.types.ts`

定义以下类型：

```typescript
/**
 * 面板类型枚举
 */
export enum PanelType {
  CHART = 'chart',
  TABLE = 'table',
  TEXT = 'text',
  CARD = 'card',
}

/**
 * 布局项接口
 */
export interface LayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
  static?: boolean;
  isDraggable?: boolean;
  isResizable?: boolean;
}

/**
 * 布局配置接口
 */
export interface Layouts {
  lg?: LayoutItem[];
  md?: LayoutItem[];
  sm?: LayoutItem[];
  xs?: LayoutItem[];
  xxs?: LayoutItem[];
}

/**
 * 面板响应接口
 */
export interface PanelResponse {
  id: string;
  title?: string;
  type: PanelType;
  queryId?: string;
  config?: Record<string, any>;
  width?: number;
  height?: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Dashboard响应接口
 */
export interface DashboardResponse {
  id: string;
  name: string;
  layout: Layouts | null;
  panels: PanelResponse[];
  createdAt: Date;
  updatedAt: Date;
}
```

### 1.2 创建 `packages/types/src/dashboard/dashboard.dto.ts`

定义以下DTO类型：

```typescript
import { Layouts } from './dashboard.types';

/**
 * 创建Dashboard请求
 */
export interface CreateDashboardRequest {
  name: string;
  layout?: Layouts;
}

/**
 * 更新Dashboard请求
 */
export interface UpdateDashboardRequest {
  name?: string;
  layout?: Layouts;
}

/**
 * 创建Panel请求
 */
export interface CreatePanelRequest {
  title?: string;
  type: string;
  queryId?: string;
  config?: Record<string, any>;
  width?: number;
  height?: number;
}

/**
 * 更新Panel请求
 */
export interface UpdatePanelRequest {
  title?: string;
  type?: string;
  queryId?: string;
  config?: Record<string, any>;
  width?: number;
  height?: number;
}
```

### 1.3 创建 `packages/types/src/dashboard/index.ts`

导出所有dashboard类型。

### 1.4 更新 `packages/types/src/index.ts`

添加dashboard模块导出。

---

## 📦 第二阶段：更新ui-core包

### 2.1 创建 `packages/ui-core/src/api/dashboard.ts`

实现DashboardApi类，包含以下方法：

| 方法 | HTTP | 路径 | 说明 |
|------|------|------|------|
| `findAll()` | GET | `/dashboard` | 获取所有Dashboard |
| `findOne(id)` | GET | `/dashboard/:id` | 获取单个Dashboard |
| `create(data)` | POST | `/dashboard` | 创建Dashboard |
| `update(id, data)` | PATCH | `/dashboard/:id` | 更新Dashboard |
| `remove(id)` | DELETE | `/dashboard/:id` | 删除Dashboard |
| `updateLayout(id, layout)` | PUT | `/dashboard/:id/layout` | 更新布局 |
| `addPanel(id, panelId)` | POST | `/dashboard/:id/panels` | 添加Panel到Dashboard |
| `removePanel(id, panelId)` | DELETE | `/dashboard/:id/panels/:panelId` | 从Dashboard移除Panel |

### 2.2 创建 `packages/ui-core/src/api/panel.ts`

实现PanelApi类，包含以下方法：

| 方法 | HTTP | 路径 | 说明 |
|------|------|------|------|
| `findAll()` | GET | `/panel` | 获取所有Panel |
| `findOne(id)` | GET | `/panel/:id` | 获取单个Panel |
| `create(data)` | POST | `/panel` | 创建Panel |
| `update(id, data)` | PATCH | `/panel/:id` | 更新Panel |
| `remove(id)` | DELETE | `/panel/:id` | 删除Panel |

### 2.3 更新 `packages/ui-core/src/api/client.ts`

- 导入DashboardApi和PanelApi
- 导出`dashboardApi`和`panelApi`实例

### 2.4 更新 `packages/ui-core/src/index.ts`

导出新增的API模块。

---

## 📦 第三阶段：更新ui-react包

### 3.1 创建 `packages/ui-react/src/hooks/useDashboard.ts`

实现以下React Hooks：

```typescript
// 查询键工厂
const dashboardKeys = {
  all: ['dashboards'] as const,
  lists: () => [...dashboardKeys.all, 'list'] as const,
  details: () => [...dashboardKeys.all, 'detail'] as const,
  detail: (id: string) => [...dashboardKeys.details(), id] as const,
};

// Hooks列表
- useDashboards()        // 获取Dashboard列表
- useDashboard(id)       // 获取单个Dashboard
- useCreateDashboard()   // 创建Dashboard
- useUpdateDashboard()   // 更新Dashboard
- useDeleteDashboard()   // 删除Dashboard
- useUpdateLayout()      // 更新布局
- useAddPanel()          // 添加Panel
- useRemovePanel()       // 移除Panel
```

### 3.2 创建 `packages/ui-react/src/hooks/usePanel.ts`

实现以下React Hooks：

```typescript
// 查询键工厂
const panelKeys = {
  all: ['panels'] as const,
  lists: () => [...panelKeys.all, 'list'] as const,
  details: () => [...panelKeys.all, 'detail'] as const,
  detail: (id: string) => [...panelKeys.details(), id] as const,
};

// Hooks列表
- usePanels()        // 获取Panel列表
- usePanel(id)       // 获取单个Panel
- useCreatePanel()   // 创建Panel
- useUpdatePanel()   // 更新Panel
- useDeletePanel()   // 删除Panel
```

### 3.3 更新 `packages/ui-react/src/hooks/index.ts`

导出新增的hooks。

---

## 📁 文件变更清单

### 新增文件 (7个)

| 包 | 文件路径 |
|---|---------|
| types | `src/dashboard/dashboard.types.ts` |
| types | `src/dashboard/dashboard.dto.ts` |
| types | `src/dashboard/index.ts` |
| ui-core | `src/api/dashboard.ts` |
| ui-core | `src/api/panel.ts` |
| ui-react | `src/hooks/useDashboard.ts` |
| ui-react | `src/hooks/usePanel.ts` |

### 修改文件 (4个)

| 包 | 文件路径 | 变更内容 |
|---|---------|---------|
| types | `src/index.ts` | 添加dashboard导出 |
| ui-core | `src/api/client.ts` | 导出dashboardApi和panelApi |
| ui-core | `src/index.ts` | 导出新增API |
| ui-react | `src/hooks/index.ts` | 导出新增hooks |

---

## ✅ 验证步骤

1. 在types包中运行TypeScript编译检查
2. 在ui-core包中运行TypeScript编译检查
3. 在ui-react包中运行TypeScript编译检查
4. 确保所有导出正确
