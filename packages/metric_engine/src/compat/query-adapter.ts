import { Query, Dimension } from "../query/query-builder";
import { Filter, TimeFilter } from "../query/filter";
import { Join, JoinCondition } from "../core/join";
import { QuerySpec, JoinSpec, OrderBySpec } from "../sql/types";
import {
  Expr,
  FieldRefExpr,
  BinaryExpr,
  ComparisonExpr,
  AggExpr,
  LiteralExpr,
  CallExpr,
  BinaryOperator,
  ComparisonOperator,
} from "../expr";
import { MetricAdapter } from "./metric-adapter";
import { Field } from "../core/field";
import { Metric } from "../metrics/metric-classes";
import { Operator } from "../core/types";

/**
 * 查询适配器类
 * 用于将旧的 Query 对象转换为新的 QuerySpec 格式
 * 提供静态方法实现从旧查询模型到新查询规格的完整转换
 */
export class QueryAdapter {
  /**
   * 将旧 Query 转换为新 QuerySpec
   * 这是主要的转换入口方法，负责协调整个转换过程
   * @param query 要转换的旧查询对象
   * @returns 转换后的新查询规格对象
   */
  static toQuerySpec(query: Query): QuerySpec {
    // 转换主表信息
    const from = QueryAdapter.convertFrom(query);

    // 转换 JOIN 列表
    const joins = QueryAdapter.convertJoins(query.joins);

    // 转换维度列表
    const dimensions = QueryAdapter.convertDimensions(query.dimensions);

    // 转换指标列表
    const metrics = QueryAdapter.convertMetrics(query.metrics);

    // 转换过滤条件列表
    const filters = QueryAdapter.convertFilters(query.filters);

    // 构建并返回完整的 QuerySpec 对象
    const querySpec: QuerySpec = {
      from,
      joins,
      dimensions,
      metrics,
      filters,
    };

    // 如果存在分页限制，添加到 QuerySpec
    if (query.limit !== undefined) {
      querySpec.limit = query.limit;
    }

    // 如果存在偏移量，添加到 QuerySpec
    if (query.offset !== undefined) {
      querySpec.offset = query.offset;
    }

    return querySpec;
  }

  /**
   * 转换主表信息
   * 从 Query 对象中提取主表的表名和别名
   * @param query 查询对象
   * @returns 包含表名和别名的对象
   */
  private static convertFrom(query: Query): { table: string; alias: string } {
    // 获取主表对象
    const mainTable = query.mainTable;

    // 返回表名和别名
    // 如果表有别名则使用别名，否则使用表名作为别名
    return {
      table: mainTable.name,
      alias: mainTable.alias || mainTable.name,
    };
  }

  /**
   * 转换 JOIN 列表
   * 将旧的 Join 对象数组转换为新的 JoinSpec 数组
   * @param joins 旧的 Join 对象数组
   * @returns 转换后的 JoinSpec 数组
   */
  private static convertJoins(joins: Join[]): JoinSpec[] {
    // 如果没有 JOIN，返回空数组
    if (!joins || joins.length === 0) {
      return [];
    }

    // 遍历每个 JOIN 对象进行转换
    return joins.map((join) => {
      // 将连接条件转换为表达式
      // 多个条件之间使用 AND 连接
      const onExpr = QueryAdapter.convertJoinConditions(join.conditions, join);

      // 构建 JoinSpec 对象
      const joinSpec: JoinSpec = {
        // 将连接类型转换为小写字符串
        type: join.type.toLowerCase() as "left" | "inner" | "right",
        // 获取右表名称
        table: join.rightTable.name,
        // 获取右表别名，如果没有则使用表名
        alias: join.rightTable.alias || join.rightTable.name,
        // 连接条件表达式
        on: onExpr,
      };

      return joinSpec;
    });
  }

  /**
   * 转换连接条件列表为表达式
   * 将多个连接条件合并为一个表达式
   * @param conditions 连接条件数组
   * @param join 所属的 Join 对象
   * @returns 转换后的表达式
   */
  private static convertJoinConditions(
    conditions: JoinCondition[],
    join: Join,
  ): Expr {
    // 如果只有一个条件，直接返回该条件的表达式
    if (conditions.length === 1) {
      return QueryAdapter.convertSingleJoinCondition(conditions[0], join);
    }

    // 如果有多个条件，使用 AND 连接
    // 注意：AND 连接使用 BinaryExpr，因为它是逻辑运算而非比较运算
    let result: Expr = QueryAdapter.convertSingleJoinCondition(conditions[0], join);

    // 遍历剩余条件，逐个用 AND 连接
    for (let i = 1; i < conditions.length; i++) {
      const nextCondition = QueryAdapter.convertSingleJoinCondition(
        conditions[i],
        join,
      );
      // 创建 AND 二元表达式（逻辑运算）
      result = new BinaryExpr("AND" as BinaryOperator, result, nextCondition);
    }

    return result;
  }

  /**
   * 转换单个连接条件为表达式
   * @param condition 连接条件对象
   * @param join 连接对象
   * @returns 转换后的比较表达式
   */
  private static convertSingleJoinCondition(
    condition: JoinCondition,
    join: Join,
  ): ComparisonExpr {
    // 创建左表字段引用表达式
    // 使用左表的别名（如果有）作为表别名
    const leftField = new FieldRefExpr(
      condition.leftField,
      join.leftTable.name,
      join.leftTable.alias,
    );

    // 创建右表字段引用表达式
    // 使用右表的别名（如果有）作为表别名
    const rightField = new FieldRefExpr(
      condition.rightField,
      join.rightTable.name,
      join.rightTable.alias,
    );

    // 将运算符转换为 ComparisonOperator 类型
    // 连接条件通常使用等号，但也支持其他运算符
    const operator = QueryAdapter.convertJoinOperator(condition.operator);

    // 创建比较表达式表示连接条件
    return new ComparisonExpr(operator, leftField, rightField);
  }

  /**
   * 转换连接条件运算符
   * 将字符串运算符转换为 ComparisonOperator 类型
   * @param operator 运算符字符串
   * @returns ComparisonOperator 类型的运算符
   */
  private static convertJoinOperator(operator: string): ComparisonOperator {
    // 连接条件的运算符映射
    // 目前主要支持等号连接
    const operatorMap: Record<string, ComparisonOperator> = {
      "=": "=",
      "==": "=",
    };

    // 返回映射后的运算符，如果不在映射中则原样返回
    return operatorMap[operator] || (operator as ComparisonOperator);
  }

  /**
   * 转换维度列表
   * 将 Dimension 对象数组转换为 FieldRefExpr 表达式数组
   * @param dimensions 维度对象数组
   * @returns 转换后的表达式数组
   */
  private static convertDimensions(dimensions: Dimension[]): Expr[] {
    // 如果没有维度，返回空数组
    if (!dimensions || dimensions.length === 0) {
      return [];
    }

    // 遍历每个维度对象进行转换
    return dimensions.map((dimension) => {
      // 获取维度字段
      const field = dimension.field;

      // 创建字段引用表达式
      // 包含字段名、表名和表别名信息
      const fieldRefExpr = new FieldRefExpr(
        field.name,
        undefined, // 表名在维度中通常不直接指定
        field.alias, // 使用字段别名作为表别名
        {
          // 传递元数据信息
          alias: dimension.alias || field.alias,
          businessName: field.businessName,
          description: field.description,
        },
      );

      return fieldRefExpr;
    });
  }

  /**
   * 转换指标列表
   * 使用 MetricAdapter 将 Metric 对象数组转换为 Expr 表达式数组
   * @param metrics 指标对象数组
   * @returns 转换后的表达式数组
   */
  private static convertMetrics(metrics: Metric[]): Expr[] {
    // 如果没有指标，返回空数组
    if (!metrics || metrics.length === 0) {
      return [];
    }

    // 使用 MetricAdapter 的批量转换方法
    return MetricAdapter.toExprList(metrics);
  }

  /**
   * 转换过滤条件列表
   * 将 Filter 对象数组转换为 Expr 表达式数组
   * @param filters 过滤条件对象数组
   * @returns 转换后的表达式数组
   */
  private static convertFilters(filters: Filter[]): Expr[] {
    // 如果没有过滤条件，返回空数组
    if (!filters || filters.length === 0) {
      return [];
    }

    // 遍历每个过滤条件进行转换
    return filters.map((filter) => {
      // 检查是否是时间过滤器
      if (filter instanceof TimeFilter) {
        // 时间过滤器需要特殊处理
        return QueryAdapter.convertTimeFilter(filter);
      }

      // 普通过滤器使用标准转换
      return QueryAdapter.convertSingleFilter(filter);
    });
  }

  /**
   * 转换单个过滤条件为表达式
   * 将 Filter 对象转换为 BinaryExpr 或 CallExpr
   * @param filter 过滤条件对象
   * @returns 转换后的表达式
   */
  private static convertSingleFilter(filter: Filter): Expr {
    // 获取过滤字段或指标
    const field = filter.field;

    // 创建左侧表达式
    let leftExpr: Expr;
    if (field instanceof Field) {
      // 如果是字段，创建字段引用表达式
      leftExpr = new FieldRefExpr(field.name, undefined, field.alias, {
        alias: field.alias,
        businessName: field.businessName,
        description: field.description,
      });
    } else if (field instanceof Metric) {
      // 如果是指标，使用 MetricAdapter 转换
      leftExpr = MetricAdapter.toExpr(field);
    } else {
      // 不支持的字段类型
      throw new Error(`不支持的过滤字段类型: ${typeof field}`);
    }

    // 创建右侧表达式（过滤值）
    const rightExpr = QueryAdapter.createFilterValueExpr(filter.value);

    // 转换运算符
    const operator = QueryAdapter.convertFilterOperator(filter.operator);

    // 根据运算符类型创建不同的表达式
    // 对于 IS NULL 和 IS NOT NULL，不需要右侧表达式
    if (filter.operator === Operator.IS_NULL) {
      // IS NULL 使用特殊的调用表达式
      return new CallExpr("IS_NULL", [leftExpr]);
    } else if (filter.operator === Operator.IS_NOT_NULL) {
      // IS NOT NULL 使用特殊的调用表达式
      return new CallExpr("IS_NOT_NULL", [leftExpr]);
    } else if (
      filter.operator === Operator.IN ||
      filter.operator === Operator.NOT_IN
    ) {
      // IN 和 NOT IN 使用调用表达式
      const functionName = filter.operator === Operator.IN ? "IN" : "NOT_IN";
      // 如果值是数组，创建多个字面量表达式
      const args: Expr[] = [leftExpr];
      if (Array.isArray(filter.value)) {
        // 将数组中的每个值转换为字面量表达式
        const valueExprs = filter.value.map((v) => new LiteralExpr(v));
        args.push(...valueExprs);
      } else {
        args.push(rightExpr);
      }
      return new CallExpr(functionName, args);
    }

    // 对于普通比较运算符，创建二元表达式
    return new BinaryExpr(operator, leftExpr, rightExpr);
  }

  /**
   * 转换时间过滤器为表达式
   * TimeFilter 需要特殊处理，因为它包含时间范围信息
   * @param filter 时间过滤器对象
   * @returns 转换后的表达式
   */
  private static convertTimeFilter(filter: TimeFilter): Expr {
    // 获取时间字段
    const field = filter.field;

    // 确保字段是 Field 类型
    if (!(field instanceof Field)) {
      throw new Error("时间过滤器的字段必须是 Field 类型");
    }

    // 创建字段引用表达式
    const fieldExpr = new FieldRefExpr(field.name, undefined, field.alias, {
      alias: field.alias,
      businessName: field.businessName,
      description: field.description,
    });

    // 根据时间范围类型创建不同的表达式
    // 这里简化处理，创建一个调用表达式表示时间过滤
    // 实际实现可能需要根据具体的数据库方言生成不同的 SQL
    return new CallExpr("TIME_FILTER", [
      fieldExpr,
      new LiteralExpr(filter.timeRange),
      new LiteralExpr(filter.timeValue),
      new LiteralExpr(filter.startDate),
      new LiteralExpr(filter.endDate),
    ]);
  }

  /**
   * 创建过滤值的表达式
   * 根据值的类型创建相应的表达式对象
   * @param value 过滤值
   * @returns 表达式对象
   */
  private static createFilterValueExpr(value: any): Expr {
    // 处理 null 值
    if (value === null) {
      return new LiteralExpr(null);
    }

    // 处理数组值（用于 IN 操作符）
    if (Array.isArray(value)) {
      // 数组值通常在 convertSingleFilter 中处理
      // 这里返回第一个元素的值
      return new LiteralExpr(value[0]);
    }

    // 处理原始 SQL 表达式对象
    if (value && typeof value === "object" && value.rawSql) {
      // 对于原始 SQL，创建一个调用表达式
      return new CallExpr("RAW_SQL", [new LiteralExpr(value.rawSql)]);
    }

    // 处理子查询字符串
    if (
      typeof value === "string" &&
      value.trim().toUpperCase().startsWith("(SELECT") &&
      value.trim().endsWith(")")
    ) {
      // 子查询作为原始 SQL 处理
      return new CallExpr("RAW_SQL", [new LiteralExpr(value)]);
    }

    // 处理普通值（字符串、数字、布尔值、日期等）
    if (typeof value === "string") {
      return new LiteralExpr(value);
    } else if (typeof value === "number") {
      return new LiteralExpr(value);
    } else if (typeof value === "boolean") {
      return new LiteralExpr(value);
    } else if (value instanceof Date) {
      return new LiteralExpr(value.toISOString());
    }

    // 其他类型直接作为字面量
    return new LiteralExpr(value);
  }

  /**
   * 转换过滤运算符
   * 将 Operator 枚举转换为 BinaryOperator 类型
   * @param operator 运算符枚举值
   * @returns BinaryOperator 类型的运算符
   */
  private static convertFilterOperator(operator: Operator): BinaryOperator {
    // 定义运算符映射关系
    // 注意：BinaryOperator 主要用于算术运算
    // 对于比较运算符，我们需要扩展 BinaryOperator 类型或使用其他方式
    const operatorMap: Record<Operator, string> = {
      [Operator.EQUALS]: "=",
      [Operator.NOT_EQUALS]: "!=",
      [Operator.GREATER_THAN]: ">",
      [Operator.LESS_THAN]: "<",
      [Operator.GREATER_EQUAL]: ">=",
      [Operator.LESS_EQUAL]: "<=",
      [Operator.LIKE]: "LIKE",
      [Operator.IN]: "IN",
      [Operator.NOT_IN]: "NOT IN",
      [Operator.IS_NULL]: "IS NULL",
      [Operator.IS_NOT_NULL]: "IS NOT NULL",
      [Operator.AND]: "AND",
      [Operator.OR]: "OR",
      [Operator.PLUS]: "+",
      [Operator.MINUS]: "-",
      [Operator.MULTIPLY]: "*",
      [Operator.DIVIDE]: "/",
    };

    // 返回映射后的运算符
    return operatorMap[operator] as BinaryOperator;
  }
}
