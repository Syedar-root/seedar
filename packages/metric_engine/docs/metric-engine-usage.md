# Metric Engine 使用文档

## 概述

Metric Engine 是一个指标计算和查询 DSL 库，提供以下核心功能：

- **表达式 AST 系统**：统一的表达式抽象语法树，支持字段引用、聚合函数、算术运算
- **SQL 构建器**：基于 Knex 的链式 SQL 构建，自动处理 CTE
- **兼容层**：新旧 API 适配器，现有代码无需修改即可使用新架构

## 快速开始

### 安装

```bash
npm install @metric-engine/core knex
```

### 基本使用

```typescript
import knex from "knex";
import {
  QuerySpec,
  KnexQueryBuilder,
  FieldRefExpr,
  AggExpr,
  BinaryExpr,
  LiteralExpr,
  ComparisonExpr,
} from "@metric-engine/core";

// 创建 Knex 实例
const db = knex({
  client: "mysql2",
  connection: {
    host: "localhost",
    user: "root",
    password: "password",
    database: "test",
  },
});

// 创建查询构建器
const builder = new KnexQueryBuilder(db);

// 构建查询规格
const spec: QuerySpec = {
  from: { table: "orders", alias: "o" },
  joins: [],
  dimensions: [
    new FieldRefExpr("product_id", undefined, "o", { alias: "product_id" }),
  ],
  metrics: [
    new AggExpr("SUM", new FieldRefExpr("amount", undefined, "o"), false, {
      alias: "total_amount",
    }),
    new AggExpr("COUNT", new FieldRefExpr("id", undefined, "o"), false, {
      alias: "order_count",
    }),
  ],
  filters: [
    new ComparisonExpr(
      ">=",
      new FieldRefExpr("created_at", undefined, "o"),
      new LiteralExpr("2024-01-01"),
    ),
  ],
};

// 生成 SQL
const result = builder.build(spec);
console.log(result.sql);
console.log(result.bindings);
```

## 核心概念

### 1. 表达式系统 (Expr)

表达式系统是 Metric Engine 的核心，所有查询元素（维度、指标、过滤条件）都是表达式。

#### 表达式类型

| 类型       | 类名              | 说明                 | 示例                                     |
| ---------- | ----------------- | -------------------- | ---------------------------------------- |
| 字面量     | `LiteralExpr`     | 常量值               | `1`, `'hello'`, `true`, `null`           |
| 字段引用   | `FieldRefExpr`    | 引用数据表字段       | `orders.amount`, `o.id`                  |
| 指标引用   | `MetricRefExpr`   | 引用已定义的业务指标 | `total_sales`                            |
| 聚合函数   | `AggExpr`         | 聚合计算             | `SUM(amount)`, `COUNT(DISTINCT user_id)` |
| 二元运算   | `BinaryExpr`      | 算术运算             | `a + b`, `price * quantity`              |
| 比较运算   | `ComparisonExpr`  | 比较运算             | `a = b`, `x > 10`                        |
| 函数调用   | `CallExpr`        | 标量函数调用         | `UPPER(name)`, `DATE(created_at)`        |
| 条件表达式 | `ConditionalExpr` | 条件判断             | `CASE WHEN ... THEN ... ELSE ... END`    |

#### 创建表达式

```typescript
import {
  LiteralExpr,
  FieldRefExpr,
  AggExpr,
  BinaryExpr,
  ComparisonExpr,
  CallExpr,
} from "@metric-engine/core";

// 字面量
const num = new LiteralExpr(100);
const str = new LiteralExpr("hello");
const bool = new LiteralExpr(true);

// 字段引用
// FieldRefExpr(fieldName, tableName?, tableAlias?, meta?)
const field = new FieldRefExpr("amount", "orders", "o", {
  alias: "order_amount",
});

// 聚合函数
// AggExpr(functionName, arg, distinct?, meta?)
const sumAmount = new AggExpr(
  "SUM",
  new FieldRefExpr("amount", undefined, "o"),
);
const countDistinct = new AggExpr(
  "COUNT",
  new FieldRefExpr("user_id", undefined, "o"),
  true,
);

// 二元运算（算术）
const total = new BinaryExpr(
  "*",
  new FieldRefExpr("price"),
  new FieldRefExpr("quantity"),
);

// 嵌套聚合：SUM(A) * SUM(B)
const sumA = new AggExpr("SUM", new FieldRefExpr("price"));
const sumB = new AggExpr("SUM", new FieldRefExpr("quantity"));
const product = new BinaryExpr("*", sumA, sumB, {
  alias: "price_times_quantity",
});

// 比较运算
const filter = new ComparisonExpr(
  ">",
  new FieldRefExpr("amount"),
  new LiteralExpr(1000),
);

// 函数调用
const upperName = new CallExpr("UPPER", [new FieldRefExpr("name")]);
```

### 2. 查询规格 (QuerySpec)

QuerySpec 定义了完整的 SQL 查询结构。

```typescript
interface QuerySpec {
  // 主表信息
  from: {
    table: string; // 表名
    alias: string; // 别名
  };

  // 表连接
  joins: JoinSpec[];

  // 维度（分组字段）
  dimensions: Expr[];

  // 指标（聚合表达式）
  metrics: Expr[];

  // 过滤条件
  filters: Expr[];

  // 排序（可选）
  orderBy?: OrderBySpec[];

  // 分页（可选）
  limit?: number;
  offset?: number;
}
```

#### JoinSpec 结构

```typescript
interface JoinSpec {
  type: "left" | "inner" | "right"; // 连接类型
  table: string; // 表名
  alias: string; // 别名
  on: Expr; // 连接条件
}
```

#### OrderBySpec 结构

```typescript
interface OrderBySpec {
  expr: Expr | string; // 排序表达式
  dir: "asc" | "desc"; // 排序方向
}
```

### 3. SQL 构建器 (KnexQueryBuilder)

KnexQueryBuilder 将 QuerySpec 转换为 SQL 语句。

```typescript
import { KnexQueryBuilder, QuerySpec } from "@metric-engine/core";
import knex from "knex";

const db = knex({ client: "mysql2" });
const builder = new KnexQueryBuilder(db);

// 构建 SQL
const result = builder.build(spec);

// result.sql      - SQL 语句字符串
// result.bindings - 参数绑定数组
```

## 完整示例

### 示例 1：简单聚合查询

```typescript
import knex from "knex";
import {
  KnexQueryBuilder,
  QuerySpec,
  FieldRefExpr,
  AggExpr,
  ComparisonExpr,
  LiteralExpr,
} from "@metric-engine/core";

const db = knex({ client: "mysql2" });
const builder = new KnexQueryBuilder(db);

const spec: QuerySpec = {
  from: { table: "sales", alias: "s" },
  joins: [],
  dimensions: [
    new FieldRefExpr("region", undefined, "s", { alias: "region" }),
    new FieldRefExpr("product", undefined, "s", { alias: "product" }),
  ],
  metrics: [
    new AggExpr("SUM", new FieldRefExpr("revenue", undefined, "s"), false, {
      alias: "total_revenue",
    }),
    new AggExpr("AVG", new FieldRefExpr("revenue", undefined, "s"), false, {
      alias: "avg_revenue",
    }),
  ],
  filters: [
    new ComparisonExpr(
      ">=",
      new FieldRefExpr("sale_date", undefined, "s"),
      new LiteralExpr("2024-01-01"),
    ),
  ],
  orderBy: [{ expr: new FieldRefExpr("total_revenue"), dir: "desc" }],
  limit: 100,
};

const result = builder.build(spec);
// 生成 SQL:
// SELECT s.region as region, s.product as product,
//        SUM(s.revenue) as total_revenue, AVG(s.revenue) as avg_revenue
// FROM sales as s
// WHERE s.sale_date >= '2024-01-01'
// GROUP BY s.region, s.product
// ORDER BY total_revenue desc
// LIMIT 100
```

### 示例 2：多表连接查询

```typescript
const spec: QuerySpec = {
  from: { table: "orders", alias: "o" },
  joins: [
    {
      type: "left",
      table: "users",
      alias: "u",
      on: new ComparisonExpr(
        "=",
        new FieldRefExpr("user_id", undefined, "o"),
        new FieldRefExpr("id", undefined, "u"),
      ),
    },
    {
      type: "left",
      table: "products",
      alias: "p",
      on: new ComparisonExpr(
        "=",
        new FieldRefExpr("product_id", undefined, "o"),
        new FieldRefExpr("id", undefined, "p"),
      ),
    },
  ],
  dimensions: [
    new FieldRefExpr("name", undefined, "u", { alias: "user_name" }),
    new FieldRefExpr("name", undefined, "p", { alias: "product_name" }),
  ],
  metrics: [
    new AggExpr("SUM", new FieldRefExpr("total", undefined, "o"), false, {
      alias: "total_spent",
    }),
    new AggExpr("COUNT", new FieldRefExpr("id", undefined, "o"), false, {
      alias: "order_count",
    }),
  ],
  filters: [],
};
```

### 示例 3：嵌套聚合计算

```typescript
// 计算 SUM(price) * SUM(quantity)
const sumPrice = new AggExpr("SUM", new FieldRefExpr("price", undefined, "o"));
const sumQuantity = new AggExpr(
  "SUM",
  new FieldRefExpr("quantity", undefined, "o"),
);
const productMetric = new BinaryExpr("*", sumPrice, sumQuantity, {
  alias: "price_qty_product",
});

// 计算毛利率：(SUM(revenue) - SUM(cost)) / SUM(revenue)
const sumRevenue = new AggExpr("SUM", new FieldRefExpr("revenue"));
const sumCost = new AggExpr("SUM", new FieldRefExpr("cost"));
const profit = new BinaryExpr("-", sumRevenue, sumCost);
const margin = new BinaryExpr("/", profit, sumRevenue, {
  alias: "profit_margin",
});

const spec: QuerySpec = {
  from: { table: "transactions", alias: "t" },
  joins: [],
  dimensions: [new FieldRefExpr("category", undefined, "t")],
  metrics: [productMetric, margin],
  filters: [],
};
```

### 示例 4：复杂过滤条件

```typescript
import { BinaryExpr, ComparisonExpr, CallExpr } from "@metric-engine/core";

// 组合过滤条件：AND / OR
const filter1 = new ComparisonExpr(
  ">",
  new FieldRefExpr("amount"),
  new LiteralExpr(100),
);
const filter2 = new ComparisonExpr(
  "=",
  new FieldRefExpr("status"),
  new LiteralExpr("completed"),
);
const filter3 = new ComparisonExpr(
  "LIKE",
  new FieldRefExpr("name"),
  new LiteralExpr("%test%"),
);

// AND 组合
const andFilter = new BinaryExpr("AND" as any, filter1, filter2);

// OR 组合
const orFilter = new BinaryExpr("OR" as any, andFilter, filter3);

// IN 条件
const inFilter = new CallExpr("IN", [
  new FieldRefExpr("category"),
  new LiteralExpr("A"),
  new LiteralExpr("B"),
  new LiteralExpr("C"),
]);
```

## 表达式解析器

使用 jsep 解析字符串表达式为 AST：

```typescript
import { parseExpression, ParseContext } from "@metric-engine/core";

const context: ParseContext = {
  // 字段映射：字段名 -> 字段信息
  fields: {
    amount: { name: "amount", type: "number" },
    quantity: { name: "quantity", type: "number" },
  },
  // 指标映射：指标名 -> 指标定义
  metrics: {
    total_sales: { name: "total_sales", expression: "SUM(amount)" },
  },
};

// 解析简单表达式
const expr1 = parseExpression("amount * quantity", context);

// 解析聚合表达式
const expr2 = parseExpression("SUM(amount) / COUNT(id)", context);

// 解析引用指标的表达式
const expr3 = parseExpression("total_sales * 1.1", context);
```

## 兼容层

兼容层允许旧代码无需修改即可使用新架构：

### MetricAdapter - 指标适配器

```typescript
import {
  MetricAdapter,
  AggregateMetric,
  ArithmeticMetric,
} from "@metric-engine/core";

// 旧的指标定义
const oldMetric = new AggregateMetric(new Field("amount", "number"), "SUM", {
  alias: "total_amount",
});

// 转换为新表达式
const newExpr = MetricAdapter.toExpr(oldMetric);
// newExpr 是 AggExpr 实例
```

### QueryAdapter - 查询适配器

```typescript
import { QueryAdapter, Query } from "@metric-engine/core";

// 旧的查询对象
const oldQuery = new Query(mainTable);
oldQuery.addDimension(dimension);
oldQuery.addMetric(metric);
oldQuery.addFilter(filter);

// 转换为新查询规格
const newSpec = QueryAdapter.toQuerySpec(oldQuery);
// newSpec 是 QuerySpec 实例
```

## 聚合层级分析

表达式系统支持聚合层级分析，用于判断表达式的聚合状态：

```typescript
import { ExprAnalyzer, AggLevel } from "@metric-engine/core";

const expr = new BinaryExpr(
  "*",
  new AggExpr("SUM", new FieldRefExpr("price")),
  new AggExpr("SUM", new FieldRefExpr("quantity")),
);

const analyzer = new ExprAnalyzer();
const aggLevel = analyzer.getAggLevel(expr);

// aggLevel === AggLevel.Partial
// 表示表达式包含聚合函数，需要 GROUP BY
```

### 聚合层级说明

| 层级      | 说明     | 示例                         |
| --------- | -------- | ---------------------------- |
| `None`    | 无聚合   | `price * quantity`           |
| `Partial` | 部分聚合 | `SUM(price) * SUM(quantity)` |
| `Full`    | 完全聚合 | `SUM(price)` (单个聚合)      |

## CTE 自动生成

当查询包含嵌套聚合时，KnexQueryBuilder 会自动使用 CTE：

```typescript
// 嵌套聚合会触发 CTE
const spec: QuerySpec = {
  from: { table: "sales", alias: "s" },
  joins: [],
  dimensions: [new FieldRefExpr("region", undefined, "s")],
  metrics: [
    // SUM(A) * SUM(B) 会触发 CTE
    new BinaryExpr(
      "*",
      new AggExpr("SUM", new FieldRefExpr("price")),
      new AggExpr("SUM", new FieldRefExpr("quantity")),
      { alias: "product" },
    ),
  ],
  filters: [],
};

// 自动生成带 CTE 的 SQL:
// WITH base_cte AS (
//   SELECT s.region, s.price, s.quantity
//   FROM sales as s
// )
// SELECT region, SUM(price) * SUM(quantity) as product
// FROM base_cte
// GROUP BY region
```

## 类型参考

### 支持的聚合函数

```typescript
type AggFuncName = "SUM" | "COUNT" | "AVG" | "MAX" | "MIN" | "DISTINCT_COUNT";
```

### 支持的二元运算符

```typescript
type BinaryOperator = "+" | "-" | "*" | "/";
```

### 支持的比较运算符

```typescript
type ComparisonOperator = "=" | "==" | "!=" | "<>" | ">" | "<" | ">=" | "<=";
```

### 表达式元数据

```typescript
interface ExprMeta {
  alias?: string; // 别名
  businessName?: string; // 业务名称
  description?: string; // 描述
}
```

## 最佳实践

1. **使用别名**：为所有维度和指标设置有意义的别名，提高可读性
2. **类型安全**：使用 TypeScript 类型检查确保表达式正确性
3. **复用表达式**：将常用表达式封装为函数，提高代码复用
4. **渐进迁移**：使用兼容层逐步迁移旧代码，降低风险

## 常见问题

### Q: 如何处理 NULL 值？

```typescript
// 使用 COALESCE 函数
const coalesceExpr = new CallExpr("COALESCE", [
  new FieldRefExpr("amount"),
  new LiteralExpr(0),
]);
```

### Q: 如何实现 CASE WHEN？

```typescript
import { ConditionalExpr, SelectExpr } from "@metric-engine/core";

// 使用 SelectExpr 实现 CASE WHEN
const caseExpr = new SelectExpr(
  [
    {
      condition: new ComparisonExpr(
        ">",
        new FieldRefExpr("score"),
        new LiteralExpr(90),
      ),
      value: new LiteralExpr("A"),
    },
    {
      condition: new ComparisonExpr(
        ">",
        new FieldRefExpr("score"),
        new LiteralExpr(80),
      ),
      value: new LiteralExpr("B"),
    },
    {
      condition: new ComparisonExpr(
        ">",
        new FieldRefExpr("score"),
        new LiteralExpr(70),
      ),
      value: new LiteralExpr("C"),
    },
  ],
  new LiteralExpr("D"), // 默认值
  { alias: "grade" },
);
```

### Q: 如何实现子查询？

```typescript
// 使用 CallExpr 包装子查询
const subquery = new CallExpr("RAW_SQL", [
  new LiteralExpr("(SELECT MAX(amount) FROM orders WHERE user_id = o.user_id)"),
]);
```
