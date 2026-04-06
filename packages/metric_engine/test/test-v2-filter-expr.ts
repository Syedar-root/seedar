import knex from "knex";
import {
  KnexQueryBuilder,
  FieldRefExpr,
  LiteralExpr,
  InExpr,
  BetweenExpr,
  LikeExpr,
  IsNullExpr,
} from "../src";

const knexInstance = knex({ client: "mysql2" });
const builder = new KnexQueryBuilder(knexInstance);

console.log("========================================");
console.log("  V2 筛选表达式测试");
console.log("========================================\n");

let passCount = 0;
let failCount = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`✅ ${name}`);
    passCount++;
  } catch (e: any) {
    console.log(`❌ ${name}`);
    console.log(`   错误: ${e.message}`);
    failCount++;
  }
}

function assertEqual(actual: string, expected: string, msg?: string) {
  if (actual !== expected) {
    throw new Error(
      `${msg || "断言失败"}\n   期望: ${expected}\n   实际: ${actual}`
    );
  }
}

function assertContains(actual: string, expected: string, msg?: string) {
  if (!actual.includes(expected)) {
    throw new Error(
      `${msg || "断言失败"}\n   期望包含: ${expected}\n   实际: ${actual}`
    );
  }
}

console.log("========================================");
console.log("  T6: InExpr 测试");
console.log("========================================\n");

test("InExpr - 基础 IN 列表", () => {
  const inExpr = new InExpr(
    new FieldRefExpr("status", "orders", "t1"),
    [
      new LiteralExpr("paid"),
      new LiteralExpr("shipped"),
      new LiteralExpr("completed"),
    ]
  );

  const spec = {
    from: { table: "orders", alias: "t1" },
    joins: [],
    dimensions: [new FieldRefExpr("id", "orders", "t1")],
    metrics: [],
    filters: [inExpr],
  };

  const result = builder.build(spec as any);
  assertContains(result.sql, "IN", "应包含 IN 关键字");
  assertContains(result.sql, "'paid'", "应包含 'paid'");
  assertContains(result.sql, "'shipped'", "应包含 'shipped'");
  assertContains(result.sql, "'completed'", "应包含 'completed'");
});

test("InExpr - NOT IN 列表", () => {
  const notInExpr = new InExpr(
    new FieldRefExpr("status", "orders", "t1"),
    [new LiteralExpr("cancelled"), new LiteralExpr("refunded")],
    true
  );

  const spec = {
    from: { table: "orders", alias: "t1" },
    joins: [],
    dimensions: [new FieldRefExpr("id", "orders", "t1")],
    metrics: [],
    filters: [notInExpr],
  };

  const result = builder.build(spec as any);
  assertContains(result.sql, "NOT IN", "应包含 NOT IN 关键字");
  assertContains(result.sql, "'cancelled'", "应包含 'cancelled'");
  assertContains(result.sql, "'refunded'", "应包含 'refunded'");
});

test("InExpr - 数值列表", () => {
  const inExpr = new InExpr(
    new FieldRefExpr("category_id", "products", "t1"),
    [new LiteralExpr(1), new LiteralExpr(2), new LiteralExpr(3)]
  );

  const spec = {
    from: { table: "products", alias: "t1" },
    joins: [],
    dimensions: [new FieldRefExpr("id", "products", "t1")],
    metrics: [],
    filters: [inExpr],
  };

  const result = builder.build(spec as any);
  assertContains(result.sql, "IN", "应包含 IN 关键字");
  assertContains(result.sql, "1", "应包含数值 1");
  assertContains(result.sql, "2", "应包含数值 2");
  assertContains(result.sql, "3", "应包含数值 3");
});

console.log("\n========================================");
console.log("  T7: BetweenExpr 测试");
console.log("========================================\n");

test("BetweenExpr - 基础 BETWEEN", () => {
  const betweenExpr = new BetweenExpr(
    new FieldRefExpr("amount", "orders", "t1"),
    new LiteralExpr(100),
    new LiteralExpr(1000)
  );

  const spec = {
    from: { table: "orders", alias: "t1" },
    joins: [],
    dimensions: [new FieldRefExpr("id", "orders", "t1")],
    metrics: [],
    filters: [betweenExpr],
  };

  const result = builder.build(spec as any);
  assertContains(result.sql, "BETWEEN", "应包含 BETWEEN 关键字");
  assertContains(result.sql, "100", "应包含下界值");
  assertContains(result.sql, "1000", "应包含上界值");
  assertContains(result.sql, "AND", "应包含 AND 关键字");
});

test("BetweenExpr - NOT BETWEEN", () => {
  const notBetweenExpr = new BetweenExpr(
    new FieldRefExpr("amount", "orders", "t1"),
    new LiteralExpr(100),
    new LiteralExpr(1000),
    true
  );

  const spec = {
    from: { table: "orders", alias: "t1" },
    joins: [],
    dimensions: [new FieldRefExpr("id", "orders", "t1")],
    metrics: [],
    filters: [notBetweenExpr],
  };

  const result = builder.build(spec as any);
  assertContains(result.sql, "NOT BETWEEN", "应包含 NOT BETWEEN 关键字");
});

test("BetweenExpr - 日期范围", () => {
  const betweenExpr = new BetweenExpr(
    new FieldRefExpr("created_at", "orders", "t1"),
    new LiteralExpr("2024-01-01"),
    new LiteralExpr("2024-12-31")
  );

  const spec = {
    from: { table: "orders", alias: "t1" },
    joins: [],
    dimensions: [new FieldRefExpr("id", "orders", "t1")],
    metrics: [],
    filters: [betweenExpr],
  };

  const result = builder.build(spec as any);
  assertContains(result.sql, "BETWEEN", "应包含 BETWEEN 关键字");
  assertContains(result.sql, "'2024-01-01'", "应包含日期下界");
  assertContains(result.sql, "'2024-12-31'", "应包含日期上界");
});

console.log("\n========================================");
console.log("  T8: LikeExpr 测试");
console.log("========================================\n");

test("LikeExpr - 基础 LIKE", () => {
  const likeExpr = new LikeExpr(
    new FieldRefExpr("name", "users", "t1"),
    new LiteralExpr("%张%")
  );

  const spec = {
    from: { table: "users", alias: "t1" },
    joins: [],
    dimensions: [new FieldRefExpr("id", "users", "t1")],
    metrics: [],
    filters: [likeExpr],
  };

  const result = builder.build(spec as any);
  assertContains(result.sql, "LIKE", "应包含 LIKE 关键字");
  assertContains(result.sql, "'%张%'", "应包含模式字符串");
});

test("LikeExpr - NOT LIKE", () => {
  const notLikeExpr = new LikeExpr(
    new FieldRefExpr("email", "users", "t1"),
    new LiteralExpr("%spam%"),
    true
  );

  const spec = {
    from: { table: "users", alias: "t1" },
    joins: [],
    dimensions: [new FieldRefExpr("id", "users", "t1")],
    metrics: [],
    filters: [notLikeExpr],
  };

  const result = builder.build(spec as any);
  assertContains(result.sql, "NOT LIKE", "应包含 NOT LIKE 关键字");
});

test("LikeExpr - 前缀匹配", () => {
  const likeExpr = new LikeExpr(
    new FieldRefExpr("code", "products", "t1"),
    new LiteralExpr("PROD_%")
  );

  const spec = {
    from: { table: "products", alias: "t1" },
    joins: [],
    dimensions: [new FieldRefExpr("id", "products", "t1")],
    metrics: [],
    filters: [likeExpr],
  };

  const result = builder.build(spec as any);
  assertContains(result.sql, "LIKE", "应包含 LIKE 关键字");
  assertContains(result.sql, "'PROD_%'", "应包含前缀模式");
});

console.log("\n========================================");
console.log("  T9: IsNullExpr 测试");
console.log("========================================\n");

test("IsNullExpr - IS NULL", () => {
  const isNullExpr = new IsNullExpr(
    new FieldRefExpr("deleted_at", "orders", "t1")
  );

  const spec = {
    from: { table: "orders", alias: "t1" },
    joins: [],
    dimensions: [new FieldRefExpr("id", "orders", "t1")],
    metrics: [],
    filters: [isNullExpr],
  };

  const result = builder.build(spec as any);
  assertContains(result.sql, "IS NULL", "应包含 IS NULL 关键字");
});

test("IsNullExpr - IS NOT NULL", () => {
  const isNotNullExpr = new IsNullExpr(
    new FieldRefExpr("paid_at", "orders", "t1"),
    true
  );

  const spec = {
    from: { table: "orders", alias: "t1" },
    joins: [],
    dimensions: [new FieldRefExpr("id", "orders", "t1")],
    metrics: [],
    filters: [isNotNullExpr],
  };

  const result = builder.build(spec as any);
  assertContains(result.sql, "IS NOT NULL", "应包含 IS NOT NULL 关键字");
});

test("IsNullExpr - 多个 NULL 条件组合", () => {
  const isNullExpr1 = new IsNullExpr(
    new FieldRefExpr("deleted_at", "orders", "t1")
  );
  const isNullExpr2 = new IsNullExpr(
    new FieldRefExpr("cancelled_at", "orders", "t1")
  );

  const spec = {
    from: { table: "orders", alias: "t1" },
    joins: [],
    dimensions: [new FieldRefExpr("id", "orders", "t1")],
    metrics: [],
    filters: [isNullExpr1, isNullExpr2],
  };

  const result = builder.build(spec as any);
  assertContains(result.sql, "IS NULL", "应包含 IS NULL 关键字");
});

console.log("\n========================================");
console.log("  测试结果汇总");
console.log("========================================\n");
console.log(`通过: ${passCount}`);
console.log(`失败: ${failCount}`);
console.log(`总计: ${passCount + failCount}`);

if (failCount > 0) {
  process.exit(1);
}

process.exit(0);
