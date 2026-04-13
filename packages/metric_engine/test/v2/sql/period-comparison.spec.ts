import {
  ComparisonExpr,
  FieldRefExpr,
  LiteralExpr,
} from "../../../src/v2/expr";
import { ComparisonMode, PeriodOffsetType } from "../../../src/v2/expr/types";
import { createTestBuilder } from "../../helpers/create-builder";
import {
  createBaseSpec,
  createDimension,
  createFieldRef,
  createSumMetric,
  createPeriodComparisonMetric,
  createTimeField,
  createTimeFilter,
} from "../../helpers/query-fixtures";

describe("PeriodComparison SQL builder", () => {
  it("routes mixed metrics through the period comparison builder with grouped alignment", () => {
    const builder = createTestBuilder();
    const timeField = createTimeField();
    const periodMetric = createPeriodComparisonMetric({
      alias: "period_change",
      comparisonMode: ComparisonMode.PERCENTAGE,
      offsetType: PeriodOffsetType.MONTH_OVER_MONTH,
      timeField,
    });

    const spec = createBaseSpec();
    spec.dimensions.push(createDimension("status", "order_status"));
    spec.metrics.push(createSumMetric("amount", "total_amount"));
    spec.metrics.push(periodMetric);
    spec.filters.push(createTimeFilter(timeField));
    spec.filters.push(
      new ComparisonExpr(
        "=",
        createFieldRef("region"),
        new LiteralExpr("APAC"),
      ),
    );
    spec.orderBy = [{ expr: "period_change", dir: "desc" }];

    const result = builder.build(spec);

    expect(result.sql).toContain("WITH current_metrics AS");
    expect(result.sql).toContain("comparison_metrics AS");
    expect(result.sql).toContain("dimension_keys AS (");
    expect(result.sql).toContain("ORDER BY period_change DESC");
    expect(result.sql).toContain("ROUND((");
    expect(result.sql).not.toContain("TIME_FILTER");
    expect(result.sql).toContain("DATE_SUB(CURDATE(), INTERVAL 1 MONTH)");
    expect(
      result.columnMappings?.some(({ alias }) => alias === "period_change"),
    ).toBe(true);
  });

  it("builds absolute difference metrics when configured for ABSOLUTE mode", () => {
    const builder = createTestBuilder();
    const timeField = createTimeField();
    const periodMetric = createPeriodComparisonMetric({
      alias: "period_diff",
      comparisonMode: ComparisonMode.ABSOLUTE,
      offsetType: PeriodOffsetType.MONTH_OVER_MONTH,
      timeField,
    });

    const spec = createBaseSpec();
    spec.metrics.push(periodMetric);
    spec.filters.push(createTimeFilter(timeField));

    const result = builder.build(spec);

    expect(result.sql).toContain("cm.__pop_base_1 - cp.__pop_base_1");
    expect(result.sql).not.toContain("ROUND(");
  });

  it("requires a time filter that explicitly targets the metric's time field", () => {
    const builder = createTestBuilder();
    const timeField = createTimeField();
    const mismatchedFilterField = new FieldRefExpr("created_at", "orders", "u");
    const periodMetric = createPeriodComparisonMetric({
      alias: "period_change",
      comparisonMode: ComparisonMode.PERCENTAGE,
      timeField,
    });

    const spec = createBaseSpec();
    spec.metrics.push(periodMetric);
    spec.filters.push(createTimeFilter(mismatchedFilterField));

    expect(() => builder.build(spec)).toThrow(
      /Missing time filter for period comparison field/,
    );
  });
});
