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
