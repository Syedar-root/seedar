import { DatasetTableResponse, DatasetFieldResponse, JoinType } from "#pkg/seedar/types";

export const getFieldNameByColumnId = (
  columnId: string,
  fields: DatasetFieldResponse[]
): string => {
  const numericId = parseInt(columnId, 10);
  const field = fields.find((f) => f.datasourceColumnId === numericId);
  return field?.businessName || field?.name || columnId;
};

export const getTableName = (
  tableId: number,
  tables: DatasetTableResponse[]
): string => {
  const table = tables.find((t) => t.id === tableId);
  return table?.datasetName || table?.tableName || `表${tableId}`;
};

export const getJoinTypeLabel = (type: JoinType): string => {
  const typeMap: Record<JoinType, string> = {
    [JoinType.INNER]: "INNER",
    [JoinType.LEFT]: "LEFT",
    [JoinType.RIGHT]: "RIGHT",
  };
  return typeMap[type] || type;
};

export const getJoinTypeClass = (
  type: JoinType,
  styles: Record<string, string>
): string => {
  const classMap: Record<JoinType, string> = {
    [JoinType.INNER]: styles.edgeInner,
    [JoinType.LEFT]: styles.edgeLeft,
    [JoinType.RIGHT]: styles.edgeRight,
  };
  return classMap[type] || "";
};
