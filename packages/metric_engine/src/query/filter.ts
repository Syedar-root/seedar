import { Field } from '../core/field';
import { Operator } from '../core/types';
import { Metric } from '../metrics/metric-classes';

/**
 * 时间范围类型枚举
 */
export enum TimeRange {
  RECENT_DAYS = 'recent_days',
  RECENT_WEEKS = 'recent_weeks',
  RECENT_MONTHS = 'recent_months',
  CUSTOM_DATE_RANGE = 'custom_date_range',
}

/**
 * 筛选器基类
 * 表示查询中的筛选条件
 */
export class Filter {
  /**
   * 筛选字段或指标
   */
  public readonly field: Field | Metric;

  /**
   * 运算符
   */
  public readonly operator: Operator;

  /**
   * 筛选值
   */
  public readonly value: any;

  constructor(field: Field | Metric, operator: Operator, value: any) {
    this.field = field;
    this.operator = operator;
    this.value = value;
  }

  toSQL(): string {
    let fieldExpr: string;
    if (this.field instanceof Field) {
      fieldExpr = this.field.getFullName();
    } else {
      fieldExpr = `(${this.field.toSQL()})`;
    }
    let valueStr: string;

    // 标准化运算符，确保使用正确的SQL运算符
    let sqlOperator: string = this.operator;
    if (typeof sqlOperator === 'string') {
      // 处理字符串形式的运算符
      switch (sqlOperator.toLowerCase()) {
        case 'greater_equal':
        case 'gte':
          sqlOperator = '>=';
          break;
        case 'less_equal':
        case 'lte':
          sqlOperator = '<=';
          break;
        case 'not_equals':
        case 'neq':
          sqlOperator = '!=';
          break;
        case 'equals':
        case 'eq':
          sqlOperator = '=';
          break;
        case 'greater_than':
        case 'gt':
          sqlOperator = '>';
          break;
        case 'less_than':
        case 'lt':
          sqlOperator = '<';
          break;
        case 'like':
          sqlOperator = 'LIKE';
          break;
        case 'in':
          sqlOperator = 'IN';
          break;
        case 'not_in':
          sqlOperator = 'NOT IN';
          break;
        case 'is_null':
          sqlOperator = 'IS NULL';
          break;
        case 'is_not_null':
          sqlOperator = 'IS NOT NULL';
          break;
        default:
          // 如果是其他字符串，直接使用
          break;
      }
    }

    if (sqlOperator === 'IN' || sqlOperator === 'NOT IN') {
      // 处理IN操作符
      if (Array.isArray(this.value)) {
        valueStr = `(${this.value.map((v) => this.formatValue(v)).join(', ')})`;
      } else {
        valueStr = `(${this.formatValue(this.value)})`;
      }
    } else if (sqlOperator === 'IS NULL' || sqlOperator === 'IS NOT NULL') {
      // NULL相关的操作符不需要值
      return `${fieldExpr} ${sqlOperator}`;
    } else {
      valueStr = this.formatValue(this.value);
    }

    return `${fieldExpr} ${sqlOperator} ${valueStr}`;
  }

  /**
   * 格式化值
   */
  private formatValue(value: any): string {
    // 支持原始SQL表达式
    if (value && typeof value === 'object' && value.rawSql) {
      return value.rawSql;
    }

    if (typeof value === 'string') {
      // 检测子查询：以(SELECT开头，以)结尾的字符串不加引号
      if (
        value.trim().toUpperCase().startsWith('(SELECT') &&
        value.trim().endsWith(')')
      ) {
        return value;
      }
      return `'${value}'`;
    } else if (value instanceof Date) {
      return `'${value.toISOString()}'`;
    } else if (value === null) {
      return 'NULL';
    } else {
      return value.toString();
    }
  }
}

/**
 * 时间过滤器类
 * 专门处理时间范围筛选的Filter子类
 */
export class TimeFilter extends Filter {
  /**
   * 时间范围类型
   */
  public readonly timeRange?: TimeRange;

  /**
   * 时间范围值（用于动态时间）
   */
  public readonly timeValue?: number;

  /**
   * 开始日期（用于自定义日期范围）
   */
  public readonly startDate?: string;

  /**
   * 结束日期（用于自定义日期范围）
   */
  public readonly endDate?: string;

  private constructor(
    field: Field,
    timeRange?: TimeRange,
    timeValue?: number,
    startDate?: string,
    endDate?: string
  ) {
    // 调用父类构造函数，传递null值，因为我们会在toSQL中自定义处理
    super(field, Operator.EQUALS, null);

    this.timeRange = timeRange;
    this.timeValue = timeValue;
    this.startDate = startDate;
    this.endDate = endDate;
  }

  /**
   * 创建动态时间范围过滤器（最近N天/周/月）
   */
  static createRecentFilter(
    field: Field,
    timeRange:
      | TimeRange.RECENT_DAYS
      | TimeRange.RECENT_WEEKS
      | TimeRange.RECENT_MONTHS,
    timeValue: number
  ): TimeFilter {
    return new TimeFilter(field, timeRange, timeValue);
  }

  /**
   * 创建自定义日期范围过滤器
   */
  static createDateRangeFilter(
    field: Field,
    startDate: string,
    endDate: string
  ): TimeFilter {
    return new TimeFilter(
      field,
      TimeRange.CUSTOM_DATE_RANGE,
      undefined,
      startDate,
      endDate
    );
  }

  /**
   * 生成时间过滤的SQL
   */
  toSQL(): string {
    let fieldExpr: string;
    if (this.field instanceof Field) {
      fieldExpr = this.field.getFullName();
    } else {
      fieldExpr = `(${this.field.toSQL()})`;
    }

    switch (this.timeRange) {
      case TimeRange.RECENT_DAYS:
        return `${fieldExpr} >= DATE_SUB(CURDATE(), INTERVAL ${this.timeValue} DAY)`;

      case TimeRange.RECENT_WEEKS:
        return `${fieldExpr} >= DATE_SUB(CURDATE(), INTERVAL ${this.timeValue} WEEK)`;

      case TimeRange.RECENT_MONTHS:
        return `${fieldExpr} >= DATE_SUB(CURDATE(), INTERVAL ${this.timeValue} MONTH)`;

      case TimeRange.CUSTOM_DATE_RANGE:
        if (!this.startDate || !this.endDate) {
          throw new Error('自定义日期范围需要同时指定startDate和endDate');
        }
        return `${fieldExpr} >= '${this.startDate}' AND ${fieldExpr} <= '${this.endDate}'`;

      default:
        throw new Error(`不支持的时间范围类型: ${this.timeRange}`);
    }
  }
}
