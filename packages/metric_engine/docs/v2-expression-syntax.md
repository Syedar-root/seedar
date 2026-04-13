# V2 Expression 语法支持

基于 [jsep](https://github.com/soney/jsep) 库解析，支持标准的 JavaScript 表达式语法。

---

## 支持的运算符

### 算术运算符
```typescript
+  -  *  /
```

### 比较运算符
```typescript
=  ==  !=  <>  >  <  >=  <=
```

### 筛选运算符
```typescript
IN        // 列表匹配
NOT IN    // 列表排除
BETWEEN   // 范围匹配
NOT BETWEEN
LIKE      // 模糊匹配
NOT LIKE
IS NULL   // 空值判断
IS NOT NULL
```

### 聚合函数
```typescript
SUM  COUNT  AVG  MAX  MIN  DISTINCT_COUNT
```

---

## 简单案例

### 1. 字段运算
```javascript
amount * quantity
```
```sql
amount * quantity
```

### 2. 聚合函数
```javascript
SUM(amount)
COUNT(user_id)
DISTINCT_COUNT(order_id)
COUNT(DISTINCT user_id)
```
```sql
SUM(t1.amount)
COUNT(t1.user_id)
COUNT(DISTINCT t1.order_id)
COUNT(DISTINCT t1.user_id)
```

### 3. 引用字段/指标（DSLTransformerV2 预处理）
```javascript
#F92         // 引用字段 ID 92
#M100        // 引用指标 ID 100
```
```sql
total_amount  // #F92 替换为字段名
revenue       // #M100 替换为指标名
```

---

## 复杂案例

### 1. 算术运算 + 聚合
```javascript
SUM(#F92) / DISTINCT_COUNT(#F87)
```
```sql
(SUM(t2.total_amount)) / (COUNT(DISTINCT t3.order_id))
```

### 2. 嵌套聚合（触发 CTE）
```javascript
SUM(price) * SUM(quantity)
```
```sql
-- 使用 CTE
WITH base_cte AS (...) SELECT (SUM(price)) * (SUM(quantity)) FROM base_cte
```

### 3. 条件表达式（三元运算符）
```javascript
status == 'paid' ? user_id : null
```
```sql
CASE WHEN status = 'paid' THEN user_id END
```

### 4. 带条件的去重计数
```javascript
COUNT(DISTINCT (status == 'paid' ? user_id : null))
```
```sql
COUNT(DISTINCT CASE WHEN status = 'paid' THEN user_id END)
```

### 5. 多指标运算
```javascript
#M100 * 1.1
```
```sql
(revenue) * 1.1
```

### 6. 复杂算术表达式
```javascript
(SUM(amount) - SUM(cost)) / SUM(cost) * 100
```
```sql
((SUM(t1.amount)) - (SUM(t1.cost))) / (SUM(t1.cost)) * 100
```

---

## 筛选表达式

### 1. IN / NOT IN 列表匹配
```typescript
import { InExpr, FieldRefExpr, LiteralExpr } from '@metric-engine/core';

// IN 列表
new InExpr(
  new FieldRefExpr("status", "orders", "t1"),
  [new LiteralExpr("paid"), new LiteralExpr("shipped")]
);
```
```sql
status IN ('paid', 'shipped')
```

```typescript
// NOT IN 列表
new InExpr(
  new FieldRefExpr("status", "orders", "t1"),
  [new LiteralExpr("cancelled"), new LiteralExpr("refunded")],
  true  // negated = true
);
```
```sql
status NOT IN ('cancelled', 'refunded')
```

### 2. BETWEEN / NOT BETWEEN 范围匹配
```typescript
import { BetweenExpr, FieldRefExpr, LiteralExpr } from '@metric-engine/core';

// BETWEEN
new BetweenExpr(
  new FieldRefExpr("amount", "orders", "t1"),
  new LiteralExpr(100),
  new LiteralExpr(1000)
);
```
```sql
amount BETWEEN 100 AND 1000
```

```typescript
// NOT BETWEEN
new BetweenExpr(
  new FieldRefExpr("amount", "orders", "t1"),
  new LiteralExpr(100),
  new LiteralExpr(1000),
  true  // negated = true
);
```
```sql
amount NOT BETWEEN 100 AND 1000
```

### 3. LIKE / NOT LIKE 模糊匹配
```typescript
import { LikeExpr, FieldRefExpr, LiteralExpr } from '@metric-engine/core';

// LIKE
new LikeExpr(
  new FieldRefExpr("name", "users", "t1"),
  new LiteralExpr("%张%")
);
```
```sql
name LIKE '%张%'
```

```typescript
// NOT LIKE
new LikeExpr(
  new FieldRefExpr("email", "users", "t1"),
  new LiteralExpr("%spam%"),
  true  // negated = true
);
```
```sql
email NOT LIKE '%spam%'
```

### 4. IS NULL / IS NOT NULL 空值判断
```typescript
import { IsNullExpr, FieldRefExpr } from '@metric-engine/core';

// IS NULL
new IsNullExpr(new FieldRefExpr("deleted_at", "orders", "t1"));
```
```sql
deleted_at IS NULL
```

```typescript
// IS NOT NULL
new IsNullExpr(new FieldRefExpr("paid_at", "orders", "t1"), true);
```
```sql
paid_at IS NOT NULL
```

---

## 不支持

- SQL 风格 CASE WHEN（只支持三元运算符）
- AND/OR 组合条件（需通过多个 filter 实现）
- 表达式字符串解析 IN/BETWEEN/LIKE/IS NULL（需直接构造 AST 对象）
---

## V2.1 同环比补充

以下内容描述的是当前已经实现并通过测试的 V2.1 同环比能力。

### 1. 新增的表达式类型

V2 AST 当前新增：

```typescript
ExprKind.PeriodComparison
PeriodOffsetType
ComparisonMode
PeriodComparisonExpr
```

其中：

```typescript
enum PeriodOffsetType {
  DAY_OVER_DAY
  WEEK_OVER_WEEK
  MONTH_OVER_MONTH
  QUARTER_OVER_QUARTER
  YEAR_OVER_YEAR
}

enum ComparisonMode {
  PERCENTAGE
  ABSOLUTE
}
```

说明：

- 当前只支持 `PERCENTAGE` 和 `ABSOLUTE`
- `BOTH` 当前不支持

### 2. 新增的字符串语法

`parseExpression()` 当前支持以下同环比函数：

```javascript
MOM(baseMetric, timeField)
YOY(baseMetric, timeField)
WOW(baseMetric, timeField)
QOQ(baseMetric, timeField)
DOD(baseMetric, timeField)
```

示例：

```javascript
MOM(SUM(amount), order_date)
YOY(AVG(revenue), sale_date)
WOW(COUNT(order_id), created_at)
QOQ(MAX(cost), accounting_date)
DOD(MIN(balance), biz_date)
```

说明：

- 第二个参数必须是显式字段引用
- 字符串函数当前默认生成 `ComparisonMode.PERCENTAGE`
- 如果要生成 `ABSOLUTE`，需要直接构造 `PeriodComparisonExpr`

### 3. 当前支持的 SQL 执行能力

`KnexQueryBuilder` 当前已经支持在 `QuerySpec.metrics` 顶层执行 `PeriodComparisonExpr`。

当前支持：

- 无维度卡片型同环比
- 有维度分组的同环比
- 普通指标 + 同环比指标混合查询
- 多个同环比指标同时出现

多个同环比指标同时出现时，必须共享：

- 相同的 `timeField`
- 相同的 `offsetType`

否则会直接报错。

### 4. 时间过滤条件的要求

同环比 planner 当前会：

- 继承所有非目标时间字段的过滤条件
- 只替换目标时间字段上的时间 filter

也就是说：

- `status = 'paid'` 这类业务过滤条件会同时保留在 current / comparison
- 目标时间字段上的时间窗口会在 comparison 分支中被平移替换

当前支持从以下过滤条件中识别 PoP 时间窗口：

```typescript
TIME_FILTER(...)
BetweenExpr(...)
```

#### 支持的 `TIME_FILTER` range

```typescript
recent_days
recent_weeks
recent_months
CUSTOM_DATE_RANGE
```

示例：

```typescript
new CallExpr("TIME_FILTER", [
  new FieldRefExpr("order_date", "orders", "o"),
  new LiteralExpr("recent_months"),
  new LiteralExpr(1),
]);
```

或：

```typescript
new CallExpr("TIME_FILTER", [
  new FieldRefExpr("order_date", "orders", "o"),
  new LiteralExpr("CUSTOM_DATE_RANGE"),
  new LiteralExpr(0),
  new LiteralExpr("2026-04-01"),
  new LiteralExpr("2026-05-01"),
]);
```

示例：

```typescript
new BetweenExpr(
  new FieldRefExpr("order_date", "orders", "o"),
  new LiteralExpr("2026-04-01"),
  new LiteralExpr("2026-05-01")
);
```

当前不支持把下面这种普通比较表达式自动识别为 PoP 时间窗口：

```typescript
order_date >= '2026-04-01'
order_date < '2026-05-01'
```

### 5. 当前明确不支持的同环比用法

以下写法当前不支持：

```javascript
MOM(SUM(amount))
MOM(SUM(amount), 'order_date')
MOM(YOY(SUM(amount), order_date), order_date)
MOM(SUM(amount), order_date) / 2
```

原因分别是：

- 缺少显式 `timeField`
- 第二个参数不是字段引用
- 不支持嵌套同环比
- 不支持把同环比作为其他表达式的子表达式

### 6. Placement 限制

当前 `PeriodComparisonExpr` 只允许出现在：

```typescript
QuerySpec.metrics
```

并且必须是顶层 metric。

当前不允许出现在：

- `filters`
- `dimensions`
- `orderBy` 的表达式对象里
- 其他 metric 的子表达式里

如果要按同环比结果排序，应使用输出 alias，而不是直接把 `PeriodComparisonExpr` 放进 `orderBy.expr`。

示例：

```typescript
orderBy: [{ expr: "sales_mom_pct", dir: "desc" }]
```

### 7. AST 直接构造示例

```typescript
import {
  AggExpr,
  FieldRefExpr,
  PeriodComparisonExpr,
  PeriodOffsetType,
  ComparisonMode,
} from "@metric-engine/core";

const salesMomPct = new PeriodComparisonExpr(
  new AggExpr("SUM", new FieldRefExpr("amount", "orders", "o")),
  PeriodOffsetType.MONTH_OVER_MONTH,
  ComparisonMode.PERCENTAGE,
  new FieldRefExpr("order_date", "orders", "o"),
  undefined,
  { alias: "sales_mom_pct", businessName: "销售额月环比(%)" },
);

const salesMomAbs = new PeriodComparisonExpr(
  new AggExpr("SUM", new FieldRefExpr("amount", "orders", "o")),
  PeriodOffsetType.MONTH_OVER_MONTH,
  ComparisonMode.ABSOLUTE,
  new FieldRefExpr("order_date", "orders", "o"),
  undefined,
  { alias: "sales_mom_abs", businessName: "销售额月环比差值" },
);
```
