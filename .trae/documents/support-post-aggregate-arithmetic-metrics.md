# 支持后聚合指标和算术运算指标实现计划

## 背景

当前 `dsl-transformer.v2.ts` 仅支持 `AGGREGATE` 和 `ROW_LEVEL` 两种指标类型。Server端数据模型 `DatasetMetric` 已完整定义了 `POST_AGGREGATE` 和 `ARITHMETIC` 类型的字段，需要扩展DSL转换器来支持这两种指标类型。

## 数据模型分析
### 后聚合指标 (POST_AGGREGATE)
- `sourceMetricId`: 被聚合的源指标ID
- `aggregateFunction`: 聚合函数 (sum/count/avg/max/min)
- `distinct`: 是否去重

### 算术运算指标 (ARITHMETIC)
- `leftMetricId`: 左操作数指标ID
- `arithmeticOperator`: 运算符 (+/-/*/)
- `rightMetricOperand`: 右操作数（指标ID或数字）
- `rightMetricOperandField`: 右操作数指标（关联关系）

## 实现步骤
### 步骤1: 添加 resolveMetric 辅助函数
在 `DSLTransformerV2` 类中添加静态方法，用于递归解析指标引用：
```typescript
private static resolveMetric(
  metricId: number,
  metricMap: Map<number, DatasetMetricResponse>,
  fieldMap: Map<number, DatasetFieldResponse>,
  mainTableAlias: string,
): Expr
```
该方法需要支持递归解析嵌套的指标定义。

### 步骤2: 添加 buildAggregateExpr 方法
提取现有的聚合指标构建逻辑为独立方法，供 `resolveMetric` 调用：
```typescript
private static buildAggregateExpr(
  metric: DatasetMetricResponse,
  fieldMap: Map<number, DatasetFieldResponse>,
  mainTableAlias: string,
): AggExpr
```

### 步骤3: 添加 buildRowLevelExpr 方法
提取现有的行级指标构建逻辑为独立方法：
```typescript
private static buildRowLevelExpr(
  metric: DatasetMetricResponse,
  fieldMap: Map<number, DatasetFieldResponse>,
  mainTableAlias: string,
): BinaryExpr
```

### 步骤4: 实现 POST_AGGREGATE 处理
在 `metrics.map()` 的 switch 中添加:
```typescript
case MetricType.POST_AGGREGATE: {
  if (!metricInfo.sourceMetricId) {
    throw new Error('post_aggregate metric需要sourceMetricId字段');
  }

  // 递归解析源指标
  const sourceExpr = this.resolveMetric(
    metricInfo.sourceMetricId,
    metricMap,
    fieldMap,
    mainTableAlias,
  );

  const funcMap: Record<string, AggFuncName> = {
    count: 'COUNT',
    sum: 'SUM',
    avg: 'AVG',
    max: 'MAX',
    min: 'MIN',
    distinct_count: 'COUNT',
  };

  const funcName = funcMap[metricInfo.aggregateFunction || 'sum'] || 'SUM';
  const isDistinct = metricInfo.distinct || 
    metricInfo.aggregateFunction === MetricAggregateFunction.DISTINCT_COUNT;

  return new AggExpr(funcName, sourceExpr, isDistinct, {
    alias,
    businessName: metricInfo.businessName,
  });
}
```

生成SQL示例: `AVG(revenue) as avg_revenue`

### 步骤5: 实现 ARITHMETIC 处理
在 `metrics.map()` 的 switch 中添加
```typescript
case MetricType.ARITHMETIC: {
  if (!metricInfo.leftMetricId || !metricInfo.arithmeticOperator) {
    throw new Error('arithmetic metric需要leftMetricId和arithmeticOperator字段');
  }

  // 左操作数 - 必须是指标
  const leftExpr = this.resolveMetric(
    metricInfo.leftMetricId,
    metricMap,
    fieldMap,
    mainTableAlias,
  );

  // 右操作数 - 可能是指标或数字
  let rightExpr: Expr;
  
  // 检查是否有右操作数指标引用
  if (metricInfo.rightMetricOperandField?.id) {
    // 右操作数是指标
    rightExpr = this.resolveMetric(
      metricInfo.rightMetricOperandField.id,
      metricMap,
      fieldMap,
      mainTableAlias,
    );
  } else if (metricInfo.rightMetricOperand !== undefined && metricInfo.rightMetricOperand !== null) {
    // 右操作数是数字常量
    rightExpr = new LiteralExpr(Number(metricInfo.rightMetricOperand));
  } else {
    throw new Error('arithmetic metric需要rightMetricOperand或rightMetricOperandField');
  }

  const opMap: Record<string, BinaryOperator> = {
    '+': '+',
    '-': '-',
    '*': '*',
    '/': '/',
  };

  return new BinaryExpr(
    opMap[metricInfo.arithmeticOperator] || '+',
    leftExpr,
    rightExpr,
    {
      alias,
      businessName: metricInfo.businessName,
    },
  );
}
```
生成SQL示例: `(profit / revenue) * 100 as profit_margin`

### 步骤6: 验证构建
运行 `pnpm run build` 磀保无 TypeScript 错误。

## 预期结果
### 后聚合指标示例
```json
{
  "name": "avg_revenue",
  "metricType": "post_aggregate",
  "sourceMetricId": 1,
  "aggregateFunction": "avg"
}
```
生成SQL: `AVG(revenue) as avg_revenue`

### 算术运算指标示例
```json
{
  "name": "profit_margin",
  "metricType": "arithmetic",
  "leftMetricId": 2,
  "arithmeticOperator": "/",
  "rightMetricOperand": 3
}
```
生成SQL: `(profit / revenue) as profit_margin`
