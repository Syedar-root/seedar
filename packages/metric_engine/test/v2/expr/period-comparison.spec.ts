import { ExprAnalyzer } from "../../../src/v2/expr/analyzer";
import {
  BinaryExpr,
  LiteralExpr,
} from "../../../src/v2/expr";
import {
  createPeriodComparisonMetric,
  createSumMetric,
} from "../../helpers/query-fixtures";

describe("PeriodComparison expression placement", () => {
  it("allows a period comparison metric at the top level", () => {
    expect(() =>
      ExprAnalyzer.assertPeriodComparisonPlacement({
        metrics: [createPeriodComparisonMetric()],
      }),
    ).not.toThrow();
  });

  it("rejects period comparison metrics nested inside another expression", () => {
    const nestedMetric = new BinaryExpr(
      "+",
      createPeriodComparisonMetric(),
      new LiteralExpr(1),
    );

    expect(() =>
      ExprAnalyzer.assertPeriodComparisonPlacement({
        metrics: [nestedMetric],
      }),
    ).toThrow(/top-level metric/);
  });

  it("rejects period comparison expressions inside filters", () => {
    const periodMetric = createPeriodComparisonMetric();

    expect(() =>
      ExprAnalyzer.assertPeriodComparisonPlacement({
        metrics: [createSumMetric()],
        filters: [periodMetric],
      }),
    ).toThrow(/filters/);
  });

  it("rejects period comparison expressions inside dimensions", () => {
    expect(() =>
      ExprAnalyzer.assertPeriodComparisonPlacement({
        metrics: [createSumMetric()],
        dimensions: [createPeriodComparisonMetric()],
      }),
    ).toThrow(/dimensions/);
  });

  it("rejects period comparison expressions inside orderBy definitions", () => {
    const periodMetric = createPeriodComparisonMetric();

    expect(() =>
      ExprAnalyzer.assertPeriodComparisonPlacement({
        metrics: [createSumMetric()],
        orderBy: [{ expr: periodMetric, dir: "asc" }],
      }),
    ).toThrow(/orderBy/);
  });
});
