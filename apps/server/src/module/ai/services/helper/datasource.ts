import { DatasourceResponse } from '@/module/datasource/dto/datasource.response';

const getDatasourceInfoCompact = (
  response: DatasourceResponse | null,
): DatasourceResponse | null =>
  response
    ? {
        ...response,
        tables: response.tables?.map((table) => ({
          tableId: table.tableId,
          tableName: table.tableName,
          columns: table.columns.map((column) => ({
            columnId: column.columnId,
            columnName: column.columnName,
            rawDataType: column.rawDataType,
            normalizedType: column.normalizedType,
            nullable: column.nullable,
            isPrimaryKey: column.isPrimaryKey,
          })),
        })),
        foreignKeys: response.foreignKeys?.map((foreignKey) => ({
          fkName: foreignKey.fkName,
          sourceTableName: foreignKey.sourceTableName,
          sourceColumnName: foreignKey.sourceColumnName,
          targetTableName: foreignKey.targetTableName,
          targetColumnName: foreignKey.targetColumnName,
        })),
      }
    : null;

export { getDatasourceInfoCompact };
