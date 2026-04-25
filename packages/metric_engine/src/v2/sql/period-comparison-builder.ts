import { Knex } from "knex";
import {
  CallExpr,
  Expr,
  ExprMeta,
  FieldRefExpr,
  PeriodComparisonExpr,
} from "../expr";
import { QuerySpec, SQLResult } from "./types";
import { TimeFilterPlanner } from "./time-filter-planner";
import { KnexQueryBuilder } from "./knex-builder";
import { DatabaseDialect } from "../../core/types";

interface PreparedMetric {
  expr: Expr;
  alias: string;
  displayName: string;
  businessName?: string;
}

interface PreparedPeriodMetric {
  expr: PeriodComparisonExpr;
  alias: string;
  displayName: string;
  businessName?: string;
  baseAlias: string;
}

interface DimensionAlignment {
  alias: string;
  requiresOffsetAlignment: boolean;
}

export class PeriodComparisonBuilder {
  private knex: Knex;

  constructor(knex: Knex) {
    this.knex = knex;
  }

  build(spec: QuerySpec): SQLResult {
    const periodMetrics = spec.metrics.filter(
      (metric): metric is PeriodComparisonExpr =>
        metric instanceof PeriodComparisonExpr,
    );
    const normalMetrics = spec.metrics.filter(
      (metric): metric is Expr => !(metric instanceof PeriodComparisonExpr),
    ) as Expr[];

    if (periodMetrics.length === 0) {
      throw new Error("PeriodComparisonBuilder requires at least one PeriodComparisonExpr");
    }

    this.assertCompatiblePeriodMetrics(periodMetrics);

    const primaryPeriodMetric = periodMetrics[0];
    const dimensionAlignments = this.buildDimensionAlignments(
      spec.dimensions as Expr[],
      primaryPeriodMetric.timeField,
    );
    const plannedFilters = TimeFilterPlanner.plan(
      spec.filters as Expr[],
      primaryPeriodMetric.timeField,
      primaryPeriodMetric.offsetType,
    );

    const preparedDimensions = this.prepareDimensions(spec.dimensions as Expr[]);
    const preparedNormalMetrics = this.prepareNormalMetrics(normalMetrics);
    const preparedPeriodMetrics = this.preparePeriodMetrics(periodMetrics);

    const currentSpec = this.createCurrentSpec(
      spec,
      preparedDimensions,
      preparedNormalMetrics,
      preparedPeriodMetrics,
      plannedFilters,
    );
    const comparisonSpec = this.createComparisonSpec(
      spec,
      preparedDimensions,
      preparedPeriodMetrics,
      plannedFilters,
    );

    const nestedBuilder = new KnexQueryBuilder(this.knex);
    const currentResult = nestedBuilder.build(currentSpec);
    const comparisonResult = nestedBuilder.build(comparisonSpec);

    const ctes = [
      `current_metrics AS (\n${currentResult.sql}\n)`,
      `comparison_metrics AS (\n${comparisonResult.sql}\n)`,
    ];

    if (preparedDimensions.length > 0) {
      ctes.push(
        this.buildDimensionKeysCTE(
          preparedDimensions,
          dimensionAlignments,
          primaryPeriodMetric.offsetType,
        ),
      );
    }

    const finalQuery = this.buildFinalQuery(
      spec,
      preparedDimensions,
      preparedNormalMetrics,
      preparedPeriodMetrics,
      dimensionAlignments,
      primaryPeriodMetric.offsetType,
    );

    return {
      sql: `WITH ${ctes.join(",\n")}\n${finalQuery.sql}`,
      bindings: [...currentResult.bindings, ...comparisonResult.bindings],
      columnMappings: this.buildColumnMappings(
        preparedDimensions,
        preparedNormalMetrics,
        preparedPeriodMetrics,
      ),
    };
  }

  private assertCompatiblePeriodMetrics(metrics: PeriodComparisonExpr[]): void {
    const [first, ...rest] = metrics;
    const firstField = first.timeField.getQualifiedName();
    const firstOffset = first.offsetType;

    for (const metric of rest) {
      if (metric.timeField.getQualifiedName() !== firstField) {
        throw new Error(
          "V2.1 only supports period comparison metrics that share the same timeField",
        );
      }
      if (metric.offsetType !== firstOffset) {
        throw new Error(
          "V2.1 only supports period comparison metrics that share the same offsetType",
        );
      }
    }
  }

  private prepareDimensions(dimensions: Expr[]): PreparedMetric[] {
    return dimensions.map((dimension, index) =>
      this.prepareExprMetric(
        dimension,
        dimension.meta,
        `dimension_${index + 1}`,
      ),
    );
  }

  private prepareNormalMetrics(metrics: Expr[]): PreparedMetric[] {
    return metrics.map((metric, index) =>
      this.prepareExprMetric(metric, metric.meta, `metric_${index + 1}`),
    );
  }

  private preparePeriodMetrics(
    metrics: PeriodComparisonExpr[],
  ): PreparedPeriodMetric[] {
    return metrics.map((metric, index) => {
      const alias = metric.meta?.alias || `period_metric_${index + 1}`;
      const displayName = metric.meta?.businessName || alias;
      return {
        expr: metric,
        alias,
        displayName,
        businessName: metric.meta?.businessName,
        baseAlias: `__pop_base_${index + 1}`,
      };
    });
  }

  private prepareExprMetric(
    expr: Expr,
    meta: ExprMeta | undefined,
    fallbackAlias: string,
  ): PreparedMetric {
    return {
      expr,
      alias: meta?.alias || fallbackAlias,
      displayName: meta?.businessName || meta?.alias || fallbackAlias,
      businessName: meta?.businessName,
    };
  }

  private createCurrentSpec(
    spec: QuerySpec,
    dimensions: PreparedMetric[],
    normalMetrics: PreparedMetric[],
    periodMetrics: PreparedPeriodMetric[],
    plannedFilters: ReturnType<typeof TimeFilterPlanner.plan>,
  ): QuerySpec {
    return {
      from: spec.from,
      joins: spec.joins,
      dimensions: dimensions.map((dimension) =>
        this.cloneExprWithAlias(dimension.expr, dimension.alias),
      ),
      metrics: [
        ...normalMetrics.map((metric) =>
          this.cloneExprWithAlias(metric.expr, metric.alias),
        ),
        ...periodMetrics.map((metric) =>
          this.cloneExprWithAlias(metric.expr.baseMetric, metric.baseAlias),
        ),
      ],
      filters: [
        ...plannedFilters.inheritedFilters,
        plannedFilters.currentTimeFilter.sql,
      ],
    };
  }

  private createComparisonSpec(
    spec: QuerySpec,
    dimensions: PreparedMetric[],
    periodMetrics: PreparedPeriodMetric[],
    plannedFilters: ReturnType<typeof TimeFilterPlanner.plan>,
  ): QuerySpec {
    return {
      from: spec.from,
      joins: spec.joins,
      dimensions: dimensions.map((dimension) =>
        this.cloneExprWithAlias(dimension.expr, dimension.alias),
      ),
      metrics: periodMetrics.map((metric) =>
        this.cloneExprWithAlias(metric.expr.baseMetric, metric.baseAlias),
      ),
      filters: [
        ...plannedFilters.inheritedFilters,
        plannedFilters.comparisonTimeFilter.sql,
      ],
    };
  }

  private cloneExprWithAlias(expr: Expr, alias: string): Expr {
    const cloned = expr.clone();
    cloned.meta = {
      ...(cloned.meta || {}),
      alias,
    };
    return cloned;
  }

  private buildDimensionKeysCTE(
    dimensions: PreparedMetric[],
    alignments: DimensionAlignment[],
    offsetType: PeriodComparisonExpr["offsetType"],
  ): string {
    const currentAliases = dimensions.map((dimension) => dimension.alias).join(", ");
    const comparisonAliases = dimensions
      .map((dimension) => {
        const alignment = alignments.find(
          (candidate) => candidate.alias === dimension.alias,
        );
        if (!alignment?.requiresOffsetAlignment) {
          return dimension.alias;
        }

        return `${this.buildForwardShiftedColumnSql(
          dimension.alias,
          offsetType,
        )} AS ${dimension.alias}`;
      })
      .join(", ");

    return `dimension_keys AS (
  SELECT ${currentAliases} FROM current_metrics
  UNION
  SELECT ${comparisonAliases} FROM comparison_metrics
)`;
  }

  private buildFinalQuery(
    spec: QuerySpec,
    dimensions: PreparedMetric[],
    normalMetrics: PreparedMetric[],
    periodMetrics: PreparedPeriodMetric[],
    dimensionAlignments: DimensionAlignment[],
    offsetType: PeriodComparisonExpr["offsetType"],
  ): { sql: string } {
    const selectParts: string[] = [];
    const fromClause =
      dimensions.length > 0 ? "FROM dimension_keys dk" : "FROM current_metrics cm\nCROSS JOIN comparison_metrics cp";

    for (const dimension of dimensions) {
      selectParts.push(`dk.${dimension.alias} as ${dimension.alias}`);
    }

    for (const metric of normalMetrics) {
      selectParts.push(`cm.${metric.alias} as ${metric.alias}`);
    }

    for (const metric of periodMetrics) {
      const currentValue = `cm.${metric.baseAlias}`;
      const comparisonValue = `cp.${metric.baseAlias}`;
      if (metric.expr.comparisonMode === "percentage") {
        selectParts.push(
          `CASE WHEN ${comparisonValue} = 0 OR ${comparisonValue} IS NULL THEN NULL ELSE ROUND(((${currentValue} - ${comparisonValue}) * 100.0 / ${comparisonValue}), 2) END as ${metric.alias}`,
        );
      } else {
        selectParts.push(`(${currentValue} - ${comparisonValue}) as ${metric.alias}`);
      }
    }

    const joinParts: string[] = [];
    if (dimensions.length > 0) {
      joinParts.push(
        `LEFT JOIN current_metrics cm ON ${this.buildDimensionJoinClause(
          dimensions,
          dimensionAlignments,
          "dk",
          "cm",
          offsetType,
        )}`,
      );
      joinParts.push(
        `LEFT JOIN comparison_metrics cp ON ${this.buildDimensionJoinClause(
          dimensions,
          dimensionAlignments,
          "dk",
          "cp",
          offsetType,
        )}`,
      );
    }

    const orderBy = this.buildOrderBy(spec, dimensions, normalMetrics, periodMetrics);
    const pagination = this.buildPagination(spec);

    return {
      sql: `SELECT ${selectParts.join(",\n  ")}
${fromClause}${joinParts.length > 0 ? `\n${joinParts.join("\n")}` : ""}${orderBy}${pagination}`,
    };
  }

  private buildDimensionJoinClause(
    dimensions: PreparedMetric[],
    alignments: DimensionAlignment[],
    leftAlias: string,
    rightAlias: string,
    offsetType: PeriodComparisonExpr["offsetType"],
  ): string {
    return dimensions
      .map((dimension) => {
        const alignment = alignments.find(
          (candidate) => candidate.alias === dimension.alias,
        );
        const rightColumn = `${rightAlias}.${dimension.alias}`;
        const rightExpr =
          rightAlias === "cp" && alignment?.requiresOffsetAlignment
            ? this.buildForwardShiftedColumnSql(rightColumn, offsetType)
            : rightColumn;

        return `${leftAlias}.${dimension.alias} = ${rightExpr}`;
      })
      .join(" AND ");
  }

  private buildDimensionAlignments(
    dimensions: Expr[],
    timeField: FieldRefExpr,
  ): DimensionAlignment[] {
    return dimensions.map((dimension, index) => ({
      alias: dimension.meta?.alias || `dimension_${index + 1}`,
      requiresOffsetAlignment: this.isTimeAlignedDimension(dimension, timeField),
    }));
  }

  private isTimeAlignedDimension(
    expr: Expr,
    timeField: FieldRefExpr,
  ): boolean {
    if (expr instanceof FieldRefExpr) {
      return expr.getQualifiedName() === timeField.getQualifiedName();
    }

    if (
      expr instanceof CallExpr &&
      expr.functionName === "TIME_GRAIN" &&
      expr.args[0] instanceof FieldRefExpr
    ) {
      return expr.args[0].getQualifiedName() === timeField.getQualifiedName();
    }

    return false;
  }

  private buildForwardShiftedColumnSql(
    columnSql: string,
    offsetType: PeriodComparisonExpr["offsetType"],
  ): string {
    const { amount, unit } = this.periodOffsetToInterval(offsetType);

    if (DatabaseDialect.isClickHouse()) {
      switch (unit) {
        case "day":
          return `addDays(${columnSql}, ${amount})`;
        case "week":
          return `addWeeks(${columnSql}, ${amount})`;
        case "month":
          return `addMonths(${columnSql}, ${amount})`;
        case "year":
          return `addYears(${columnSql}, ${amount})`;
      }
    }

    if (DatabaseDialect.isPostgres()) {
      return `${columnSql} + INTERVAL '${amount} ${unit}'`;
    }

    return `DATE_ADD(${columnSql}, INTERVAL ${amount} ${unit.toUpperCase()})`;
  }

  private periodOffsetToInterval(
    offsetType: PeriodComparisonExpr["offsetType"],
  ): { amount: number; unit: "day" | "week" | "month" | "year" } {
    switch (offsetType) {
      case "day_over_day":
        return { amount: 1, unit: "day" };
      case "week_over_week":
        return { amount: 1, unit: "week" };
      case "month_over_month":
        return { amount: 1, unit: "month" };
      case "quarter_over_quarter":
        return { amount: 3, unit: "month" };
      case "year_over_year":
        return { amount: 1, unit: "year" };
      default:
        throw new Error(`Unsupported period offset type: ${String(offsetType)}`);
    }
  }

  private buildOrderBy(
    spec: QuerySpec,
    dimensions: PreparedMetric[],
    normalMetrics: PreparedMetric[],
    periodMetrics: PreparedPeriodMetric[],
  ): string {
    if (!spec.orderBy || spec.orderBy.length === 0) {
      return "";
    }

    const outputAliases = new Map<Expr | string, string>();
    dimensions.forEach((dimension) => outputAliases.set(dimension.expr, dimension.alias));
    normalMetrics.forEach((metric) => outputAliases.set(metric.expr, metric.alias));
    periodMetrics.forEach((metric) => outputAliases.set(metric.expr, metric.alias));

    const parts = spec.orderBy.map((order) => {
      if (typeof order.expr === "string") {
        return `${order.expr} ${order.dir.toUpperCase()}`;
      }

      const alias =
        outputAliases.get(order.expr) ||
        order.expr.meta?.alias ||
        (order.expr instanceof FieldRefExpr ? order.expr.getQualifiedName() : undefined);
      if (!alias) {
        throw new Error("Unsupported orderBy expression for PeriodComparisonBuilder");
      }
      return `${alias} ${order.dir.toUpperCase()}`;
    });

    return `\nORDER BY ${parts.join(", ")}`;
  }

  private buildPagination(spec: QuerySpec): string {
    let sql = "";
    if (spec.limit !== undefined && spec.limit !== null) {
      sql += `\nLIMIT ${spec.limit}`;
    }
    if (spec.offset !== undefined && spec.offset !== null) {
      sql += `\nOFFSET ${spec.offset}`;
    }
    return sql;
  }

  private buildColumnMappings(
    dimensions: PreparedMetric[],
    normalMetrics: PreparedMetric[],
    periodMetrics: PreparedPeriodMetric[],
  ): SQLResult["columnMappings"] {
    return [
      ...dimensions.map((dimension) => ({
        alias: dimension.alias,
        type: "dimension" as const,
        displayName: dimension.displayName,
        businessName: dimension.businessName,
      })),
      ...normalMetrics.map((metric) => ({
        alias: metric.alias,
        type: "metric" as const,
        displayName: metric.displayName,
        businessName: metric.businessName,
      })),
      ...periodMetrics.map((metric) => ({
        alias: metric.alias,
        type: "metric" as const,
        displayName: metric.displayName,
        businessName: metric.businessName,
      })),
    ];
  }
}
