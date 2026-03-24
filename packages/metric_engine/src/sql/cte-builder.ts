import { Knex } from 'knex';
import { QuerySpec, SQLResult } from './types';
import { Expr, AggLevel, BinaryExpr, AggExpr, FieldRefExpr, LiteralExpr } from '../expr';
import { ExprAnalyzer } from '../expr/analyzer';

/**
 * CTE（Common Table Expression，公共表表达式）构建器
 *
 * 用于处理包含部分聚合表达式的查询场景，将聚合操作分离到 CTE 中执行。
 * 这种设计可以处理类似 "SUM(amount) * COUNT(id)" 这样的复杂表达式，
 * 其中聚合函数需要先在 CTE 中计算，然后在外层查询中进行组合运算。
 *
 * 典型使用场景：
 * - 指标表达式中包含多个聚合函数的组合运算
 * - 需要在聚合结果上进行二次计算的场景
 */
export class CTEBuilder {
  /**
   * Knex 查询构建器实例
   * 用于生成数据库无关的 SQL 语句
   */
  private knex: Knex;

  /**
   * 构造函数
   *
   * @param knex - Knex 实例，用于构建 SQL 查询
   */
  constructor(knex: Knex) {
    this.knex = knex;
  }

  /**
   * 构建带 CTE 的 SQL 查询
   *
   * 该方法将查询规格转换为带 WITH 子句的 SQL 语句，
   * 将聚合表达式分离到 inner CTE 中执行，
   * 在 outer 查询中引用 CTE 结果进行后续计算。
   *
   * @param spec - 查询规格，包含数据源、维度、指标等信息
   * @returns SQL 结果对象，包含 SQL 语句和参数绑定数组
   */
  buildWithCTE(spec: QuerySpec): SQLResult {
    // CTE 名称，用于在 outer 查询中引用
    const cteName = 'inner_metrics';

    // 存储所有 inner 层的聚合表达式
    const allInnerAggs: AggExpr[] = [];
    // 存储所有 outer 层的表达式（聚合已替换为字段引用）
    const outerMetrics: Expr[] = [];

    // 遍历所有指标表达式，分离 inner 和 outer 层
    for (const metricExpr of spec.metrics) {
      // 使用类型断言确保表达式类型正确
      const expr = metricExpr as Expr;

      // 分析表达式的聚合层级
      const aggLevel = ExprAnalyzer.getAggLevel(expr);

      if (aggLevel === AggLevel.Partial) {
        // 部分聚合：需要提取聚合子表达式到 CTE
        const { inner, outer } = this.extractAggregations(expr);
        // 收集所有聚合表达式
        allInnerAggs.push(...inner);
        // 收集替换后的 outer 表达式
        outerMetrics.push(outer);
      } else if (aggLevel === AggLevel.Full) {
        // 完全聚合：直接作为 inner 层表达式
        if (expr instanceof AggExpr) {
          // 克隆并设置别名
          const aggExpr = expr.clone() as AggExpr;
          if (!aggExpr.meta) {
            aggExpr.meta = {};
          }
          aggExpr.meta.alias = `agg_${allInnerAggs.length}`;
          allInnerAggs.push(aggExpr);
          // outer 层用字段引用替换
          const fieldRef = new FieldRefExpr(aggExpr.meta.alias!);
          outerMetrics.push(fieldRef);
        } else {
          // 其他完全聚合表达式（如 MetricRefExpr），直接传递到 outer
          outerMetrics.push(expr);
        }
      } else {
        // 无聚合：直接传递到 outer 层
        outerMetrics.push(expr);
      }
    }

    // 构建 inner CTE 的 SQL
    const innerSQL = this.buildInnerCTE(spec, allInnerAggs);

    // 构建 outer 查询的 SQL
    const outerSQL = this.buildOuterQuery(spec, outerMetrics, cteName);

    // 组合完整的 CTE SQL
    const fullSQL = `WITH ${cteName} AS (\n${innerSQL}\n)\n${outerSQL}`;

    return {
      sql: fullSQL,
      bindings: []
    };
  }

  /**
   * 从混合表达式中提取聚合子表达式
   *
   * 遍历表达式树，找出所有聚合函数（如 SUM、COUNT 等），
   * 将它们提取到 inner 数组中，并用字段引用替换原位置，
   * 从而实现聚合与非聚合部分的分离。
   *
   * @param expr - 待处理的表达式
   * @returns 包含 inner（聚合表达式数组）和 outer（替换后的表达式）的对象
   */
  private extractAggregations(expr: Expr): { inner: AggExpr[]; outer: Expr } {
    // 存储提取出的聚合表达式
    const inner: AggExpr[] = [];

    /**
     * 递归处理表达式，提取聚合子表达式
     *
     * @param currentExpr - 当前处理的表达式节点
     * @returns 替换聚合表达式后的新表达式
     */
    function process(currentExpr: Expr): Expr {
      // 聚合表达式：提取并用字段引用替换
      if (currentExpr instanceof AggExpr) {
        // 生成唯一的聚合表达式别名
        const alias = `agg_${inner.length}`;

        // 克隆聚合表达式并设置别名元数据
        const aggExpr = currentExpr.clone() as AggExpr;
        if (!aggExpr.meta) {
          aggExpr.meta = {};
        }
        aggExpr.meta.alias = alias;

        // 将聚合表达式添加到 inner 数组
        inner.push(aggExpr);

        // 创建字段引用表达式，用于在 outer 层引用该聚合结果
        const fieldRef = new FieldRefExpr(alias);
        fieldRef.aggLevel = AggLevel.Full;
        return fieldRef;
      }

      // 二元运算表达式：递归处理左右操作数
      if (currentExpr instanceof BinaryExpr) {
        const newLeft = process(currentExpr.left);
        const newRight = process(currentExpr.right);
        // 创建新的二元表达式，保持原有运算符和元数据
        return new BinaryExpr(currentExpr.operator, newLeft, newRight, currentExpr.meta);
      }

      // 字面量表达式：无需处理，直接返回
      if (currentExpr instanceof LiteralExpr) {
        return currentExpr;
      }

      // 字段引用表达式：无需处理，直接返回
      if (currentExpr instanceof FieldRefExpr) {
        return currentExpr;
      }

      // 其他类型的表达式：默认直接返回
      // 注意：如果需要支持更多表达式类型，可以在此扩展
      return currentExpr;
    }

    // 处理表达式并返回结果
    const outer = process(expr);
    return { inner, outer };
  }

  /**
   * 构建 inner CTE 的 SQL 语句
   *
   * inner CTE 负责执行基础聚合操作，包括：
   * - 选择维度字段
   * - 计算聚合指标
   * - 按维度分组
   *
   * @param spec - 查询规格
   * @param innerMetrics - inner 层的聚合表达式数组
   * @returns inner CTE 的 SQL 语句字符串
   */
  private buildInnerCTE(spec: QuerySpec, innerMetrics: AggExpr[]): string {
    // 使用 Knex 构建查询
    const query = this.knex.queryBuilder();

    // 构建维度选择列表
    const dimensionSelects: string[] = [];
    for (let i = 0; i < spec.dimensions.length; i++) {
      const dim = spec.dimensions[i];
      // 维度使用 column_1, column_2 等别名
      const alias = `column_${i + 1}`;
      // 将维度表达式转换为 SQL 片段
      const dimExpr = this.exprToSQL(dim as Expr);
      dimensionSelects.push(`${dimExpr} as ${alias}`);
    }

    // 构建聚合指标选择列表
    const metricSelects: string[] = [];
    for (const aggExpr of innerMetrics) {
      // 获取聚合表达式的别名
      const alias = aggExpr.meta?.alias || `agg_${metricSelects.length}`;
      // 将聚合表达式转换为 SQL 片段
      const aggSQL = this.aggExprToSQL(aggExpr);
      metricSelects.push(`${aggSQL} as ${alias}`);
    }

    // 合并维度和指标选择列表
    const allSelects = [...dimensionSelects, ...metricSelects];

    // 设置主表
    query.from(`${spec.from.table} as ${spec.from.alias}`);

    // 添加表连接
    for (const join of spec.joins) {
      const joinOnSQL = this.exprToSQL(join.on as Expr);
      switch (join.type) {
        case 'left':
          query.leftJoin(`${join.table} as ${join.alias}`, this.knex.raw(joinOnSQL));
          break;
        case 'inner':
          query.innerJoin(`${join.table} as ${join.alias}`, this.knex.raw(joinOnSQL));
          break;
        case 'right':
          query.rightJoin(`${join.table} as ${join.alias}`, this.knex.raw(joinOnSQL));
          break;
      }
    }

    // 添加过滤条件
    for (const filter of spec.filters) {
      const filterSQL = this.exprToSQL(filter as Expr);
      query.whereRaw(filterSQL);
    }

    // 构建完整的 SELECT 子句
    // 注意：Knex 的 select 方法不支持直接设置别名，所以使用 raw 方式
    const selectClause = allSelects.join(',\n  ');

    // 构建 GROUP BY 子句
    const groupByColumns = dimensionSelects.map((_, i) => `column_${i + 1}`);
    const groupByClause = groupByColumns.length > 0 ? `\nGROUP BY ${groupByColumns.join(', ')}` : '';

    // 组装完整的 inner CTE SQL
    const innerSQL = `SELECT\n  ${selectClause}\nFROM ${spec.from.table} ${spec.from.alias}${groupByClause}`;

    return innerSQL;
  }

  /**
   * 构建 outer 查询的 SQL 语句
   *
   * outer 查询负责从 CTE 中读取数据，并进行后续计算：
   * - 选择维度字段（引用 CTE 列）
   * - 计算组合指标（基于 CTE 中的聚合结果）
   * - 应用排序和分页
   *
   * @param spec - 查询规格
   * @param outerMetrics - outer 层的表达式数组
   * @param cteName - CTE 名称，用于引用
   * @returns outer 查询的 SQL 语句字符串
   */
  private buildOuterQuery(spec: QuerySpec, outerMetrics: Expr[], cteName: string): string {
    // 使用 Knex 构建查询
    const query = this.knex.queryBuilder();

    // 构建维度选择列表
    const dimensionSelects: string[] = [];
    for (let i = 0; i < spec.dimensions.length; i++) {
      const dim = spec.dimensions[i];
      // 获取维度的业务名称或别名
      const dimExpr = dim as Expr;
      const alias = dimExpr.meta?.alias || dimExpr.meta?.businessName || `column_${i + 1}`;
      // 引用 CTE 中的维度列
      dimensionSelects.push(`column_${i + 1} as ${alias}`);
    }

    // 构建指标选择列表
    const metricSelects: string[] = [];
    for (let i = 0; i < outerMetrics.length; i++) {
      const metricExpr = outerMetrics[i];
      // 获取指标的业务名称或别名
      const originalMetric = spec.metrics[i] as Expr;
      const alias = originalMetric.meta?.alias || originalMetric.meta?.businessName || `metric_${i + 1}`;
      // 将 outer 表达式转换为 SQL
      const metricSQL = this.exprToSQL(metricExpr);
      metricSelects.push(`${metricSQL} as ${alias}`);
    }

    // 合并维度和指标选择列表
    const allSelects = [...dimensionSelects, ...metricSelects];

    // 设置 CTE 为数据源
    query.from(cteName);

    // 构建完整的 SELECT 子句
    const selectClause = allSelects.join(',\n  ');

    // 添加排序条件
    let orderByClause = '';
    if (spec.orderBy && spec.orderBy.length > 0) {
      const orderParts = spec.orderBy.map(order => {
        const orderExpr = this.exprToSQL(order.expr as Expr);
        return `${orderExpr} ${order.dir.toUpperCase()}`;
      });
      orderByClause = `\nORDER BY ${orderParts.join(', ')}`;
    }

    // 添加分页限制
    let limitClause = '';
    if (spec.limit !== undefined) {
      limitClause = `\nLIMIT ${spec.limit}`;
      if (spec.offset !== undefined) {
        limitClause += ` OFFSET ${spec.offset}`;
      }
    }

    // 组装完整的 outer 查询 SQL
    const outerSQL = `SELECT\n  ${selectClause}\nFROM ${cteName}${orderByClause}${limitClause}`;

    return outerSQL;
  }

  /**
   * 将表达式转换为 SQL 字符串
   *
   * 递归处理各种类型的表达式，生成对应的 SQL 片段。
   * 支持字段引用、字面量、二元运算、聚合函数等表达式类型。
   *
   * @param expr - 待转换的表达式
   * @returns SQL 字符串片段
   */
  private exprToSQL(expr: Expr): string {
    // 字面量表达式：根据值类型生成 SQL
    if (expr instanceof LiteralExpr) {
      if (expr.value === null) {
        return 'NULL';
      }
      if (typeof expr.value === 'string') {
        // 字符串值需要用单引号包裹，并转义内部单引号
        return `'${expr.value.replace(/'/g, "''")}'`;
      }
      // 数字和布尔值直接返回
      return String(expr.value);
    }

    // 字段引用表达式：生成带表别名的字段名
    if (expr instanceof FieldRefExpr) {
      return expr.getQualifiedName();
    }

    // 二元运算表达式：递归处理操作数并组合
    if (expr instanceof BinaryExpr) {
      const leftSQL = this.exprToSQL(expr.left);
      const rightSQL = this.exprToSQL(expr.right);
      // 使用括号确保运算优先级正确
      return `(${leftSQL} ${expr.operator} ${rightSQL})`;
    }

    // 聚合表达式：生成聚合函数调用
    if (expr instanceof AggExpr) {
      return this.aggExprToSQL(expr);
    }

    // 默认情况：返回空字符串
    // 注意：如果遇到未知表达式类型，可能需要扩展此方法
    return '';
  }

  /**
   * 将聚合表达式转换为 SQL 字符串
   *
   * 生成聚合函数调用的 SQL，支持 DISTINCT 关键字。
   * 例如：SUM(amount)、COUNT(DISTINCT user_id) 等。
   *
   * @param aggExpr - 聚合表达式
   * @returns 聚合函数的 SQL 字符串
   */
  private aggExprToSQL(aggExpr: AggExpr): string {
    // 获取聚合函数参数的 SQL
    const argSQL = this.exprToSQL(aggExpr.arg);

    // 获取聚合函数名称
    const funcName = aggExpr.functionName.toUpperCase();

    // 处理 DISTINCT_COUNT 特殊情况
    if (funcName === 'DISTINCT_COUNT') {
      return `COUNT(DISTINCT ${argSQL})`;
    }

    // 处理带 DISTINCT 的聚合函数
    if (aggExpr.distinct) {
      return `${funcName}(DISTINCT ${argSQL})`;
    }

    // 普通聚合函数
    return `${funcName}(${argSQL})`;
  }
}
