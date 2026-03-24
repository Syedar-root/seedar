/**
 * SQL 生成器测试脚本
 *
 * 用于测试 metric-engine 的 SQL 生成功能
 * 可以输入数据模型结构和查询 DSL，返回生成的 SQL
 *
 * 使用方法：
 * npx ts-node test-sql-generator.ts
 */

import knex from "knex";
import {
  KnexQueryBuilder,
  QuerySpec,
  JoinSpec,
  OrderBySpec,
  FieldRefExpr,
  AggExpr,
  BinaryExpr,
  LiteralExpr,
  ComparisonExpr,
  CallExpr,
  Expr,
  AggFuncName,
  BinaryOperator,
  ComparisonOperator,
} from "../src";

/**
 * 数据模型定义接口
 */
interface DataModel {
  tables: TableDefinition[];
  joins?: JoinDefinition[];
}

/**
 * 表定义接口
 */
interface TableDefinition {
  name: string;
  alias?: string;
  fields: FieldDefinition[];
}

/**
 * 字段定义接口
 */
interface FieldDefinition {
  name: string;
  type: "string" | "number" | "boolean" | "date";
  alias?: string;
}

/**
 * 连接定义接口
 */
interface JoinDefinition {
  leftTable: string;
  rightTable: string;
  type: "left" | "inner" | "right";
  conditions: Array<{
    leftField: string;
    rightField: string;
    operator?: string;
  }>;
}

/**
 * 查询 DSL 接口
 */
interface QueryDSL {
  mainTable: string;
  mainTableAlias?: string;
  joins?: Array<{
    table: string;
    alias?: string;
    type: "left" | "inner" | "right";
    on: Array<{
      leftField: string;
      leftTableAlias?: string;
      rightField: string;
      rightTableAlias?: string;
    }>;
  }>;
  dimensions?: Array<{
    field: string;
    tableAlias?: string;
    alias?: string;
  }>;
  metrics?: Array<{
    type: "agg" | "arithmetic";
    aggFunc?: AggFuncName;
    field?: string;
    tableAlias?: string;
    distinct?: boolean;
    left?: MetricOperand;
    right?: MetricOperand;
    operator?: BinaryOperator;
    alias?: string;
  }>;
  filters?: Array<{
    field: string;
    tableAlias?: string;
    operator: ComparisonOperator | "LIKE" | "IN" | "NOT_IN";
    value: any;
  }>;
  orderBy?: Array<{
    field: string;
    tableAlias?: string;
    direction: "asc" | "desc";
  }>;
  limit?: number;
  offset?: number;
}

/**
 * 指标操作数接口
 */
interface MetricOperand {
  type: "field" | "agg" | "literal" | "arithmetic";
  field?: string;
  tableAlias?: string;
  aggFunc?: AggFuncName;
  distinct?: boolean;
  value?: any;
  operator?: BinaryOperator;
  left?: MetricOperand;
  right?: MetricOperand;
}

/**
 * SQL 生成器测试类
 */
class SQLGeneratorTester {
  private knex: knex.Knex;
  private builder: KnexQueryBuilder;
  private dataModel: DataModel;

  constructor(dataModel: DataModel, dialect: string = "mysql2") {
    this.dataModel = dataModel;
    this.knex = knex({ client: dialect });
    this.builder = new KnexQueryBuilder(this.knex);
  }

  /**
   * 根据查询 DSL 生成 SQL
   */
  generateSQL(dsl: QueryDSL): { sql: string; bindings: readonly any[] } {
    const spec = this.buildQuerySpec(dsl);
    const result = this.builder.build(spec);
    return {
      sql: result.sql,
      bindings: result.bindings,
    };
  }

  /**
   * 构建查询规格
   */
  private buildQuerySpec(dsl: QueryDSL): QuerySpec {
    const spec: QuerySpec = {
      from: {
        table: dsl.mainTable,
        alias: dsl.mainTableAlias || dsl.mainTable,
      },
      joins: this.buildJoins(dsl.joins || []),
      dimensions: this.buildDimensions(dsl.dimensions || []),
      metrics: this.buildMetrics(dsl.metrics || []),
      filters: this.buildFilters(dsl.filters || []),
    };

    if (dsl.orderBy && dsl.orderBy.length > 0) {
      spec.orderBy = this.buildOrderBy(dsl.orderBy);
    }

    if (dsl.limit !== undefined) {
      spec.limit = dsl.limit;
    }

    if (dsl.offset !== undefined) {
      spec.offset = dsl.offset;
    }

    return spec;
  }

  /**
   * 构建 JOIN 规格
   */
  private buildJoins(joins: QueryDSL["joins"]): JoinSpec[] {
    return joins.map((join) => {
      let onExpr: Expr;

      if (join.on.length === 1) {
        onExpr = new ComparisonExpr(
          "=",
          new FieldRefExpr(
            join.on[0].leftField,
            undefined,
            join.on[0].leftTableAlias,
          ),
          new FieldRefExpr(
            join.on[0].rightField,
            undefined,
            join.on[0].rightTableAlias || join.alias || join.table,
          ),
        );
      } else {
        let expr = new ComparisonExpr(
          "=",
          new FieldRefExpr(
            join.on[0].leftField,
            undefined,
            join.on[0].leftTableAlias,
          ),
          new FieldRefExpr(
            join.on[0].rightField,
            undefined,
            join.on[0].rightTableAlias || join.alias || join.table,
          ),
        );
        for (let i = 1; i < join.on.length; i++) {
          const nextExpr = new ComparisonExpr(
            "=",
            new FieldRefExpr(
              join.on[i].leftField,
              undefined,
              join.on[i].leftTableAlias,
            ),
            new FieldRefExpr(
              join.on[i].rightField,
              undefined,
              join.on[i].rightTableAlias || join.alias || join.table,
            ),
          );
          expr = new BinaryExpr("AND" as any, expr, nextExpr);
        }
        onExpr = expr;
      }

      return {
        type: join.type,
        table: join.table,
        alias: join.alias || join.table,
        on: onExpr,
      };
    });
  }

  /**
   * 构建维度表达式
   */
  private buildDimensions(dimensions: QueryDSL["dimensions"]): Expr[] {
    return dimensions.map((dim) => {
      return new FieldRefExpr(dim.field, undefined, dim.tableAlias, {
        alias: dim.alias,
      });
    });
  }

  /**
   * 构建指标表达式
   */
  private buildMetrics(metrics: QueryDSL["metrics"]): Expr[] {
    return metrics.map((metric) => {
      if (metric.type === "agg") {
        return new AggExpr(
          metric.aggFunc!,
          new FieldRefExpr(metric.field!, undefined, metric.tableAlias),
          metric.distinct || false,
          { alias: metric.alias },
        );
      } else if (metric.type === "arithmetic") {
        const left = this.buildMetricOperand(metric.left!);
        const right = this.buildMetricOperand(metric.right!);
        return new BinaryExpr(metric.operator!, left, right, {
          alias: metric.alias,
        });
      }
      throw new Error(`不支持的指标类型: ${metric.type}`);
    });
  }

  /**
   * 构建指标操作数
   */
  private buildMetricOperand(operand: MetricOperand): Expr {
    if (operand.type === "field") {
      return new FieldRefExpr(operand.field!, undefined, operand.tableAlias);
    } else if (operand.type === "agg") {
      return new AggExpr(
        operand.aggFunc!,
        new FieldRefExpr(operand.field!, undefined, operand.tableAlias),
        operand.distinct || false,
      );
    } else if (operand.type === "literal") {
      return new LiteralExpr(operand.value);
    } else if (operand.type === "arithmetic") {
      const left = this.buildMetricOperand(operand.left!);
      const right = this.buildMetricOperand(operand.right!);
      return new BinaryExpr(operand.operator!, left, right);
    }
    throw new Error(`不支持的操作数类型: ${operand.type}`);
  }

  /**
   * 构建过滤条件
   */
  private buildFilters(filters: QueryDSL["filters"]): Expr[] {
    return filters.map((filter) => {
      const leftExpr = new FieldRefExpr(
        filter.field,
        undefined,
        filter.tableAlias,
      );
      let rightExpr: Expr;

      if (filter.operator === "IN" || filter.operator === "NOT_IN") {
        const values = Array.isArray(filter.value)
          ? filter.value
          : [filter.value];
        const args: Expr[] = [
          leftExpr,
          ...values.map((v) => new LiteralExpr(v)),
        ];
        return new CallExpr(filter.operator, args);
      }

      if (filter.operator === "LIKE") {
        rightExpr = new LiteralExpr(filter.value);
        return new BinaryExpr("LIKE" as any, leftExpr, rightExpr);
      }

      rightExpr = new LiteralExpr(filter.value);
      return new ComparisonExpr(
        filter.operator as ComparisonOperator,
        leftExpr,
        rightExpr,
      );
    });
  }

  /**
   * 构建排序规格
   */
  private buildOrderBy(orderBy: QueryDSL["orderBy"]): OrderBySpec[] {
    return orderBy.map((order) => ({
      expr: new FieldRefExpr(order.field, undefined, order.tableAlias),
      dir: order.direction,
    }));
  }
}

/**
 * 打印格式化的 SQL
 */
function printFormattedSQL(sql: string, bindings: readonly any[]) {
  console.log("\n========================================");
  console.log("生成的 SQL:");
  console.log("========================================");
  console.log(sql);
  console.log("\n参数绑定:");
  console.log(bindings);
  console.log("========================================\n");
}

/**
 * 测试用例
 */
function runTests() {
  console.log("========================================");
  console.log("  Metric Engine SQL 生成器测试");
  console.log("========================================\n");

  const tester = new SQLGeneratorTester({
    tables: [
      {
        name: "orders",
        alias: "o",
        fields: [
          { name: "id", type: "number" },
          { name: "user_id", type: "number" },
          { name: "product_id", type: "number" },
          { name: "amount", type: "number" },
          { name: "quantity", type: "number" },
          { name: "status", type: "string" },
          { name: "created_at", type: "date" },
        ],
      },
      {
        name: "users",
        alias: "u",
        fields: [
          { name: "id", type: "number" },
          { name: "name", type: "string" },
          { name: "email", type: "string" },
          { name: "region", type: "string" },
        ],
      },
      {
        name: "products",
        alias: "p",
        fields: [
          { name: "id", type: "number" },
          { name: "name", type: "string" },
          { name: "category", type: "string" },
          { name: "price", type: "number" },
        ],
      },
    ],
    joins: [
      {
        leftTable: "orders",
        rightTable: "users",
        type: "left",
        conditions: [{ leftField: "user_id", rightField: "id" }],
      },
      {
        leftTable: "orders",
        rightTable: "products",
        type: "left",
        conditions: [{ leftField: "product_id", rightField: "id" }],
      },
    ],
  });

  console.log("测试 1: 简单聚合查询");
  console.log("------------------------");
  const result1 = tester.generateSQL({
    mainTable: "orders",
    mainTableAlias: "o",
    dimensions: [{ field: "status", tableAlias: "o", alias: "order_status" }],
    metrics: [
      {
        type: "agg",
        aggFunc: "SUM",
        field: "amount",
        tableAlias: "o",
        alias: "total_amount",
      },
      {
        type: "agg",
        aggFunc: "COUNT",
        field: "id",
        tableAlias: "o",
        alias: "order_count",
      },
    ],
    filters: [
      {
        field: "created_at",
        tableAlias: "o",
        operator: ">=",
        value: "2024-01-01",
      },
    ],
    orderBy: [{ field: "total_amount", direction: "desc" }],
    limit: 100,
  });
  printFormattedSQL(result1.sql, result1.bindings);

  console.log("测试 2: 多表连接查询");
  console.log("------------------------");
  const result2 = tester.generateSQL({
    mainTable: "orders",
    mainTableAlias: "o",
    joins: [
      {
        table: "users",
        alias: "u",
        type: "left",
        on: [
          {
            leftField: "user_id",
            leftTableAlias: "o",
            rightField: "id",
            rightTableAlias: "u",
          },
        ],
      },
      {
        table: "products",
        alias: "p",
        type: "left",
        on: [
          {
            leftField: "product_id",
            leftTableAlias: "o",
            rightField: "id",
            rightTableAlias: "p",
          },
        ],
      },
    ],
    dimensions: [
      { field: "name", tableAlias: "u", alias: "user_name" },
      { field: "name", tableAlias: "p", alias: "product_name" },
    ],
    metrics: [
      {
        type: "agg",
        aggFunc: "SUM",
        field: "amount",
        tableAlias: "o",
        alias: "total_spent",
      },
    ],
    filters: [],
  });
  printFormattedSQL(result2.sql, result2.bindings);

  console.log("测试 3: 嵌套聚合计算 (SUM(A) * SUM(B))");
  console.log("------------------------");
  const result3 = tester.generateSQL({
    mainTable: "orders",
    mainTableAlias: "o",
    dimensions: [{ field: "status", tableAlias: "o" }],
    metrics: [
      {
        type: "arithmetic",
        operator: "*",
        left: { type: "agg", aggFunc: "SUM", field: "amount", tableAlias: "o" },
        right: {
          type: "agg",
          aggFunc: "SUM",
          field: "quantity",
          tableAlias: "o",
        },
        alias: "amount_qty_product",
      },
    ],
    filters: [],
  });
  printFormattedSQL(result3.sql, result3.bindings);

  console.log("测试 4: 复杂过滤条件");
  console.log("------------------------");
  const result4 = tester.generateSQL({
    mainTable: "orders",
    mainTableAlias: "o",
    dimensions: [{ field: "status", tableAlias: "o" }],
    metrics: [
      {
        type: "agg",
        aggFunc: "SUM",
        field: "amount",
        tableAlias: "o",
        alias: "total_amount",
      },
    ],
    filters: [
      { field: "amount", tableAlias: "o", operator: ">", value: 100 },
      { field: "status", tableAlias: "o", operator: "=", value: "completed" },
      {
        field: "created_at",
        tableAlias: "o",
        operator: ">=",
        value: "2024-01-01",
      },
    ],
  });
  printFormattedSQL(result4.sql, result4.bindings);

  console.log("测试 5: DISTINCT 聚合");
  console.log("------------------------");
  const result5 = tester.generateSQL({
    mainTable: "orders",
    mainTableAlias: "o",
    joins: [
      {
        table: "users",
        alias: "u",
        type: "left",
        on: [
          {
            leftField: "user_id",
            leftTableAlias: "o",
            rightField: "id",
            rightTableAlias: "u",
          },
        ],
      },
    ],
    dimensions: [{ field: "region", tableAlias: "u", alias: "user_region" }],
    metrics: [
      {
        type: "agg",
        aggFunc: "COUNT",
        field: "user_id",
        tableAlias: "o",
        distinct: true,
        alias: "unique_users",
      },
    ],
    filters: [],
  });
  printFormattedSQL(result5.sql, result5.bindings);

  console.log("测试 6: 算术运算指标");
  console.log("------------------------");
  const result6 = tester.generateSQL({
    mainTable: "orders",
    mainTableAlias: "o",
    dimensions: [{ field: "status", tableAlias: "o" }],
    metrics: [
      {
        type: "arithmetic",
        operator: "*",
        left: { type: "field", field: "amount", tableAlias: "o" },
        right: { type: "field", field: "quantity", tableAlias: "o" },
        alias: "line_total",
      },
    ],
    filters: [],
  });
  printFormattedSQL(result6.sql, result6.bindings);

  console.log("\n所有测试完成！");
}

/**
 * 自定义测试入口
 * 可以修改此函数来测试自定义的数据模型和查询 DSL
 */
function customTest() {
  console.log("\n========================================");
  console.log("  自定义测试");
  console.log("========================================\n");

  const tester = new SQLGeneratorTester({
    tables: [
      {
        name: "sales",
        alias: "s",
        fields: [
          { name: "id", type: "number" },
          { name: "product", type: "string" },
          { name: "region", type: "string" },
          { name: "revenue", type: "number" },
          { name: "cost", type: "number" },
          { name: "sale_date", type: "date" },
        ],
      },
    ],
  });

  const result = tester.generateSQL({
    mainTable: "sales",
    mainTableAlias: "s",
    dimensions: [
      { field: "region", tableAlias: "s" },
      { field: "product", tableAlias: "s" },
    ],
    metrics: [
      {
        type: "agg",
        aggFunc: "SUM",
        field: "revenue",
        tableAlias: "s",
        alias: "total_revenue",
      },
      {
        type: "arithmetic",
        operator: "/",
        left: {
          type: "arithmetic",
          operator: "-",
          left: {
            type: "agg",
            aggFunc: "SUM",
            field: "revenue",
            tableAlias: "s",
          },
          right: {
            type: "agg",
            aggFunc: "SUM",
            field: "cost",
            tableAlias: "s",
          },
        },
        right: {
          type: "agg",
          aggFunc: "SUM",
          field: "revenue",
          tableAlias: "s",
        },
        alias: "profit_margin",
      },
    ],
    filters: [
      {
        field: "sale_date",
        tableAlias: "s",
        operator: ">=",
        value: "2024-01-01",
      },
    ],
    orderBy: [{ field: "total_revenue", direction: "desc" }],
    limit: 50,
  });

  printFormattedSQL(result.sql, result.bindings);
}

/**
 * 用户订单数据集测试
 * 基于真实的用户订单数据模型构建查询
 */
function userOrderDatasetTest() {
  console.log("\n========================================");
  console.log("  用户订单数据集测试");
  console.log("========================================\n");

  const tester = new SQLGeneratorTester({
    tables: [
      {
        name: "user",
        alias: "u",
        fields: [
          { name: "user_id", type: "number", alias: "用户ID" },
          { name: "user_name", type: "string", alias: "用户姓名" },
          { name: "phone", type: "string", alias: "手机号" },
          { name: "user_level", type: "string", alias: "用户等级" },
          { name: "register_time", type: "date", alias: "注册时间" },
        ],
      },
      {
        name: "order_main",
        alias: "o",
        fields: [
          { name: "order_id", type: "number", alias: "订单ID" },
          { name: "user_id", type: "number", alias: "用户ID" },
          { name: "order_time", type: "date", alias: "下单时间" },
          { name: "order_status", type: "string", alias: "订单状态" },
          { name: "total_amount", type: "number", alias: "订单金额" },
          { name: "pay_type", type: "string", alias: "支付方式" },
          { name: "pay_time", type: "date", alias: "支付时间" },
        ],
      },
    ],
  });

  console.log("测试 1: 按用户等级统计订单数量和金额");
  console.log("----------------------------------------");
  const result1 = tester.generateSQL({
    mainTable: "user",
    mainTableAlias: "u",
    joins: [
      {
        table: "order_main",
        alias: "o",
        type: "left",
        on: [
          {
            leftField: "user_id",
            leftTableAlias: "u",
            rightField: "user_id",
            rightTableAlias: "o",
          },
        ],
      },
    ],
    dimensions: [{ field: "user_level", tableAlias: "u", alias: "用户等级" }],
    metrics: [
      {
        type: "agg",
        aggFunc: "COUNT",
        field: "order_id",
        tableAlias: "o",
        alias: "订单数量",
      },
      {
        type: "agg",
        aggFunc: "SUM",
        field: "total_amount",
        tableAlias: "o",
        alias: "订单总金额",
      },
      {
        type: "agg",
        aggFunc: "COUNT",
        field: "user_id",
        tableAlias: "o",
        distinct: true,
        alias: "下单用户数",
      },
    ],
    filters: [],
    orderBy: [{ field: "订单总金额", direction: "desc" }],
  });
  printFormattedSQL(result1.sql, result1.bindings);

  console.log("测试 2: 查询每个用户的订单统计");
  console.log("----------------------------------------");
  const result2 = tester.generateSQL({
    mainTable: "user",
    mainTableAlias: "u",
    joins: [
      {
        table: "order_main",
        alias: "o",
        type: "left",
        on: [
          {
            leftField: "user_id",
            leftTableAlias: "u",
            rightField: "user_id",
            rightTableAlias: "o",
          },
        ],
      },
    ],
    dimensions: [
      { field: "user_id", tableAlias: "u", alias: "用户ID" },
      { field: "user_name", tableAlias: "u", alias: "用户姓名" },
      { field: "user_level", tableAlias: "u", alias: "用户等级" },
    ],
    metrics: [
      {
        type: "agg",
        aggFunc: "COUNT",
        field: "order_id",
        tableAlias: "o",
        alias: "订单数",
      },
      {
        type: "agg",
        aggFunc: "SUM",
        field: "total_amount",
        tableAlias: "o",
        alias: "消费总额",
      },
      {
        type: "agg",
        aggFunc: "AVG",
        field: "total_amount",
        tableAlias: "o",
        alias: "平均订单金额",
      },
    ],
    filters: [
      {
        field: "order_time",
        tableAlias: "o",
        operator: ">=",
        value: "2024-01-01",
      },
    ],
    orderBy: [{ field: "消费总额", direction: "desc" }],
    limit: 100,
  });
  printFormattedSQL(result2.sql, result2.bindings);

  console.log("测试 3: 按订单状态统计");
  console.log("----------------------------------------");
  const result3 = tester.generateSQL({
    mainTable: "order_main",
    mainTableAlias: "o",
    joins: [],
    dimensions: [{ field: "order_status", tableAlias: "o", alias: "订单状态" }],
    metrics: [
      {
        type: "agg",
        aggFunc: "COUNT",
        field: "order_id",
        tableAlias: "o",
        alias: "订单数量",
      },
      {
        type: "agg",
        aggFunc: "SUM",
        field: "total_amount",
        tableAlias: "o",
        alias: "订单总额",
      },
    ],
    filters: [
      {
        field: "order_time",
        tableAlias: "o",
        operator: ">=",
        value: "2024-01-01",
      },
    ],
    orderBy: [{ field: "订单数量", direction: "desc" }],
  });
  printFormattedSQL(result3.sql, result3.bindings);

  console.log("测试 4: 按支付方式统计");
  console.log("----------------------------------------");
  const result4 = tester.generateSQL({
    mainTable: "order_main",
    mainTableAlias: "o",
    joins: [],
    dimensions: [{ field: "pay_type", tableAlias: "o", alias: "支付方式" }],
    metrics: [
      {
        type: "agg",
        aggFunc: "COUNT",
        field: "order_id",
        tableAlias: "o",
        alias: "订单数",
      },
      {
        type: "agg",
        aggFunc: "SUM",
        field: "total_amount",
        tableAlias: "o",
        alias: "总金额",
      },
    ],
    filters: [
      {
        field: "order_status",
        tableAlias: "o",
        operator: "=",
        value: "completed",
      },
    ],
    orderBy: [{ field: "总金额", direction: "desc" }],
  });
  printFormattedSQL(result4.sql, result4.bindings);

  console.log("测试 5: 复杂查询 - 按用户等级和时间统计");
  console.log("----------------------------------------");
  const result5 = tester.generateSQL({
    mainTable: "user",
    mainTableAlias: "u",
    joins: [
      {
        table: "order_main",
        alias: "o",
        type: "left",
        on: [
          {
            leftField: "user_id",
            leftTableAlias: "u",
            rightField: "user_id",
            rightTableAlias: "o",
          },
        ],
      },
    ],
    dimensions: [{ field: "user_level", tableAlias: "u", alias: "用户等级" }],
    metrics: [
      {
        type: "agg",
        aggFunc: "COUNT",
        field: "order_id",
        tableAlias: "o",
        alias: "订单数",
      },
      {
        type: "agg",
        aggFunc: "SUM",
        field: "total_amount",
        tableAlias: "o",
        alias: "总金额",
      },
      {
        type: "arithmetic",
        operator: "/",
        left: {
          type: "agg",
          aggFunc: "SUM",
          field: "total_amount",
          tableAlias: "o",
        },
        right: {
          type: "agg",
          aggFunc: "COUNT",
          field: "order_id",
          tableAlias: "o",
        },
        alias: "客单价",
      },
    ],
    filters: [
      {
        field: "order_time",
        tableAlias: "o",
        operator: ">=",
        value: "2024-01-01",
      },
      {
        field: "order_status",
        tableAlias: "o",
        operator: "=",
        value: "completed",
      },
    ],
    orderBy: [{ field: "总金额", direction: "desc" }],
  });
  printFormattedSQL(result5.sql, result5.bindings);
}

runTests();
customTest();
userOrderDatasetTest();
