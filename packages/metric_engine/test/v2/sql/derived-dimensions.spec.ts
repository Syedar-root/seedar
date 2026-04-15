import {
  AggExpr,
  BinaryExpr,
  CallExpr,
  ComparisonExpr,
  ConditionalExpr,
  LiteralExpr,
} from "../../../src/v2/expr";
import { DatabaseDialect } from "../../../src";
import { createTestBuilder } from "../../helpers/create-builder";
import { createBaseSpec, createFieldRef } from "../../helpers/query-fixtures";

function createTimeGrainDimension(grain: string, alias = "time_grain_dim") {
  return new CallExpr(
    "TIME_GRAIN",
    [createFieldRef("created_at"), new LiteralExpr(grain)],
    { alias },
  );
}

function createBucketDimension(alias = "amount_bucket") {
  return new ConditionalExpr(
    new ComparisonExpr("<", createFieldRef("amount"), new LiteralExpr(20)),
    new LiteralExpr("bad"),
    new ConditionalExpr(
      new ComparisonExpr("<", createFieldRef("amount"), new LiteralExpr(50)),
      new LiteralExpr("normal"),
      new LiteralExpr("good"),
    ),
    { alias },
  );
}

function createMappingDimension(alias = "status_level") {
  return new ConditionalExpr(
    new ComparisonExpr("==", createFieldRef("status"), new LiteralExpr("A")),
    new LiteralExpr("high"),
    new ConditionalExpr(
      new ComparisonExpr("==", createFieldRef("status"), new LiteralExpr("B")),
      new LiteralExpr("mid"),
      new LiteralExpr("low"),
    ),
    { alias },
  );
}

describe("derived dimensions SQL builder", () => {
  it("builds simple SQL for TIME_GRAIN and expression dimensions", () => {
    const builder = createTestBuilder("mysql2");
    const timeGrainDim = createTimeGrainDimension("month", "order_month");
    const exprDim = new BinaryExpr(
      "+",
      createFieldRef("amount"),
      new LiteralExpr(1),
      { alias: "amount_plus_one" },
    );

    const spec = createBaseSpec();
    spec.dimensions.push(timeGrainDim);
    spec.dimensions.push(exprDim);
    spec.metrics.push(
      new AggExpr("SUM", createFieldRef("amount"), false, { alias: "total" }),
    );
    spec.orderBy = [{ expr: "order_month", dir: "asc" }];

    const result = builder.build(spec);
    expect(result.sql).toContain("DATE_FORMAT(o.created_at, '%Y-%m')");
    expect(result.sql).toContain("group by DATE_FORMAT(o.created_at, '%Y-%m')");
    expect(result.sql).toContain("o.amount + 1");
    expect(
      result.columnMappings?.some((col) => col.alias === "amount_plus_one"),
    ).toBe(true);
  });

  it("supports bucket/mapping dimensions in simple SQL", () => {
    const builder = createTestBuilder("mysql2");
    const spec = createBaseSpec();

    spec.dimensions.push(createBucketDimension("bucket_label"));
    spec.dimensions.push(createMappingDimension("mapped_status"));
    spec.metrics.push(
      new AggExpr("COUNT", createFieldRef("id"), false, { alias: "cnt" }),
    );
    spec.orderBy = [{ expr: "bucket_label", dir: "asc" }];

    const result = builder.build(spec);
    expect(result.sql).toContain("CASE WHEN");
    expect(result.sql).toContain("THEN 'bad'");
    expect(result.sql).toContain("THEN 'high'");
    expect(result.sql).toContain("ELSE 'low'");
  });

  it("builds CTE SQL for derived dimensions and expression orderBy", () => {
    const builder = createTestBuilder("mysql2");
    const bucketDim = createBucketDimension("bucket_label");
    const timeGrainDim = createTimeGrainDimension("week", "order_week");

    const spec = createBaseSpec();
    spec.dimensions.push(timeGrainDim);
    spec.dimensions.push(bucketDim);
    spec.metrics.push(
      new BinaryExpr(
        "+",
        new AggExpr("SUM", createFieldRef("amount"), false),
        new LiteralExpr(1),
        { alias: "sum_plus_one" },
      ),
    );
    spec.orderBy = [{ expr: bucketDim, dir: "asc" }];

    const result = builder.build(spec);
    expect(result.sql).toContain("with `base_cte` as");
    expect(result.sql).toContain("DATE_FORMAT(o.created_at, '%x-%v')");
    expect(result.sql).toContain("CASE WHEN");
    expect(result.sql).toContain("order by `column_3` asc");
  });

  it("requires alias for expression dimensions in simple path", () => {
    const builder = createTestBuilder("mysql2");
    const spec = createBaseSpec();

    spec.dimensions.push(
      new BinaryExpr("+", createFieldRef("amount"), new LiteralExpr(1)),
    );
    spec.metrics.push(
      new AggExpr("SUM", createFieldRef("amount"), false, { alias: "total" }),
    );

    expect(() => builder.build(spec)).toThrow(
      "Expression dimension at index 0 requires meta.alias",
    );
  });

  it("requires alias for expression dimensions in CTE path", () => {
    const builder = createTestBuilder("mysql2");
    const spec = createBaseSpec();

    spec.dimensions.push(
      new BinaryExpr("+", createFieldRef("amount"), new LiteralExpr(1)),
    );
    spec.metrics.push(
      new BinaryExpr(
        "+",
        new AggExpr("SUM", createFieldRef("amount"), false),
        new LiteralExpr(1),
        { alias: "sum_plus_one" },
      ),
    );

    expect(() => builder.build(spec)).toThrow(
      "Expression dimension at index 0 requires meta.alias",
    );
  });

  describe("TIME_GRAIN dialect mapping", () => {
    const mysqlCases: Array<[string, string]> = [
      ["day", "DATE(o.created_at)"],
      ["date", "DATE(o.created_at)"],
      ["week", "DATE_FORMAT(o.created_at, '%x-%v')"],
      ["month", "DATE_FORMAT(o.created_at, '%Y-%m')"],
      ["quarter", "CONCAT(YEAR(o.created_at), '-Q', QUARTER(o.created_at))"],
      ["year", "YEAR(o.created_at)"],
    ];

    it.each(mysqlCases)("maps mysql TIME_GRAIN(%s)", (grain, expectedSql) => {
      const builder = createTestBuilder("mysql2");
      const spec = createBaseSpec();
      spec.dimensions.push(createTimeGrainDimension(grain, "tg"));
      spec.metrics.push(
        new AggExpr("SUM", createFieldRef("amount"), false, { alias: "total" }),
      );

      const result = builder.build(spec);
      expect(result.sql).toContain(expectedSql);
    });

    it("maps postgres TIME_GRAIN", () => {
      const builder = createTestBuilder("pg");
      const spec = createBaseSpec();
      spec.dimensions.push(createTimeGrainDimension("month", "tg"));
      spec.metrics.push(
        new AggExpr("SUM", createFieldRef("amount"), false, { alias: "total" }),
      );

      const result = builder.build(spec);
      expect(result.sql).toContain("DATE_TRUNC('month', o.created_at)");
    });

    it("maps clickhouse TIME_GRAIN", () => {
      const builder = createTestBuilder("mysql2");
      DatabaseDialect.setClient("clickhouse");
      const spec = createBaseSpec();
      spec.dimensions.push(createTimeGrainDimension("quarter", "tg"));
      spec.metrics.push(
        new AggExpr("SUM", createFieldRef("amount"), false, { alias: "total" }),
      );

      const result = builder.build(spec);
      expect(result.sql).toContain("toStartOfQuarter(o.created_at)");
    });

    it("throws on invalid TIME_GRAIN grain", () => {
      const builder = createTestBuilder("mysql2");
      const spec = createBaseSpec();
      spec.dimensions.push(createTimeGrainDimension("invalid_grain", "tg"));
      spec.metrics.push(
        new AggExpr("SUM", createFieldRef("amount"), false, { alias: "total" }),
      );

      expect(() => builder.build(spec)).toThrow(/Invalid TIME_GRAIN grain/);
    });
  });
});
