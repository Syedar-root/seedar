import { memo, useCallback } from "react";
import { DatabaseZap, Hash, Table2, Trash2 } from "lucide-react";
import type { DatasourceResponse } from "#pkg/seedar/types";
import { Select } from "@/core/components/ui/Select";
import type {
  JoinConfig,
  DatasetFormData,
} from "../../../../../../types/editor.types";
import styles from "./JoinInfoPanel.module.scss";

interface JoinInfoPanelProps {
  joins: JoinConfig[];
  tables: DatasetFormData["tables"];
  selectedDatasource?: DatasourceResponse;
  onUpdateJoin: (joinId: string, updates: Partial<JoinConfig>) => void;
  onRemoveJoin: (joinId: string) => void;
  onApplyDatasourceJoins: () => void;
  onClearJoins: () => void;
  availableAutoJoinCount: number;
  pendingAutoJoinCount: number;
}

interface ColumnData {
  columnId: string;
  columnName: string;
  isPrimaryKey?: boolean;
  type?: string;
  [key: string]: unknown;
}

const joinTypeOptions = [
  { value: "inner", label: "INNER JOIN" },
  { value: "left", label: "LEFT JOIN" },
  { value: "right", label: "RIGHT JOIN" },
  { value: "full", label: "FULL JOIN" },
];

export const JoinInfoPanel = memo(
  ({
    joins,
    tables,
    selectedDatasource,
    onUpdateJoin,
    onRemoveJoin,
    onApplyDatasourceJoins,
    onClearJoins,
    availableAutoJoinCount,
    pendingAutoJoinCount,
  }: JoinInfoPanelProps) => {
    const getTableName = (tableId: string) => {
      return (
        tables.find((table) => table.tableId === tableId)?.tableName || tableId
      );
    };

    const getTableColumnsMap = useCallback(
      (tableId: string) => {
        const table = tables.find((item) => item.tableId === tableId);
        if (!table || !selectedDatasource?.tables) {
          return {};
        }

        const datasourceTable = selectedDatasource.tables.find(
          (item) => item.tableName === table.tableName,
        );
        if (!datasourceTable?.columns) {
          return {};
        }

        return datasourceTable.columns.reduce(
          (accumulator, column) => ({
            ...accumulator,
            [String(column.columnId)]: {
              ...column,
              columnId: String(column.columnId),
            },
          }),
          {} as Record<string, ColumnData>,
        );
      },
      [selectedDatasource, tables],
    );

    return (
      <aside className={styles.panel}>
        <div className={styles.header}>
          <div className={styles.headerText}>
            <h4 className={styles.panelTitle}>关联关系列表</h4>
            <p className={styles.panelMeta}>
              已配置 {joins.length} 条
              {availableAutoJoinCount > 0
                ? `，数据库可应用 ${availableAutoJoinCount} 条`
                : "，当前没有可直接应用的数据库关系"}
            </p>
          </div>

          <div className={styles.headerActions}>
            <button
              className={styles.applyButton}
              onClick={onApplyDatasourceJoins}
              disabled={availableAutoJoinCount === 0}
            >
              <DatabaseZap size={16} />
              {pendingAutoJoinCount > 0
                ? `应用数据库 Join 关系（+${pendingAutoJoinCount}）`
                : "应用数据库 Join 关系"}
            </button>

            <button
              className={styles.clearButton}
              onClick={onClearJoins}
              disabled={joins.length === 0}
            >
              <Trash2 size={16} />
              清空关联
            </button>
          </div>
        </div>

        <div className={styles.body}>
          {joins.length === 0 ? (
            <div className={styles.emptyState}>
              <p className={styles.emptyText}>
                暂未配置关联关系，请在左侧图中连线，或使用上方按钮自动应用数据库关系。
              </p>
            </div>
          ) : (
            <div className={styles.joinList}>
              {joins.map((join, index) => (
                <div key={join.id} className={styles.joinItem}>
                  <span className={styles.joinIndex}>{index + 1}</span>

                  <div className={styles.joinFields}>
                    <span className={styles.tableName}>
                      <Table2 size={12} />
                      {getTableName(join.leftTable)}
                    </span>
                    <span className={styles.fieldName}>
                      <Hash size={11} />
                      {getTableColumnsMap(join.leftTable)[join.leftField]
                        ?.columnName || join.leftField}
                    </span>
                  </div>

                  <Select
                    className={styles.joinTypeSelect}
                    value={join.joinType}
                    onChange={(value) => {
                      if (!value) {
                        return;
                      }

                      onUpdateJoin(join.id, {
                        joinType: value as JoinConfig["joinType"],
                      });
                    }}
                    options={joinTypeOptions}
                    placeholder="选择 Join 类型"
                    clearable={false}
                  />

                  <div className={styles.joinFields}>
                    <span className={styles.tableName}>
                      <Table2 size={12} />
                      {getTableName(join.rightTable)}
                    </span>
                    <span className={styles.fieldName}>
                      <Hash size={11} />
                      {getTableColumnsMap(join.rightTable)[join.rightField]
                        ?.columnName || join.rightField}
                    </span>
                  </div>

                  <button
                    className={styles.removeButton}
                    onClick={() => onRemoveJoin(join.id)}
                    title="删除关联"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>
    );
  },
);

JoinInfoPanel.displayName = "JoinInfoPanel";
