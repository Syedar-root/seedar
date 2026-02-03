# Metric Engine - 指标引擎

一个强大的 TypeScript 工具库，用于将 JSON Schema 查询定义转换为标准 SQL 语句。支持多种指标类型、维度分析、筛选条件和表连接，帮你快速构建数据分析和报表查询。

## 📋 目录

- [✨ 核心特性](#核心特性)
- [🚀 快速开始](#快速开始)
- [🧠 核心概念](#核心概念)
- [📚 详细指南](#详细指南)
- [💻 代码示例](#代码示例)
- [📖 API 参考](#api-参考)
- [🏗️ 项目结构](#项目结构)
- [🤝 贡献指南](#贡献指南)

---

## ✨ 核心特性

### 🔢 丰富的指标体系

| 指标类型 | 说明 | 示例 |
|---------|------|------|
| **行级指标** | 单行记录的字段运算 | `amount * quantity` |
| **聚合指标** | 多行记录的聚合计算 | `SUM(amount)`, `COUNT(id)` |
| **后聚合指标** | 对指标的再次聚合 | `AVG(total_amount)` |
| **算术运算指标** | 指标间的四则运算 | `revenue - cost` |
| **子查询指标** | 复杂子查询逻辑 | 基于时间窗口的统计 |
| **同环比指标** | 时间周期对比分析 | 月环比、年同比、周环比 |

### 🛠️ 完整的查询构建能力

- **多维度分析** - 支持任意字段作为分组维度
- **灵活筛选** - 多种运算符（等于、不等于、大于、小于、LIKE、IN 等）
- **表连接** - 支持 INNER、LEFT、RIGHT、FULL JOIN
- **时间条件** - 支持最近N天/周/月、自定义日期范围

### 🎯 智能 SQL 生成

- 自动处理表别名和字段引用
- 支持 GROUP BY 优化
- CTE 分阶段聚合支持
- 完整的错误检测和提示

---

## 🚀 快速开始

### 环境要求

- Node.js 18+
- TypeScript 5.3+
- pnpm（推荐）或 npm

### 安装

```bash
# 克隆项目
git clone https://github.com/your-org/metric-engine.git
cd metric-engine

# 安装依赖
pnpm install

# 编译项目
pnpm build
```

### 第一个查询

创建 `example.ts` 文件：

```typescript
import {
  Table, Field, Query, Dimension, Filter,
  AggregateMetric, SQLGenerator,
  FieldType, AggregateFunction, Operator
} from './dist/index';

// 1. 定义表结构
const orderTable = new Table({
  name: 'orders',
  fields: [
    new Field({ name: 'id', type: FieldType.NUMBER, alias: 'order_id' }),
    new Field({ name: 'user_id', type: FieldType.NUMBER }),
    new Field({ name: 'amount', type: FieldType.DECIMAL }),
    new Field({ name: 'status', type: FieldType.STRING }),
    new Field({ name: 'created_at', type: FieldType.DATETIME })
  ],
  alias: 'o',
  description: '订单表'
});

// 2. 创建指标
const totalSales = new AggregateMetric(
  'total_sales',
  AggregateFunction.SUM,
  orderTable.getField('amount')!,
  false,
  '总销售额'
);

const orderCount = new AggregateMetric(
  'order_count',
  AggregateFunction.COUNT,
  orderTable.getField('id')!,
  false,
  '订单数量'
);

// 3. 创建维度
const statusDimension = new Dimension(
  orderTable.getField('status')!,
  '订单状态'
);

// 4. 创建筛选条件
const completedFilter = new Filter(
  orderTable.getField('status')!,
  Operator.EQUALS,
  'completed'
);

// 5. 构建查询
const query = new Query(
  orderTable,
  [statusDimension],
  [totalSales, orderCount],
  [completedFilter]
);

// 6. 生成 SQL
const result = SQLGenerator.generate(query);

console.log('生成的 SQL:');
console.log(result.sql);
```

运行：

```bash
pnpm exec tsx example.ts
```

输出：

```sql
SELECT 
  o.status AS column_1 /* 订单状态 */,
  SUM(o.amount) AS column_2 /* 总销售额 */,
  COUNT(o.id) AS column_3 /* 订单数量 */
FROM orders AS o
WHERE o.status = 'completed'
GROUP BY o.status
```

---

## 🧠 核心概念

### 1. 数据模型

```
┌─────────────────────────────────────────────────────────────┐
│                        数据模型                              │
├─────────────────────────────────────────────────────────────┤
│  Table (表)                                                  │
│  ├── name: 表名                                              │
│  ├── fields: 字段列表                                        │
│  ├── alias: 表别名（用于SQL生成）                            │
│  └── description: 表描述                                     │
│                                                              │
│  Field (字段)                                                │
│  ├── name: 字段名                                            │
│  ├── type: 数据类型                                          │
│  ├── alias: 字段别名                                         │
│  └── description: 字段描述                                   │
│                                                              │
│  Join (连接)                                                 │
│  ├── type: 连接类型 (INNER/LEFT/RIGHT/FULL)                 │
│  ├── leftTable: 左表                                         │
│  ├── rightTable: 右表                                        │
│  └── conditions: 连接条件                                    │
└─────────────────────────────────────────────────────────────┘
```

### 2. 指标体系

```
┌─────────────────────────────────────────────────────────────┐
│                        指标类型                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  RowLevelMetric (行级指标)                                   │
│  └── 单行记录内的字段运算                                     │
│      示例: amount * quantity = 订单总价                      │
│                                                              │
│  AggregateMetric (聚合指标)                                  │
│  └── 多行记录聚合计算                                         │
│      示例: SUM(amount) = 总销售额                            │
│                                                              │
│  PostAggregateMetric (后聚合指标)                            │
│  └── 对聚合指标的再次聚合                                     │
│      示例: AVG(SUM(amount)) = 平均销售额                     │
│                                                              │
│  ArithmeticMetric (算术指标)                                 │
│  └── 指标间的四则运算                                         │
│      示例: revenue - cost = 利润                             │
│                                                              │
│  SubQueryMetric (子查询指标)                                 │
│  └── 复杂子查询逻辑                                          │
│      示例: 最近30天活跃用户数                                 │
│                                                              │
│  PeriodOverPeriodMetric (同环比指标)                         │
│  └── 时间周期对比分析                                        │
│      示例: 销售额月环比、订单数同比                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 3. 查询构建流程

```
查询定义
    │
    ▼
┌─────────────────┐
│  1. 定义 Table  │ ─── 数据库表结构定义
└────────┬────────┘
         │
    ▼
┌─────────────────┐
│  2. 定义 Field  │ ─── 字段和类型
└────────┬────────┘
         │
    ▼
┌─────────────────┐
│  3. 定义 Join   │ ─── 表间关系（可选）
└────────┬────────┘
         │
    ▼
┌─────────────────┐
│  4. 定义 Metric │ ─── 指标计算
└────────┬────────┘
         │
    ▼
┌─────────────────┐
│  5. 定义 Dim    │ ─── 分组维度
└────────┬────────┘
         │
    ▼
┌─────────────────┐
│  6. 定义 Filter │ ─── 筛选条件（可选）
└────────┬────────┘
         │
    ▼
┌─────────────────┐
│  7. 构建 Query  │ ─── 组装完整查询对象
└────────┬────────┘
         │
    ▼
┌─────────────────┐
│  8. SQL生成     │ ─── 自动生成SQL
└─────────────────┘
```

---

## 📚 详细指南

### 字段类型 (FieldType)

| 类型 | 说明 | SQL 对应 |
|-----|------|---------|
| `STRING` | 字符串 | `VARCHAR` |
| `NUMBER` | 整数 | `INT` |
| `DECIMAL` | 浮点数 | `DECIMAL` |
| `BOOLEAN` | 布尔值 | `BOOLEAN` |
| `DATE` | 日期 | `DATE` |
| `DATETIME` | 日期时间 | `DATETIME` |

### 聚合函数 (AggregateFunction)

| 函数 | 说明 | 示例 |
|-----|------|------|
| `COUNT` | 计数 | `COUNT(id)` |
| `SUM` | 求和 | `SUM(amount)` |
| `AVG` | 平均值 | `AVG(score)` |
| `MAX` | 最大值 | `MAX(price)` |
| `MIN` | 最小值 | `MIN(price)` |
| `DISTINCT_COUNT` | 去重计数 | `COUNT(DISTINCT user_id)` |

### 运算符 (Operator)

**比较运算符：**
- `EQUALS` (=)
- `NOT_EQUALS` (!=)
- `GREATER_THAN` (>)
- `LESS_THAN` (<)
- `GREATER_EQUAL` (>=)
- `LESS_EQUAL` (<=)
- `LIKE` (模糊匹配)
- `IN` (在列表中)
- `NOT_IN` (不在列表中)
- `IS_NULL` (为空)
- `IS_NOT_NULL` (不为空)

**逻辑运算符：**
- `AND` (且)
- `OR` (或)

**算术运算符：**
- `PLUS` (+)
- `MINUS` (-)
- `MULTIPLY` (*)
- `DIVIDE` (/)

### 连接类型 (JoinType)

| 类型 | 说明 |
|-----|------|
| `INNER` | 内连接 - 只返回匹配的记录 |
| `LEFT` | 左连接 - 返回左表所有记录 |
| `RIGHT` | 右连接 - 返回右表所有记录 |
| `FULL` | 全连接 - 返回所有记录 |

### 同环比类型 (PeriodOverPeriodType)

| 类型 | 说明 |
|-----|------|
| `MONTH_OVER_MONTH` | 月环比 |
| `YEAR_OVER_YEAR` | 年同比 |
| `WEEK_OVER_WEEK` | 周环比 |
| `QUARTER_OVER_QUARTER` | 季环比 |
| `DAY_OVER_DAY` | 日环比 |

---

## 💻 代码示例

### 示例 1: 基础查询

```typescript
import { Table, Field, Query, Dimension, Filter, AggregateMetric, SQLGenerator, FieldType, AggregateFunction, Operator } from './dist/index';

// 定义订单表
const ordersTable = new Table({
  name: 'orders',
  fields: [
    new Field({ name: 'id', type: FieldType.NUMBER }),
    new Field({ name: 'user_id', type: FieldType.NUMBER }),
    new Field({ name: 'amount', type: FieldType.DECIMAL }),
    new Field({ name: 'status', type: FieldType.STRING })
  ],
  alias: 'o'
});

// 定义用户表
const usersTable = new Table({
  name: 'users',
  fields: [
    new Field({ name: 'id', type: FieldType.NUMBER }),
    new Field({ name: 'name', type: FieldType.STRING }),
    new Field({ name: 'region', type: FieldType.STRING })
  ],
  alias: 'u'
});

// 创建连接
const join = new Join({
  type: JoinType.LEFT,
  leftTable: usersTable,
  rightTable: ordersTable,
  conditions: [new JoinCondition({ leftField: 'id', rightField: 'user_id' })]
});

// 定义指标
const totalSales = new AggregateMetric(
  'total_sales',
  AggregateFunction.SUM,
  ordersTable.getField('amount')!,
  false,
  '总销售额'
);

const orderCount = new AggregateMetric(
  'order_count',
  AggregateFunction.COUNT,
  ordersTable.getField('id')!,
  false,
  '订单数'
);

// 定义维度
const regionDimension = new Dimension(
  usersTable.getField('region')!,
  '地区'
);

// 定义筛选
const statusFilter = new Filter(
  ordersTable.getField('status')!,
  Operator.EQUALS,
  'completed'
);

// 构建查询
const query = new Query(
  usersTable,
  [regionDimension],
  [totalSales, orderCount],
  [statusFilter],
  [join]
);

// 生成 SQL
const result = SQLGenerator.generate(query);
console.log(result.sql);
```

**输出：**
```sql
SELECT 
  u.region AS column_1 /* 地区 */,
  SUM(o.amount) AS column_2 /* 总销售额 */,
  COUNT(o.id) AS column_3 /* 订单数 */
FROM users AS u
LEFT JOIN orders AS o ON u.id = o.user_id
WHERE o.status = 'completed'
GROUP BY u.region
```

### 示例 2: 行级指标

```typescript
import { Table, Field, RowLevelMetric, MetricExpression, Operator, FieldType, Query, Dimension, SQLGenerator, AggregateMetric, AggregateFunction } from './dist/index';

const orderTable = new Table({
  name: 'orders',
  fields: [
    new Field({ name: 'id', type: FieldType.NUMBER }),
    new Field({ name: 'unit_price', type: FieldType.DECIMAL }),
    new Field({ name: 'quantity', type: FieldType.NUMBER }),
    new Field({ name: 'discount', type: FieldType.DECIMAL }),
    new Field({ name: 'user_id', type: FieldType.NUMBER })
  ],
  alias: 'o'
});

// 行级指标：订单总价 = 单价 × 数量 - 折扣
const orderTotal = new RowLevelMetric(
  'order_total',
  new MetricExpression(
    new MetricExpression(
      orderTable.getField('unit_price')!,
      Operator.MULTIPLY,
      orderTable.getField('quantity')!
    ),
    Operator.MINUS,
    orderTable.getField('discount')!
  ),
  '订单总价'
);

// 聚合指标：总销售额（对行级指标聚合）
const totalSales = new AggregateMetric(
  'total_sales',
  AggregateFunction.SUM,
  orderTotal,  // 可以使用行级指标作为聚合对象
  false,
  '总销售额'
);

const query = new Query(
  orderTable,
  [],
  [totalSales]
);

const result = SQLGenerator.generate(query);
```

**输出：**
```sql
SELECT SUM((o.unit_price * o.quantity) - o.discount) AS column_1 /* 总销售额 */
FROM orders AS o
```

### 示例 3: 算术运算指标

```typescript
import { Table, Field, AggregateMetric, ArithmeticMetric, Query, Dimension, SQLGenerator, Operator, AggregateFunction, FieldType } from './dist/index';

const salesTable = new Table({
  name: 'sales',
  fields: [
    new Field({ name: 'id', type: FieldType.NUMBER }),
    new Field({ name: 'revenue', type: FieldType.DECIMAL }),
    new Field({ name: 'cost', type: FieldType.DECIMAL }),
    new Field({ name: 'tax', type: FieldType.DECIMAL }),
    new Field({ name: 'region', type: FieldType.STRING })
  ],
  alias: 's'
});

// 基础聚合指标
const totalRevenue = new AggregateMetric(
  'total_revenue',
  AggregateFunction.SUM,
  salesTable.getField('revenue')!,
  false,
  '总收入'
);

const totalCost = new AggregateMetric(
  'total_cost',
  AggregateFunction.SUM,
  salesTable.getField('cost')!,
  false,
  '总成本'
);

const totalTax = new AggregateMetric(
  'total_tax',
  AggregateFunction.SUM,
  salesTable.getField('tax')!,
  false,
  '总税费'
);

// 算术运算指标
const grossProfit = new ArithmeticMetric(
  'gross_profit',
  totalRevenue,
  Operator.MINUS,
  totalCost,
  '毛利润'
);

const netProfit = new ArithmeticMetric(
  'net_profit',
  grossProfit,
  Operator.MINUS,
  totalTax,
  '净利润'
);

const profitMargin = new ArithmeticMetric(
  'profit_margin',
  new ArithmeticMetric('ratio', netProfit, Operator.DIVIDE, totalRevenue),
  Operator.MULTIPLY,
  100,
  '利润率(%)'
);

const regionDimension = new Dimension(
  salesTable.getField('region')!,
  '地区'
);

const query = new Query(
  salesTable,
  [regionDimension],
  [totalRevenue, totalCost, grossProfit, netProfit, profitMargin]
);

const result = SQLGenerator.generate(query);
```

**输出：**
```sql
SELECT 
  s.region AS column_1 /* 地区 */,
  SUM(s.revenue) AS column_2 /* 总收入 */,
  SUM(s.cost) AS column_3 /* 总成本 */,
  SUM(s.revenue) - SUM(s.cost) AS column_4 /* 毛利润 */,
  (SUM(s.revenue) - SUM(s.cost)) - SUM(s.tax) AS column_5 /* 净利润 */,
  (((SUM(s.revenue) - SUM(s.cost)) - SUM(s.tax)) / SUM(s.revenue)) * 100 AS column_6 /* 利润率(%) */
FROM sales AS s
GROUP BY s.region
```

### 示例 4: 同环比指标

```typescript
import {
  Table, Field, Query, Dimension, Filter, AggregateMetric,
  PeriodOverPeriodMetric, SQLGenerator,
  FieldType, AggregateFunction, PeriodOverPeriodType, PeriodCalculationMode, Operator
} from './dist/index';

const ordersTable = new Table({
  name: 'orders',
  fields: [
    new Field({ name: 'id', type: FieldType.NUMBER }),
    new Field({ name: 'amount', type: FieldType.DECIMAL }),
    new Field({ name: 'order_date', type: FieldType.DATETIME }),
    new Field({ name: 'status', type: FieldType.STRING })
  ],
  alias: 'o'
});

// 基础指标
const totalSales = new AggregateMetric(
  'total_sales',
  AggregateFunction.SUM,
  ordersTable.getField('amount')!,
  false,
  '销售额'
);

const orderCount = new AggregateMetric(
  'order_count',
  AggregateFunction.COUNT,
  ordersTable.getField('id')!,
  false,
  '订单数'
);

// 同环比指标 - 销售额月环比
const salesMoM = new PeriodOverPeriodMetric(
  totalSales,
  PeriodOverPeriodType.MONTH_OVER_MONTH,
  ordersTable.getField('order_date')!,
  PeriodCalculationMode.PERCENTAGE,
  '销售额环比(%)'
);

// 同环比指标 - 订单数年同比
const ordersYoY = new PeriodOverPeriodMetric(
  orderCount,
  PeriodOverPeriodType.YEAR_OVER_YEAR,
  ordersTable.getField('order_date')!,
  PeriodCalculationMode.BOTH,
  '订单数同比'
);

// 维度
const monthDimension = new Dimension(
  ordersTable.getField('order_date')!,
  '月份'
);

// 筛选：最近3个月
const dateFilter = new Filter(
  ordersTable.getField('order_date')!,
  Operator.GREATER_EQUAL,
  '2024-10-01'
);

// 构建查询
const query = new Query(
  ordersTable,
  [monthDimension],
  [totalSales, orderCount, salesMoM, ordersYoY],
  [dateFilter]
);

const result = SQLGenerator.generate(query);
console.log(result.sql);
```

### 示例 5: 带时间条件的聚合指标

```typescript
import { Table, Field, AggregateMetric, AggregateCondition, Query, Dimension, SQLGenerator, FieldType, AggregateFunction, Operator } from './dist/index';

const userActivityTable = new Table({
  name: 'user_activity',
  fields: [
    new Field({ name: 'id', type: FieldType.NUMBER }),
    new Field({ name: 'user_id', type: FieldType.NUMBER }),
    new Field({ name: 'action', type: FieldType.STRING }),
    new Field({ name: 'activity_time', type: FieldType.DATETIME })
  ],
  alias: 'ua'
});

// 聚合条件：最近7天
const recentCondition: AggregateCondition = {
  timeField: userActivityTable.getField('activity_time')!,
  timeRange: 'recent_days',
  timeValue: 7
};

// 最近7天的活跃用户数
const recentActiveUsers = new AggregateMetric(
  'recent_active_users',
  AggregateFunction.DISTINCT_COUNT,
  userActivityTable.getField('user_id')!,
  false,
  '最近7天活跃用户数',
  undefined,
  recentCondition
);

// 最近30天的总操作次数
const recentActionsCondition: AggregateCondition = {
  timeField: userActivityTable.getField('activity_time')!,
  timeRange: 'recent_days',
  timeValue: 30
};

const recentActions = new AggregateMetric(
  'recent_actions',
  AggregateFunction.COUNT,
  userActivityTable.getField('id')!,
  false,
  '最近30天操作次数',
  undefined,
  recentActionsCondition
);

const query = new Query(
  userActivityTable,
  [],
  [recentActiveUsers, recentActions]
);

const result = SQLGenerator.generate(query);
```

### 示例 6: 子查询指标

```typescript
import { Table, Field, SubQueryMetric, Query, Dimension, SQLGenerator, FieldType } from './dist/index';

const ordersTable = new Table({
  name: 'orders',
  fields: [
    new Field({ name: 'id', type: FieldType.NUMBER }),
    new Field({ name: 'user_id', type: FieldType.NUMBER }),
    new Field({ name: 'amount', type: FieldType.DECIMAL }),
    new Field({ name: 'order_date', type: FieldType.DATETIME })
  ],
  alias: 'o'
});

// 子查询指标：客户的首次订单金额
const firstOrderAmount = new SubQueryMetric(
  'first_order_amount',
  `SELECT total_amount 
   FROM orders 
   WHERE customer_id = {customer_id} 
   ORDER BY order_date ASC 
   LIMIT 1`,
  { customer_id: 'user_id' },
  undefined,
  '首次订单金额'
);

// 子查询指标：客户最近一次订单金额
const lastOrderAmount = new SubQueryMetric(
  'last_order_amount',
  `SELECT total_amount 
   FROM orders 
   WHERE customer_id = {customer_id} 
   ORDER BY order_date DESC 
   LIMIT 1`,
  { customer_id: 'user_id' },
  undefined,
  '最近订单金额'
);

const query = new Query(
  ordersTable,
  [],
  [firstOrderAmount, lastOrderAmount]
);

const result = SQLGenerator.generate(query);
console.log(result.sql);
```

---

## 📖 API 参考

### 核心类

#### `Table`
数据表实体类，用于定义表结构。

```typescript
const table = new Table({
  name: 'users',
  fields: [
    new Field({ name: 'id', type: FieldType.NUMBER }),
    new Field({ name: 'name', type: FieldType.STRING })
  ],
  alias: 'u',
  description: '用户表'
});
```

**方法：**
- `getFullName()` - 获取完整表名（含别名）
- `getField(fieldName)` - 根据名称查找字段
- `withAlias(alias)` - 创建带新别名的表副本

#### `Field`
字段实体类，用于定义列。

```typescript
const field = new Field({
  name: 'amount',
  type: FieldType.DECIMAL,
  alias: 'order_amount',
  description: '订单金额'
});
```

**方法：**
- `getFullName(tableAlias?)` - 获取完整字段引用
- `withAlias(alias)` - 创建带新别名的字段副本

#### `Query`
查询实体类，包含完整的查询定义。

```typescript
const query = new Query(
  mainTable,           // 主表
  [dimension1],        // 维度列表
  [metric1, metric2],  // 指标列表
  [filter1],           // 筛选条件列表
  [join1]              // 连接列表
);
```

**方法：**
- `addJoin(join)` - 添加连接
- `addFilter(filter)` - 添加筛选
- `toJSONSchema()` - 转换为 JSON Schema

#### `SQLGenerator`
SQL 生成器类。

```typescript
const result = SQLGenerator.generate(query);

// 结果结构：
// {
//   sql: string,      // 生成的SQL语句
//   errors: string[], // 错误列表
//   aliasMapping?: {  // 别名映射（可选）
//     tables: Record<string, string>,
//     columns: Record<string, string>
//   }
// }
```

### 指标类

#### `RowLevelMetric`
行级指标，对单行记录进行运算。

```typescript
const metric = new RowLevelMetric(
  'order_total',
  new MetricExpression(
    field1,
    Operator.MULTIPLY,
    field2
  ),
  '订单总价'
);
```

#### `AggregateMetric`
聚合指标，对多行记录进行聚合。

```typescript
const metric = new AggregateMetric(
  'total_amount',
  AggregateFunction.SUM,
  field,
  false,           // 是否去重
  '总金额',
  undefined,       // 描述
  condition        // 可选的聚合条件
);
```

#### `ArithmeticMetric`
算术运算指标，对指标进行四则运算。

```typescript
const metric = new ArithmeticMetric(
  'profit',
  revenueMetric,    // 左操作数
  Operator.MINUS,   // 运算符
  costMetric,       // 右操作数
  '利润'
);
```

#### `PeriodOverPeriodMetric`
同环比指标，对指标添加时间对比。

```typescript
const metric = new PeriodOverPeriodMetric(
  baseMetric,                   // 基础指标
  PeriodOverPeriodType.MONTH_OVER_MONTH,  // 周期类型
  timeField,                    // 时间字段
  PeriodCalculationMode.PERCENTAGE,       // 计算模式
  '环比增长率'                  // 别名
);
```

#### `SubQueryMetric`
子查询指标，支持复杂子查询逻辑。

```typescript
const metric = new SubQueryMetric(
  'first_order',
  'SELECT amount FROM orders WHERE user_id = {user_id} ORDER BY date LIMIT 1',
  { user_id: 'id' },  // 字段映射
  undefined,          // 静态参数
  '首次订单'           // 描述
);
```

---

## 🏗️ 项目结构

```
metric_engine/
├── src/
│   ├── core/                    # 核心基础类
│   │   ├── types.ts             # 枚举类型和常量
│   │   ├── field.ts             # Field 字段类
│   │   ├── table.ts             # Table 数据表类
│   │   └── join.ts              # Join 连接类
│   ├── metrics/                 # 指标相关
│   │   └── metric-classes.ts    # 各种指标实现
│   ├── query/                   # 查询构建和SQL生成
│   │   ├── query-builder.ts     # Query、Dimension、Filter
│   │   ├── sql-generator.ts     # SQL生成器
│   │   └── filter.ts            # 筛选条件类
│   ├── database/                # 数据库连接
│   │   ├── database.ts
│   │   └── test-database.ts
│   ├── index.ts                 # 模块导出
│   └── demo.ts                  # 功能演示
├── examples/                    # 示例代码
│   ├── arithmetic-metric-example.ts
│   ├── period-over-period-example.ts
│   └── subquery-metric-example.ts
├── test-scenarios/              # 测试场景
│   ├── basic-query-validation/
│   ├── module-activity-analysis/
│   ├── project-portfolio-management/
│   └── subquery-testing/
├── dist/                        # 编译输出
├── doc/                         # 文档
├── package.json
└── tsconfig.json
```

---

## 🛠️ 开发命令

```bash
# 安装依赖
pnpm install

# 编译项目
pnpm build

# 运行演示
pnpm demo

# 运行所有测试场景
pnpm dsl-basic    # 基础查询验证
pnpm dsl-activity # 模块活跃度分析
pnpm dsl-portfolio # 项目组合管理
pnpm dsl-subquery # 子查询测试

# 清理构建产物
pnpm clean
```

---

## 📝 更新日志

### v1.0.0 (2024)
- ✨ 初始版本发布
- ✅ 支持基础查询构建
- ✅ 支持多种指标类型
- ✅ 支持表连接
- ✅ 支持筛选条件
- ✅ 支持同环比分析

---

## 🤝 贡献指南

欢迎贡献代码！请遵循以下步骤：

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

---

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

---

## 📧 联系方式

- 项目地址: https://github.com/your-org/metric-engine
- 问题反馈: https://github.com/your-org/metric-engine/issues

---

**Happy Coding! 🎉**
