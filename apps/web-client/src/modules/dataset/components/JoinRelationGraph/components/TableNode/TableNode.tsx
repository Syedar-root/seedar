import { memo } from "react";
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import { Star } from "lucide-react";
import type { TableNodeData } from "../../types";
import styles from "./TableNode.module.scss";

export const TableNode = memo(({ data }: NodeProps<Node<TableNodeData>>) => {
  const { tableName, isMainTable } = data;

  return (
    <div className={styles.tableNode}>
      {isMainTable && (
        <Star
          size={16}
          className={styles.mainTableStar}
          fill="#f59e0b"
          color="#f59e0b"
        />
      )}
      <div className={styles.tableName}>{tableName}</div>
      <Handle
        id="bottom"
        type="source"
        position={Position.Bottom}
        className={styles.handle}
      />
      <Handle
        id="top"
        type="target"
        position={Position.Top}
        className={styles.handle}
      />
      <Handle
        id="right"
        type="source"
        position={Position.Right}
        className={styles.handle}
      />
      <Handle
        id="left"
        type="target"
        position={Position.Left}
        className={styles.handle}
      />
    </div>
  );
});

TableNode.displayName = "TableNode";
