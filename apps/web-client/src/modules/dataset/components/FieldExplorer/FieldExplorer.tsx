import { Accordion } from "@base-ui/react/accordion";
import { DatasetFieldResponse, DatasetTableResponse, FieldType } from "#pkg/seedar/types";
import { Key, Table2, ChevronDown } from "lucide-react";
import styles from "./FieldExplorer.module.scss";

interface FieldExplorerProps {
  fields: DatasetFieldResponse[];
  tables: DatasetTableResponse[];
  mainTableId?: number;
}

interface TableFieldGroup {
  tableId: number;
  tableName: string;
  isMainTable: boolean;
  fields: DatasetFieldResponse[];
}

const getTypeLabel = (type: FieldType): string => {
  const typeMap: Record<FieldType, string> = {
    [FieldType.STRING]: "文本",
    [FieldType.NUMBER]: "数字",
    [FieldType.BOOLEAN]: "布尔",
    [FieldType.DATE]: "日期",
    [FieldType.DATETIME]: "日期时间",
    [FieldType.DECIMAL]: "小数",
  };
  return typeMap[type] || type;
};

const getTypeClass = (type: FieldType): string => {
  const classMap: Record<FieldType, string> = {
    [FieldType.STRING]: styles.typeString,
    [FieldType.NUMBER]: styles.typeNumber,
    [FieldType.BOOLEAN]: styles.typeBoolean,
    [FieldType.DATE]: styles.typeDate,
    [FieldType.DATETIME]: styles.typeDate,
    [FieldType.DECIMAL]: styles.typeNumber,
  };
  return classMap[type] || "";
};

const groupFieldsByTable = (
  fields: DatasetFieldResponse[],
  tables: DatasetTableResponse[],
  mainTableId?: number
): TableFieldGroup[] => {
  const tableMap = new Map<number, DatasetTableResponse>();
  tables.forEach((table) => {
    tableMap.set(table.id, table);
  });

  const groupedMap = new Map<number, DatasetFieldResponse[]>();
  fields.forEach((field) => {
    const existing = groupedMap.get(field.tableId) || [];
    existing.push(field);
    groupedMap.set(field.tableId, existing);
  });

  const groups: TableFieldGroup[] = [];
  groupedMap.forEach((tableFields, tableId) => {
    const table = tableMap.get(tableId);
    groups.push({
      tableId,
      tableName: table?.tableName || `表${tableId}`,
      isMainTable: mainTableId === tableId,
      fields: tableFields,
    });
  });

  groups.sort((a, b) => {
    if (a.isMainTable) return -1;
    if (b.isMainTable) return 1;
    return 0;
  });

  return groups;
};

export const FieldExplorer = ({ fields, tables, mainTableId }: FieldExplorerProps) => {
  if (!fields || fields.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p className={styles.emptyText}>暂无字段</p>
      </div>
    );
  }

  const groupedFields = groupFieldsByTable(fields, tables, mainTableId);
  const defaultOpen = mainTableId ? [mainTableId.toString()] : [];

  return (
    <Accordion.Root multiple defaultValue={defaultOpen} className={styles.accordion}>
      {groupedFields.map((group) => (
        <Accordion.Item key={group.tableId} value={group.tableId.toString()} className={styles.item}>
          <Accordion.Header className={styles.header}>
            <Accordion.Trigger className={styles.trigger}>
              <Table2 size={16} className={styles.tableIcon} />
              <span className={styles.tableName}>{group.tableName}</span>
                {group.isMainTable && (
                  <span className={styles.mainBadge}>默认入口表</span>
                )}
              <span className={styles.fieldCount}>{group.fields.length} 字段</span>
              <ChevronDown size={16} className={styles.chevron} />
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel className={styles.panel}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>字段名</th>
                  <th className={styles.th}>业务名称</th>
                  <th className={styles.th}>类型</th>
                  <th className={styles.thIcon}>主键</th>
                </tr>
              </thead>
              <tbody>
                {group.fields.map((field) => (
                  <tr key={field.id} className={styles.tr}>
                    <td className={styles.tdName}>
                      <span className={styles.fieldName}>{field.name}</span>
                      {field.alias && (
                        <span className={styles.fieldAlias}>{field.alias}</span>
                      )}
                    </td>
                    <td className={styles.td}>{field.businessName || "-"}</td>
                    <td className={styles.td}>
                      <span className={`${styles.typeTag} ${getTypeClass(field.type)}`}>
                        {getTypeLabel(field.type)}
                      </span>
                    </td>
                    <td className={styles.tdIcon}>
                      {field.isPrimaryKey && (
                        <Key size={14} className={styles.keyIcon} />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Accordion.Panel>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  );
};
