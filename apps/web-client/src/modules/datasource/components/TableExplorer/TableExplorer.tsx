import { Table2, Key } from "lucide-react";
import styles from "./TableExplorer.module.scss";

interface Column {
  columnName: string;
  rawDataType: string;
  normalizedType: string;
  nullable: boolean;
  isPrimaryKey: boolean;
}

interface Table {
  tableName: string;
  columns: Column[];
}

interface TableExplorerProps {
  tables?: Table[];
}

export const TableExplorer = ({ tables }: TableExplorerProps) => {
  const getNormalizedTypeText = (type: string) => {
    const typeMap: Record<string, string> = {
      string: "字符串",
      number: "数字",
      date: "日期",
      boolean: "布尔",
    };
    return typeMap[type] || type;
  };

  if (!tables || tables.length === 0) {
    return (
      <div className={styles.emptyState}>
        <Table2 size={32} strokeWidth={1.5} />
        <p>暂无表结构</p>
      </div>
    );
  }

  return (
    <div className={styles.tableExplorer}>
      {tables.map((table, index) => (
        <div
          key={index}
          className={styles.tableNode}
          style={
            {
              "--delay": `${index * 0.05}s`,
            } as React.CSSProperties
          }
        >
          <div className={styles.tableNodeHeader}>
            <div className={styles.tableNodeIcon}>
              <Table2 size={14} />
            </div>
            <h3 className={styles.tableNodeName}>
              {table.tableName}
            </h3>
            <span className={styles.tableNodeCount}>
              {table.columns.length} 字段
            </span>
          </div>

          <div className={styles.tableNodeContent}>
            {table.columns.map((column, colIndex) => (
              <div key={colIndex} className={styles.fieldRow}>
                <div className={styles.fieldName}>
                  {column.isPrimaryKey && (
                    <Key size={10} className={styles.primaryKey} />
                  )}
                  <span>{column.columnName}</span>
                </div>
                <div className={styles.fieldType}>
                  <code>{column.rawDataType}</code>
                </div>
                <div className={styles.fieldMeta}>
                  <span className={styles.normalizedType}>
                    {getNormalizedTypeText(column.normalizedType)}
                  </span>
                  {column.nullable && (
                    <span className={styles.nullableTag}>
                      nullable
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
