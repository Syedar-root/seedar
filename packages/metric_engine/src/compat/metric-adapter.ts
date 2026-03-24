import {
  Metric,
  AggregateMetric,
  RowLevelMetric,
  ArithmeticMetric,
  PostAggregateMetric,
  MetricExpression,
} from '../metrics/metric-classes';
import { Field } from '../core/field';
import { Operator, AggregateFunction as OldAggregateFunction } from '../core/types';
import {
  Expr,
  AggExpr,
  BinaryExpr,
  FieldRefExpr,
  LiteralExpr,
  AggLevel,
  AggFuncName,
  BinaryOperator,
} from '../expr';

/**
 * 指标适配器类
 * 用于将旧的 Metric 对象转换为新的 Expr 表达式对象
 * 支持多种指标类型的转换，包括聚合指标、行级指标、算术指标和后聚合指标
 */
export class MetricAdapter {
  /**
   * 将旧 Metric 转换为新 Expr
   * 根据指标的具体类型，调用相应的转换方法进行转换
   * @param metric 要转换的旧指标对象
   * @returns 转换后的新表达式对象
   * @throws Error 如果指标类型不支持转换
   */
  static toExpr(metric: Metric): Expr {
    // 根据指标类型分发到具体的转换方法
    if (metric instanceof AggregateMetric) {
      // 聚合指标转换
      return MetricAdapter.convertAggregateMetric(metric);
    } else if (metric instanceof RowLevelMetric) {
      // 行级指标转换
      return MetricAdapter.convertRowLevelMetric(metric);
    } else if (metric instanceof ArithmeticMetric) {
      // 算术指标转换
      return MetricAdapter.convertArithmeticMetric(metric);
    } else if (metric instanceof PostAggregateMetric) {
      // 后聚合指标转换
      return MetricAdapter.convertPostAggregateMetric(metric);
    }

    // 不支持的指标类型，抛出错误
    throw new Error(`不支持的指标类型: ${metric.constructor.name}`);
  }

  /**
   * 批量转换指标列表为表达式列表
   * 遍历指标数组，逐个调用 toExpr 方法进行转换
   * @param metrics 要转换的指标数组
   * @returns 转换后的表达式数组
   */
  static toExprList(metrics: Metric[]): Expr[] {
    // 使用 map 方法批量转换所有指标
    return metrics.map((metric) => MetricAdapter.toExpr(metric));
  }

  /**
   * 转换聚合指标为聚合表达式
   * 将 AggregateMetric 的聚合函数和字段信息转换为 AggExpr
   * @param metric 聚合指标对象
   * @returns 转换后的聚合表达式
   */
  private static convertAggregateMetric(metric: AggregateMetric): AggExpr {
    // 将旧的聚合函数枚举转换为新的大写字符串格式
    const functionName = MetricAdapter.convertAggregateFunction(metric.function);

    // 解析被聚合的字段或行级指标
    let arg: Expr;
    if (metric.field instanceof Field) {
      // 如果是字段，创建字段引用表达式
      arg = new FieldRefExpr(
        metric.field.name,
        undefined,
        undefined,
        {
          alias: metric.field.alias,
          businessName: metric.field.businessName,
          description: metric.field.description,
        }
      );
    } else if (metric.field instanceof RowLevelMetric) {
      // 如果是行级指标，递归转换为表达式
      arg = MetricAdapter.convertRowLevelMetric(metric.field);
    } else {
      // 其他情况，抛出错误
      throw new Error(`不支持的聚合字段类型: ${typeof metric.field}`);
    }

    // 创建聚合表达式，设置去重标志和元数据
    const aggExpr = new AggExpr(functionName, arg, metric.distinct, {
      alias: metric.alias,
      businessName: metric.businessName,
      description: metric.description,
    });

    // 设置聚合级别为部分聚合
    aggExpr.aggLevel = AggLevel.Partial;

    return aggExpr;
  }

  /**
   * 转换行级指标为二元表达式
   * 将 RowLevelMetric 的表达式转换为 BinaryExpr
   * 行级指标表示同一行记录中不同字段之间的运算
   * @param metric 行级指标对象
   * @returns 转换后的二元表达式
   */
  private static convertRowLevelMetric(metric: RowLevelMetric): BinaryExpr {
    // 获取行级指标的表达式
    const expression = metric.expression;

    // 解析左操作数
    const left = MetricAdapter.resolveOperand(expression.left);

    // 解析右操作数
    const right = MetricAdapter.resolveOperand(expression.right);

    // 将旧的运算符枚举转换为新的运算符字符串
    const operator = MetricAdapter.convertOperator(expression.operator);

    // 创建二元表达式，设置元数据
    return new BinaryExpr(operator, left, right, {
      alias: metric.alias,
      businessName: metric.businessName,
      description: metric.description,
    });
  }

  /**
   * 转换算术指标为二元表达式
   * 将 ArithmeticMetric 的算术运算转换为 BinaryExpr
   * 算术指标表示对指标进行加减乘除等运算
   * @param metric 算术指标对象
   * @returns 转换后的二元表达式
   */
  private static convertArithmeticMetric(metric: ArithmeticMetric): BinaryExpr {
    // 解析左操作数（必须是指标）
    const left = MetricAdapter.toExpr(metric.leftMetric);

    // 解析右操作数（可以是指标或数字）
    const right = MetricAdapter.resolveOperand(metric.rightOperand);

    // 将旧的运算符枚举转换为新的运算符字符串
    const operator = MetricAdapter.convertOperator(metric.operator);

    // 创建二元表达式，设置元数据
    return new BinaryExpr(operator, left, right, {
      alias: metric.alias,
      businessName: metric.businessName,
      description: metric.description,
    });
  }

  /**
   * 转换后聚合指标为聚合表达式
   * 将 PostAggregateMetric 的聚合函数和指标转换为 AggExpr
   * 后聚合指标表示对已经聚合的结果再次进行聚合
   * @param metric 后聚合指标对象
   * @returns 转换后的聚合表达式
   */
  private static convertPostAggregateMetric(metric: PostAggregateMetric): AggExpr {
    // 将旧的聚合函数枚举转换为新的大写字符串格式
    const functionName = MetricAdapter.convertAggregateFunction(metric.function);

    // 将被聚合的指标转换为表达式
    const arg = MetricAdapter.toExpr(metric.metric);

    // 创建聚合表达式，设置去重标志和元数据
    const aggExpr = new AggExpr(functionName, arg, metric.distinct, {
      alias: metric.alias,
      businessName: metric.businessName,
      description: metric.description,
    });

    // 设置聚合级别为完全聚合（因为是对已聚合结果再次聚合）
    aggExpr.aggLevel = AggLevel.Full;

    return aggExpr;
  }

  /**
   * 解析操作数为表达式
   * 支持解析 Field、Metric 或数字类型的操作数
   * @param operand 要解析的操作数，可以是字段、指标或数字
   * @returns 解析后的表达式对象
   */
  private static resolveOperand(operand: any): Expr {
    // 如果操作数是字段类型
    if (operand instanceof Field) {
      // 创建字段引用表达式
      return new FieldRefExpr(
        operand.name,
        undefined,
        undefined,
        {
          alias: operand.alias,
          businessName: operand.businessName,
          description: operand.description,
        }
      );
    }

    // 如果操作数是指标类型（继承自 Metric）
    if (operand instanceof Metric) {
      // 递归调用 toExpr 进行转换
      return MetricAdapter.toExpr(operand);
    }

    // 如果操作数是数字类型
    if (typeof operand === 'number') {
      // 创建字面量表达式
      return new LiteralExpr(operand);
    }

    // 不支持的操作数类型，抛出错误
    throw new Error(`不支持的操作数类型: ${typeof operand}`);
  }

  /**
   * 将旧的聚合函数枚举转换为新的大写字符串格式
   * 用于兼容新旧两种聚合函数表示方式
   * @param func 旧的聚合函数枚举值
   * @returns 新的聚合函数字符串（大写）
   */
  private static convertAggregateFunction(func: OldAggregateFunction): AggFuncName {
    // 定义枚举值到字符串的映射关系
    const functionMap: Record<OldAggregateFunction, AggFuncName> = {
      [OldAggregateFunction.COUNT]: 'COUNT',
      [OldAggregateFunction.SUM]: 'SUM',
      [OldAggregateFunction.AVG]: 'AVG',
      [OldAggregateFunction.MAX]: 'MAX',
      [OldAggregateFunction.MIN]: 'MIN',
      [OldAggregateFunction.DISTINCT_COUNT]: 'DISTINCT_COUNT',
    };

    // 返回对应的字符串值
    return functionMap[func];
  }

  /**
   * 将旧的运算符枚举转换为新的运算符字符串
   * 用于兼容新旧两种运算符表示方式
   * @param op 旧的运算符枚举值
   * @returns 新的运算符字符串
   * @throws Error 如果运算符不是算术运算符
   */
  private static convertOperator(op: Operator): BinaryOperator {
    // 定义枚举值到字符串的映射关系
    const operatorMap: Record<Operator, BinaryOperator> = {
      [Operator.PLUS]: '+',
      [Operator.MINUS]: '-',
      [Operator.MULTIPLY]: '*',
      [Operator.DIVIDE]: '/',
      // 以下运算符不是二元算术运算符，抛出错误
      [Operator.EQUALS]: undefined as any,
      [Operator.NOT_EQUALS]: undefined as any,
      [Operator.GREATER_THAN]: undefined as any,
      [Operator.LESS_THAN]: undefined as any,
      [Operator.GREATER_EQUAL]: undefined as any,
      [Operator.LESS_EQUAL]: undefined as any,
      [Operator.LIKE]: undefined as any,
      [Operator.IN]: undefined as any,
      [Operator.NOT_IN]: undefined as any,
      [Operator.IS_NULL]: undefined as any,
      [Operator.IS_NOT_NULL]: undefined as any,
      [Operator.AND]: undefined as any,
      [Operator.OR]: undefined as any,
    };

    const result = operatorMap[op];

    // 如果映射结果为 undefined，说明不是算术运算符
    if (!result) {
      throw new Error(`不支持的运算符: ${op}，只支持算术运算符 (+, -, *, /)`);
    }

    return result;
  }
}
