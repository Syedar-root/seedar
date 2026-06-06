import knex, { Knex } from "knex";
import {
  KnexQueryBuilder,
  FieldRefExpr,
  LiteralExpr,
  InExpr,
  BetweenExpr,
  LikeExpr,
  ComparisonExpr,
  QuerySpec,
} from "../src";

/**
 * SQL 注入测试套件 —— 测试 metric_engine V2 的防护现状
 *
 * 测试目标 MySQL: localhost:3306, root/2586603nnj
 *
 * 测试链路：构造 Expr AST（含恶意载荷）→ KnexQueryBuilder.build() → 执行 SQL
 * 全程只走 metric_engine 管道，不直接拼接 SQL 字符串。
 */

const MYSQL_CONFIG = {
  host: "localhost",
  port: 3306,
  user: "root",
  password: "2586603nnj",
  database: "seedar_injection_test",
};

/** 无连接 builder，仅验证生成的 SQL 文本 */
function createSqlOnlyBuilder(): KnexQueryBuilder {
  return new KnexQueryBuilder(knex({ client: "mysql2" }));
}

/** 构造最小 QuerySpec */
function makeSpec(filter: any, overrides?: Partial<QuerySpec>): QuerySpec {
  return {
    from: { table: "users", alias: "t1" },
    joins: [],
    dimensions: [new FieldRefExpr("id", "users", "t1")],
    metrics: [],
    filters: [filter],
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════
// Part 1: 纯 SQL 生成 — 验证 Plan B 参数化绑定防护
// ═══════════════════════════════════════════════════════════

describe("Part1 — metric_engine SQL 生成：Plan B 参数化绑定防护", () => {
  let builder: KnexQueryBuilder;

  beforeAll(() => {
    builder = createSqlOnlyBuilder();
  });

  describe("ComparisonExpr — 字符串值", () => {
    it("Plan B: OR 注入载荷进入 bindings，SQL 中用 ? 占位", () => {
      const payload = "' OR '1'='1";
      const expr = new ComparisonExpr(
        "=",
        new FieldRefExpr("name", "users", "t1"),
        new LiteralExpr(payload),
      );
      const { sql, bindings } = builder.build(makeSpec(expr));

      // Plan B: 值在 bindings 中，不在 SQL 中
      expect(bindings).toContain(payload);
      // SQL 中应该是 ? 占位符，而非载荷原文
      expect(sql).toContain("?");
      expect(sql).not.toContain("' OR '1'='1'");

      console.log("[Part1-OR]    SQL:", sql, "bindings:", bindings);
    });

    it("Plan B: UNION 注入载荷进入 bindings", () => {
      const payload = "' UNION SELECT 1,2,3 -- ";
      const expr = new ComparisonExpr(
        "=",
        new FieldRefExpr("name", "users", "t1"),
        new LiteralExpr(payload),
      );
      const { sql, bindings } = builder.build(makeSpec(expr));

      expect(bindings).toContain(payload);
      expect(sql).toContain("?");
      expect(sql).not.toContain("UNION SELECT");

      console.log("[Part1-UNION] SQL:", sql, "bindings:", bindings);
    });

    it("Plan B: O'Brien 进入 bindings，SQL 语法正确", () => {
      const expr = new ComparisonExpr(
        "=",
        new FieldRefExpr("last_name", "users", "t1"),
        new LiteralExpr("O'Brien"),
      );
      const { sql, bindings } = builder.build(makeSpec(expr));

      // Plan B: O'Brien 在 bindings 中，SQL 用 ? 占位
      expect(bindings).toContain("O'Brien");
      expect(sql).toContain("?");
      expect(sql).not.toContain("O'Brien");

      console.log("[Part1-OBrien] SQL:", sql, "bindings:", bindings);
    });
  });

  describe("LikeExpr — LIKE 模式", () => {
    it("Plan B: LIKE 注入载荷进入 bindings", () => {
      const payload = "%' OR '1'='1'; -- ";
      const expr = new LikeExpr(
        new FieldRefExpr("name", "users", "t1"),
        new LiteralExpr(payload),
      );
      const { sql, bindings } = builder.build(makeSpec(expr));

      expect(bindings).toContain(payload);
      expect(sql).toContain("?");
      expect(sql).not.toContain("'1'='1");

      console.log("[Part1-LIKE]  SQL:", sql, "bindings:", bindings);
    });
  });

  describe("InExpr — IN 列表", () => {
    it("Plan B: IN 列表注入载荷进入 bindings", () => {
      const payload = "') OR 1=1 -- ";
      const expr = new InExpr(
        new FieldRefExpr("status", "orders", "t1"),
        [
          new LiteralExpr("paid"),
          new LiteralExpr(payload),
          new LiteralExpr("shipped"),
        ],
      );
      const { sql, bindings } = builder.build(makeSpec(expr));

      expect(bindings).toContain(payload);
      expect(sql).toContain("?");
      expect(sql).not.toContain("') OR 1=1 --");

      console.log("[Part1-IN]    SQL:", sql, "bindings:", bindings);
    });
  });

  describe("BetweenExpr — BETWEEN 范围", () => {
    it("Plan B: BETWEEN 注入载荷进入 bindings", () => {
      const payload = "' OR 1=1 -- ";
      const expr = new BetweenExpr(
        new FieldRefExpr("created_at", "orders", "t1"),
        new LiteralExpr(payload),
        new LiteralExpr("2024-12-31"),
      );
      const { sql, bindings } = builder.build(makeSpec(expr));

      expect(bindings).toContain(payload);
      expect(sql).toContain("?");
      expect(sql).not.toContain("' OR 1=1");

      console.log("[Part1-BETWEEN] SQL:", sql, "bindings:", bindings);
    });
  });
});

// ═══════════════════════════════════════════════════════════
// Part 2: 真实数据库执行 — metric_engine 生成 SQL → Knex 执行
// ═══════════════════════════════════════════════════════════

describe("Part2 — metric_engine 生成 SQL 在 MySQL 上执行", () => {
  let knexInst: Knex;
  let builder: KnexQueryBuilder;

  beforeAll(async () => {
    // 使用带连接的 Knex 实例
    knexInst = knex({
      client: "mysql2",
      connection: MYSQL_CONFIG,
    });
    builder = new KnexQueryBuilder(knexInst);

    // 建库建表
    const initKnex = knex({
      client: "mysql2",
      connection: {
        host: "localhost",
        port: 3306,
        user: "root",
        password: "2586603nnj",
      },
    });
    await initKnex.raw("CREATE DATABASE IF NOT EXISTS seedar_injection_test");
    await initKnex.destroy();

    await knexInst.raw("DROP TABLE IF EXISTS users");
    await knexInst.raw("DROP TABLE IF EXISTS admin_secrets");

    await knexInst.raw(`
      CREATE TABLE users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) NOT NULL,
        email VARCHAR(200) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'user',
        salary DECIMAL(10,2) DEFAULT 0
      )`);

    await knexInst.raw(`
      CREATE TABLE admin_secrets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        secret_key VARCHAR(200) NOT NULL
      )`);

    // 插入测试数据
    await knexInst("users").insert([
      { username: "Alice", email: "alice@example.com", role: "user", salary: 5000 },
      { username: "Bob", email: "bob@example.com", role: "user", salary: 6000 },
      { username: "Charlie", email: "charlie@example.com", role: "admin", salary: 10000 },
      { username: "O'Brien", email: "obrien@example.com", role: "user", salary: 7000 },
    ]);

    await knexInst("admin_secrets").insert([
      { secret_key: "SECRET_TOKEN_12345" },
      { secret_key: "API_KEY_abcdef" },
    ]);

    console.log("[Part2] 测试数据准备完成");
  }, 30000);

  afterAll(async () => {
    if (knexInst) {
      await knexInst.raw("DROP DATABASE IF EXISTS seedar_injection_test");
      await knexInst.destroy();
      console.log("[Part2] 已清理");
    }
  });

  // ── 2.1 基线：正常值走 metric_engine 应该正常工作 ────

  describe("基线：正常值", () => {
    it("正常字符串值通过 metric_engine 查询成功", async () => {
      const expr = new ComparisonExpr(
        "=",
        new FieldRefExpr("username", "users", "t1"),
        new LiteralExpr("Alice"),
      );
      const spec = makeSpec(expr, {
        dimensions: [
          new FieldRefExpr("id", "users", "t1"),
          new FieldRefExpr("username", "users", "t1"),
          new FieldRefExpr("role", "users", "t1"),
        ],
      });
      const { sql, bindings } = builder.build(spec);

      const result = await knexInst.raw(sql, bindings as any);
      const rows = result[0] as any[];

      expect(rows).toHaveLength(1);
      expect(rows[0].username).toBe("Alice");

      console.log("[基线-正常] SQL:", sql);
      console.log("[基线-正常] 结果:", rows);
    });
  });

  // ── 2.2 攻击：Plan B 防护下注入被阻止 ───

  describe("攻击场景 — Plan B 参数化绑定防护", () => {
    it("【OR 注入已阻止】恶意载荷被当作字面值，返回 0 行", async () => {
      const expr = new ComparisonExpr(
        "=",
        new FieldRefExpr("username", "users", "t1"),
        new LiteralExpr("' OR '1'='1"), // ← 恶意载荷
      );
      const spec = makeSpec(expr, {
        dimensions: [
          new FieldRefExpr("id", "users", "t1"),
          new FieldRefExpr("username", "users", "t1"),
          new FieldRefExpr("role", "users", "t1"),
        ],
      });
      const { sql, bindings } = builder.build(spec);

      console.log("[OR注入-已阻止] SQL:", sql, "bindings:", bindings);

      const result = await knexInst.raw(sql, bindings as any);
      const rows = result[0] as any[];

      // Plan B: 载荷作为字面值匹配，无用户名为 "' OR '1'='1"，返回 0 行
      expect(rows).toHaveLength(0);
      console.log(`[OR注入-已阻止] 返回 ${rows.length} 行，注入被阻止`);
    });

    it("【UNION 注入已阻止】载荷被当作字面值，返回 0 行", async () => {
      const expr = new ComparisonExpr(
        "=",
        new FieldRefExpr("username", "users", "t1"),
        new LiteralExpr("' UNION SELECT id, secret_key, NULL, NULL, NULL FROM admin_secrets -- "),
      );
      const spec = makeSpec(expr, {
        dimensions: [
          new FieldRefExpr("id", "users", "t1"),
          new FieldRefExpr("username", "users", "t1"),
          new FieldRefExpr("email", "users", "t1"),
          new FieldRefExpr("role", "users", "t1"),
          new FieldRefExpr("salary", "users", "t1"),
        ],
      });
      const { sql, bindings } = builder.build(spec);

      console.log("[UNION注入-已阻止] SQL:", sql, "bindings:", bindings);

      const result = await knexInst.raw(sql, bindings as any);
      const rows = result[0] as any[];

      // Plan B: 参数化后载荷为字面值，不泄露敏感表
      expect(rows).toHaveLength(0);
      console.log(`[UNION注入-已阻止] 返回 ${rows.length} 行，未泄露数据`);
    });

    it("【报错注入已阻止】XPATH 载荷被当作字面值，不抛错", async () => {
      const expr = new ComparisonExpr(
        "=",
        new FieldRefExpr("username", "users", "t1"),
        new LiteralExpr(
          "' AND EXTRACTVALUE(1,CONCAT(0x7e,(SELECT database()))) AND '1'='1",
        ),
      );
      const spec = makeSpec(expr, {
        dimensions: [
          new FieldRefExpr("id", "users", "t1"),
          new FieldRefExpr("username", "users", "t1"),
        ],
      });
      const { sql, bindings } = builder.build(spec);

      console.log("[报错注入-已阻止] SQL:", sql, "bindings:", bindings);

      // Plan B: 载荷作为字面值，不触发 XPATH 函数，正常执行返回 0 行
      const result = await knexInst.raw(sql, bindings as any);
      const rows = result[0] as any[];
      expect(rows).toHaveLength(0);
      console.log(`[报错注入-已阻止] 返回 ${rows.length} 行，报错注入被阻止`);
    });

    it("【LIKE 注入已阻止】恶意载荷被当作 LIKE 字面模式，返回 0 行", async () => {
      const expr = new LikeExpr(
        new FieldRefExpr("email", "users", "t1"),
        new LiteralExpr("%' OR 1=1 -- "),
      );
      const spec = makeSpec(expr, {
        dimensions: [
          new FieldRefExpr("id", "users", "t1"),
          new FieldRefExpr("username", "users", "t1"),
          new FieldRefExpr("email", "users", "t1"),
          new FieldRefExpr("role", "users", "t1"),
        ],
      });
      const { sql, bindings } = builder.build(spec);

      console.log("[LIKE注入-已阻止] SQL:", sql, "bindings:", bindings);

      const result = await knexInst.raw(sql, bindings as any);
      const rows = result[0] as any[];

      // Plan B: 参数化后无注入，返回 0 行
      expect(rows).toHaveLength(0);
      console.log(`[LIKE注入-已阻止] 返回 ${rows.length} 行`);
    });

    it("【IN 注入已阻止】恶意载荷被当作 IN 列表字面值，返回 0 行", async () => {
      const expr = new InExpr(
        new FieldRefExpr("role", "users", "t1"),
        [
          new LiteralExpr("user"),
          new LiteralExpr("') OR 1=1 -- "),
        ],
      );
      const spec = makeSpec(expr, {
        dimensions: [
          new FieldRefExpr("id", "users", "t1"),
          new FieldRefExpr("username", "users", "t1"),
          new FieldRefExpr("role", "users", "t1"),
        ],
      });
      const { sql, bindings } = builder.build(spec);

      console.log("[IN注入-已阻止] SQL:", sql, "bindings:", bindings);

      const result = await knexInst.raw(sql, bindings as any);
      const rows = result[0] as any[];

      // Plan B: 参数化后 IN 列表匹配 role IN ('user', ''') OR 1=1 -- ')，注入被阻止
      // role = 'user' 的 3 个用户正常返回，注入载荷是另一个不匹配的字面值
      expect(rows.length).toBe(3);
      console.log(`[IN注入-已阻止] 返回 ${rows.length} 行（仅 role=user），注入被阻止`);
    });

    it("【O'Brien 修复】合法值含单引号现在可以正常查询", async () => {
      const expr = new ComparisonExpr(
        "=",
        new FieldRefExpr("username", "users", "t1"),
        new LiteralExpr("O'Brien"),
      );
      const spec = makeSpec(expr, {
        dimensions: [
          new FieldRefExpr("id", "users", "t1"),
          new FieldRefExpr("username", "users", "t1"),
        ],
      });
      const { sql, bindings } = builder.build(spec);

      console.log("[O'Brien-修复] SQL:", sql, "bindings:", bindings);

      // Plan B: O'Brien 走参数化绑定，不再导致 SQL 语法错误
      const result = await knexInst.raw(sql, bindings as any);
      const rows = result[0] as any[];
      expect(rows).toHaveLength(1);
      expect(rows[0].username).toBe("O'Brien");
      console.log(`[O'Brien-修复] 查询成功: ${JSON.stringify(rows)}`);
    });
  });

  // ── 2.3 对比：如果用了参数化查询 ───────────────────

  describe("对比 — 参数化查询（说明这不是 MySQL 的问题）", () => {
    it("Knex 参数化查询安全处理 O'Brien", async () => {
      const rows = await knexInst("users")
        .select("*")
        .where("username", "O'Brien");
      expect(rows).toHaveLength(1);
      expect(rows[0].username).toBe("O'Brien");

      console.log("[对比] O'Brien 参数化查询正常");
    });

    it("Knex 参数化查询不受 OR 注入影响", async () => {
      const rows = await knexInst("users")
        .select("*")
        .where("username", "' OR '1'='1");
      expect(rows).toHaveLength(0); // 找不到这个用户，而不是返回全表

      console.log("[对比] OR 注入被参数化阻挡，返回 0 行");
    });
  });
});
