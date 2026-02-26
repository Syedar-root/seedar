import {
  AggregateFunction,
  Operator,
  PeriodOverPeriodType,
  PeriodCalculationMode,
} from '../core/types';
import { Field } from '../core/field';

/**
 * 指标基类
 */
export abstract class Metric {
  /**
   * 指标名称
   */
  public readonly name: string;

  /**
   * 指标别名（可选）
   */
  public readonly alias?: string;

  /**
   * 指标描述（可选）
   */
  public readonly description?: string;

  /**
   * 业务名称
   */
  public readonly businessName?: string;

  constructor(
    name: string,
    alias?: string,
    description?: string,
    businessName?: string
  ) {
    this.name = name;
    this.alias = alias;
    this.description = description;
    this.businessName = businessName;
  }

  /**
   * 获取指标的显示名称
   */
  getDisplayName(): string {
    return this.alias || this.name;
  }

  /**
   * 抽象方法：转换为SQL表达式
   */
  abstract toSQL(): string;
}

/**
 * 行级指标
 * 同一条记录的不同字段进行运算
 */
export class RowLevelMetric extends Metric {
  /**
   * 运算表达式
   */
  public readonly expression: MetricExpression;

  constructor(
    name: string,
    expression: MetricExpression,
    alias?: string,
    description?: string
  ) {
    super(name, alias, description);
    this.expression = expression;
  }

  toSQL(): string {
    return this.expression.toSQL();
  }
}

/**
 * 聚合指标
 * 利用字段或者行级指标进行聚合计算
 */
/**
 * 聚合条件配置
 */
export interface AggregateCondition {
  /**
   * 时间字段（用于时间范围筛选）
   */
  timeField?: Field;

  /**
   * 时间范围类型
   */
  timeRange?:
    | 'recent_days'
    | 'recent_weeks'
    | 'recent_months'
    | 'custom_date_range';

  /**
   * 时间范围值（比如7表示最近7天）
   */
  timeValue?: number;

  /**
   * 自定义日期范围 - 开始日期（格式：YYYY-MM-DD 或 YYYY-MM-DD HH:mm:ss）
   */
  startDate?: string;

  /**
   * 自定义日期范围 - 结束日期（格式：YYYY-MM-DD 或 YYYY-MM-DD HH:mm:ss）
   */
  endDate?: string;

  /**
   * CASE WHEN 条件表达式
   * 比如: "access_time >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)"
   */
  caseCondition?: string;

  /**
   * 额外的WHERE条件
   */
  additionalFilter?: string;

  /**
   * 自定义SQL模板（可选，用于复杂计算）
   * 可以使用 {field} 作为字段占位符，{base_sql} 作为基础聚合SQL
   * 比如: "({base_sql} / (SELECT COUNT(*) FROM users)) * 100"
   */
  sqlTemplate?: string;
}

export class AggregateMetric extends Metric {
  /**
   * 聚合函数
   */
  public readonly function: AggregateFunction;

  /**
   * 被聚合的字段或指标
   */
  public readonly field: Field | RowLevelMetric;

  /**
   * 是否去重（用于COUNT DISTINCT）
   */
  public readonly distinct: boolean = false;

  /**
   * 聚合条件配置（可选，用于添加时间筛选、CASE条件等）
   */
  public readonly condition?: AggregateCondition;

  constructor(
    name: string,
    functionType: AggregateFunction,
    field: Field | RowLevelMetric,
    distinct: boolean = false,
    alias?: string,
    description?: string,
    condition?: AggregateCondition
  ) {
    super(name, alias, description);
    this.function = functionType;
    this.field = field;
    this.distinct = distinct;
    this.condition = condition;
  }

  toSQL(): string {
    console.log(this.field);
    const fieldExpr =
      this.field instanceof Field
        ? this.field.getFullName()
        : this.field.toSQL();

    let baseSql: string;
    let caseCondition = '';

    // 收集所有条件
    const conditions: string[] = [];

    // 添加时间条件
    const timeCondition = this.getTimeConditionSQL();
    if (timeCondition) {
      conditions.push(timeCondition);
    }

    // 添加CASE WHEN条件
    if (this.condition?.caseCondition) {
      conditions.push(this.condition.caseCondition);
    }

    // 合并所有条件
    if (conditions.length > 0) {
      caseCondition = conditions.join(' AND ');
      const caseFieldExpr = `CASE WHEN ${caseCondition} THEN ${fieldExpr} END`;

      // 特殊处理DISTINCT_COUNT
      if (this.function === AggregateFunction.DISTINCT_COUNT) {
        baseSql = `COUNT(DISTINCT ${caseFieldExpr})`;
      } else {
        const distinctStr = this.distinct ? 'DISTINCT ' : '';
        baseSql = `${this.function.toUpperCase()}(${distinctStr}${caseFieldExpr})`;
      }
    } else {
      // 没有条件，直接使用字段
      // 特殊处理DISTINCT_COUNT
      if (this.function === AggregateFunction.DISTINCT_COUNT) {
        baseSql = `COUNT(DISTINCT ${fieldExpr})`;
      } else {
        const distinctStr = this.distinct ? 'DISTINCT ' : '';
        baseSql = `${this.function.toUpperCase()}(${distinctStr}${fieldExpr})`;
      }
    }

    // 如果有自定义SQL模板，使用模板
    if (this.condition?.sqlTemplate) {
      return this.condition.sqlTemplate
        .replace('{field}', fieldExpr)
        .replace('{base_sql}', baseSql);
    }

    return baseSql;
  }

  /**
   * 获取时间条件SQL（如果配置了时间条件）
   * 这个方法主要用于在查询构建时生成WHERE子句
   */
  getTimeConditionSQL(): string | null {
    if (!this.condition?.timeField) {
      return null;
    }

    const timeFieldName = this.condition.timeField.getFullName();

    switch (this.condition.timeRange) {
      case 'recent_days':
        if (!this.condition.timeValue) return null;
        return `${timeFieldName} >= DATE_SUB(CURDATE(), INTERVAL ${this.condition.timeValue} DAY)`;
      case 'recent_weeks':
        if (!this.condition.timeValue) return null;
        return `${timeFieldName} >= DATE_SUB(CURDATE(), INTERVAL ${this.condition.timeValue} WEEK)`;
      case 'recent_months':
        if (!this.condition.timeValue) return null;
        return `${timeFieldName} >= DATE_SUB(CURDATE(), INTERVAL ${this.condition.timeValue} MONTH)`;
      case 'custom_date_range':
        if (!this.condition.startDate || !this.condition.endDate) {
          return null;
        }
        return `${timeFieldName} >= '${this.condition.startDate}' AND ${timeFieldName} <= '${this.condition.endDate}'`;
      default:
        return null;
    }
  }
}

/**
 * 后聚合指标
 * 对其他指标进行聚合运算
 */
export class PostAggregateMetric extends Metric {
  /**
   * 聚合函数
   */
  public readonly function: AggregateFunction;

  /**
   * 被聚合的指标
   */
  public readonly metric: Metric;

  /**
   * 是否去重
   */
  public readonly distinct: boolean = false;

  constructor(
    name: string,
    functionType: AggregateFunction,
    metric: Metric,
    distinct: boolean = false,
    alias?: string,
    description?: string
  ) {
    super(name, alias, description);
    this.function = functionType;
    this.metric = metric;
    this.distinct = distinct;
  }

  toSQL(): string {
    const distinctStr = this.distinct ? 'DISTINCT ' : '';
    return `${this.function.toUpperCase()}(${distinctStr}${this.metric.getDisplayName()})`;
  }
}

/**
 * 子查询指标
 * 支持复杂的子查询逻辑，用于实现高级聚合计算
 */
export class SubQueryMetric extends Metric {
  /**
   * 子查询SQL模板
   * 可以使用 {field_name} 占位符引用主查询中的字段
   * 例如: "SELECT COUNT(*) FROM related_table WHERE related_table.main_id = {id}"
   */
  public readonly subQueryTemplate: string;

  /**
   * 上下文字段映射
   * 将主查询中的字段名映射为子查询中使用的占位符
   * 例如: { main_id: 'id' } 表示主查询的 'id' 字段在子查询中用 {main_id} 引用
   */
  public readonly contextFieldMapping: Record<string, string>;

  /**
   * 子查询参数
   * 额外的静态参数，用于替换模板中的占位符
   */
  public readonly parameters?: Record<string, string | number>;

  constructor(
    name: string,
    subQueryTemplate: string,
    contextFieldMapping: Record<string, string> = {},
    parameters?: Record<string, string | number>,
    alias?: string,
    description?: string
  ) {
    super(name, alias, description);
    this.subQueryTemplate = subQueryTemplate;
    this.contextFieldMapping = contextFieldMapping;
    this.parameters = parameters;
  }

  /**
   * 生成子查询SQL（需要Query上下文信息）
   * 此方法在SQL生成器中被调用，会传入主查询的表别名信息
   */
  generateSubQuerySQL(queryContext: any): string {
    let sql = this.subQueryTemplate;

    // 替换上下文字段引用
    Object.entries(this.contextFieldMapping).forEach(
      ([placeholder, mainField]) => {
        // 查找主查询中对应字段的表别名
        const tableAlias = this.findFieldTableAlias(mainField, queryContext);
        if (tableAlias) {
          sql = sql.replace(
            new RegExp(`{${placeholder}}`, 'g'),
            `${tableAlias}.${mainField}`
          );
        } else {
          // 如果找不到表别名，假设字段在主表中
          sql = sql.replace(new RegExp(`{${placeholder}}`, 'g'), mainField);
        }
      }
    );

    // 替换静态参数
    if (this.parameters) {
      Object.entries(this.parameters).forEach(([key, value]) => {
        sql = sql.replace(new RegExp(`{${key}}`, 'g'), String(value));
      });
    }

    return sql;
  }

  /**
   * 查找字段对应的表别名
   * 注意：这里的字段查找是基于主查询上下文的，用于映射主查询字段到子查询
   */
  private findFieldTableAlias(
    fieldName: string,
    queryContext: any
  ): string | null {
    if (!queryContext) return null;

    // 首先检查主表
    if (
      queryContext.mainTable &&
      this.fieldExistsInTable(fieldName, queryContext.mainTable)
    ) {
      return queryContext.mainTable.alias;
    }

    // 然后检查JOIN表
    if (queryContext.joins) {
      for (const join of queryContext.joins) {
        if (
          join.rightTable &&
          this.fieldExistsInTable(fieldName, join.rightTable)
        ) {
          return join.rightTable.alias;
        }
      }
    }

    return null;
  }

  /**
   * 检查字段是否存在于表中
   */
  private fieldExistsInTable(fieldName: string, table: any): boolean {
    if (!table || !table.fields) return false;

    // 检查表是否有这个字段
    return table.fields.some((field: any) => field.name === fieldName);
  }

  toSQL(): string {
    // 这个方法主要用于显示和调试，实际的SQL生成在SQLGenerator中处理
    return `(${this.subQueryTemplate}) /* SubQueryMetric: ${this.name} */`;
  }
}

/**
 * 算术运算指标
 * 对指标进行加减乘除等算术运算
 */
export class ArithmeticMetric extends Metric {
  /**
   * 左操作数指标
   */
  public readonly leftMetric: Metric;

  /**
   * 运算符
   */
  public readonly operator: Operator;

  /**
   * 右操作数（指标或数值）
   */
  public readonly rightOperand: Metric | number;

  constructor(
    name: string,
    leftMetric: Metric,
    operator: Operator,
    rightOperand: Metric | number,
    alias?: string,
    description?: string
  ) {
    super(name, alias, description);
    this.leftMetric = leftMetric;
    this.operator = operator;
    this.rightOperand = rightOperand;
  }

  toSQL(): string {
    // Prefer to use full SQL of nested metrics/fields when available
    const leftSQL = (this.leftMetric as any)?.toSQL
      ? (this.leftMetric as any).toSQL()
      : (this.leftMetric as any)?.getFullName
      ? (this.leftMetric as any).getFullName()
      : String(this.leftMetric);

    const rightSQL = (this.rightOperand as any)?.toSQL
      ? (this.rightOperand as any).toSQL()
      : (this.rightOperand as any)?.getFullName
      ? (this.rightOperand as any).getFullName()
      : String(this.rightOperand);

    return `(${leftSQL} ${this.operator} ${rightSQL})`;
  }
}

/**
 * 同环比指标
 * 为任何指标添加同环比计算功能
 */
export class PeriodOverPeriodMetric extends Metric {
  /**
   * 原始指标
   */
  public readonly baseMetric: Metric;

  /**
   * 同环比类型
   */
  public readonly periodType: PeriodOverPeriodType;

  /**
   * 计算模式
   */
  public readonly calculationMode: PeriodCalculationMode;

  /**
   * 时间字段（用于确定时间周期）
   */
  public readonly timeField: Field;

  constructor(
    baseMetric: Metric,
    periodType: PeriodOverPeriodType,
    timeField: Field,
    calculationMode: PeriodCalculationMode = PeriodCalculationMode.PERCENTAGE,
    alias?: string,
    description?: string
  ) {
    // 自动生成名称和描述
    const periodName = `${baseMetric.name}_${periodType}`;
    const periodAlias =
      alias || `${baseMetric.getDisplayName()}_${periodType.toUpperCase()}`;
    const periodDesc =
      description ||
      `${baseMetric.getDisplayName()}的${PeriodOverPeriodMetric.getPeriodTypeDescription(
        periodType
      )}`;

    super(periodName, periodAlias, periodDesc);

    this.baseMetric = baseMetric;
    this.periodType = periodType;
    this.calculationMode = calculationMode;
    this.timeField = timeField;
  }

  /**
   * 获取周期类型的描述
   */
  private static getPeriodTypeDescription(
    periodType: PeriodOverPeriodType
  ): string {
    const descriptions: Record<PeriodOverPeriodType, string> = {
      [PeriodOverPeriodType.MONTH_OVER_MONTH]: '月环比',
      [PeriodOverPeriodType.YEAR_OVER_YEAR]: '年同比',
      [PeriodOverPeriodType.WEEK_OVER_WEEK]: '周环比',
      [PeriodOverPeriodType.QUARTER_OVER_QUARTER]: '季环比',
      [PeriodOverPeriodType.DAY_OVER_DAY]: '日环比',
    };
    return descriptions[periodType] || '同环比';
  }

  /**
   * 获取当前周期的时间表达式
   */
  getCurrentPeriodExpression(): string {
    // 这里返回当前周期的时间筛选条件
    // 实际实现中可能需要根据具体数据库语法调整
    return this.getPeriodExpression(0);
  }

  /**
   * 获取对比周期的时间表达式
   */
  getComparisonPeriodExpression(): string {
    // 这里返回对比周期的时间筛选条件
    return this.getPeriodExpression(this.getPeriodOffset());
  }

  /**
   * 获取周期偏移量
   */
  private getPeriodOffset(): number {
    switch (this.periodType) {
      case PeriodOverPeriodType.MONTH_OVER_MONTH:
        return -1; // 上个月
      case PeriodOverPeriodType.YEAR_OVER_YEAR:
        return -12; // 去年同期（12个月前）
      case PeriodOverPeriodType.WEEK_OVER_WEEK:
        return -1; // 上周
      case PeriodOverPeriodType.QUARTER_OVER_QUARTER:
        return -3; // 上季度（3个月前）
      case PeriodOverPeriodType.DAY_OVER_DAY:
        return -1; // 昨天
      default:
        return -1;
    }
  }

  /**
   * 获取指定偏移量的时间表达式
   */
  private getPeriodExpression(offset: number): string {
    const timeFieldName = this.timeField.getFullName();

    switch (this.periodType) {
      case PeriodOverPeriodType.MONTH_OVER_MONTH:
        if (offset === 0) {
          return `${timeFieldName} >= DATE_FORMAT(CURDATE(), '%Y-%m-01') AND ${timeFieldName} < DATE_FORMAT(DATE_ADD(CURDATE(), INTERVAL 1 MONTH), '%Y-%m-01')`;
        } else {
          return `${timeFieldName} >= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL ${Math.abs(
            offset
          )} MONTH), '%Y-%m-01') AND ${timeFieldName} < DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL ${
            Math.abs(offset) - 1
          } MONTH), '%Y-%m-01')`;
        }

      case PeriodOverPeriodType.YEAR_OVER_YEAR:
        if (offset === 0) {
          return `YEAR(${timeFieldName}) = YEAR(CURDATE())`;
        } else {
          return `YEAR(${timeFieldName}) = YEAR(DATE_SUB(CURDATE(), INTERVAL ${Math.abs(
            offset
          )} MONTH))`;
        }

      // 其他周期类型的实现可以类似扩展
      default:
        return `${timeFieldName} >= DATE_SUB(CURDATE(), INTERVAL ${Math.abs(
          offset
        )} DAY)`;
    }
  }

  toSQL(): string {
    // 同环比指标在SQLGenerator中特殊处理，这里返回占位符
    return `'PoP_${this.periodType}_${this.calculationMode}_${this.baseMetric.name}'`;
  }

  /**
   * 生成同环比计算的SQL表达式
   * 用于在SELECT子句中直接计算同环比
   */
  generatePeriodOverPeriodSQLExpression(tableAlias?: string): string {
    const timeFieldExpr = tableAlias
      ? `${tableAlias}.${this.timeField.name}`
      : this.timeField.name;

    // 生成当前周期和对比周期的聚合表达式
    const currentPeriodExpr = this.generatePeriodAggregationSQL(
      'current',
      tableAlias
    );
    const comparisonPeriodExpr = this.generatePeriodAggregationSQL(
      'comparison',
      tableAlias
    );

    // 根据计算模式生成最终表达式
    let popExpression: string;

    if (this.calculationMode === PeriodCalculationMode.PERCENTAGE) {
      // 只返回百分比
      popExpression = `CASE WHEN ${comparisonPeriodExpr} = 0 OR ${comparisonPeriodExpr} IS NULL
                         THEN NULL
                         ELSE ROUND(((${currentPeriodExpr} - ${comparisonPeriodExpr}) * 100.0 / ${comparisonPeriodExpr}), 2)
                         END`;
    } else if (this.calculationMode === PeriodCalculationMode.ABSOLUTE) {
      // 只返回绝对值差异
      popExpression = `(${currentPeriodExpr} - ${comparisonPeriodExpr})`;
    } else {
      // BOTH
      // 返回百分比和绝对值，用特殊分隔符连接
      const percentageExpr = `CASE WHEN ${comparisonPeriodExpr} = 0 OR ${comparisonPeriodExpr} IS NULL
                              THEN NULL
                              ELSE ROUND(((${currentPeriodExpr} - ${comparisonPeriodExpr}) * 100.0 / ${comparisonPeriodExpr}), 2)
                              END`;
      const absoluteExpr = `(${currentPeriodExpr} - ${comparisonPeriodExpr})`;
      popExpression = `CONCAT(COALESCE(${percentageExpr}, 'N/A'), '|', ${absoluteExpr})`;
    }

    return popExpression;
  }

  /**
   * 生成周期聚合的SQL表达式
   */
  private generatePeriodAggregationSQL(
    period: 'current' | 'comparison',
    tableAlias?: string
  ): string {
    const timeFieldExpr = tableAlias
      ? `${tableAlias}.${this.timeField.name}`
      : this.timeField.name;
    const baseFieldExpr = this.baseMetric.toSQL();

    // 生成时间筛选条件
    const timeCondition = this.generateTimeConditionSQL(period, timeFieldExpr);

    // 使用子查询或窗口函数计算指定周期的聚合值
    // 这里使用子查询方式，可以根据实际数据库优化为窗口函数

    return `(SELECT ${this.getAggregationSQL(baseFieldExpr)}
             FROM ${tableAlias || 't'}
             WHERE ${timeCondition})`;
  }

  /**
   * 生成时间条件的SQL
   */
  private generateTimeConditionSQL(
    period: 'current' | 'comparison',
    timeFieldExpr: string
  ): string {
    const offset = period === 'current' ? 0 : this.getPeriodOffset();

    // 使用日期函数生成时间范围条件
    // 这里简化为基本的日期计算，实际使用时可以根据数据库类型优化

    switch (this.periodType) {
      case PeriodOverPeriodType.MONTH_OVER_MONTH:
        if (offset === 0) {
          // 当前月
          return `DATE_FORMAT(${timeFieldExpr}, '%Y-%m') = DATE_FORMAT(CURDATE(), '%Y-%m')`;
        } else {
          // 上个月
          return `DATE_FORMAT(${timeFieldExpr}, '%Y-%m') = DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL ${Math.abs(
            offset
          )} MONTH), '%Y-%m')`;
        }

      case PeriodOverPeriodType.YEAR_OVER_YEAR:
        if (offset === 0) {
          // 今年
          return `YEAR(${timeFieldExpr}) = YEAR(CURDATE())`;
        } else {
          // 去年
          return `YEAR(${timeFieldExpr}) = YEAR(DATE_SUB(CURDATE(), INTERVAL ${Math.abs(
            offset
          )} YEAR))`;
        }

      case PeriodOverPeriodType.WEEK_OVER_WEEK:
        if (offset === 0) {
          // 本周
          return `YEARWEEK(${timeFieldExpr}, 1) = YEARWEEK(CURDATE(), 1)`;
        } else {
          // 上周
          return `YEARWEEK(${timeFieldExpr}, 1) = YEARWEEK(DATE_SUB(CURDATE(), INTERVAL ${Math.abs(
            offset
          )} WEEK), 1)`;
        }

      case PeriodOverPeriodType.QUARTER_OVER_QUARTER:
        if (offset === 0) {
          // 本季度
          return `CONCAT(YEAR(${timeFieldExpr}), '-', QUARTER(${timeFieldExpr})) = CONCAT(YEAR(CURDATE()), '-', QUARTER(CURDATE()))`;
        } else {
          // 上季度
          return `CONCAT(YEAR(${timeFieldExpr}), '-', QUARTER(${timeFieldExpr})) = CONCAT(YEAR(DATE_SUB(CURDATE(), INTERVAL ${Math.abs(
            offset
          )} MONTH)), '-', QUARTER(DATE_SUB(CURDATE(), INTERVAL ${Math.abs(
            offset
          )} MONTH)))`;
        }

      case PeriodOverPeriodType.DAY_OVER_DAY:
        if (offset === 0) {
          // 今天
          return `DATE(${timeFieldExpr}) = CURDATE()`;
        } else {
          // 前几天
          return `DATE(${timeFieldExpr}) = DATE_SUB(CURDATE(), INTERVAL ${Math.abs(
            offset
          )} DAY)`;
        }

      default:
        return `DATE(${timeFieldExpr}) = CURDATE()`;
    }
  }

  /**
   * 获取聚合函数的SQL
   */
  private getAggregationSQL(baseFieldExpr: string): string {
    // 从baseMetric中提取聚合逻辑
    // 这里需要根据实际的Metric类型生成正确的聚合SQL

    if (this.baseMetric.constructor.name === 'AggregateMetric') {
      const aggMetric = this.baseMetric as any;
      const distinctStr = aggMetric.distinct ? 'DISTINCT ' : '';

      switch (aggMetric.function) {
        case 'sum':
          return `SUM(${distinctStr}${baseFieldExpr})`;
        case 'count':
          return `COUNT(${distinctStr}${baseFieldExpr})`;
        case 'avg':
          return `AVG(${distinctStr}${baseFieldExpr})`;
        case 'max':
          return `MAX(${distinctStr}${baseFieldExpr})`;
        case 'min':
          return `MIN(${distinctStr}${baseFieldExpr})`;
        case 'distinct_count':
          return `COUNT(DISTINCT ${baseFieldExpr})`;
        default:
          return `SUM(${distinctStr}${baseFieldExpr})`;
      }
    }

    // 默认处理
    return `SUM(${baseFieldExpr})`;
  }

  /**
   * 获取同环比查询参数
   * 返回生成SQL所需的参数信息
   */
  getPeriodOverPeriodQueryParams(): {
    periodType: PeriodOverPeriodType;
    calculationMode: PeriodCalculationMode;
    timeField: Field;
    baseMetric: Metric;
    periodOffset: number;
    currentPeriodExpression: string;
    comparisonPeriodExpression: string;
  } {
    return {
      periodType: this.periodType,
      calculationMode: this.calculationMode,
      timeField: this.timeField,
      baseMetric: this.baseMetric,
      periodOffset: this.getPeriodOffset(),
      currentPeriodExpression: this.getCurrentPeriodExpression(),
      comparisonPeriodExpression: this.getComparisonPeriodExpression(),
    };
  }

  /**
   * 生成合并的同环比查询SQL
   */
  private generateCombinedQuerySQL(
    currentSQL: string,
    comparisonSQL: string
  ): string {
    // 这里需要根据实际需求生成合并查询
    // 这是一个简化的实现

    // 从当前查询中提取SELECT和FROM部分
    const selectMatch = currentSQL.match(/SELECT\s+(.+?)\s+FROM/i);
    const fromMatch = currentSQL.match(
      /FROM\s+(.+?)(?:\s+WHERE|\s+GROUP|\s+ORDER|\s+LIMIT|$)/i
    );

    if (!selectMatch || !fromMatch) {
      return currentSQL;
    }

    const selectClause = selectMatch[1];
    const fromClause = fromMatch[1];

    // 生成同环比计算的SELECT子句
    const popSelectClause = this.generatePopSelectClause(selectClause);

    return `SELECT ${popSelectClause} FROM (
  ${currentSQL.replace(
    /SELECT\s+(.+?)\s+FROM/i,
    'SELECT $1 as current_$1 FROM'
  )}
) current_data FULL OUTER JOIN (
  ${comparisonSQL.replace(
    /SELECT\s+(.+?)\s+FROM/i,
    'SELECT $1 as comparison_$1 FROM'
  )}
) comparison_data ON /* 连接条件 */ 1=1`;
  }

  /**
   * 生成同环比SELECT子句
   */
  private generatePopSelectClause(originalSelect: string): string {
    // 解析原始SELECT子句并生成同环比计算
    // 这是一个简化的实现

    const fields = originalSelect.split(',').map((field) => field.trim());
    const popFields: string[] = [];

    fields.forEach((field) => {
      // 为每个字段添加同环比计算
      const fieldName =
        field
          .split(/\s+AS\s+/i)
          .pop()
          ?.trim() || field;
      const currentField = `current_${fieldName}`;
      const comparisonField = `comparison_${fieldName}`;

      popFields.push(`${currentField} as ${fieldName}_current`);
      popFields.push(`${comparisonField} as ${fieldName}_previous`);

      if (
        this.calculationMode === PeriodCalculationMode.PERCENTAGE ||
        this.calculationMode === PeriodCalculationMode.BOTH
      ) {
        popFields.push(`CASE WHEN ${comparisonField} = 0 THEN NULL
                         ELSE ROUND(((${currentField} - ${comparisonField}) * 100.0 / ${comparisonField}), 2)
                         END as ${fieldName}_pop_percentage`);
      }

      if (
        this.calculationMode === PeriodCalculationMode.ABSOLUTE ||
        this.calculationMode === PeriodCalculationMode.BOTH
      ) {
        popFields.push(
          `(${currentField} - ${comparisonField}) as ${fieldName}_pop_absolute`
        );
      }
    });

    return popFields.join(', ');
  }
}

/**
 * 指标表达式
 * 表示指标的计算表达式
 */
export class MetricExpression {
  /**
   * 左操作数
   */
  public readonly left: Field | RowLevelMetric | number;

  /**
   * 运算符
   */
  public readonly operator: Operator;

  /**
   * 右操作数
   */
  public readonly right: Field | RowLevelMetric | number;

  constructor(
    left: Field | RowLevelMetric | number,
    operator: Operator,
    right: Field | RowLevelMetric | number
  ) {
    this.left = left;
    this.operator = operator;
    this.right = right;
  }

  toSQL(): string {
    const leftStr =
      this.left instanceof Field
        ? this.left.getFullName()
        : this.left instanceof Metric
        ? this.left.toSQL()
        : this.left.toString();

    const rightStr =
      this.right instanceof Field
        ? this.right.getFullName()
        : this.right instanceof Metric
        ? this.right.toSQL()
        : this.right.toString();

    return `(${leftStr} ${this.operator} ${rightStr})`;
  }
}
