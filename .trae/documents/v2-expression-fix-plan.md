# V2 表达式语法修复计划

## 背景

文档 `v2-expression-syntax.md` 声明支持比较运算符和条件表达式，但实际代码存在缺失：

| 问题 | 描述 | 影响 |
|------|------|------|
| 问题1 | 比较运算符解析缺失 | `status == 'paid'` 等表达式无法解析 |
| 问题2 | 条件表达式 SQL 生成缺失 | 三元运算符解析成功但 SQL 生成空字符串 |

---

## 修复目标

修复后支持以下文档声明的语法：

```javascript
// 条件表达式
status == 'paid' ? user_id : null

// 带条件的去重计数
COUNT(DISTINCT (status == 'paid' ? user_id : null))
```

---

## 实现步骤

### 问题1：比较运算符解析支持

**修改文件**：`packages/metric_engine/src/v2/expr/parser.ts`

**修改位置**：`transformBinary` 方法（约第 148-163 行）

**修改内容**：

```typescript
private transformBinary(node: jsep.BinaryExpression): BinaryExpr | ComparisonExpr {
  const left = this.transform(node.left);
  const right = this.transform(node.right);
  const operator = node.operator;

  // 算术运算符
  const arithmeticOperators = ['+', '-', '*', '/'];
  // 比较运算符
  const comparisonOperators = ['=', '==', '!=', '<>', '>', '<', '>=', '<='];

  if (arithmeticOperators.includes(operator)) {
    return new BinaryExpr(operator as BinaryOperator, left, right);
  }

  if (comparisonOperators.includes(operator)) {
    return new ComparisonExpr(operator as ComparisonOperator, left, right);
  }

  throw new Error(`不支持的二元运算符: ${operator}`);
}
```

**需要导入**：在文件顶部添加 `ComparisonExpr` 和 `ComparisonOperator` 的导入

---

### 问题2：条件表达式 SQL 生成

**修改文件**：`packages/metric_engine/src/v2/sql/knex-builder.ts`

#### 修改点 2.1：`buildExpr` 方法

**位置**：约第 581-662 行

**添加内容**：在处理一元运算表达式之后，默认返回之前添加：

```typescript
// 处理条件表达式 (ConditionalExpr)
if (expr.condition !== undefined && expr.consequent !== undefined && expr.alternate !== undefined) {
  const condStr = this.buildExpr(expr.condition);
  const consStr = this.buildExpr(expr.consequent);
  const altStr = this.buildExpr(expr.alternate);
  
  // 如果 alternate 是 null，生成不带 ELSE 的 CASE WHEN
  if (expr.alternate.value !== undefined && expr.alternate.value === null) {
    return `CASE WHEN ${condStr} THEN ${consStr} END`;
  }
  return `CASE WHEN ${condStr} THEN ${consStr} ELSE ${altStr} END`;
}
```

#### 修改点 2.2：`buildExprWithAlias` 方法

**位置**：约第 421-476 行

**添加内容**：在处理一元运算表达式之后添加类似的条件表达式处理逻辑：

```typescript
// 处理条件表达式 (ConditionalExpr)
if (expr.condition !== undefined && expr.consequent !== undefined && expr.alternate !== undefined) {
  const condStr = this.buildExprWithAlias(expr.condition, aliasMap);
  const consStr = this.buildExprWithAlias(expr.consequent, aliasMap);
  const altStr = this.buildExprWithAlias(expr.alternate, aliasMap);
  
  if (expr.alternate.value !== undefined && expr.alternate.value === null) {
    return `CASE WHEN ${condStr} THEN ${consStr} END`;
  }
  return `CASE WHEN ${condStr} THEN ${consStr} ELSE ${altStr} END`;
}
```

#### 修改点 2.3：`collectFieldsFromExpr` 方法

**位置**：约第 380-413 行

**添加内容**：添加对条件表达式的字段收集：

```typescript
// 处理条件表达式
if (expr.condition !== undefined && expr.consequent !== undefined) {
  this.collectFieldsFromExpr(expr.condition, fields);
  this.collectFieldsFromExpr(expr.consequent, fields);
  if (expr.alternate !== undefined) {
    this.collectFieldsFromExpr(expr.alternate, fields);
  }
  return;
}
```

---

## 验证步骤

修复完成后，运行测试验证：

```bash
cd packages/metric_engine
npx ts-node test/test-sql-generator.ts
```

可添加以下测试用例验证修复效果：

```typescript
// 测试条件表达式
const testConditional = tester.generateSQL({
  mainTable: "orders",
  mainTableAlias: "o",
  dimensions: [{ field: "status", tableAlias: "o" }],
  metrics: [
    {
      type: "agg",
      aggFunc: "SUM",
      field: "CASE WHEN status = 'paid' THEN amount ELSE 0 END",
      tableAlias: "o",
      alias: "paid_amount",
    },
  ],
  filters: [],
});
```

---

## 风险评估

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 破坏现有功能 | 低 | 只添加新逻辑，不修改现有逻辑 |
| 类型不匹配 | 低 | 使用已有的类型定义 |
| SQL 语法错误 | 低 | CASE WHEN 是标准 SQL |

---

## 预计工作量

| 任务 | 预计时间 |
|------|----------|
| 问题1 修复 | 5 分钟 |
| 问题2 修复 | 10 分钟 |
| 测试验证 | 5 分钟 |
| **总计** | **20 分钟** |
