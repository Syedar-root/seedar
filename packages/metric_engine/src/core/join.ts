import { Table } from './table';
import { JoinType } from './types';

/**
 * 连接条件配置选项
 */
export interface JoinConditionOptions {
  leftField: string;
  rightField: string;
  operator?: string;
}

/**
 * 连接条件类
 * 表示两个表之间的连接条件
 */
export class JoinCondition {
  /**
   * 左表字段名
   */
  public readonly leftField: string;

  /**
   * 右表字段名
   */
  public readonly rightField: string;

  /**
   * 运算符（默认为等于）
   */
  public readonly operator: string = '=';

  constructor(options: JoinConditionOptions) {
    this.leftField = options.leftField;
    this.rightField = options.rightField;
    this.operator = options.operator ?? '=';
  }
}

/**
 * 连接配置选项
 */
export interface JoinOptions {
  type: JoinType;
  leftTable: Table;
  rightTable: Table;
  conditions: JoinCondition[];
}

/**
 * 表连接实体类
 * 表示两个表之间的连接关系
 */
export class Join {
  /**
   * 连接类型
   */
  public readonly type: JoinType;

  /**
   * 左表
   */
  public readonly leftTable: Table;

  /**
   * 右表
   */
  public readonly rightTable: Table;

  /**
   * 连接条件列表
   */
  public readonly conditions: JoinCondition[];

  constructor(options: JoinOptions) {
    this.type = options.type;
    this.leftTable = options.leftTable;
    this.rightTable = options.rightTable;
    this.conditions = options.conditions;
  }

  /**
   * 生成连接的SQL片段
   */
  toSQL(): string {
    const joinTypeStr = this.type.toUpperCase();
    const conditionsStr = this.conditions
      .map(condition => {
        const leftField = this.leftTable.alias
          ? `${this.leftTable.alias}.${condition.leftField}`
          : condition.leftField;
        const rightField = this.rightTable.alias
          ? `${this.rightTable.alias}.${condition.rightField}`
          : condition.rightField;
        return `${leftField} ${condition.operator} ${rightField}`;
      })
      .join(' AND ');

    return `${joinTypeStr} JOIN ${this.rightTable.getFullName()} ON ${conditionsStr}`;
  }
}