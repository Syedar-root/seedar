import { Field } from './field';

/**
 * 表配置选项
 */
export interface TableOptions {
  name: string;
  fields: Field[];
  alias?: string;
  description?: string;
}

/**
 * 数据表实体类
 * 表示数据库中的一张表，包含表名、字段列表等信息
 */
export class Table {
  /**
   * 表名称
   */
  public readonly name: string;

  /**
   * 表别名（可选，用于查询时的表重命名）
   */
  public readonly alias?: string;

  /**
   * 表中的字段列表
   */
  public readonly fields: Field[];

  /**
   * 表描述（可选）
   */
  public readonly description?: string;

  constructor(options: TableOptions) {
    this.name = options.name;
    this.fields = options.fields;
    this.alias = options.alias;
    this.description = options.description;
  }

  /**
   * 获取表的完整名称（包含别名）
   */
  getFullName(): string {
    return this.alias ? `${this.name} ${this.alias}` : this.name;
  }

  /**
   * 根据字段名查找字段
   */
  getField(fieldName: string): Field | undefined {
    return this.fields.find(field => field.name === fieldName);
  }

  /**
   * 创建表的副本，但使用新的别名
   */
  withAlias(alias: string): Table {
    return new Table({ name: this.name, fields: this.fields, alias, description: this.description });
  }
}