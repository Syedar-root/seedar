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

describe("V2 筛选表达式测试", () => {
  let builder: KnexQueryBuilder;

  beforeAll(() => {
    const knexInstance = knex({ client: "mysql2" });
    builder = new KnexQueryBuilder(knexInstance);
  });

  describe("InExpr - IN 列表测试", () => {
    it("应正确生成 IN 列表 SQL", () => {
      const inExpr = new InExpr(new FieldRefExpr("status", "orders", "t1"), [
        new LiteralExpr("paid"),
        new LiteralExpr("shipped"),
        new LiteralExpr("completed"),
      ]);

      const spec = {
        from: { table: "orders", alias: "t1" },
        joins: [],
        dimensions: [new FieldRefExpr("id", "orders", "t1")],
        metrics: [],
        filters: [inExpr],
      };

      const result = builder.build(spec as any);
      expect(result.sql).toContain("IN");
      expect(result.sql).toContain("'paid'");
      expect(result.sql).toContain("'shipped'");
      expect(result.sql).toContain("'completed'");
      console.log("SQL:", result.sql);
    });

    it("应正确生成 NOT IN 列表 SQL", () => {
      const notInExpr = new InExpr(
        new FieldRefExpr("status", "orders", "t1"),
        [new LiteralExpr("cancelled"), new LiteralExpr("refunded")],
        true,
      );

      const spec = {
        from: { table: "orders", alias: "t1" },
        joins: [],
        dimensions: [new FieldRefExpr("id", "orders", "t1")],
        metrics: [],
        filters: [notInExpr],
      };

      const result = builder.build(spec as any);
      expect(result.sql).toContain("NOT IN");
      expect(result.sql).toContain("'cancelled'");
      expect(result.sql).toContain("'refunded'");
      console.log("SQL:", result.sql);
    });

    it("应正确处理数值列表", () => {
      const inExpr = new InExpr(
        new FieldRefExpr("category_id", "products", "t1"),
        [new LiteralExpr(1), new LiteralExpr(2), new LiteralExpr(3)],
      );

      const spec = {
        from: { table: "products", alias: "t1" },
        joins: [],
        dimensions: [new FieldRefExpr("id", "products", "t1")],
        metrics: [],
        filters: [inExpr],
      };

      const result = builder.build(spec as any);
      expect(result.sql).toContain("IN");
      expect(result.sql).toContain("1");
      expect(result.sql).toContain("2");
      expect(result.sql).toContain("3");
      console.log("SQL:", result.sql);
    });
  });

  describe("BetweenExpr - BETWEEN 范围测试", () => {
    it("应正确生成 BETWEEN SQL", () => {
      const betweenExpr = new BetweenExpr(
        new FieldRefExpr("amount", "orders", "t1"),
        new LiteralExpr(100),
        new LiteralExpr(1000),
      );

      const spec = {
        from: { table: "orders", alias: "t1" },
        joins: [],
        dimensions: [new FieldRefExpr("id", "orders", "t1")],
        metrics: [],
        filters: [betweenExpr],
      };

      const result = builder.build(spec as any);
      expect(result.sql).toContain("BETWEEN");
      expect(result.sql).toContain("100");
      expect(result.sql).toContain("1000");
      expect(result.sql).toContain("AND");
      console.log("SQL:", result.sql);
    });

    it("应正确生成 NOT BETWEEN SQL", () => {
      const notBetweenExpr = new BetweenExpr(
        new FieldRefExpr("amount", "orders", "t1"),
        new LiteralExpr(100),
        new LiteralExpr(1000),
        true,
      );

      const spec = {
        from: { table: "orders", alias: "t1" },
        joins: [],
        dimensions: [new FieldRefExpr("id", "orders", "t1")],
        metrics: [],
        filters: [notBetweenExpr],
      };

      const result = builder.build(spec as any);
      expect(result.sql).toContain("NOT BETWEEN");
    });

    it("应正确处理日期范围", () => {
      const betweenExpr = new BetweenExpr(
        new FieldRefExpr("created_at", "orders", "t1"),
        new LiteralExpr("2024-01-01"),
        new LiteralExpr("2024-12-31"),
      );

      const spec = {
        from: { table: "orders", alias: "t1" },
        joins: [],
        dimensions: [new FieldRefExpr("id", "orders", "t1")],
        metrics: [],
        filters: [betweenExpr],
      };

      const result = builder.build(spec as any);
      expect(result.sql).toContain("BETWEEN");
      expect(result.sql).toContain("'2024-01-01'");
      expect(result.sql).toContain("'2024-12-31'");
    });
  });

  describe("LikeExpr - LIKE 模糊匹配测试", () => {
    it("应正确生成 LIKE SQL", () => {
      const likeExpr = new LikeExpr(
        new FieldRefExpr("name", "users", "t1"),
        new LiteralExpr("%张%"),
      );

      const spec = {
        from: { table: "users", alias: "t1" },
        joins: [],
        dimensions: [new FieldRefExpr("id", "users", "t1")],
        metrics: [],
        filters: [likeExpr],
      };

      const result = builder.build(spec as any);
      expect(result.sql).toContain("LIKE");
      expect(result.sql).toContain("'%张%'");
    });

    it("应正确生成 NOT LIKE SQL", () => {
      const notLikeExpr = new LikeExpr(
        new FieldRefExpr("email", "users", "t1"),
        new LiteralExpr("%spam%"),
        true,
      );

      const spec = {
        from: { table: "users", alias: "t1" },
        joins: [],
        dimensions: [new FieldRefExpr("id", "users", "t1")],
        metrics: [],
        filters: [notLikeExpr],
      };

      const result = builder.build(spec as any);
      expect(result.sql).toContain("NOT LIKE");
    });

    it("应正确处理前缀匹配", () => {
      const likeExpr = new LikeExpr(
        new FieldRefExpr("code", "products", "t1"),
        new LiteralExpr("PROD_%"),
      );

      const spec = {
        from: { table: "products", alias: "t1" },
        joins: [],
        dimensions: [new FieldRefExpr("id", "products", "t1")],
        metrics: [],
        filters: [likeExpr],
      };

      const result = builder.build(spec as any);
      expect(result.sql).toContain("LIKE");
      expect(result.sql).toContain("'PROD_%'");
    });
  });

  describe("IsNullExpr - IS NULL 空值判断测试", () => {
    it("应正确生成 IS NULL SQL", () => {
      const isNullExpr = new IsNullExpr(
        new FieldRefExpr("deleted_at", "orders", "t1"),
      );

      const spec = {
        from: { table: "orders", alias: "t1" },
        joins: [],
        dimensions: [new FieldRefExpr("id", "orders", "t1")],
        metrics: [],
        filters: [isNullExpr],
      };

      const result = builder.build(spec as any);
      expect(result.sql).toContain("IS NULL");
    });

    it("应正确生成 IS NOT NULL SQL", () => {
      const isNotNullExpr = new IsNullExpr(
        new FieldRefExpr("paid_at", "orders", "t1"),
        true,
      );

      const spec = {
        from: { table: "orders", alias: "t1" },
        joins: [],
        dimensions: [new FieldRefExpr("id", "orders", "t1")],
        metrics: [],
        filters: [isNotNullExpr],
      };

      const result = builder.build(spec as any);
      expect(result.sql).toContain("IS NOT NULL");
    });

    it("应正确处理多个 NULL 条件组合", () => {
      const isNullExpr1 = new IsNullExpr(
        new FieldRefExpr("deleted_at", "orders", "t1"),
      );
      const isNullExpr2 = new IsNullExpr(
        new FieldRefExpr("cancelled_at", "orders", "t1"),
      );

      const spec = {
        from: { table: "orders", alias: "t1" },
        joins: [],
        dimensions: [new FieldRefExpr("id", "orders", "t1")],
        metrics: [],
        filters: [isNullExpr1, isNullExpr2],
      };

      const result = builder.build(spec as any);
      expect(result.sql).toContain("IS NULL");
    });
  });
});
