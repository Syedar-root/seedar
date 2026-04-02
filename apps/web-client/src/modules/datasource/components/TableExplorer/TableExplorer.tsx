import { useState } from "react";
import { Table2 } from "lucide-react";
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

const typeMap: Record<string, string> = {
  string: "字符串",
  number: "数字",
  date: "日期",
  boolean: "布尔",
};

const FieldRow = ({ column }: { column: Column }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`${styles.fieldRow} ${expanded ? styles.expanded : ""}`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className={styles.fieldMain}>
        <div className={styles.fieldNameWrapper}>
          {column.isPrimaryKey && (
            <div className={styles.primaryKeyIndicator} />
          )}
          <span
            className={`${styles.fieldName} ${column.isPrimaryKey ? styles.isPrimary : ""}`}
          >
            {column.columnName}
          </span>
        </div>
        <div className={styles.fieldTechDetails}>
          <code className={styles.rawType}>{column.rawDataType}</code>
          <span className={styles.nullableTag}>
            {column.nullable ? "nullable" : "not null"}
          </span>
        </div>
      </div>
      <span className={styles.typeTag}>
        {typeMap[column.normalizedType] || column.normalizedType}
      </span>
    </div>
  );
};

export const TableExplorer = ({ tables }: TableExplorerProps) => {
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
            <h3 className={styles.tableNodeName}>{table.tableName}</h3>
            <span className={styles.tableNodeCount}>
              {table.columns.length} 字段
            </span>
          </div>

          <div className={styles.tableNodeContent}>
            {table.columns.map((column, colIndex) => (
              <FieldRow key={colIndex} column={column} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
