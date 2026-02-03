import { getDatabaseManager } from './database';
import { Table } from '../core/table';
import { Field } from '../core/field';
import { FieldType } from '../core/types';

/**
 * 数据库模式检查器
 * 根据实际数据库表结构动态创建Table和Field对象
 */
export class SchemaInspector {

  /**
   * 获取数据库中所有表的结构信息
   */
  static async getAllTables(): Promise<Table[]> {
    const dbManager = getDatabaseManager();

    try {
      // 查询所有用户表（排除系统表）
      const tablesQuery = `
        SELECT
          TABLE_NAME,
          TABLE_COMMENT
        FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_TYPE = 'BASE TABLE'
          AND TABLE_NAME NOT IN ('information_schema', 'performance_schema', 'mysql', 'sys')
        ORDER BY TABLE_NAME
      `;

      const tableRows = await dbManager.query(tablesQuery);

      const tables: Table[] = [];

      for (const tableRow of tableRows) {
        const tableName = tableRow.TABLE_NAME;
        const tableComment = tableRow.TABLE_COMMENT || '';

        // 获取表的字段信息
        const fields = await this.getTableFields(tableName);

        // 创建Table对象 - 使用唯一的别名
        const alias = this.generateUniqueAlias(tableName, tables);
        const table = new Table({ name: tableName, fields, alias, description: tableComment });
        tables.push(table);
      }

      return tables;

    } catch (error) {
      console.error('获取表结构失败:', error);
      throw error;
    }
  }

  /**
   * 获取指定表的字段信息
   */
  private static async getTableFields(tableName: string): Promise<Field[]> {
    const dbManager = getDatabaseManager();

    const fieldsQuery = `
      SELECT
        COLUMN_NAME,
        DATA_TYPE,
        COLUMN_TYPE,
        IS_NULLABLE,
        COLUMN_DEFAULT,
        COLUMN_COMMENT,
        CHARACTER_MAXIMUM_LENGTH,
        NUMERIC_PRECISION,
        NUMERIC_SCALE
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
      ORDER BY ORDINAL_POSITION
    `;

    const fieldRows = await dbManager.query(fieldsQuery, [tableName]);

    const fields: Field[] = [];

    for (const fieldRow of fieldRows) {
      const fieldName = fieldRow.COLUMN_NAME;
      const dataType = fieldRow.DATA_TYPE.toLowerCase();
      const columnComment = fieldRow.COLUMN_COMMENT || '';

      // 根据MySQL数据类型映射到FieldType
      const fieldType = this.mapMySQLTypeToFieldType(dataType, fieldRow);

      // 创建Field对象
      const field = new Field({ name: fieldName, type: fieldType, description: columnComment });
      fields.push(field);
    }

    return fields;
  }

  /**
   * 生成唯一的表别名
   * 使用系统化的 t_1, t_2, t_3... 格式，避免与用户自定义SQL冲突
   */
  private static generateUniqueAlias(tableName: string, existingTables: Table[]): string {
    // 使用系统化的 t_1, t_2, t_3... 格式
    let counter = 1;
    let alias = `t_${counter}`;

    while (existingTables.some(table => table.alias === alias)) {
      counter++;
      alias = `t_${counter}`;
    }

    return alias;
  }

  /**
   * 将MySQL数据类型映射到FieldType枚举
   */
  private static mapMySQLTypeToFieldType(dataType: string, columnInfo: any): FieldType {
    switch (dataType) {
      case 'tinyint':
      case 'smallint':
      case 'mediumint':
      case 'int':
      case 'bigint':
      case 'integer':
        return FieldType.NUMBER;

      case 'decimal':
      case 'numeric':
      case 'float':
      case 'double':
      case 'real':
        return FieldType.DECIMAL;

      case 'char':
      case 'varchar':
      case 'text':
      case 'tinytext':
      case 'mediumtext':
      case 'longtext':
      case 'enum':
      case 'set':
        return FieldType.STRING;

      case 'date':
        return FieldType.DATE;

      case 'time':
        return FieldType.STRING; // MySQL TIME类型映射为STRING

      case 'datetime':
      case 'timestamp':
        return FieldType.DATETIME;

      case 'boolean':
      case 'bool':
        return FieldType.BOOLEAN;

      default:
        // 对于未知类型，默认使用STRING
        console.warn(`未知的MySQL数据类型: ${dataType}，使用STRING类型`);
        return FieldType.STRING;
    }
  }

  /**
   * 获取指定表的详细信息
   */
  static async getTableDetails(tableName: string): Promise<Table | null> {
    const tables = await this.getAllTables();
    return tables.find(table => table.name === tableName) || null;
  }

  /**
   * 打印数据库中所有表的结构信息
   */
  static async printDatabaseSchema(): Promise<void> {
    console.log('🔍 数据库表结构信息');
    console.log('=' .repeat(60));

    const tables = await this.getAllTables();

    for (const table of tables) {
      console.log(`\n📋 表: ${table.name}`);
      if (table.description) {
        console.log(`   描述: ${table.description}`);
      }
      console.log(`   别名: ${table.alias}`);
      console.log(`   字段数量: ${table.fields.length}`);

      console.log('   字段列表:');
      table.fields.forEach((field, index) => {
        const nullable = field.description ? ' (可空)' : '';
        console.log(`     ${index + 1}. ${field.name} (${field.type})${nullable}`);
        if (field.description) {
          console.log(`        描述: ${field.description}`);
        }
      });
    }

    console.log('\n✅ 表结构检查完成');
  }

  /**
   * 根据表名获取Table对象
   */
  static async getTableByName(tableName: string): Promise<Table | null> {
    return await this.getTableDetails(tableName);
  }

  /**
   * 获取多个表的Table对象
   */
  static async getTablesByNames(tableNames: string[]): Promise<Table[]> {
    const allTables = await this.getAllTables();
    // 按照输入的tableNames顺序返回结果
    return tableNames.map(tableName =>
      allTables.find(table => table.name === tableName)
    ).filter(table => table !== undefined) as Table[];
  }
}