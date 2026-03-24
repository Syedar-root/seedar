import {
  ExprKind,
  AggLevel,
  ExprMeta,
  AggFuncName,
  BinaryOperator,
  ComparisonOperator,
} from "./types";

export abstract class Expr {
  kind: ExprKind;
  aggLevel: AggLevel = AggLevel.None;
  meta?: ExprMeta;

  constructor(kind: ExprKind, meta?: ExprMeta) {
    this.kind = kind;
    this.meta = meta;
  }

  abstract clone(): Expr;
}

export class LiteralExpr extends Expr {
  value: string | number | boolean | null;

  constructor(value: string | number | boolean | null, meta?: ExprMeta) {
    super(ExprKind.Literal, meta);
    this.value = value;
  }

  clone(): LiteralExpr {
    return new LiteralExpr(this.value, this.meta);
  }
}

export class FieldRefExpr extends Expr {
  fieldName: string;
  tableName?: string;
  tableAlias?: string;

  constructor(
    fieldName: string,
    tableName?: string,
    tableAlias?: string,
    meta?: ExprMeta,
  ) {
    super(ExprKind.FieldRef, meta);
    this.fieldName = fieldName;
    this.tableName = tableName;
    this.tableAlias = tableAlias;
  }

  clone(): FieldRefExpr {
    return new FieldRefExpr(
      this.fieldName,
      this.tableName,
      this.tableAlias,
      this.meta,
    );
  }

  getQualifiedName(): string {
    if (this.tableAlias) {
      return `${this.tableAlias}.${this.fieldName}`;
    }
    if (this.tableName) {
      return `${this.tableName}.${this.fieldName}`;
    }
    return this.fieldName;
  }
}

export class MetricRefExpr extends Expr {
  metricName: string;

  constructor(metricName: string, meta?: ExprMeta) {
    super(ExprKind.MetricRef, meta);
    this.metricName = metricName;
  }

  clone(): MetricRefExpr {
    return new MetricRefExpr(this.metricName, this.meta);
  }
}

export class CallExpr extends Expr {
  functionName: string;
  args: Expr[];

  constructor(functionName: string, args: Expr[], meta?: ExprMeta) {
    super(ExprKind.Call, meta);
    this.functionName = functionName;
    this.args = args;
  }

  clone(): CallExpr {
    return new CallExpr(
      this.functionName,
      this.args.map((arg) => arg.clone()),
      this.meta,
    );
  }
}

export class AggExpr extends Expr {
  functionName: AggFuncName;
  arg: Expr;
  distinct: boolean = false;

  constructor(
    functionName: AggFuncName,
    arg: Expr,
    distinct: boolean = false,
    meta?: ExprMeta,
  ) {
    super(ExprKind.Call, meta);
    this.functionName = functionName;
    this.arg = arg;
    this.distinct = distinct;
    this.aggLevel = AggLevel.Partial;
  }

  clone(): AggExpr {
    return new AggExpr(
      this.functionName,
      this.arg.clone(),
      this.distinct,
      this.meta,
    );
  }
}

export class BinaryExpr extends Expr {
  operator: BinaryOperator;
  left: Expr;
  right: Expr;

  constructor(
    operator: BinaryOperator,
    left: Expr,
    right: Expr,
    meta?: ExprMeta,
  ) {
    super(ExprKind.Binary, meta);
    this.operator = operator;
    this.left = left;
    this.right = right;
  }

  clone(): BinaryExpr {
    return new BinaryExpr(
      this.operator,
      this.left.clone(),
      this.right.clone(),
      this.meta,
    );
  }
}

/**
 * 比较表达式类
 * 用于表示比较运算，如 a = b, a > b 等
 * 与 BinaryExpr 不同，ComparisonExpr 使用比较运算符
 */
export class ComparisonExpr extends Expr {
  operator: ComparisonOperator;
  left: Expr;
  right: Expr;

  constructor(
    operator: ComparisonOperator,
    left: Expr,
    right: Expr,
    meta?: ExprMeta,
  ) {
    super(ExprKind.Binary, meta);
    this.operator = operator;
    this.left = left;
    this.right = right;
  }

  clone(): ComparisonExpr {
    return new ComparisonExpr(
      this.operator,
      this.left.clone(),
      this.right.clone(),
      this.meta,
    );
  }
}

export class UnaryExpr extends Expr {
  operator: string;
  operand: Expr;

  constructor(operator: string, operand: Expr, meta?: ExprMeta) {
    super(ExprKind.Unary, meta);
    this.operator = operator;
    this.operand = operand;
  }

  clone(): UnaryExpr {
    return new UnaryExpr(this.operator, this.operand.clone(), this.meta);
  }
}

export class ConditionalExpr extends Expr {
  condition: Expr;
  consequent: Expr;
  alternate: Expr;

  constructor(
    condition: Expr,
    consequent: Expr,
    alternate: Expr,
    meta?: ExprMeta,
  ) {
    super(ExprKind.Conditional, meta);
    this.condition = condition;
    this.consequent = consequent;
    this.alternate = alternate;
  }

  clone(): ConditionalExpr {
    return new ConditionalExpr(
      this.condition.clone(),
      this.consequent.clone(),
      this.alternate.clone(),
      this.meta,
    );
  }
}

export class SelectExpr extends Expr {
  cases: Array<{ condition?: Expr; value: Expr }>;
  defaultValue?: Expr;

  constructor(
    cases: Array<{ condition?: Expr; value: Expr }>,
    defaultValue?: Expr,
    meta?: ExprMeta,
  ) {
    super(ExprKind.Select, meta);
    this.cases = cases;
    this.defaultValue = defaultValue;
  }

  clone(): SelectExpr {
    return new SelectExpr(
      this.cases.map((c) => ({
        condition: c.condition?.clone(),
        value: c.value.clone(),
      })),
      this.defaultValue?.clone(),
      this.meta,
    );
  }
}
