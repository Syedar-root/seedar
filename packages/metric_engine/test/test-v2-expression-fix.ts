import knex from "knex";
import {
  KnexQueryBuilder,
  FieldRefExpr,
  AggExpr,
  LiteralExpr,
  ComparisonExpr,
  ConditionalExpr,
  parseExpression,
} from "../src";

const knexInstance = knex({ client: "mysql2" });
const builder = new KnexQueryBuilder(knexInstance);

console.log("========================================");
console.log("  V2 表达式语法修复验证测试");
console.log("========================================\n");

// 测试 1: 比较运算符解析
console.log("测试 1: 比较运算符解析");
console.log("------------------------");
try {
  const context = {
    tables: new Map([["t1", { name: "orders", alias: "t1" }]]),
    fields: new Map([
      ["status", { name: "status", tableName: "orders", tableAlias: "t1" }],
      ["amount", { name: "amount", tableName: "orders", tableAlias: "t1" }],
      ["user_id", { name: "user_id", tableName: "orders", tableAlias: "t1" }],
    ]),
    metrics: new Map(),
    defaultTable: "t1",
  };

  const expr1 = parseExpression("status == 'paid'", context);
  console.log("表达式: status == 'paid'");
  console.log("解析结果:", expr1);
  console.log("✅ 比较运算符解析成功\n");
} catch (e: any) {
  console.log("❌ 比较运算符解析失败:", e.message, "\n");
}

// 测试 2: 条件表达式 SQL 生成
console.log("测试 2: 条件表达式 SQL 生成");
console.log("------------------------");
try {
  const condExpr = new ConditionalExpr(
    new ComparisonExpr("=", new FieldRefExpr("status", undefined, "t1"), new LiteralExpr("paid")),
    new FieldRefExpr("user_id", undefined, "t1"),
    new LiteralExpr(null)
  );

  const spec = {
    from: { table: "orders", alias: "t1" },
    joins: [],
    dimensions: [],
    metrics: [
      new AggExpr("COUNT", condExpr, true, { alias: "paid_users" }),
    ],
    filters: [],
  };

  const result = builder.build(spec as any);
  console.log("表达式: COUNT(DISTINCT (status == 'paid' ? user_id : null))");
  console.log("生成 SQL:", result.sql);
  console.log("✅ 条件表达式 SQL 生成成功\n");
} catch (e: any) {
  console.log("❌ 条件表达式 SQL 生成失败:", e.message, "\n");
}

// 测试 3: 带条件去重计数
console.log("测试 3: 带条件去重计数");
console.log("------------------------");
try {
  const condExpr = new ConditionalExpr(
    new ComparisonExpr(">", new FieldRefExpr("amount", undefined, "t1"), new LiteralExpr(1000)),
    new FieldRefExpr("user_id", undefined, "t1"),
    new LiteralExpr(null)
  );

  const spec = {
    from: { table: "orders", alias: "t1" },
    joins: [],
    dimensions: [new FieldRefExpr("status", undefined, "t1")],
    metrics: [
      new AggExpr("COUNT", condExpr, true, { alias: "high_value_users" }),
    ],
    filters: [],
  };

  const result = builder.build(spec as any);
  console.log("表达式: COUNT(DISTINCT (amount > 1000 ? user_id : null))");
  console.log("生成 SQL:", result.sql);
  console.log("✅ 带条件去重计数成功\n");
} catch (e: any) {
  console.log("❌ 带条件去重计数失败:", e.message, "\n");
}

// 测试 4: 条件求和
console.log("测试 4: 条件求和");
console.log("------------------------");
try {
  const condExpr = new ConditionalExpr(
    new ComparisonExpr("=", new FieldRefExpr("status", undefined, "t1"), new LiteralExpr("paid")),
    new FieldRefExpr("amount", undefined, "t1"),
    new LiteralExpr(0)
  );

  const spec = {
    from: { table: "orders", alias: "t1" },
    joins: [],
    dimensions: [new FieldRefExpr("user_id", undefined, "t1")],
    metrics: [
      new AggExpr("SUM", condExpr, false, { alias: "paid_amount" }),
    ],
    filters: [],
  };

  const result = builder.build(spec as any);
  console.log("表达式: SUM(status == 'paid' ? amount : 0)");
  console.log("生成 SQL:", result.sql);
  console.log("✅ 条件求和成功\n");
} catch (e: any) {
  console.log("❌ 条件求和失败:", e.message, "\n");
}

console.log("========================================");
console.log("  所有测试完成");
console.log("========================================");

process.exit(0);
