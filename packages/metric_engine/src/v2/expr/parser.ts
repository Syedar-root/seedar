import * as jsep from "jsep";
import {
  ExprKind,
  AggFuncName,
  BinaryOperator,
  ComparisonOperator,
} from "./types";
import {
  Expr,
  LiteralExpr,
  FieldRefExpr,
  MetricRefExpr,
  BinaryExpr,
  CallExpr,
  AggExpr,
  ComparisonExpr,
} from "./ast";

/**
 * 解析上下文接口
 * 用于存储表达式解析过程中需要的上下文信息
 */
export interface ParseContext {
  /** 表信息映射，key 为表名或别名 */
  tables: Map<string, { name: string; alias?: string }>;
  /** 字段信息映射，key 为字段名或完整限定名 */
  fields: Map<string, { name: string; tableName: string; tableAlias?: string }>;
  /** 已定义的指标映射，key 为指标名 */
  metrics: Map<string, Expr>;
  /** 默认表名，用于解析未限定的字段名 */
  defaultTable?: string;
}

/**
 * 聚合函数名称集合
 * 用于快速判断函数是否为聚合函数
 */
const AGGREGATE_FUNCTIONS = new Set<string>([
  "SUM",
  "COUNT",
  "AVG",
  "MAX",
  "MIN",
  "DISTINCT_COUNT",
]);

/**
 * 表达式解析器类
 * 使用 jsep 库将表达式字符串解析为 Expr AST
 */
export class ExprParser {
  /** 解析上下文，包含表、字段、指标等信息 */
  private context: ParseContext;

  /**
   * 构造函数
   * @param context 解析上下文
   */
  constructor(context: ParseContext) {
    this.context = context;
  }

  /**
   * 解析表达式字符串，生成 Expr AST
   * @param expression 表达式字符串，如 "amount * 2" 或 "SUM(o.amount)"
   * @returns 解析后的 Expr AST
   * @throws 当表达式语法错误或无法解析时抛出错误
   */
  parse(expression: string): Expr {
    // 使用 jsep 解析表达式字符串，生成 AST
    // jsep 是一个命名空间导出，需要作为函数调用
    const parseFn = (jsep as any).default || jsep;
    const ast = parseFn(expression);
    // 将 jsep AST 转换为我们的 Expr AST
    return this.transform(ast);
  }

  /**
   * 递归转换 jsep AST 节点为 Expr AST
   * @param node jsep AST 节点
   * @returns 转换后的 Expr AST
   * @throws 当遇到不支持的节点类型时抛出错误
   */
  private transform(node: jsep.Expression): Expr {
    // 根据节点类型分发处理
    switch (node.type) {
      case "Identifier":
        // 标识符节点，可能是字段引用或指标引用
        return this.transformIdentifier(node as jsep.Identifier);

      case "Literal":
        // 字面量节点，如数字、字符串等
        return this.transformLiteral(node as jsep.Literal);

      case "BinaryExpression":
        // 二元表达式节点，如加减乘除
        return this.transformBinary(node as jsep.BinaryExpression);

      case "CallExpression":
        // 函数调用节点，可能是普通函数或聚合函数
        return this.transformCall(node as jsep.CallExpression);

      case "MemberExpression":
        // 成员访问节点，如 o.amount
        return this.transformMember(node as jsep.MemberExpression);

      case "UnaryExpression":
        // 一元表达式节点，如取负
        return this.transformUnary(node as jsep.UnaryExpression);

      case "ConditionalExpression":
        // 条件表达式节点，如三元运算符
        return this.transformConditional(node as jsep.ConditionalExpression);

      default:
        // 不支持的节点类型
        throw new Error(`不支持的 jsep 节点类型: ${node.type}`);
    }
  }

  /**
   * 转换标识符节点
   * 标识符可能是字段名或指标名
   * @param node jsep 标识符节点
   * @returns 转换后的 Expr
   */
  private transformIdentifier(node: jsep.Identifier): Expr {
    const name = node.name;
    return this.resolveIdentifier(name);
  }

  /**
   * 转换字面量节点
   * @param node jsep 字面量节点
   * @returns 转换后的 LiteralExpr
   */
  private transformLiteral(node: jsep.Literal): LiteralExpr {
    // jsep 的 Literal 节点包含 raw 和 value 属性
    // value 可能是 string、number、boolean、RegExp 或 null
    // 如果是 RegExp，转换为字符串表示
    let value = node.value;
    if (value instanceof RegExp) {
      value = value.toString();
    }
    return new LiteralExpr(value);
  }

  /**
   * 转换二元表达式节点
   * @param node jsep 二元表达式节点
   * @returns 转换后的 BinaryExpr 或 ComparisonExpr
   * @throws 当运算符不支持时抛出错误
   */
  private transformBinary(
    node: jsep.BinaryExpression,
  ): BinaryExpr | ComparisonExpr {
    const left = this.transform(node.left);
    const right = this.transform(node.right);
    const operator = node.operator;

    const arithmeticOperators = ["+", "-", "*", "/"];
    const comparisonOperators = ["=", "==", "!=", "<>", ">", "<", ">=", "<="];

    if (arithmeticOperators.includes(operator)) {
      return new BinaryExpr(operator as BinaryOperator, left, right);
    }

    if (comparisonOperators.includes(operator)) {
      return new ComparisonExpr(operator as ComparisonOperator, left, right);
    }

    throw new Error(`不支持的二元运算符: ${operator}`);
  }

  /**
   * 转换函数调用节点
   * 如果是聚合函数（SUM/COUNT/AVG/MAX/MIN），则转换为 AggExpr
   * 否则转换为普通的 CallExpr
   * @param node jsep 函数调用节点
   * @returns 转换后的 Expr（AggExpr 或 CallExpr）
   */
  private transformCall(node: jsep.CallExpression): Expr {
    // 获取函数名
    // jsep 的 callee 可能是 Identifier 或 MemberExpression
    let functionName: string;

    if (node.callee.type === "Identifier") {
      functionName = (node.callee as jsep.Identifier).name;
    } else if (node.callee.type === "MemberExpression") {
      // 处理类似 Math.max 这样的调用
      const member = node.callee as jsep.MemberExpression;
      if (
        member.object.type === "Identifier" &&
        member.property.type === "Identifier"
      ) {
        const objectName = (member.object as jsep.Identifier).name;
        const propertyName = (member.property as jsep.Identifier).name;
        functionName = `${objectName}.${propertyName}`;
      } else {
        throw new Error("不支持的函数调用形式");
      }
    } else {
      throw new Error("不支持的函数调用形式");
    }

    // 转换所有参数
    const args = node.arguments.map((arg) => this.transform(arg));

    // 判断是否为聚合函数
    const upperFunctionName = functionName.toUpperCase();
    if (AGGREGATE_FUNCTIONS.has(upperFunctionName)) {
      // 聚合函数只接受一个参数
      if (args.length !== 1) {
        console.log(args);
        throw new Error(
          `聚合函数 ${functionName} 只接受一个参数, 当前参数数量: ${args.length}`,
        );
      }

      // 处理 DISTINCT_COUNT 特殊情况
      if (upperFunctionName === "DISTINCT_COUNT") {
        return new AggExpr("DISTINCT_COUNT" as AggFuncName, args[0], true);
      }

      return new AggExpr(upperFunctionName as AggFuncName, args[0]);
    }

    // 普通函数调用
    return new CallExpr(functionName, args);
  }

  /**
   * 转换成员访问节点
   * 成员访问通常用于限定字段名，如 o.amount 表示 o 表的 amount 字段
   * @param node jsep 成员访问节点
   * @returns 转换后的 FieldRefExpr
   */
  private transformMember(node: jsep.MemberExpression): FieldRefExpr {
    // 获取对象部分（表名或别名）
    let tableName: string;
    let tableAlias: string | undefined;

    if (node.object.type === "Identifier") {
      // 对象是标识符，如 o.amount 中的 o
      tableName = (node.object as jsep.Identifier).name;
      tableAlias = tableName;
    } else if (node.object.type === "MemberExpression") {
      // 嵌套成员访问，如 db.schema.table.field
      // 这里简化处理，只支持两级访问
      throw new Error("不支持嵌套的成员访问表达式");
    } else {
      throw new Error("不支持的成员访问对象类型");
    }

    // 获取属性部分（字段名）
    if (node.property.type !== "Identifier") {
      throw new Error("成员访问的属性必须是标识符");
    }
    const fieldName = (node.property as jsep.Identifier).name;

    // 尝试从上下文中查找表信息
    const tableInfo = this.context.tables.get(tableName);
    if (tableInfo) {
      // 如果找到表信息，使用实际的表名
      return new FieldRefExpr(
        fieldName,
        tableInfo.name,
        tableInfo.alias || tableName,
      );
    }

    // 如果没有找到表信息，直接使用标识符作为表名
    return new FieldRefExpr(fieldName, tableName, tableAlias);
  }

  /**
   * 转换一元表达式节点
   * @param node jsep 一元表达式节点
   * @returns 转换后的 UnaryExpr
   */
  private transformUnary(node: jsep.UnaryExpression): Expr {
    const operand = this.transform(node.argument);
    const operator = node.operator;

    // 这里可以扩展支持更多一元运算符
    // 目前支持取负和逻辑非
    if (operator !== "-" && operator !== "!" && operator !== "+") {
      throw new Error(`不支持的一元运算符: ${operator}`);
    }

    // 如果操作数是字面量，直接计算结果
    if (operand instanceof LiteralExpr && operator === "-") {
      if (typeof operand.value === "number") {
        return new LiteralExpr(-operand.value);
      }
    }

    // 使用 CallExpr 表示一元运算（因为我们的 AST 中 UnaryExpr 可能需要额外处理）
    // 这里我们返回一个特殊的 CallExpr 来表示一元运算
    return new CallExpr(`unary_${operator}`, [operand]);
  }

  /**
   * 转换条件表达式节点（三元运算符）
   * @param node jsep 条件表达式节点
   * @returns 转换后的 ConditionalExpr
   */
  private transformConditional(node: jsep.ConditionalExpression): Expr {
    const condition = this.transform(node.test);
    const consequent = this.transform(node.consequent);
    const alternate = this.transform(node.alternate);

    // 导入 ConditionalExpr
    // 由于循环依赖问题，这里使用动态导入或延迟处理
    const { ConditionalExpr } = require("./ast");
    return new ConditionalExpr(condition, consequent, alternate);
  }

  /**
   * 解析标识符
   * 首先尝试从 metrics 中查找，如果找到则返回 MetricRefExpr
   * 然后尝试从 fields 中查找，如果找到则返回 FieldRefExpr
   * 最后使用 defaultTable 创建 FieldRefExpr
   * @param name 标识符名称
   * @returns 解析后的 Expr
   * @throws 当无法解析标识符且没有默认表时抛出错误
   */
  private resolveIdentifier(name: string): Expr {
    // 首先尝试从指标映射中查找
    if (this.context.metrics.has(name)) {
      return new MetricRefExpr(name);
    }

    // 然后尝试从字段映射中查找
    if (this.context.fields.has(name)) {
      const fieldInfo = this.context.fields.get(name)!;
      return new FieldRefExpr(
        fieldInfo.name,
        fieldInfo.tableName,
        fieldInfo.tableAlias,
      );
    }

    // 如果有默认表，创建字段引用
    if (this.context.defaultTable) {
      const tableInfo = this.context.tables.get(this.context.defaultTable);
      if (tableInfo) {
        return new FieldRefExpr(name, tableInfo.name, tableInfo.alias);
      }
      return new FieldRefExpr(name, this.context.defaultTable);
    }

    // 无法解析标识符
    throw new Error(
      `无法解析标识符 "${name}"，请确保该字段或指标已在上下文中定义，或设置默认表`,
    );
  }
}

/**
 * 创建表达式解析器的工厂函数
 * @param context 解析上下文
 * @returns ExprParser 实例
 */
export function createParser(context: ParseContext): ExprParser {
  return new ExprParser(context);
}

/**
 * 解析表达式的便捷函数
 * @param expression 表达式字符串
 * @param context 解析上下文
 * @returns 解析后的 Expr AST
 */
export function parseExpression(
  expression: string,
  context: ParseContext,
): Expr {
  const parser = new ExprParser(context);
  return parser.parse(expression);
}
