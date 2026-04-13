import {
  BetweenExpr,
  CallExpr,
  ComparisonExpr,
  Expr,
  FieldRefExpr,
  LiteralExpr,
} from "../expr";
import { DatabaseDialect } from "../../core/types";
import { PeriodOffsetType } from "../expr/types";

export interface RawSqlDescriptor {
  sql: string;
}

export interface PlannedTimeFilters {
  inheritedFilters: Expr[];
  currentTimeFilter: RawSqlDescriptor;
  comparisonTimeFilter: RawSqlDescriptor;
}

interface TimeRangeDescriptor {
  kind: "relative" | "absolute";
  field: FieldRefExpr;
  unit?: "day" | "week" | "month";
  amount?: number;
  start?: string;
  end?: string;
}

const SUPPORTED_TIME_FILTERS = new Set([
  "recent_days",
  "recent_weeks",
  "recent_months",
  "CUSTOM_DATE_RANGE",
]);

export class TimeFilterPlanner {
  static plan(
    filters: Expr[],
    timeField: FieldRefExpr,
    offsetType: PeriodOffsetType,
  ): PlannedTimeFilters {
    const inheritedFilters: Expr[] = [];
    const timeDescriptors: TimeRangeDescriptor[] = [];

    for (const filter of filters) {
      const descriptor = this.extractDescriptor(filter, timeField);
      if (descriptor) {
        timeDescriptors.push(descriptor);
      } else {
        inheritedFilters.push(filter);
      }
    }

    if (timeDescriptors.length === 0) {
      throw new Error(
        `Missing time filter for period comparison field ${timeField.getQualifiedName()}`,
      );
    }

    if (timeDescriptors.length > 1) {
      throw new Error(
        `Expected exactly one time filter for ${timeField.getQualifiedName()}, received ${timeDescriptors.length}`,
      );
    }

    const currentDescriptor = timeDescriptors[0];
    const currentTimeFilter = this.buildCurrentFilter(currentDescriptor);
    const comparisonTimeFilter = this.buildComparisonFilter(
      currentDescriptor,
      offsetType,
    );

    return {
      inheritedFilters,
      currentTimeFilter,
      comparisonTimeFilter,
    };
  }

  private static extractDescriptor(
    filter: Expr,
    targetField: FieldRefExpr,
  ): TimeRangeDescriptor | null {
    if (
      filter instanceof CallExpr &&
      filter.functionName === "TIME_FILTER" &&
      filter.args.length >= 3
    ) {
      const [fieldArg, rangeArg, valueArg, startArg, endArg] = filter.args;
      if (!(fieldArg instanceof FieldRefExpr) || !this.isSameField(fieldArg, targetField)) {
        return null;
      }

      const range = this.readLiteral(rangeArg);
      if (typeof range !== "string" || !SUPPORTED_TIME_FILTERS.has(range)) {
        throw new Error(`Unsupported TIME_FILTER range: ${String(range)}`);
      }

      if (range === "CUSTOM_DATE_RANGE") {
        const start = this.readLiteral(startArg);
        const end = this.readLiteral(endArg);
        if (typeof start !== "string" || typeof end !== "string") {
          throw new Error("CUSTOM_DATE_RANGE requires string start and end dates");
        }

        return {
          kind: "absolute",
          field: fieldArg,
          start,
          end,
        };
      }

      const amount = this.readLiteral(valueArg);
      if (typeof amount !== "number") {
        throw new Error(`${range} requires a numeric amount`);
      }

      return {
        kind: "relative",
        field: fieldArg,
        unit: this.mapRelativeRangeToUnit(range),
        amount,
      };
    }

    if (filter instanceof BetweenExpr && this.isFieldFilter(filter.expr, targetField)) {
      const start = this.readLiteral(filter.low);
      const end = this.readLiteral(filter.high);
      if (typeof start !== "string" || typeof end !== "string") {
        throw new Error("BETWEEN time filter requires string boundaries");
      }

      return {
        kind: "absolute",
        field: targetField,
        start,
        end,
      };
    }

    if (filter instanceof ComparisonExpr && this.isComparisonOnField(filter, targetField)) {
      throw new Error(
        `ComparisonExpr time filters on ${targetField.getQualifiedName()} are not supported in V2.1; use TIME_FILTER or BETWEEN`,
      );
    }

    return null;
  }

  private static buildCurrentFilter(
    descriptor: TimeRangeDescriptor,
  ): RawSqlDescriptor {
    const fieldSql = descriptor.field.getQualifiedName();
    if (descriptor.kind === "absolute") {
      return {
        sql: `${fieldSql} >= ${this.quoteDate(descriptor.start!)} AND ${fieldSql} < ${this.quoteDate(descriptor.end!)}`,
      };
    }

    const start = this.nowMinus(descriptor.amount!, descriptor.unit!);
    const end = this.nowSql();
    return {
      sql: `${fieldSql} >= ${start} AND ${fieldSql} < ${end}`,
    };
  }

  private static buildComparisonFilter(
    descriptor: TimeRangeDescriptor,
    offsetType: PeriodOffsetType,
  ): RawSqlDescriptor {
    const fieldSql = descriptor.field.getQualifiedName();
    if (descriptor.kind === "absolute") {
      const shifted = this.shiftAbsoluteRange(
        descriptor.start!,
        descriptor.end!,
        offsetType,
      );
      return {
        sql: `${fieldSql} >= ${this.quoteDate(shifted.start)} AND ${fieldSql} < ${this.quoteDate(shifted.end)}`,
      };
    }

    const start = this.shiftSql(
      this.nowMinus(descriptor.amount!, descriptor.unit!),
      offsetType,
    );
    const end = this.shiftSql(this.nowSql(), offsetType);
    return {
      sql: `${fieldSql} >= ${start} AND ${fieldSql} < ${end}`,
    };
  }

  private static isSameField(left: FieldRefExpr, right: FieldRefExpr): boolean {
    return left.getQualifiedName() === right.getQualifiedName();
  }

  private static isFieldFilter(expr: Expr, targetField: FieldRefExpr): expr is FieldRefExpr {
    return expr instanceof FieldRefExpr && this.isSameField(expr, targetField);
  }

  private static isComparisonOnField(
    expr: ComparisonExpr,
    targetField: FieldRefExpr,
  ): boolean {
    return (
      (expr.left instanceof FieldRefExpr && this.isSameField(expr.left, targetField)) ||
      (expr.right instanceof FieldRefExpr && this.isSameField(expr.right, targetField))
    );
  }

  private static readLiteral(expr: Expr | undefined): string | number | boolean | null | undefined {
    if (expr === undefined) {
      return undefined;
    }
    if (expr instanceof LiteralExpr) {
      return expr.value;
    }
    return undefined;
  }

  private static mapRelativeRangeToUnit(
    range: string,
  ): "day" | "week" | "month" {
    switch (range) {
      case "recent_days":
        return "day";
      case "recent_weeks":
        return "week";
      case "recent_months":
        return "month";
      default:
        throw new Error(`Unsupported relative time range: ${range}`);
    }
  }

  private static nowSql(): string {
    if (DatabaseDialect.isClickHouse()) {
      return "today()";
    }
    return "CURRENT_DATE";
  }

  private static nowMinus(amount: number, unit: "day" | "week" | "month"): string {
    if (DatabaseDialect.isClickHouse()) {
      return `${this.nowSql()} - INTERVAL ${amount} ${unit.toUpperCase()}`;
    }

    if (DatabaseDialect.isPostgres()) {
      return `${this.nowSql()} - INTERVAL '${amount} ${unit}'`;
    }

    return `DATE_SUB(${this.nowSql() === "CURRENT_DATE" ? "CURDATE()" : this.nowSql()}, INTERVAL ${amount} ${unit.toUpperCase()})`;
  }

  private static shiftSql(sqlExpr: string, offsetType: PeriodOffsetType): string {
    const { amount, unit } = this.periodOffsetToInterval(offsetType);

    if (DatabaseDialect.isClickHouse()) {
      return `${sqlExpr} - INTERVAL ${amount} ${unit.toUpperCase()}`;
    }

    if (DatabaseDialect.isPostgres()) {
      return `${sqlExpr} - INTERVAL '${amount} ${unit}'`;
    }

    return `DATE_SUB(${sqlExpr === "CURRENT_DATE" ? "CURDATE()" : sqlExpr}, INTERVAL ${amount} ${unit.toUpperCase()})`;
  }

  private static periodOffsetToInterval(
    offsetType: PeriodOffsetType,
  ): { amount: number; unit: "day" | "week" | "month" | "year" } {
    switch (offsetType) {
      case PeriodOffsetType.DAY_OVER_DAY:
        return { amount: 1, unit: "day" };
      case PeriodOffsetType.WEEK_OVER_WEEK:
        return { amount: 1, unit: "week" };
      case PeriodOffsetType.MONTH_OVER_MONTH:
        return { amount: 1, unit: "month" };
      case PeriodOffsetType.QUARTER_OVER_QUARTER:
        return { amount: 3, unit: "month" };
      case PeriodOffsetType.YEAR_OVER_YEAR:
        return { amount: 1, unit: "year" };
      default:
        throw new Error(`Unsupported period offset type: ${String(offsetType)}`);
    }
  }

  private static shiftAbsoluteRange(
    start: string,
    end: string,
    offsetType: PeriodOffsetType,
  ): { start: string; end: string } {
    return {
      start: this.shiftIsoDate(start, offsetType),
      end: this.shiftIsoDate(end, offsetType),
    };
  }

  private static shiftIsoDate(dateString: string, offsetType: PeriodOffsetType): string {
    const date = new Date(`${dateString}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime())) {
      throw new Error(`Invalid custom date range boundary: ${dateString}`);
    }

    switch (offsetType) {
      case PeriodOffsetType.DAY_OVER_DAY:
        date.setUTCDate(date.getUTCDate() - 1);
        break;
      case PeriodOffsetType.WEEK_OVER_WEEK:
        date.setUTCDate(date.getUTCDate() - 7);
        break;
      case PeriodOffsetType.MONTH_OVER_MONTH:
        date.setUTCMonth(date.getUTCMonth() - 1);
        break;
      case PeriodOffsetType.QUARTER_OVER_QUARTER:
        date.setUTCMonth(date.getUTCMonth() - 3);
        break;
      case PeriodOffsetType.YEAR_OVER_YEAR:
        date.setUTCFullYear(date.getUTCFullYear() - 1);
        break;
      default:
        throw new Error(`Unsupported period offset type: ${String(offsetType)}`);
    }

    return date.toISOString().slice(0, 10);
  }

  private static quoteDate(value: string): string {
    return `'${value}'`;
  }
}
