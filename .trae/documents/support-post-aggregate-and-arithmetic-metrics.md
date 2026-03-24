# 支持后聚合指标和算术运算指标实现计划

## 目标
在 `dsl-transformer.v2.ts` 中扩展支持 `POST_AGGREGATE`（后聚合指标）和 `ARITHMETIC`（算术运算指标）两种指标类型。

## 当前状态

### 已支持的指标类型
- ✅ `AGGREGATE` - 聚合指标（含distinct和aggregateCondition支持）
- ✅ `ROW_LEVEL` - 行级指标

### 待支持的指标类型
- ❌ `POST_AGGREGATE` - 后聚合指标
- ❌ `ARITHMETIC` - 算术运算指标

## 数据模型分析

### 后聚合指标 (POST_AGGREGATE)
```typescript
// dataset-metric.entity.ts 中的字段
sourceMetricId: number;           // 被聚合的源指标ID
aggregateFunction: MetricAggregateFunction;  // 聚合函数
distinct: boolean;                // 是否去重
```

**业务场景**：对已聚合的指标进行二次聚合，如：
- 对"销售额"求平均值：`AVG(销售额)`
- 对"订单数"求总和：`SUM(订单数)`

### 算术运算指标 (ARITHMETIC)
```typescript
// dataset-metric.entity.ts 中的字段
leftMetricId: number;             // 左操作数指标ID
arithmeticOperator: MetricOperator;  // 运算符 (+, -, *, /)
rightMetricOperand: number;       // 右操作数（指标ID或数字）
rightMetricOperandField: DatasetMetric;  // 右操作数指标引用
```

**业务场景**：指标间或指标与常量的运算，如：
- 利润率 = `利润 / 销售额`
- 目标差额 = `实际销售额 - 目标销售额`
- 折扣后金额 = `原价 * 0.8`

## 实现步骤

### 步骤1: 添加 resolveMetric 辅助函数

在 `DSLTransformerV2` 类中添加静态方法，用于递归解析指标引用：

```typescript
/**
 * 解析指标引用，返回 Expr 表达式
 * 支持递归解析嵌套的指标定义
 */
private static resolveMetric(
  metricId: number,
  metricMap: Map<number, DatasetMetricResponse>,
  fieldMap: Map<number, DatasetFieldResponse>,
  mainTableAlias: string,
): Expr {
  const metric = metricMap.get(metricId);
  if (!metric) {
    throw new Error(`找不到指标: ${metricId}`);
  }

  // 根据指标类型递归构建表达式
  switch (metric.metricType) {
    case MetricType.AGGREGATE:
      // 构建聚合表达式
      return this.buildAggregateExpr(metric, fieldMap, mainTableAlias);
    case MetricType.ROW_LEVEL:
      // 构建行级表达式
      return this.buildRowLevelExpr(metric, fieldMap, mainTableAlias);
    case MetricType.POST_AGGREGATE:
      // 递归构建后聚合表达式
      return this.buildPostAggregateExpr(metric, metricMap, fieldMap, mainTableAlias);
    case MetricType.ARITHMETIC:
      // 递归构建算术表达式
      return this.buildArithmeticExpr(metric, metricMap, fieldMap, mainTableAlias);
    default:
      // 其他类型返回指标引用
      return new MetricRefExpr(metric.name, {
        alias: metric.name,
        businessName: metric.businessName,
      });
  }
}
```

### 步骤2: 添加 buildAggregateExpr 方法

提取现有的聚合指标构建逻辑为独立方法：

```typescript
private static buildAggregateExpr(
  metric: DatasetMetricResponse,
  fieldMap: Map<number, DatasetFieldResponse>,
  mainTableAlias: string,
): AggExpr {
  // 现有的 AGGREGATE 处理逻辑
  // ...
}
```

### 步骤3: 添加 buildRowLevelExpr 方法

提取现有的行级指标构建逻辑为独立方法：

```typescript
private static buildRowLevelExpr(
  metric: DatasetMetricResponse,
  fieldMap: Map<number, DatasetFieldResponse>,
  mainTableAlias: string,
): BinaryExpr {
  // 现有的 ROW_LEVEL 处理逻辑
  // ...
}
```

### 步骤4: 实现 POST_AGGREGATE 处理

在 `metrics.map()` 的 switch 中添加：

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

### 步骤5: 实现 ARITHMETIC 处理

在 `metrics.map()` 的 switch 中添加：

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

### 步骤6: 重构现有代码

将现有的 AGGREGATE 和 ROW_LEVEL 处理逻辑提取为独立方法，减少代码重复，便于递归调用。

## 文件修改清单

| 文件 | 修改内容 |
|------|---------|
| `dsl-transformer.v2.ts` | 添加 resolveMetric、buildAggregateExpr、buildRowLevelExpr 方法；添加 POST_AGGREGATE 和 ARITHMETIC case |

## 测试验证

1. 构建验证：`pnpm run build`
2. 类型检查：确保无 TypeScript 错误

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
  "rightMetricId": 3
}
```
生成SQL: `profit / revenue as profit_margin`
