# Query ID 类型修改计划：从 number 改为 UUID (string)

## 概述

将 Query 模块的 ID 类型从自增数字 (number) 改为 UUID (string)，需要修改跨多个包的文件。

## 影响范围分析

### 1. Server 端 (`apps/server`)

| 文件路径 | 需要修改的内容 |
|---------|--------------|
| `src/module/query/entities/query.entity.ts` | `@PrimaryGeneratedColumn()` → `@PrimaryGeneratedColumn('uuid')`, `id: number` → `id: string` |
| `src/module/query/dto/query.response.ts` | `id: number` → `id: string` |
| `src/module/query/dto/execute-query.request.ts` | `@IsNumber()` → `@IsString()`, `queryId: number` → `queryId: string` |
| `src/module/query/query.controller.ts` | 移除 `+id` 数字转换逻辑 |
| `src/module/query/query.service.ts` | 所有 `id: number` 参数改为 `id: string` |

### 2. Types 包 (`packages/types`)

| 文件路径 | 需要修改的内容 |
|---------|--------------|
| `src/query/query.types.ts` | `QueryResponse.id: number` → `id: string` |
| `src/query/query.dto.ts` | `ExecuteQueryRequest.queryId: number` → `queryId: string` |

### 3. UI-Core 包 (`packages/ui-core`)

| 文件路径 | 需要修改的内容 |
|---------|--------------|
| `src/api/query.ts` | 所有方法中的 `id: number` 参数改为 `id: string` |

### 4. UI-React 包 (`packages/ui-react`)

| 文件路径 | 需要修改的内容 |
|---------|--------------|
| `src/hooks/useQuery.ts` | 所有 hooks 中的 `id: number` 参数改为 `id: string` |
| `src/hooks/useApi.ts` | `useQueryApi` hook 中的 ID 参数类型 |
| `src/components/charts/Chart.tsx` | `queryId` 属性类型和 `Number(queryId)` 转换逻辑 |
| `src/components/table/ListTable.tsx` | `queryId` 属性类型 |
| `src/components/gridContainer/gridPanel/seedarPanel.tsx` | `SeedarPanel` 接口中的 `queryId` 类型 |

## 详细修改步骤

### 步骤 1: 修改 Server 端实体

**文件**: `apps/server/src/module/query/entities/query.entity.ts`

```typescript
// 修改前
@PrimaryGeneratedColumn()
id: number;

// 修改后
@PrimaryGeneratedColumn('uuid')
id: string;
```

### 步骤 2: 修改 Server 端 DTO

**文件**: `apps/server/src/module/query/dto/query.response.ts`

```typescript
// 修改前
id: number;

// 修改后
id: string;
```

**文件**: `apps/server/src/module/query/dto/execute-query.request.ts`

```typescript
// 修改前
import { IsNumber } from 'class-validator';

export class ExecuteQueryRequest {
  @IsNumber()
  queryId: number;
}

// 修改后
import { IsString } from 'class-validator';

export class ExecuteQueryRequest {
  @IsString()
  queryId: string;
}
```

### 步骤 3: 修改 Server 端控制器

**文件**: `apps/server/src/module/query/query.controller.ts`

```typescript
// 修改前
findOne(@Param('id') id: string) {
  return this.queryService.findOne(+id);
}

// 修改后
findOne(@Param('id') id: string) {
  return this.queryService.findOne(id);
}
```

同样修改 `update`、`remove` 方法，移除 `+id` 转换。

### 步骤 4: 修改 Server 端服务

**文件**: `apps/server/src/module/query/query.service.ts`

```typescript
// 修改前
async findOne(id: number): Promise<Query>
async update(id: number, ...): Promise<Query>
async remove(id: number): Promise<void>
async execute(queryId: number): Promise<ExecuteQueryResponse>

// 修改后
async findOne(id: string): Promise<Query>
async update(id: string, ...): Promise<Query>
async remove(id: string): Promise<void>
async execute(queryId: string): Promise<ExecuteQueryResponse>
```

### 步骤 5: 修改 Types 包

**文件**: `packages/types/src/query/query.types.ts`

```typescript
// 修改前
export interface QueryResponse {
  id: number;
  ...
}

// 修改后
export interface QueryResponse {
  id: string;
  ...
}
```

**文件**: `packages/types/src/query/query.dto.ts`

```typescript
// 修改前
export interface ExecuteQueryRequest {
  queryId: number;
}

// 修改后
export interface ExecuteQueryRequest {
  queryId: string;
}
```

### 步骤 6: 修改 UI-Core 包

**文件**: `packages/ui-core/src/api/query.ts`

```typescript
// 修改前
static async findOne(id: number, ...): Promise<QueryResponse>
static async update(id: number, ...): Promise<QueryResponse>
static async remove(id: number, ...): Promise<void>
static async execute(queryId: number, ...): Promise<ExecuteQueryResponse>

// 修改后
static async findOne(id: string, ...): Promise<QueryResponse>
static async update(id: string, ...): Promise<QueryResponse>
static async remove(id: string, ...): Promise<void>
static async execute(queryId: string, ...): Promise<ExecuteQueryResponse>
```

### 步骤 7: 修改 UI-React 包 Hooks

**文件**: `packages/ui-react/src/hooks/useQuery.ts`

```typescript
// 修改前
detail: (id: number) => [...queryKeys.details(), id] as const,
execution: (id: number) => [...queryKeys.all, 'execution', id] as const,

export const useQuery = (id: number) => { ... }
export const useUpdateQuery = () => {
  ...
  mutationFn: ({ id, data }: { id: number; data: UpdateQueryRequest }) =>
  ...
}
export const useDeleteQuery = () => {
  ...
  mutationFn: (id: number) => queryApi.remove(id),
  ...
}
export const useExecuteQuery = () => {
  ...
  mutationFn: (queryId: number) => queryApi.execute(queryId),
  ...
}

// 修改后
detail: (id: string) => [...queryKeys.details(), id] as const,
execution: (id: string) => [...queryKeys.all, 'execution', id] as const,

export const useQuery = (id: string) => { ... }
export const useUpdateQuery = () => {
  ...
  mutationFn: ({ id, data }: { id: string; data: UpdateQueryRequest }) =>
  ...
}
export const useDeleteQuery = () => {
  ...
  mutationFn: (id: string) => queryApi.remove(id),
  ...
}
export const useExecuteQuery = () => {
  ...
  mutationFn: (queryId: string) => queryApi.execute(queryId),
  ...
}
```

**文件**: `packages/ui-react/src/hooks/useApi.ts`

```typescript
// 修改前
const findOne = useCallback((id: number, options?: RequestOptions) => {
  return QueryApi.findOne(id, options);
}, []);

const update = useCallback(
  (id: number, data: UpdateQueryRequest, options?: RequestOptions) => {
    return QueryApi.update(id, data, options);
  },
  []
);

const remove = useCallback((id: number, options?: RequestOptions) => {
  return QueryApi.remove(id, options);
}, []);

const execute = useCallback((queryId: number, options?: RequestOptions) => {
  return QueryApi.execute(queryId, options);
}, []);

// 修改后
const findOne = useCallback((id: string, options?: RequestOptions) => {
  return QueryApi.findOne(id, options);
}, []);

const update = useCallback(
  (id: string, data: UpdateQueryRequest, options?: RequestOptions) => {
    return QueryApi.update(id, data, options);
  },
  []
);

const remove = useCallback((id: string, options?: RequestOptions) => {
  return QueryApi.remove(id, options);
}, []);

const execute = useCallback((queryId: string, options?: RequestOptions) => {
  return QueryApi.execute(queryId, options);
}, []);
```

### 步骤 8: 修改 UI-React 包组件

**文件**: `packages/ui-react/src/components/charts/Chart.tsx`

```typescript
// 修改前
export interface ChartProps {
  queryId?: string | number;
}

// 修改后
export interface ChartProps {
  queryId?: string;
}

// 同时移除 Number(queryId) 转换
// 修改前
executeQuery(Number(queryId), { ... });

// 修改后
executeQuery(queryId as string, { ... });
```

**文件**: `packages/ui-react/src/components/table/ListTable.tsx`

```typescript
// 修改前
export interface ListTableProps {
  queryId?: number;
}

// 修改后
export interface ListTableProps {
  queryId?: string;
}
```

**文件**: `packages/ui-react/src/components/gridContainer/gridPanel/seedarPanel.tsx`

```typescript
// 修改前
interface SeedarPanel {
  queryId?: string | number;
}

// 修改后
interface SeedarPanel {
  queryId?: string;
}

// 同时修改 mockFetch 返回值
// 修改前
return {
  ...
  queryId: 6,
  ...
};

// 修改后
return {
  ...
  queryId: '550e8400-e29b-41d4-a716-446655440000', // 示例 UUID
  ...
};
```

## 数据库迁移注意事项

修改完成后，需要执行以下操作：

1. **删除现有数据**：由于 ID 类型变更，现有数据无法直接迁移
2. **运行数据库迁移**：生成并执行 TypeORM 迁移脚本
3. **更新测试数据**：如果有测试数据，需要更新为 UUID 格式

## 执行顺序

1. 先修改 `packages/types` (基础类型定义)
2. 再修改 `packages/ui-core` (依赖 types)
3. 然后修改 `packages/ui-react` (依赖 ui-core 和 types)
4. 最后修改 `apps/server` (服务端实现)

## 验证步骤

1. 运行 TypeScript 类型检查，确保没有类型错误
2. 运行单元测试和集成测试
3. 手动测试 API 接口，确保 UUID 格式正确
