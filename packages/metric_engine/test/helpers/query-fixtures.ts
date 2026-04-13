import {
  Expr,
  ExprMeta,
  FieldRefExpr,
  AggExpr,
  PeriodComparisonExpr,
  CallExpr,
  LiteralExpr,
  PeriodOffsetType,
  ComparisonMode,
  PeriodComparisonCustomRange,
} from "../../src";
import { QuerySpec } from "../../src/v2/sql";

const DEFAULT_TABLE = "orders";
const DEFAULT_ALIAS = "o";

export function createBaseSpec(): QuerySpec {
  return {
    from: {
      table: DEFAULT_TABLE,
      alias: DEFAULT_ALIAS,
    },
    joins: [],
    dimensions: [],
    metrics: [],
    filters: [],
  };
}

export function createFieldRef(
  fieldName: string,
  alias: string = DEFAULT_ALIAS,
  meta?: ExprMeta,
): FieldRefExpr {
  const expr = new FieldRefExpr(fieldName, DEFAULT_TABLE, alias, meta);
  return expr;
}

export function createDimension(fieldName: string, alias?: string): FieldRefExpr {
  return createFieldRef(fieldName, DEFAULT_ALIAS, alias ? { alias } : undefined);
}

export function createTimeField(alias: string = DEFAULT_ALIAS): FieldRefExpr {
  return createFieldRef("created_at", alias);
}

export function createTimeFilter(
  field: FieldRefExpr,
  range: "recent_days" | "recent_weeks" | "recent_months" | "CUSTOM_DATE_RANGE" = "recent_months",
  amount = 1,
  start?: string,
  end?: string,
): CallExpr {
  const args: Expr[] = [field, new LiteralExpr(range), new LiteralExpr(amount)];
  if (range === "CUSTOM_DATE_RANGE") {
    args.push(new LiteralExpr(start ?? "2024-01-01"));
    args.push(new LiteralExpr(end ?? "2024-02-01"));
  }
  return new CallExpr("TIME_FILTER", args);
}

export function createSumMetric(
  fieldName = "amount",
  alias = "total_amount",
): AggExpr {
  return new AggExpr(
    "SUM",
    createFieldRef(fieldName),
    false,
    { alias },
  );
}

export interface PeriodComparisonFixture {
  baseMetric?: Expr;
  comparisonMode?: ComparisonMode;
  offsetType?: PeriodOffsetType;
  timeField?: FieldRefExpr;
  alias?: string;
  meta?: ExprMeta;
  customTimeRange?: PeriodComparisonCustomRange;
}

export function createPeriodComparisonMetric(
  fixture: PeriodComparisonFixture = {},
): PeriodComparisonExpr {
  const timeField = fixture.timeField ?? createTimeField();
  const baseMetric =
    fixture.baseMetric ??
    new AggExpr(
      "SUM",
      createFieldRef("amount"),
      false,
    );
  const alias = fixture.alias ?? "period_change";
  const meta = fixture.meta ?? { alias };

  return new PeriodComparisonExpr(
    baseMetric,
    fixture.offsetType ?? PeriodOffsetType.MONTH_OVER_MONTH,
    fixture.comparisonMode ?? ComparisonMode.PERCENTAGE,
    timeField,
    fixture.customTimeRange,
    meta,
  );
}
