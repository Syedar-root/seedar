# 前端 Query Hooks 更新计划

## 需求概述

为新增的临时查询接口 `POST /query/temp` 添加对应的前端支持，包括类型定义、API 方法和 React Hook。

## 需要更新的文件

| 序号 | 文件路径                                      | 操作             |
| -- | ----------------------------------------- | -------------- |
| 1  | `packages/types/src/query/query.dto.ts`   | 新增类型           |
| 2  | `packages/ui-core/src/api/query.ts`       | 新增 API 方法      |
| 3  | `packages/ui-react/src/hooks/useApi.ts`   | 新增 API hook 方法 |
| 4  | `packages/ui-react/src/hooks/useQuery.ts` | 新增 React Hook  |

***

## 详细实现步骤

### 步骤 1：新增类型定义

**文件**: `packages/types/src/query/query.dto.ts`

新增 `ExecuteTempQueryRequest` 接口：

```typescript
/**
 * 执行临时查询请求接口
 */
export interface ExecuteTempQueryRequest {
  dsl: QueryDSL;
}
```

> 注：`ExecuteQueryResponse` 已存在，可直接复用。

***

### 步骤 2：新增 API 方法

**文件**: `packages/ui-core/src/api/query.ts`

在 `QueryApi` 类中新增 `executeTemp` 方法：

```typescript
/**
 * 执行临时查询
 * @param dsl - 查询 DSL
 * @param options - 请求选项
 * @returns 执行结果
 */
static async executeTemp(
  dsl: QueryDSL,
  options?: RequestOptions
): Promise<ExecuteQueryResponse> {
  return ApiClient.post<ExecuteQueryResponse>(
    '/query/temp',
    { dsl },
    options
  );
}
```

需要导入 `ExecuteTempQueryRequest` 类型（如果需要类型校验）。

***

### 步骤 3：更新 API Hook

**文件**: `packages/ui-react/src/hooks/useApi.ts`

在 `useQueryApi` hook 中添加 `executeTemp` 方法：

```typescript
const executeTemp = useCallback((dsl: QueryDSL, options?: RequestOptions) => {
  return QueryApi.executeTemp(dsl, options);
}, []);

return {
  findAll,
  findOne,
  create,
  update,
  remove,
  execute,
  executeTemp,  // 新增
};
```

需要导入 `QueryDSL` 类型。

***

### 步骤 4：新增 React Hook

**文件**: `packages/ui-react/src/hooks/useQuery.ts`

新增 `useExecuteTempQuery` hook：

```typescript
/**
 * 执行临时查询
 * @returns 包含执行临时查询的 mutation 对象
 */
export const useExecuteTempQuery = () => {
  const queryApi = useQueryApi();

  return useMutation({
    mutationFn: (dsl: QueryDSL) => queryApi.executeTemp(dsl),
  });
};
```

需要导入 `QueryDSL` 类型。

***

## 调用链示意图

```
React 组件
    ↓
useExecuteTempQuery() hook
    ↓
useQueryApi().executeTemp()
    ↓
QueryApi.executeTemp()
    ↓
ApiClient.post('/query/temp', { dsl })
    ↓
POST /query/temp
```

***

## 使用示例

```typescript
import { useExecuteTempQuery } from '@seedar/ui-react';

function QueryEditor() {
  const executeTempQuery = useExecuteTempQuery();

  const handleExecute = (dsl: QueryDSL) => {
    executeTempQuery.mutate(dsl, {
      onSuccess: (data) => {
        console.log('SQL:', data.sql);
        console.log('Results:', data.results);
      },
      onError: (error) => {
        console.error('Query failed:', error);
      },
    });
  };

  return (
    <button
      onClick={() => handleExecute({ datasetId: 1, tableId: 1, ... })}
      disabled={executeTempQuery.isPending}
    >
      {executeTempQuery.isPending ? '执行中...' : '执行查询'}
    </button>
  );
}
```

***

## 验证步骤

1. 运行 TypeScript 类型检查，确保无编译错误
2. 检查所有导出是否正确

