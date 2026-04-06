# DSL Transformer V2 筛选表达式支持计划

## 目标
修改 `dsl-transformer.v2.ts`，使其支持新添加的筛选表达式类型：
- IN / NOT IN 列表匹配
- BETWEEN / NOT BETWEEN 范围匹配
- LIKE / NOT LIKE 模糊匹配
- IS NULL / IS NOT NULL 空值判断

## 现状分析

### 当前代码位置
`d:\Program\projects\seedar\apps\server\src\module\query\dsl-transformer\dsl-transformer.v2.ts`

### 已有支持
文件第 991-1003 行已定义了 `opMap`，包含操作符映射：
```typescript
const opMap: Record<string, Operator> = {
  '=': Operator.EQUALS,
  '!=': Operator.NOT_EQUALS,
  '>': Operator.GREATER_THAN,
  '<': Operator.LESS_THAN,
  '>=': Operator.GREATER_EQUAL,
  '<=': Operator.LESS_EQUAL,
  like: Operator.LIKE,
  in: Operator.IN,
  not_in: Operator.NOT_IN,
  is_null: Operator.IS_NULL,
  is_not_null: Operator.IS_NOT_NULL,
};
```

### 问题
第 1011-1016 行只使用 `ComparisonExpr` 构建过滤器，无法处理新表达式类型：
```typescript
return new ComparisonExpr(
  op as ComparisonOperator,
  fieldExpr,
  value !== undefined ? new LiteralExpr(value) : (undefined as any),
);
```

## 任务拆分与依赖关系

```
┌─────────────────────────────────────────────────────────────────┐
│                        Phase 1: 导入新类型                       │
│  [T1] 导入 InExpr, BetweenExpr, LikeExpr, IsNullExpr           │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Phase 2: 修改过滤器构建逻辑               │
│  [T2] 重构 filters 构建函数，支持不同操作符                      │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Phase 3: 编写测试用例                     │
│  [T3] 编写 dsl-transformer.v2.spec.ts 测试文件                  │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Phase 4: 验证与修复                       │
│  [T4] 运行测试验证功能                                          │
│  [T5] 运行 lint 和 typecheck 检查                               │
│  [T6] 修复所有错误                                              │
└─────────────────────────────────────────────────────────────────┘
```

## 详细任务说明

### Phase 1: 导入新类型

#### [T1] 导入新的表达式类
**文件**: `apps/server/src/module/query/dsl-transformer/dsl-transformer.v2.ts`

**修改内容**:
```typescript
import {
  // ... 现有导入
  InExpr,
  BetweenExpr,
  LikeExpr,
  IsNullExpr,
} from '@metric-engine/core';
```

**依赖**: 无
**并行**: 否（基础任务）

---

### Phase 2: 修改过滤器构建逻辑

#### [T2] 重构 filters 构建函数
**文件**: `apps/server/src/module/query/dsl-transformer/dsl-transformer.v2.ts`

**修改内容**:
将第 966-1016 行的 filters 构建逻辑重构为：

```typescript
const filters = (dsl.filters || []).map((filter) => {
  const fieldExpr = resolveField(filter.fieldId);

  // 时间过滤器处理（保持不变）
  if (filter.op === 'recent_days' && typeof filter.value === 'number') {
    return TimeFilter.createRecentFilter(
      fieldExpr as any,
      TimeRange.RECENT_DAYS,
      filter.value,
    );
  }
  // ... 其他时间过滤器

  // 根据操作符类型构建不同的表达式
  switch (filter.op) {
    case 'in':
      return new InExpr(fieldExpr, parseValueList(filter.value), false);
    
    case 'not_in':
      return new InExpr(fieldExpr, parseValueList(filter.value), true);
    
    case 'between':
      return new BetweenExpr(
        fieldExpr,
        new LiteralExpr(filter.value.low),
        new LiteralExpr(filter.value.high),
        false
      );
    
    case 'not_between':
      return new BetweenExpr(
        fieldExpr,
        new LiteralExpr(filter.value.low),
        new LiteralExpr(filter.value.high),
        true
      );
    
    case 'like':
      return new LikeExpr(fieldExpr, new LiteralExpr(filter.value), false);
    
    case 'not_like':
      return new LikeExpr(fieldExpr, new LiteralExpr(filter.value), true);
    
    case 'is_null':
      return new IsNullExpr(fieldExpr, false);
    
    case 'is_not_null':
      return new IsNullExpr(fieldExpr, true);
    
    default:
      // 原有比较运算符处理
      const opMap: Record<string, Operator> = { ... };
      return new ComparisonExpr(
        opMap[filter.op] as ComparisonOperator,
        fieldExpr,
        new LiteralExpr(filter.value)
      );
  }
});

// 辅助函数：解析值列表
function parseValueList(value: any): LiteralExpr[] {
  if (Array.isArray(value)) {
    return value.map(v => new LiteralExpr(v));
  }
  return [new LiteralExpr(value)];
}
```

**依赖**: T1
**并行**: 否

---

### Phase 3: 编写测试用例

#### [T3] 编写测试文件
**文件**: `apps/server/src/module/query/dsl-transformer/dsl-transformer.v2.spec.ts`（新建）

**测试内容**:
- IN 列表筛选转换测试
- NOT IN 列表筛选转换测试
- BETWEEN 范围筛选转换测试
- NOT BETWEEN 范围筛选转换测试
- LIKE 模糊匹配转换测试
- NOT LIKE 模糊匹配转换测试
- IS NULL 空值判断转换测试
- IS NOT NULL 空值判断转换测试
- 混合筛选条件测试

**依赖**: T2
**并行**: 否

---

### Phase 4: 验证与修复

#### [T4] 运行测试验证功能
**命令**: `pnpm --filter server test dsl-transformer.v2`

**依赖**: T3
**并行**: 否

#### [T5] 运行 lint 和 typecheck 检查
**命令**: 
- `pnpm --filter server lint`
- `pnpm --filter server type-check`

**依赖**: T4
**并行**: 可并行执行

#### [T6] 修复所有错误
**内容**: 修复 T4-T5 发现的所有问题

**依赖**: T5
**并行**: 否

---

## DSL 接口扩展

### QueryDSL.filters 字段扩展

```typescript
filters?: Array<{
  fieldId: number;
  op: string;
  value?: any;  // 根据操作符不同，格式不同
  raw?: boolean;
}>;
```

### value 格式说明

| 操作符 | value 格式 | 示例 |
|--------|-----------|------|
| `=` `!=` `>` `<` `>=` `<=` | 单值 | `100`, `'paid'` |
| `in` `not_in` | 数组 | `[1, 2, 3]`, `['paid', 'shipped']` |
| `between` `not_between` | 对象 | `{ low: 100, high: 1000 }` |
| `like` `not_like` | 字符串模式 | `'%张%'`, `'PROD_%'` |
| `is_null` `is_not_null` | 无需 value | - |

---

## 文件修改清单

| 文件 | 修改类型 | 任务 |
|------|---------|------|
| `dsl-transformer.v2.ts` | 修改 | T1, T2 |
| `dsl-transformer.v2.spec.ts` | 新建 | T3 |

---

## 预期产出

完成后，前端可以通过以下 DSL 进行筛选：

```typescript
// IN 列表筛选
{ fieldId: 1, op: 'in', value: ['paid', 'shipped', 'completed'] }

// NOT IN 列表筛选
{ fieldId: 1, op: 'not_in', value: ['cancelled', 'refunded'] }

// BETWEEN 范围筛选
{ fieldId: 2, op: 'between', value: { low: 100, high: 1000 } }

// NOT BETWEEN 范围筛选
{ fieldId: 2, op: 'not_between', value: { low: 100, high: 1000 } }

// LIKE 模糊匹配
{ fieldId: 3, op: 'like', value: '%张%' }

// NOT LIKE 模糊匹配
{ fieldId: 3, op: 'not_like', value: '%spam%' }

// IS NULL 空值判断
{ fieldId: 4, op: 'is_null' }

// IS NOT NULL 空值判断
{ fieldId: 4, op: 'is_not_null' }
```
