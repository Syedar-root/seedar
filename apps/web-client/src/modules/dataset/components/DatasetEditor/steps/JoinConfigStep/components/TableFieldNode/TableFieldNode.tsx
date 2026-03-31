import { memo } from "react";
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import { Star } from "lucide-react";
import styles from "./TableFieldNode.module.scss";

interface TableFieldNodeData {
  [key: string]: unknown;
  tableId: string;
  tableName: string;
  isMainTable: boolean;
  columns: Array<{
    columnName: string;
    isPrimaryKey?: boolean;
    type?: string;
  }>;
  connectedFields?: Set<string>;
}

export const TableFieldNode = memo(
  ({ data }: NodeProps<Node<TableFieldNodeData>>) => {
    const {
      tableName,
      isMainTable,
      columns,
      connectedFields = new Set(),
    } = data;

    return (
      <div className={styles.tableFieldNode}>
        <div className={styles.header}>
          {isMainTable && (
            <Star
              size={14}
              className={styles.mainTableStar}
              fill="#f59e0b"
              color="#f59e0b"
            />
          )}
          <span className={styles.tableName}>{tableName}</span>
        </div>
        <div className={styles.fieldList}>
          {columns.map((col) => {
            const leftHandleId = `${data.tableId}:${col.columnName}:target`;
            const rightHandleId = `${data.tableId}:${col.columnName}:source`;
            const isLeftConnected = connectedFields.has(leftHandleId);
            const isRightConnected = connectedFields.has(rightHandleId);

            return (
              <div key={col.columnName} className={styles.fieldRow}>
                <Handle
                  id={leftHandleId}
                  type="target"
                  position={Position.Left}
                  className={`${styles.handle} ${isLeftConnected ? styles.handleConnected : ""}`}
                  isConnectable={true}
                />
                <span
                  className={`${styles.fieldName} ${col.isPrimaryKey ? styles.primaryKey : ""}`}
                >
                  {col.columnName}
                </span>
                <Handle
                  id={rightHandleId}
                  type="source"
                  position={Position.Right}
                  className={`${styles.handle} ${isRightConnected ? styles.handleConnected : ""}`}
                  isConnectable={true}
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  },
);

TableFieldNode.displayName = "TableFieldNode";
