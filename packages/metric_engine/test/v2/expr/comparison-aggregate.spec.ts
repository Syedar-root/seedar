import {
  AggExpr,
  ComparisonExpr,
  ConditionalExpr,
  FieldRefExpr,
  LiteralExpr,
  parseExpression,
} from "../../../src/v2/expr";
import { createTestBuilder } from "../../helpers/create-builder";
import { createBaseSpec, createFieldRef } from "../../helpers/query-fixtures";

describe("comparison aggregates", () => {
  const context = {
    tables: new Map([["t1", { name: "orders", alias: "t1" }]]),
    fields: new Map([
      ["status", { name: "status", tableName: "orders", tableAlias: "t1" }],
      ["user_id", { name: "user_id", tableName: "orders", tableAlias: "t1" }],
    ]),
    metrics: new Map(),
    defaultTable: "t1",
  };

  it("parses single equals as a comparison operator", () => {
    const expr = parseExpression("status = 'paid'", context);

    expect(expr).toBeInstanceOf(ComparisonExpr);
    expect((expr as ComparisonExpr).operator).toBe("=");
  });

  it("normalizes COUNT(comparison) into a conditional count expression", () => {
    const expr = parseExpression("COUNT(status = 'paid')", context);

    expect(expr).toBeInstanceOf(AggExpr);
    const aggExpr = expr as AggExpr;
    expect(aggExpr.functionName).toBe("COUNT");
    expect(aggExpr.arg).toBeInstanceOf(ConditionalExpr);

    const conditionalArg = aggExpr.arg as ConditionalExpr;
    expect(conditionalArg.condition).toBeInstanceOf(ComparisonExpr);
    expect(conditionalArg.consequent).toEqual(new LiteralExpr(1));
    expect(conditionalArg.alternate).toEqual(new LiteralExpr(null));
  });

  it("generates CASE WHEN SQL for COUNT(comparison)", () => {
    const builder = createTestBuilder();
    const spec = createBaseSpec();
    spec.metrics = [
      parseExpression("COUNT(status = 'paid')", context),
      new AggExpr("COUNT", createFieldRef("user_id"), false, {
        alias: "total_users",
      }),
    ];

    const result = builder.build(spec);

    expect(result.sql).toContain("COUNT(CASE WHEN");
    expect(result.sql).toContain("status = 'paid'");
  });

  it("supports arithmetic expressions that contain conditional count", () => {
    const expr = parseExpression("COUNT(status = 'paid') / COUNT(user_id)", context);

    expect(expr).toBeDefined();
  });
});
