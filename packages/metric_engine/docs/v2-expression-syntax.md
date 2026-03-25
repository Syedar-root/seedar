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

## 不支持

- SQL 风格 CASE WHEN（只支持三元运算符）
- AND/OR 组合条件
