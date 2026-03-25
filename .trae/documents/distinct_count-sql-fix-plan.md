# DISTINCT_COUNT SQL 生成修复计划

## 问题描述

当前 V2 表达式 `SUM(#F92) / DISTINCT_COUNT(#F87)` 生成的 SQL 有两个问题：

### 问题 1：DISTINCT_COUNT 重复添加 DISTINCT
- 表达式被解析为：`BinaryExpr(左: AggExpr(SUM, #F92), 右: AggExpr(DISTINCT_COUNT, #F87, true), op: /)`
- SQL 生成：`SUM(t2.total_amount) / DISTINCT_COUNT(DISTINCT t3.order_id)`
- 错误原因：`DISTINCT_COUNT` 已经是"去重计数"的语义，SQL 生成时又加了一次 `DISTINCT`，导致语法错误

### 问题 2：二元运算缺少括号（潜在问题）
- 生成的 SQL：`SUM(t2.total_amount) / DISTINCT_COUNT(DISTINCT t3.order_id)`
- SQL 解析器可能把整个 `DISTINCT_COUNT(DISTINCT t3.order_id)` 当成字段名

---

## 问题定位

### 位置 1：knex-builder.ts - SQL 生成逻辑
**文件**: `packages/metric_engine/src/v2/sql/knex-builder.ts`
**行号**: 582-587

```typescript
// 当前代码
if (expr.functionName && expr.arg !== undefined && !expr.args) {
  const argStr = this.buildExpr(expr.arg);
  if (expr.distinct) {
    return `${expr.functionName}(DISTINCT ${argStr})`;  // 问题：DISTINCT_COUNT 又加了 DISTINCT
  }
  return `${expr.functionName}(${argStr})`;
}
```

### 位置 2：parser.ts - 表达式解析逻辑
**文件**: `packages/metric_engine/src/v2/expr/parser.ts`
**行号**: 205-206

```typescript
// 当前代码
if (upperFunctionName === 'DISTINCT_COUNT') {
  return new AggExpr('DISTINCT_COUNT' as AggFuncName, args[0], true);
}
```

---

## 修复方案

### 修复 1：在 knex-builder.ts 中处理 DISTINCT_COUNT

修改 `knex-builder.ts` 第 582-590 行，在 SQL 生成时将 `DISTINCT_COUNT` 转换为标准的 `COUNT(DISTINCT ...)` 语法：

```typescript
if (expr.functionName && expr.arg !== undefined && !expr.args) {
  const argStr = this.buildExpr(expr.arg);
  
  // DISTINCT_COUNT 已经是"去重计数"语义，直接转换为 COUNT(DISTINCT ...)
  if (expr.functionName === 'DISTINCT_COUNT') {
    return `COUNT(DISTINCT ${argStr})`;
  }
  
  if (expr.distinct) {
    return `${expr.functionName}(DISTINCT ${argStr})`;
  }
  return `${expr.functionName}(${argStr})`;
}
```

### 修复 2：扩展 needsParens 方法（可选但推荐）

为二元运算中的聚合函数添加括号，避免 SQL 解析问题：

**文件**: `packages/metric_engine/src/v2/sql/knex-builder.ts`
**位置**: `needsParens` 方法（约第 650 行）

```typescript
private needsParens(
  expr: any,
  parentOp: string,
  position: "left" | "right",
): boolean {
  // 如果是聚合函数，需要括号
  if (expr.functionName && expr.arg !== undefined) {
    return true;
  }

  // 原有逻辑...
}
```

---

## 修复后预期效果

### 修复前
```sql
-- 输入
SUM(#F92) / DISTINCT_COUNT(#F87)

-- 输出（错误）
SUM(t2.total_amount) / DISTINCT_COUNT(DISTINCT t3.order_id)
```

### 修复后
```sql
-- 输入
SUM(#F92) / DISTINCT_COUNT(#F87)

-- 输出（正确）
(SUM(t2.total_amount)) / (COUNT(DISTINCT t3.order_id))
```

---

## 实施步骤

1. **修改 knex-builder.ts**
   - 在 `buildExpr` 方法中添加对 `DISTINCT_COUNT` 的特殊处理
   - 将 `DISTINCT_COUNT` 转换为 `COUNT(DISTINCT ...)`

2. **（可选）修改 knex-builder.ts**
   - 扩展 `needsParens` 方法，为聚合函数添加括号

3. **测试验证**
   - 测试 `DISTINCT_COUNT` 单独使用
   - 测试 `DISTINCT_COUNT` 在算术表达式中使用
   - 测试其他聚合函数（SUM、COUNT、AVG 等）

---

## 影响范围

- **受影响**: 使用 V2 expression 语法定义指标的场景
- **不受影响**: 
  - V1 的聚合指标定义（通过 UI 配置的 aggregate metrics）
  - 其他聚合函数（SUM、COUNT、AVG、MAX、MIN）
