import { memo, useCallback } from "react";
import { Trash2 } from "lucide-react";
import type {
  JoinConfig,
  DatasetFormData,
} from "../../../../../../types/editor.types";
import styles from "./JoinInfoPanel.module.scss";
import { useDatasetEditorStore } from "@/modules/dataset/store";

interface JoinInfoPanelProps {
  joins: JoinConfig[];
  tables: DatasetFormData["tables"];
  onUpdateJoin: (joinId: string, updates: Partial<JoinConfig>) => void;
  onRemoveJoin: (joinId: string) => void;
}

interface ColumnData {
  columnId: string;
  columnName: string;
  isPrimaryKey?: boolean;
  type?: string;
  [key: string]: unknown;
}

export const JoinInfoPanel = memo(
  ({ joins, tables, onUpdateJoin, onRemoveJoin }: JoinInfoPanelProps) => {
    const getTableName = (tableId: string) => {
      const table = tables.find((t) => t.tableId === tableId);
      return table?.tableName || tableId;
    };

    const { datasource } = useDatasetEditorStore();

    const getTableColumnsMap = useCallback(
      (tableId: string) => {
        const table = tables.find((t) => t.tableId === tableId);
        if (!table || !datasource?.tables) return {};
        const datasourceTable = datasource.tables.find(
          (t) => t.tableName === table.tableName,
        );
        if (!datasourceTable?.columns) return {};
        return (
          (datasourceTable?.columns).reduce(
            (acc, col) => ({
              ...acc,
              [String(col.columnId)]: {
                ...col,
                columnId: String(col.columnId),
              },
            }),
            {} as Record<string, ColumnData>,
          ) || {}
        );
      },
      [tables, datasource],
    );

    const joinTypeOptions = [
      { value: "inner", label: "INNER JOIN" },
      { value: "left", label: "LEFT JOIN" },
      { value: "right", label: "RIGHT JOIN" },
      { value: "full", label: "FULL JOIN" },
    ];

    if (joins.length === 0) {
      return (
        <div className={styles.panel}>
          <h4 className={styles.panelTitle}>关联关系</h4>
          <p className={styles.emptyText}>
            暂未配置关联关系，请在图中连接两个表的字段
          </p>
        </div>
      );
    }

    return (
      <div className={styles.panel}>
        <h4 className={styles.panelTitle}>关联关系（共 {joins.length} 个）</h4>
        <div className={styles.joinList}>
          {joins.map((join, index) => (
            <div key={join.id} className={styles.joinItem}>
              <span className={styles.joinIndex}>{index + 1}</span>

              <div className={styles.joinFields}>
                <span className={styles.tableName}>
                  {getTableName(join.leftTable)}
                </span>
                <span className={styles.fieldName}>
                  {getTableColumnsMap(join.leftTable)[join.leftField]
                    ?.columnName || join.leftField}
                </span>
              </div>

              <select
                className={styles.joinTypeSelect}
                value={join.joinType}
                onChange={(e) =>
                  onUpdateJoin(join.id, {
                    joinType: e.target.value as JoinConfig["joinType"],
                  })
                }
              >
                {joinTypeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              <div className={styles.joinFields}>
                <span className={styles.tableName}>
                  {getTableName(join.rightTable)}
                </span>
                <span className={styles.fieldName}>
                  {getTableColumnsMap(join.rightTable)[join.rightField]
                    ?.columnName || join.rightField}
                </span>
              </div>

              <button
                className={styles.removeButton}
                onClick={() => onRemoveJoin(join.id)}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  },
);

JoinInfoPanel.displayName = "JoinInfoPanel";
