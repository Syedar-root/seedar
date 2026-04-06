import { AggLevel } from './types';
import {
  Expr,
  LiteralExpr,
  FieldRefExpr,
  MetricRefExpr,
  AggExpr,
  BinaryExpr,
  CallExpr,
  UnaryExpr,
  ConditionalExpr,
  SelectExpr,
  InExpr,
  BetweenExpr,
  LikeExpr,
  IsNullExpr
} from './ast';

/**
 * 表达式分析器类
 * 提供静态方法用于分析表达式的聚合层级、提取聚合子表达式等操作
 */
export class ExprAnalyzer {
  /**
   * 分析表达式的聚合层级
   * 根据表达式的类型和结构确定其聚合状态
   *
   * @param expr - 待分析的表达式
   * @returns 聚合层级枚举值（None/Partial/Full）
   */
  static getAggLevel(expr: Expr): AggLevel {
    // 字面量表达式：无聚合，表示常量值
    if (expr instanceof LiteralExpr) {
      return AggLevel.None;
    }

    // 字段引用表达式：无聚合，直接引用数据表字段
    if (expr instanceof FieldRefExpr) {
      return AggLevel.None;
    }

    // 聚合表达式：完全聚合，聚合函数的结果是标量值
    if (expr instanceof AggExpr) {
      return AggLevel.Full;
    }

    // 指标引用表达式：完全聚合，引用的指标通常是已经聚合的结果
    if (expr instanceof MetricRefExpr) {
      return AggLevel.Full;
    }

    // 二元运算表达式：需要递归分析左右操作数的聚合层级
    if (expr instanceof BinaryExpr) {
      // 获取左操作数的聚合层级
      const leftLevel = this.getAggLevel(expr.left);
      // 获取右操作数的聚合层级
      const rightLevel = this.getAggLevel(expr.right);

      // 两边都是完全聚合 → 结果为完全聚合
      if (leftLevel === AggLevel.Full && rightLevel === AggLevel.Full) {
        return AggLevel.Full;
      }

      // 两边都无聚合 → 结果无聚合
      if (leftLevel === AggLevel.None && rightLevel === AggLevel.None) {
        return AggLevel.None;
      }

      // 其他情况（一边聚合一边不聚合）→ 部分聚合
      return AggLevel.Partial;
    }

    // 一元运算表达式：递归分析操作数的聚合层级
    if (expr instanceof UnaryExpr) {
      return this.getAggLevel(expr.operand);
    }

    // 函数调用表达式：分析所有参数的聚合层级
    if (expr instanceof CallExpr) {
      // 如果没有参数，则无聚合
      if (expr.args.length === 0) {
        return AggLevel.None;
      }

      // 分析所有参数的聚合层级
      const argLevels = expr.args.map(arg => this.getAggLevel(arg));

      // 如果所有参数都是完全聚合，则结果为完全聚合
      if (argLevels.every(level => level === AggLevel.Full)) {
        return AggLevel.Full;
      }

      // 如果所有参数都无聚合，则结果无聚合
      if (argLevels.every(level => level === AggLevel.None)) {
        return AggLevel.None;
      }

      // 其他情况为部分聚合
      return AggLevel.Partial;
    }

    // 条件表达式：分析条件、结果和替代值的聚合层级
    if (expr instanceof ConditionalExpr) {
      const condLevel = this.getAggLevel(expr.condition);
      const consLevel = this.getAggLevel(expr.consequent);
      const altLevel = this.getAggLevel(expr.alternate);

      // 所有部分都是完全聚合 → 完全聚合
      if (condLevel === AggLevel.Full && consLevel === AggLevel.Full && altLevel === AggLevel.Full) {
        return AggLevel.Full;
      }

      // 所有部分都无聚合 → 无聚合
      if (condLevel === AggLevel.None && consLevel === AggLevel.None && altLevel === AggLevel.None) {
        return AggLevel.None;
      }

      // 其他情况为部分聚合
      return AggLevel.Partial;
    }

    // 选择表达式：分析所有 case 和默认值的聚合层级
    if (expr instanceof SelectExpr) {
      // 收集所有值的聚合层级
      const allLevels: AggLevel[] = [];

      // 分析每个 case 的条件和值
      for (const caseItem of expr.cases) {
        if (caseItem.condition) {
          allLevels.push(this.getAggLevel(caseItem.condition));
        }
        allLevels.push(this.getAggLevel(caseItem.value));
      }

      // 分析默认值
      if (expr.defaultValue) {
        allLevels.push(this.getAggLevel(expr.defaultValue));
      }

      // 如果没有内容，则无聚合
      if (allLevels.length === 0) {
        return AggLevel.None;
      }

      // 如果所有部分都是完全聚合，则结果为完全聚合
      if (allLevels.every(level => level === AggLevel.Full)) {
        return AggLevel.Full;
      }

      // 如果所有部分都无聚合，则结果无聚合
      if (allLevels.every(level => level === AggLevel.None)) {
        return AggLevel.None;
      }

      // 其他情况为部分聚合
      return AggLevel.Partial;
    }

    // IN 表达式：分析左侧表达式和值列表
    if (expr instanceof InExpr) {
      const exprLevel = this.getAggLevel(expr.expr);
      const valuesLevels = expr.values.map(v => this.getAggLevel(v));
      const allLevels = [exprLevel, ...valuesLevels];

      if (allLevels.every(level => level === AggLevel.None)) {
        return AggLevel.None;
      }
      if (allLevels.every(level => level === AggLevel.Full)) {
        return AggLevel.Full;
      }
      return AggLevel.Partial;
    }

    // BETWEEN 表达式：分析表达式和边界值
    if (expr instanceof BetweenExpr) {
      const exprLevel = this.getAggLevel(expr.expr);
      const lowLevel = this.getAggLevel(expr.low);
      const highLevel = this.getAggLevel(expr.high);
      const allLevels = [exprLevel, lowLevel, highLevel];

      if (allLevels.every(level => level === AggLevel.None)) {
        return AggLevel.None;
      }
      if (allLevels.every(level => level === AggLevel.Full)) {
        return AggLevel.Full;
      }
      return AggLevel.Partial;
    }

    // LIKE 表达式：分析表达式和模式
    if (expr instanceof LikeExpr) {
      const exprLevel = this.getAggLevel(expr.expr);
      const patternLevel = this.getAggLevel(expr.pattern);

      if (exprLevel === AggLevel.None && patternLevel === AggLevel.None) {
        return AggLevel.None;
      }
      if (exprLevel === AggLevel.Full && patternLevel === AggLevel.Full) {
        return AggLevel.Full;
      }
      return AggLevel.Partial;
    }

    // IS NULL 表达式：分析表达式
    if (expr instanceof IsNullExpr) {
      return this.getAggLevel(expr.expr);
    }

    // 默认返回无聚合
    return AggLevel.None;
  }

  /**
   * 提取表达式中的聚合子表达式
   * 用于 CTE（Common Table Expression）生成，将聚合表达式提取到子查询中
   *
   * @param expr - 待提取的表达式
   * @returns 包含 inner（聚合表达式数组）和 outer（替换后的表达式）的对象
   */
  static extractAggregations(expr: Expr): { inner: AggExpr[]; outer: Expr } {
    // 存储提取出的聚合表达式
    const inner: AggExpr[] = [];

    /**
     * 递归处理表达式，提取聚合子表达式
     * @param currentExpr - 当前处理的表达式
     * @returns 替换聚合表达式后的新表达式
     */
    function process(currentExpr: Expr): Expr {
      // 聚合表达式：直接提取，并用字段引用替换
      if (currentExpr instanceof AggExpr) {
        // 生成聚合表达式的别名
        const alias = `agg_${inner.length}`;
        // 克隆聚合表达式并设置别名
        const aggExpr = currentExpr.clone() as AggExpr;
        if (!aggExpr.meta) {
          aggExpr.meta = {};
        }
        aggExpr.meta.alias = alias;

        // 添加到内部聚合表达式数组
        inner.push(aggExpr);

        // 创建字段引用表达式替换原聚合表达式
        const fieldRef = new FieldRefExpr(alias);
        fieldRef.aggLevel = AggLevel.Full;
        return fieldRef;
      }

      // 二元运算表达式：递归处理左右操作数
      if (currentExpr instanceof BinaryExpr) {
        const newLeft = process(currentExpr.left);
        const newRight = process(currentExpr.right);
        return new BinaryExpr(currentExpr.operator, newLeft, newRight, currentExpr.meta);
      }

      // 一元运算表达式：递归处理操作数
      if (currentExpr instanceof UnaryExpr) {
        const newOperand = process(currentExpr.operand);
        return new UnaryExpr(currentExpr.operator, newOperand, currentExpr.meta);
      }

      // 函数调用表达式：递归处理所有参数
      if (currentExpr instanceof CallExpr) {
        const newArgs = currentExpr.args.map(arg => process(arg));
        return new CallExpr(currentExpr.functionName, newArgs, currentExpr.meta);
      }

      // 条件表达式：递归处理条件、结果和替代值
      if (currentExpr instanceof ConditionalExpr) {
        const newCondition = process(currentExpr.condition);
        const newConsequent = process(currentExpr.consequent);
        const newAlternate = process(currentExpr.alternate);
        return new ConditionalExpr(newCondition, newConsequent, newAlternate, currentExpr.meta);
      }

      // 选择表达式：递归处理所有 case 和默认值
      if (currentExpr instanceof SelectExpr) {
        const newCases = currentExpr.cases.map(c => ({
          condition: c.condition ? process(c.condition) : undefined,
          value: process(c.value)
        }));
        const newDefault = currentExpr.defaultValue ? process(currentExpr.defaultValue) : undefined;
        return new SelectExpr(newCases, newDefault, currentExpr.meta);
      }

      // 其他表达式类型（字面量、字段引用、指标引用）：直接返回
      return currentExpr;
    }

    // 处理表达式并返回结果
    const outer = process(expr);
    return { inner, outer };
  }

  /**
   * 检查表达式数组是否需要 CTE（Common Table Expression）
   * 当存在部分聚合的表达式时，需要使用 CTE 来分离聚合和非聚合部分
   *
   * @param exprs - 待检查的表达式数组
   * @returns 如果需要 CTE 返回 true，否则返回 false
   */
  static needsCTE(exprs: Expr[]): boolean {
    // 遍历所有表达式，检查是否存在部分聚合
    for (const expr of exprs) {
      if (this.getAggLevel(expr) === AggLevel.Partial) {
        return true;
      }
    }
    return false;
  }
}
