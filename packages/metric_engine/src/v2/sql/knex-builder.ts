import { Knex } from "knex";
import { QuerySpec, SQLResult, JoinSpec } from "./types";
import { Expr, AggLevel, PeriodComparisonExpr } from "../expr";
import { DatabaseDialect } from "../../core/types";
import { ExprAnalyzer } from "../expr/analyzer";
import { PeriodComparisonBuilder } from "./period-comparison-builder";

/**
 * Knex 查询构建器类
 * 使用 Knex 链式 API 将 QuerySpec 转换为 SQL 语句
 */
export class KnexQueryBuilder {
  /**
   * Knex 实例，用于构建 SQL 查询
   */
  private knex: Knex;

  /**
   * 构造函数
   * @param knex - Knex 实例，用于数据库查询构建
   */
  constructor(knex: Knex) {
    this.knex = knex;
  }

  /**
   * 根据查询规格构建 SQL 结果
   * 会自动判断是否需要使用 CTE（公共表表达式）
   * @param spec - 查询规格对象，包含完整的查询配置
   * @returns SQLResult - 包含 SQL 语句和参数绑定的结果对象
   */
  build(spec: QuerySpec): SQLResult {
    ExprAnalyzer.assertPeriodComparisonPlacement(spec);

    if (
      spec.metrics?.some((metric) => metric instanceof PeriodComparisonExpr)
    ) {
      return new PeriodComparisonBuilder(this.knex).build(spec);
    }

    // 检查是否需要使用 CTE（公共表表达式）
    if (this.needsCTE(spec)) {
      // 如果需要 CTE，使用带 CTE 的构建方法
      return this.buildWithCTE(spec);
    }
    // 否则使用简单构建方法
    return this.buildSimple(spec);
  }

  /**
   * 构建简单 SQL 查询（不使用 CTE）
   * 使用 Knex 链式 API 构建 SELECT 查询
   * @param spec - 查询规格对象
   * @returns SQLResult - 包含 SQL 语句和参数绑定的结果对象
   */
  private buildSimple(spec: QuerySpec): SQLResult {
    // 创建查询构建器，设置 FROM 子句
    // 使用 `${table} as ${alias}` 格式设置主表及其别名
    const qb = this.knex(`${spec.from.table} as ${spec.from.alias}`);

    // 收集列映射信息
    const columnMappings: Array<{
      alias: string;
      type: "dimension" | "metric";
      displayName: string;
      businessName?: string;
    }> = [];

    // 添加 SELECT 列
    // 维度字段直接添加到选择列表
    if (spec.dimensions && spec.dimensions.length > 0) {
      spec.dimensions.forEach((dim, index) => {
        // 确定 SQL 列名：优先使用 alias，其次用字段名
        const isFieldDim = this.isFieldRefExpr(dim);
        // 确定显示名：优先使用 businessName，其次用 alias
        const expressionSql = isFieldDim
          ? dim?.getQualifiedName()
          : this.buildExpr(dim);
        const dimensionAlias = isFieldDim
          ? dim.meta?.alias
          : this.requireExpressionDimensionAlias(dim, index);
        const sqlAlias = dimensionAlias || expressionSql;
        const displayName =
          dim.meta?.businessName || dimensionAlias || expressionSql;

        if (dimensionAlias) {
          qb.select(this.knex.raw(`${expressionSql} as ??`, [dimensionAlias]));
        } else {
          qb.select(expressionSql);
        }
        columnMappings.push({
          alias: sqlAlias,
          type: "dimension",
          displayName,
          businessName: dim.meta?.businessName,
        });
      });
    }

    // 指标字段添加到选择列表
    if (spec.metrics && spec.metrics.length > 0) {
      spec.metrics.forEach((metric) => {
        // 确定 SQL 列名：优先使用 alias
        const sqlAlias =
          metric.meta?.alias || metric.name || this.buildExpr(metric);
        // 确定显示名：优先使用 businessName，其次用 alias
        const displayName =
          metric.meta?.businessName ||
          metric.meta?.alias ||
          metric.name ||
          this.buildExpr(metric);

        if (metric.meta?.alias) {
          // 使用 raw 避免 Knex 给带括号的表达式添加反引号
          qb.select(
            this.knex.raw(`${this.buildExpr(metric)} as ??`, [
              metric.meta.alias,
            ]),
          );
        } else {
          qb.select(this.buildExpr(metric));
        }
        columnMappings.push({
          alias: sqlAlias,
          type: "metric",
          displayName,
          businessName: metric.meta?.businessName,
        });
      });
    }

    // 添加 JOIN 连接
    if (spec.joins && spec.joins.length > 0) {
      spec.joins.forEach((join: JoinSpec) => {
        // 根据连接类型获取对应的 Knex 方法名
        const joinMethod = this.getJoinMethod(join.type);
        // 构建 ON 条件的 SQL 字符串
        const onClause = this.buildExpr(join.on);
        // 使用 Knex 的 join 方法添加表连接
        // 使用 raw 方法添加原始 SQL 条件
        const knexInstance = this.knex;
        (qb as any)[joinMethod](`${join.table} as ${join.alias}`, function () {
          this.on(knexInstance.raw(onClause));
        });
      });
    }

    // 添加 WHERE 过滤条件
    if (spec.filters && spec.filters.length > 0) {
      spec.filters.forEach((filter) => {
        // 将过滤条件添加到 WHERE 子句
        qb.whereRaw(this.buildExpr(filter));
      });
    }

    // 添加 GROUP BY 分组
    if (spec.dimensions && spec.dimensions.length > 0) {
      spec.dimensions.forEach((dim) => {
        if (this.isFieldRefExpr(dim)) {
          qb.groupBy(dim.getQualifiedName());
          return;
        }
        qb.groupByRaw(this.buildExpr(dim));
      });
    }

    // 添加 ORDER BY 排序
    if (spec.orderBy && spec.orderBy.length > 0) {
      spec.orderBy.forEach((order) => {
        // 获取排序表达式，可能是字段名或复杂表达式
        const orderExpr =
          typeof order.expr === "string"
            ? order.expr
            : this.buildExpr(order.expr);
        // 根据排序方向添加排序规则
        qb.orderBy(orderExpr, order.dir);
      });
    }

    // 添加 LIMIT 限制
    if (spec.limit !== undefined && spec.limit !== null) {
      qb.limit(spec.limit);
    }

    // 添加 OFFSET 偏移量（用于分页）
    if (spec.offset !== undefined && spec.offset !== null) {
      qb.offset(spec.offset);
    }

    // 获取最终的 SQL 和参数绑定
    const sqlResult = qb.toSQL();
    return {
      sql: sqlResult.sql,
      bindings: [...sqlResult.bindings],
      columnMappings,
    };
  }

  /**
   * 构建带 CTE（公共表表达式）的 SQL 查询
   * 用于处理包含 Partial 聚合层级指标的复杂查询
   * 参考 V1 版本使用自动生成的列别名避免列名重复
   * CTE 中需要包含：维度字段 + 指标引用的所有字段
   * @param spec - 查询规格对象
   * @returns SQLResult - 包含 SQL 语句和参数绑定的结果对象
   */
  private buildWithCTE(spec: QuerySpec): SQLResult {
    // 创建基础查询构建器
    const qb = this.knex.queryBuilder();

    // 构建 CTE（公共表表达式）
    // 使用自动生成的列别名避免列名重复
    const cteQueryBuilder = this.knex(
      `${spec.from.table} as ${spec.from.alias}`,
    );

    // 列别名计数器
    let colIdx = 1;
    const columnAliasMap = new Map<string, string>();
    const fieldAliasSet = new Set<string>(); // 用于去重

    // 收集列映射信息
    const columnMappings: Array<{
      alias: string;
      type: "dimension" | "metric";
      displayName: string;
      businessName?: string;
    }> = [];

    // 添加 JOIN 连接到 CTE
    if (spec.joins && spec.joins.length > 0) {
      const knexInstance = this.knex;
      spec.joins.forEach((join: JoinSpec) => {
        const joinMethod = this.getJoinMethod(join.type);
        const onClause = this.buildExpr(join.on);
        (cteQueryBuilder as any)[joinMethod](
          `${join.table} as ${join.alias}`,
          function () {
            this.on(knexInstance.raw(onClause));
          },
        );
      });
    }

    // 构建 CTE 的 SELECT 列
    // CTE 必须包含：维度字段 + 指标引用的所有字段
    const cteSelectItems: any[] = [];
    const dimensionSelectAliases: string[] = [];
    const dimensionExprAliasMap = new Map<unknown, string>();

    const addFieldRefToCTE = (qualifiedName: string): void => {
      if (fieldAliasSet.has(qualifiedName)) {
        return;
      }
      const alias = `column_${colIdx}`;
      columnAliasMap.set(qualifiedName, alias);
      cteSelectItems.push(this.knex.raw(`${qualifiedName} AS ??`, [alias]));
      fieldAliasSet.add(qualifiedName);
      colIdx++;
    };

    // 1. 添加维度字段
    if (spec.dimensions && spec.dimensions.length > 0) {
      spec.dimensions.forEach((dim, index) => {
        if (this.isFieldRefExpr(dim)) {
          const qualifiedName = dim.getQualifiedName();
          addFieldRefToCTE(qualifiedName);
          const cteAlias = columnAliasMap.get(qualifiedName) || qualifiedName;
          dimensionSelectAliases.push(cteAlias);
          dimensionExprAliasMap.set(dim, cteAlias);
          return;
        }

        this.requireExpressionDimensionAlias(dim, index);
        const expressionSql = this.buildExpr(dim);
        const cteAlias = `column_${colIdx}`;
        cteSelectItems.push(
          this.knex.raw(`${expressionSql} AS ??`, [cteAlias]),
        );
        colIdx++;
        dimensionSelectAliases.push(cteAlias);
        dimensionExprAliasMap.set(dim, cteAlias);

        const dimFields = this.extractFieldsFromExpr(dim);
        dimFields.forEach((fieldRef) => {
          addFieldRefToCTE(fieldRef.getQualifiedName());
        });
      });
    }

    // 2. 提取并添加指标引用的字段
    if (spec.metrics && spec.metrics.length > 0) {
      spec.metrics.forEach((metric) => {
        const metricFields = this.extractFieldsFromExpr(metric);
        metricFields.forEach((fieldRef) => {
          addFieldRefToCTE(fieldRef.getQualifiedName());
        });
      });
    }

    // 添加 WHERE 过滤条件到 CTE
    if (spec.filters && spec.filters.length > 0) {
      spec.filters.forEach((filter) => {
        cteQueryBuilder.whereRaw(this.buildExpr(filter));
      });
    }

    // 应用 SELECT 列到 CTE
    cteQueryBuilder.select(cteSelectItems);

    // 使用 WITH 子句添加 CTE
    qb.with("base_cte", cteQueryBuilder);

    // 从 CTE 中选择数据
    qb.from("base_cte");

    // 添加外层 SELECT 列
    // 维度使用 CTE 列别名
    if (spec.dimensions && spec.dimensions.length > 0) {
      spec.dimensions.forEach((dim, index) => {
        const cteAlias = dimensionSelectAliases[index];
        // 确定 SQL 列名：优先使用 alias
        const dimensionAlias = this.isFieldRefExpr(dim)
          ? dim.meta?.alias
          : this.requireExpressionDimensionAlias(dim, index);
        const sqlAlias = dimensionAlias || cteAlias;
        // 确定显示名：优先使用 businessName
        const displayName =
          dim.meta?.businessName || dimensionAlias || cteAlias;

        if (dimensionAlias) {
          qb.select(`${cteAlias} as ${dimensionAlias}`);
        } else {
          qb.select(cteAlias);
        }
        columnMappings.push({
          alias: sqlAlias,
          type: "dimension",
          displayName,
          businessName: dim.meta?.businessName,
        });
      });
    }

    // 指标使用字段引用（会从 CTE 中读取）
    // 使用 Knex 链式方法避免聚合函数被反引号包住
    if (spec.metrics && spec.metrics.length > 0) {
      spec.metrics.forEach((metric) => {
        const alias = metric.meta?.alias || metric.name;
        // 确定显示名：优先使用 businessName
        const displayName =
          metric.meta?.businessName || metric.meta?.alias || metric.name;

        this.applyMetricSelect(qb, metric, alias, columnAliasMap);
        columnMappings.push({
          alias,
          type: "metric",
          displayName,
          businessName: metric.meta?.businessName,
        });
      });
    }

    // 添加 GROUP BY（使用 CTE 列别名）
    if (spec.dimensions && spec.dimensions.length > 0) {
      qb.groupBy(dimensionSelectAliases);
    }

    // 添加 ORDER BY
    if (spec.orderBy && spec.orderBy.length > 0) {
      spec.orderBy.forEach((order) => {
        let orderExpr: string;
        if (typeof order.expr === "string") {
          orderExpr = order.expr;
        } else {
          // 将排序表达式中的字段引用替换为 CTE 列别名
          orderExpr =
            dimensionExprAliasMap.get(order.expr) ||
            this.buildExprWithAlias(order.expr, columnAliasMap);
        }
        qb.orderBy(orderExpr, order.dir);
      });
    }

    // 添加 LIMIT 和 OFFSET
    if (spec.limit !== undefined && spec.limit !== null) {
      qb.limit(spec.limit);
    }

    if (spec.offset !== undefined && spec.offset !== null) {
      qb.offset(spec.offset);
    }

    const sqlResult = qb.toSQL();
    return {
      sql: sqlResult.sql,
      bindings: [...sqlResult.bindings],
      columnMappings,
    };
  }

  /**
   * 从表达式中提取所有字段引用
   * 用于收集指标表达式中使用的字段
   * @param expr - 表达式对象
   * @returns FieldRefExpr[] - 字段引用数组
   */
  private extractFieldsFromExpr(expr: any): any[] {
    const fields: any[] = [];
    this.collectFieldsFromExpr(expr, fields);
    return fields;
  }

  /**
   * 递归收集表达式中的字段引用
   * @param expr - 表达式对象
   * @param fields - 字段数组（输出参数）
   */
  private collectFieldsFromExpr(expr: any, fields: any[]): void {
    if (!expr) return;

    // 如果是字段引用
    if (expr.getQualifiedName && typeof expr.getQualifiedName === "function") {
      fields.push(expr);
      return;
    }

    // 如果是聚合表达式，递归处理参数
    if (expr.functionName && expr.arg) {
      this.collectFieldsFromExpr(expr.arg, fields);
      return;
    }

    // 如果是函数调用，递归处理参数
    if (expr.functionName && expr.args) {
      expr.args.forEach((arg: any) => this.collectFieldsFromExpr(arg, fields));
      return;
    }

    // 如果是二元运算，递归处理左右操作数
    if (expr.operator && expr.left) {
      this.collectFieldsFromExpr(expr.left, fields);
    }
    if (expr.operator && expr.right) {
      this.collectFieldsFromExpr(expr.right, fields);
    }

    // 如果是一元运算
    if (expr.operator && expr.operand) {
      this.collectFieldsFromExpr(expr.operand, fields);
    }

    // 处理条件表达式
    if (expr.condition !== undefined && expr.consequent !== undefined) {
      this.collectFieldsFromExpr(expr.condition, fields);
      this.collectFieldsFromExpr(expr.consequent, fields);
      if (expr.alternate !== undefined) {
        this.collectFieldsFromExpr(expr.alternate, fields);
      }
      return;
    }
  }

  /**
   * 构建表达式并将字段引用替换为 CTE 列别名
   * @param expr - 表达式对象
   * @param aliasMap - 字段名到 CTE 别名的映射
   * @returns string - 转换后的 SQL 表达式字符串
   */
  private buildExprWithAlias(expr: any, aliasMap: Map<string, string>): string {
    if (expr instanceof PeriodComparisonExpr) {
      throw new Error(
        "PeriodComparisonExpr must be handled by PeriodComparisonBuilder",
      );
    }

    // 如果是字段引用，替换为 CTE 别名
    if (expr.getQualifiedName && typeof expr.getQualifiedName === "function") {
      const qualifiedName = expr.getQualifiedName();
      return aliasMap.get(qualifiedName) || qualifiedName;
    }

    // 如果有 value 属性且没有其他属性（字面量）
    if (expr.value !== undefined && !expr.functionName && !expr.operator) {
      return typeof expr.value === "string"
        ? `'${expr.value}'`
        : String(expr.value);
    }

    // 处理聚合函数表达式
    if (expr.functionName && expr.arg !== undefined && !expr.args) {
      const argStr = this.buildExprWithAlias(expr.arg, aliasMap);
      // DISTINCT_COUNT 已经是去重计数语义，转换为 COUNT(DISTINCT ...)
      if (expr.functionName === "DISTINCT_COUNT") {
        return `COUNT(DISTINCT ${argStr})`;
      }
      if (expr.distinct) {
        return `${expr.functionName}(DISTINCT ${argStr})`;
      }
      return `${expr.functionName}(${argStr})`;
    }

    // 处理普通函数调用
    if (expr.functionName && expr.args) {
      if (expr.functionName === "TIME_GRAIN") {
        return this.buildTimeGrainSQL(expr.args, (arg) =>
          this.buildExprWithAlias(arg, aliasMap),
        );
      }

      const argsStr = expr.args
        .map((arg: any) => this.buildExprWithAlias(arg, aliasMap))
        .join(", ");
      return `${expr.functionName}(${argsStr})`;
    }

    // 处理二元运算表达式
    if (expr.operator && expr.left && expr.right) {
      const leftStr = this.buildExprWithAlias(expr.left, aliasMap);
      const rightStr = this.buildExprWithAlias(expr.right, aliasMap);

      // 转换运算符：== -> =, <> -> !=
      let sqlOperator = expr.operator;
      if (sqlOperator === "==") {
        sqlOperator = "=";
      }

      // 给二元运算添加括号，避免 SQL 解析问题
      return `(${leftStr}) ${sqlOperator} (${rightStr})`;
    }

    // 处理一元运算表达式
    if (expr.operator && expr.operand) {
      const operandStr = this.buildExprWithAlias(expr.operand, aliasMap);
      return `${expr.operator}${operandStr}`;
    }

    // 处理条件表达式 (ConditionalExpr)
    if (
      expr.condition !== undefined &&
      expr.consequent !== undefined &&
      expr.alternate !== undefined
    ) {
      const condStr = this.buildExprWithAlias(expr.condition, aliasMap);
      const consStr = this.buildExprWithAlias(expr.consequent, aliasMap);
      const altStr = this.buildExprWithAlias(expr.alternate, aliasMap);

      // 如果 alternate 是 null 字面量，生成不带 ELSE 的 CASE WHEN
      if (expr.alternate.value !== undefined && expr.alternate.value === null) {
        return `CASE WHEN ${condStr} THEN ${consStr} END`;
      }
      return `CASE WHEN ${condStr} THEN ${consStr} ELSE ${altStr} END`;
    }

    // 处理 IN 表达式 (InExpr)
    if (
      expr.values !== undefined &&
      Array.isArray(expr.values) &&
      expr.expr !== undefined
    ) {
      const leftStr = this.buildExprWithAlias(expr.expr, aliasMap);
      const valuesStr = expr.values
        .map((v: any) => this.buildExprWithAlias(v, aliasMap))
        .join(", ");
      const op = expr.negated ? "NOT IN" : "IN";
      return `${leftStr} ${op} (${valuesStr})`;
    }

    // 处理 BETWEEN 表达式 (BetweenExpr)
    if (
      expr.low !== undefined &&
      expr.high !== undefined &&
      expr.expr !== undefined
    ) {
      const exprStr = this.buildExprWithAlias(expr.expr, aliasMap);
      const lowStr = this.buildExprWithAlias(expr.low, aliasMap);
      const highStr = this.buildExprWithAlias(expr.high, aliasMap);
      const op = expr.negated ? "NOT BETWEEN" : "BETWEEN";
      return `${exprStr} ${op} ${lowStr} AND ${highStr}`;
    }

    // 处理 LIKE 表达式 (LikeExpr)
    if (
      expr.pattern !== undefined &&
      expr.expr !== undefined &&
      expr.values === undefined
    ) {
      const leftStr = this.buildExprWithAlias(expr.expr, aliasMap);
      const patternStr = this.buildExprWithAlias(expr.pattern, aliasMap);
      const op = expr.negated ? "NOT LIKE" : "LIKE";
      return `${leftStr} ${op} ${patternStr}`;
    }

    // 处理 IS NULL 表达式 (IsNullExpr)
    if (
      expr.negated !== undefined &&
      expr.expr !== undefined &&
      expr.values === undefined &&
      expr.pattern === undefined &&
      expr.low === undefined
    ) {
      const exprStr = this.buildExprWithAlias(expr.expr, aliasMap);
      return expr.negated ? `${exprStr} IS NOT NULL` : `${exprStr} IS NULL`;
    }

    // 如果是字符串，直接返回
    if (typeof expr === "string") {
      return aliasMap.get(expr) || expr;
    }

    return "";
  }

  /**
   * 使用 Knex 链式方法添加指标 SELECT
   * 避免聚合函数被反引号包住
   * @param qb - Knex 查询构建器
   * @param metric - 指标表达式
   * @param alias - 别名
   * @param aliasMap - 字段名到 CTE 别名的映射
   */
  private applyMetricSelect(
    qb: any,
    metric: any,
    alias: string,
    aliasMap: Map<string, string>,
  ): void {
    // 检查是否是聚合函数表达式
    if (metric.functionName && metric.arg !== undefined && !metric.args) {
      const argStr = this.buildExprWithAlias(metric.arg, aliasMap);
      const distinct = metric.distinct;

      // 使用 qb.select() 配合 ?? 占位符来设置别名
      // ?? 会自动添加反引号
      switch (metric.functionName.toUpperCase()) {
        case "COUNT":
          if (distinct) {
            qb.select(
              this.knex.raw(`COUNT(DISTINCT ??) as ??`, [argStr, alias]),
            );
          } else {
            qb.select(this.knex.raw(`COUNT(??) as ??`, [argStr, alias]));
          }
          break;
        case "DISTINCT_COUNT":
          // DISTINCT_COUNT 已经是去重计数语义，直接转换为 COUNT(DISTINCT ...)
          qb.select(this.knex.raw(`COUNT(DISTINCT ??) as ??`, [argStr, alias]));
          break;
        case "SUM":
          qb.select(this.knex.raw(`SUM(??) as ??`, [argStr, alias]));
          break;
        case "AVG":
          qb.select(this.knex.raw(`AVG(??) as ??`, [argStr, alias]));
          break;
        case "MIN":
          qb.select(this.knex.raw(`MIN(??) as ??`, [argStr, alias]));
          break;
        case "MAX":
          qb.select(this.knex.raw(`MAX(??) as ??`, [argStr, alias]));
          break;
        default:
          // 其他函数
          qb.select(
            this.knex.raw(`${metric.functionName}(??) as ??`, [argStr, alias]),
          );
      }
      return;
    }

    // 处理非聚合函数的指标（如算术表达式）
    const metricSQL = this.buildExprWithAlias(metric, aliasMap);
    // 使用 raw 避免 Knex 给带括号的表达式添加反引号
    qb.select(this.knex.raw(`${metricSQL} as ??`, [alias]));
  }

  private isFieldRefExpr(expr: any): boolean {
    return !!(expr && typeof expr.getQualifiedName === "function");
  }

  private requireExpressionDimensionAlias(expr: any, index: number): string {
    const alias = expr?.meta?.alias;
    if (typeof alias !== "string" || alias.trim().length === 0) {
      throw new Error(
        `Expression dimension at index ${index} requires meta.alias`,
      );
    }
    return alias;
  }

  private buildTimeGrainSQL(
    args: any[],
    renderArg: (arg: any) => string,
  ): string {
    if (args.length !== 2) {
      throw new Error(
        "TIME_GRAIN requires exactly 2 arguments: fieldExpr, grain",
      );
    }

    const fieldExpr = renderArg(args[0]);
    const grain = this.normalizeTimeGrain(args[1]);

    if (DatabaseDialect.isClickHouse()) {
      switch (grain) {
        case "day":
          return `toDate(${fieldExpr})`;
        case "week":
          return `toStartOfWeek(${fieldExpr})`;
        case "month":
          return `toStartOfMonth(${fieldExpr})`;
        case "quarter":
          return `toStartOfQuarter(${fieldExpr})`;
        case "year":
          return `toStartOfYear(${fieldExpr})`;
      }
    }

    if (DatabaseDialect.isPostgres()) {
      return `DATE_TRUNC('${grain}', ${fieldExpr})`;
    }

    switch (grain) {
      case "day":
        return `DATE(${fieldExpr})`;
      case "week":
        return `DATE_FORMAT(${fieldExpr}, '%x-%v')`;
      case "month":
        return `DATE_FORMAT(${fieldExpr}, '%Y-%m')`;
      case "quarter":
        return `CONCAT(YEAR(${fieldExpr}), '-Q', QUARTER(${fieldExpr}))`;
      case "year":
        return `YEAR(${fieldExpr})`;
      default:
        throw new Error(`Invalid TIME_GRAIN grain: ${grain}`);
    }
  }

  private normalizeTimeGrain(
    grainArg: any,
  ): "day" | "week" | "month" | "quarter" | "year" {
    const rawValue = grainArg?.value ?? grainArg;
    if (typeof rawValue !== "string") {
      throw new Error(
        "Invalid TIME_GRAIN grain: grain must be a string literal",
      );
    }

    const normalized = rawValue.toLowerCase();
    if (normalized === "day" || normalized === "date") {
      return "day";
    }
    if (normalized === "week") {
      return "week";
    }
    if (normalized === "month") {
      return "month";
    }
    if (normalized === "quarter") {
      return "quarter";
    }
    if (normalized === "year") {
      return "year";
    }

    throw new Error(
      `Invalid TIME_GRAIN grain: ${rawValue}. Supported grains: day, date, week, month, quarter, year`,
    );
  }

  /**
   * 检查查询是否需要使用 CTE（公共表表达式）
   * 当指标中包含 Partial 聚合层级的表达式时需要使用 CTE
   * @param spec - 查询规格对象
   * @returns boolean - 是否需要使用 CTE
   */
  private needsCTE(spec: QuerySpec): boolean {
    // 遍历所有指标表达式
    if (spec.metrics && spec.metrics.length > 0) {
      for (const metric of spec.metrics) {
        // 检查指标是否为 Expr 实例且聚合层级为 Partial
        if (
          metric instanceof Expr &&
          ExprAnalyzer.getAggLevel(metric) === AggLevel.Partial
        ) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * 将连接类型转换为 Knex 方法名
   * @param type - 连接类型字符串（'left' | 'inner' | 'right'）
   * @returns string - 对应的 Knex 方法名
   */
  private getJoinMethod(type: string): string {
    // 根据连接类型映射到 Knex 的 join 方法名
    const joinMethodMap: Record<string, string> = {
      left: "leftJoin", // 左连接
      inner: "innerJoin", // 内连接
      right: "rightJoin", // 右连接
    };
    // 返回对应的方法名，如果类型不存在则默认使用左连接
    return joinMethodMap[type] || "leftJoin";
  }

  /**
   * 构建表达式为 SQL 字符串
   * 将 Expr 对象转换为可执行的 SQL 表达式字符串
   * @param expr - 表达式对象
   * @returns string - SQL 表达式字符串
   */
  private buildExpr(expr: any): string {
    if (expr instanceof PeriodComparisonExpr) {
      throw new Error(
        "PeriodComparisonExpr must be handled by PeriodComparisonBuilder",
      );
    }

    // 如果表达式有 getQualifiedName 方法（字段引用）
    if (expr.getQualifiedName && typeof expr.getQualifiedName === "function") {
      return expr.getQualifiedName();
    }

    // 如果表达式有 value 属性且没有其他属性（字面量）
    if (expr.value !== undefined && !expr.functionName && !expr.operator) {
      return typeof expr.value === "string"
        ? `'${expr.value}'`
        : String(expr.value);
    }

    // 处理聚合函数表达式 (AggExpr)
    // AggExpr 有 functionName 和 arg（单数），以及 distinct 属性
    if (expr.functionName && expr.arg !== undefined && !expr.args) {
      const argStr = this.buildExpr(expr.arg);

      // DISTINCT_COUNT 已经是"去重计数"语义，直接转换为 COUNT(DISTINCT ...)
      if (expr.functionName === "DISTINCT_COUNT") {
        return `COUNT(DISTINCT ${argStr})`;
      }

      if (expr.distinct) {
        return `${expr.functionName}(DISTINCT ${argStr})`;
      }
      return `${expr.functionName}(${argStr})`;
    }

    // 处理普通函数调用 (CallExpr)
    // CallExpr 有 functionName 和 args（复数）
    if (expr.functionName && expr.args) {
      // 兼容V1：特殊处理 TIME_FILTER 函数
      if (expr.functionName === "TIME_FILTER") {
        return this.buildTimeFilterSQL(expr.args);
      }
      if (expr.functionName === "TIME_GRAIN") {
        return this.buildTimeGrainSQL(expr.args, (arg) => this.buildExpr(arg));
      }

      const argsStr = expr.args
        .map((arg: any) => this.buildExpr(arg))
        .join(", ");
      return `${expr.functionName}(${argsStr})`;
    }

    // 处理二元运算表达式 (BinaryExpr, ComparisonExpr)
    if (expr.operator && expr.left && expr.right) {
      // 检查是否需要为子表达式添加括号
      // 如果子表达式也是二元表达式，需要添加括号以确保正确的运算顺序
      const leftNeedsParens = this.needsParens(
        expr.left,
        expr.operator,
        "left",
      );
      const rightNeedsParens = this.needsParens(
        expr.right,
        expr.operator,
        "right",
      );

      const leftStr = leftNeedsParens
        ? `(${this.buildExpr(expr.left)})`
        : this.buildExpr(expr.left);
      const rightStr = rightNeedsParens
        ? `(${this.buildExpr(expr.right)})`
        : this.buildExpr(expr.right);

      // 转换运算符：== -> =, <> -> !=
      let sqlOperator = expr.operator;
      if (sqlOperator === "==") {
        sqlOperator = "=";
      }

      return `${leftStr} ${sqlOperator} ${rightStr}`;
    }

    // 处理一元运算表达式 (UnaryExpr)
    if (expr.operator && expr.operand) {
      const operandStr = this.buildExpr(expr.operand);
      return `${expr.operator}${operandStr}`;
    }

    // 处理条件表达式 (ConditionalExpr)
    if (
      expr.condition !== undefined &&
      expr.consequent !== undefined &&
      expr.alternate !== undefined
    ) {
      const condStr = this.buildExpr(expr.condition);
      const consStr = this.buildExpr(expr.consequent);
      const altStr = this.buildExpr(expr.alternate);

      // 如果 alternate 是 null 字面量，生成不带 ELSE 的 CASE WHEN
      if (expr.alternate.value !== undefined && expr.alternate.value === null) {
        return `CASE WHEN ${condStr} THEN ${consStr} END`;
      }
      return `CASE WHEN ${condStr} THEN ${consStr} ELSE ${altStr} END`;
    }

    // 处理 IN 表达式 (InExpr)
    if (
      expr.values !== undefined &&
      Array.isArray(expr.values) &&
      expr.expr !== undefined
    ) {
      const leftStr = this.buildExpr(expr.expr);
      const valuesStr = expr.values
        .map((v: any) => this.buildExpr(v))
        .join(", ");
      const op = expr.negated ? "NOT IN" : "IN";
      return `${leftStr} ${op} (${valuesStr})`;
    }

    // 处理 BETWEEN 表达式 (BetweenExpr)
    if (
      expr.low !== undefined &&
      expr.high !== undefined &&
      expr.expr !== undefined
    ) {
      const exprStr = this.buildExpr(expr.expr);
      const lowStr = this.buildExpr(expr.low);
      const highStr = this.buildExpr(expr.high);
      const op = expr.negated ? "NOT BETWEEN" : "BETWEEN";
      return `${exprStr} ${op} ${lowStr} AND ${highStr}`;
    }

    // 处理 LIKE 表达式 (LikeExpr)
    if (
      expr.pattern !== undefined &&
      expr.expr !== undefined &&
      expr.values === undefined
    ) {
      const leftStr = this.buildExpr(expr.expr);
      const patternStr = this.buildExpr(expr.pattern);
      const op = expr.negated ? "NOT LIKE" : "LIKE";
      return `${leftStr} ${op} ${patternStr}`;
    }

    // 处理 IS NULL 表达式 (IsNullExpr)
    if (
      expr.negated !== undefined &&
      expr.expr !== undefined &&
      expr.values === undefined &&
      expr.pattern === undefined &&
      expr.low === undefined
    ) {
      const exprStr = this.buildExpr(expr.expr);
      return expr.negated ? `${exprStr} IS NOT NULL` : `${exprStr} IS NULL`;
    }

    // 如果是字符串，直接返回
    if (typeof expr === "string") {
      return expr;
    }

    // 默认返回空字符串
    return "";
  }

  /**
   * 检查表达式是否需要添加括号
   * 用于确保嵌套表达式的正确运算顺序
   * @param expr - 要检查的表达式
   * @param parentOp - 父表达式的运算符
   * @param position - 表达式在父表达式中的位置（'left' 或 'right'）
   * @returns boolean - 是否需要添加括号
   */
  private needsParens(
    expr: any,
    parentOp: string,
    position: "left" | "right",
  ): boolean {
    // 如果是聚合函数，需要括号（聚合函数作为二元运算的操作数时）
    if (expr.functionName && expr.arg !== undefined) {
      return true;
    }

    // 如果不是二元表达式，不需要括号
    if (!expr.operator || !expr.left || !expr.right) {
      return false;
    }

    // 运算符优先级定义（数值越大优先级越高）
    const precedence: Record<string, number> = {
      "*": 3,
      "/": 3,
      "+": 2,
      "-": 2,
      "=": 1,
      "==": 1,
      "!=": 1,
      "<>": 1,
      ">": 1,
      "<": 1,
      ">=": 1,
      "<=": 1,
      AND: 0,
      OR: 0,
    };

    const childOp = expr.operator;
    const parentPrecedence = precedence[parentOp] ?? 1;
    const childPrecedence = precedence[childOp] ?? 1;

    // 如果子表达式优先级低于父表达式，需要括号
    if (childPrecedence < parentPrecedence) {
      return true;
    }

    // 对于相同优先级，右侧表达式需要括号（左结合性）
    // 例如：a - (b - c) 需要括号，但 (a - b) - c 不需要
    if (childPrecedence === parentPrecedence && position === "right") {
      // 对于减法和除法，右侧相同优先级需要括号
      if (parentOp === "-" || parentOp === "/") {
        return true;
      }
    }

    return false;
  }

  /**
   * 构建 TIME_FILTER 函数的 SQL
   * 根据不同数据库方言生成正确的时间过滤 SQL
   * @param args TIME_FILTER 函数的参数 [field, timeRange, timeValue, startDate, endDate]
   * @returns 生成的 SQL 字符串
   */
  private buildTimeFilterSQL(args: any[]): string {
    if (args.length < 3) {
      throw new Error(
        "TIME_FILTER 需要至少3个参数: field, timeRange, timeValue",
      );
    }

    const fieldExpr = this.buildExpr(args[0]);
    const timeRange = args[1]?.value || args[1];
    const timeValue = args[2]?.value ?? args[2];
    const startDate = args[3]?.value ?? args[3];
    const endDate = args[4]?.value ?? args[4];

    const isPostgres = DatabaseDialect.isPostgres();
    const isClickHouse = DatabaseDialect.isClickHouse();

    switch (timeRange) {
      case "recent_days":
        if (isClickHouse) {
          return `${fieldExpr} >= today() - INTERVAL ${timeValue} DAY`;
        }
        if (isPostgres) {
          return `${fieldExpr} >= CURRENT_DATE - INTERVAL '${timeValue} day'`;
        }
        return `${fieldExpr} >= DATE_SUB(CURDATE(), INTERVAL ${timeValue} DAY)`;

      case "recent_weeks":
        if (isClickHouse) {
          return `${fieldExpr} >= today() - INTERVAL ${timeValue} WEEK`;
        }
        if (isPostgres) {
          return `${fieldExpr} >= CURRENT_DATE - INTERVAL '${timeValue} week'`;
        }
        return `${fieldExpr} >= DATE_SUB(CURDATE(), INTERVAL ${timeValue} WEEK)`;

      case "recent_months":
        if (isClickHouse) {
          return `${fieldExpr} >= today() - INTERVAL ${timeValue} MONTH`;
        }
        if (isPostgres) {
          return `${fieldExpr} >= CURRENT_DATE - INTERVAL '${timeValue} month'`;
        }
        return `${fieldExpr} >= DATE_SUB(CURDATE(), INTERVAL ${timeValue} MONTH)`;

      case "CUSTOM_DATE_RANGE":
        if (!startDate || !endDate) {
          throw new Error("CUSTOM_DATE_RANGE 需要指定 startDate 和 endDate");
        }
        return `${fieldExpr} >= '${startDate}' AND ${fieldExpr} <= '${endDate}'`;

      default:
        throw new Error(`不支持的时间范围类型: ${timeRange}`);
    }
  }
}
