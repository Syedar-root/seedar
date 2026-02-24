import { FieldType } from './types';

class FieldBase {
  /**
   * 字段名称
   */
  public readonly name: string;

  /**
   * 字段类型
   */
  public readonly type: FieldType;

  /**
   * 字段别名
   */
  public readonly alias?: string;

  /**
   * 字段描述
   */
  public readonly description?: string;

  /**
   * 业务名称
   */
  public readonly businessName?: string;

  constructor(options: FieldBase) {
    this.name = options.name;
    this.type = options.type;
    this.alias = options.alias;
    this.description = options.description;
    this.businessName = options.businessName;
  }
}

/**
 * 字段实体类
 * 表示数据表中的一个字段，包含字段名和类型信息
 */
export class Field extends FieldBase {
  constructor(options: FieldBase) {
    super(options);
  }

  /**
   * 获取字段的完整引用名（包含表别名）
   * @param tableAlias 表别名
   */
  getFullName(tableAlias?: string): string {
    const fieldName = this.alias || this.name;
    return tableAlias ? `${tableAlias}.${fieldName}` : fieldName;
  }

  /**
   * 创建字段的副本，但使用新的别名
   */
  withAlias(alias: string): Field {
    return new Field({
      name: this.name,
      type: this.type,
      alias,
      description: this.description,
    });
  }
}

export class Test {}
