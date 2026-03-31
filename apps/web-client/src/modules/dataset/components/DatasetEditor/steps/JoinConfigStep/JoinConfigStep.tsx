import { Plus, Trash2, AlertCircle } from "lucide-react";
import type {
  DatasetFormData,
  JoinConfig,
} from "../../../../types/editor.types";
import styles from "./JoinConfigStep.module.scss";

interface JoinConfigStepProps {
  formData: DatasetFormData;
  selectedDatasource?: {
    tables?: Array<{
      tableName: string;
      columns?: Array<{
        columnName: string;
        isPrimaryKey?: boolean;
        type?: string;
      }>;
    }>;
  };
  onAddJoin: (join: JoinConfig) => void;
  onRemoveJoin: (joinId: string) => void;
  onUpdateJoin: (joinId: string, updates: Partial<JoinConfig>) => void;
}

export const JoinConfigStep = ({
  formData,
  selectedDatasource,
  onAddJoin,
  onRemoveJoin,
  onUpdateJoin,
}: JoinConfigStepProps) => {
  const isSingleTable = formData.tables.length <= 1;

  const getTableColumns = (tableId: string) => {
    const table = formData.tables.find((t) => t.tableId === tableId);
    if (!table || !selectedDatasource?.tables) return [];
    const datasourceTable = selectedDatasource.tables.find(
      (t) => t.tableName === table.tableName,
    );
    return datasourceTable?.columns || [];
  };

  const getFieldOptions = (tableId: string) => {
    const columns = getTableColumns(tableId);
    return columns.map((col) => ({
      value: col.columnName,
      label: col.columnName,
    }));
  };

  if (isSingleTable) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <AlertCircle size={48} className={styles.emptyIcon} />
          <h3 className={styles.emptyTitle}>无需配置关联</h3>
          <p className={styles.emptyText}>
            当前数据集只包含单个表，不需要配置表之间的关联关系。
          </p>
        </div>
      </div>
    );
  }

  const handleAddJoin = () => {
    const newJoin: JoinConfig = {
      id: `join-${Date.now()}`,
      leftTable: formData.tables[0]?.tableId || "",
      leftField: "",
      joinType: "inner",
      rightTable: formData.tables[1]?.tableId || "",
      rightField: "",
    };
    onAddJoin(newJoin);
  };

  const tableOptions = formData.tables.map((t) => ({
    value: t.tableId,
    label: t.tableName,
  }));

  const joinTypeOptions = [
    { value: "inner", label: "INNER JOIN" },
    { value: "left", label: "LEFT JOIN" },
    { value: "right", label: "RIGHT JOIN" },
    { value: "full", label: "FULL JOIN" },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h3 className={styles.title}>关联关系配置</h3>
          <p className={styles.hint}>配置表中字段之间的关联关系</p>
        </div>
        <button className={styles.addButton} onClick={handleAddJoin}>
          <Plus size={14} />
          添加关联
        </button>
      </div>

      {formData.joins.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyText}>暂未配置关联关系</p>
        </div>
      ) : (
        <div className={styles.joinList}>
          {formData.joins.map((join, index) => (
            <div key={join.id} className={styles.joinItem}>
              <div className={styles.joinHeader}>
                <span className={styles.joinLabel}>关联 {index + 1}</span>
                <button
                  className={styles.removeButton}
                  onClick={() => onRemoveJoin(join.id)}
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <div className={styles.joinGrid}>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>左表</label>
                  <select
                    className={styles.select}
                    value={join.leftTable}
                    onChange={(e) =>
                      onUpdateJoin(join.id, {
                        leftTable: e.target.value,
                        leftField: "",
                      })
                    }
                  >
                    <option value="">选择表</option>
                    {tableOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.field}>
                  <label className={styles.fieldLabel}>左字段</label>
                  <select
                    className={styles.select}
                    value={join.leftField}
                    onChange={(e) =>
                      onUpdateJoin(join.id, { leftField: e.target.value })
                    }
                  >
                    <option value="">选择字段</option>
                    {getFieldOptions(join.leftTable).map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.field}>
                  <label className={styles.fieldLabel}>关联类型</label>
                  <select
                    className={styles.select}
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
                </div>

                <div className={styles.field}>
                  <label className={styles.fieldLabel}>右表</label>
                  <select
                    className={styles.select}
                    value={join.rightTable}
                    onChange={(e) =>
                      onUpdateJoin(join.id, {
                        rightTable: e.target.value,
                        rightField: "",
                      })
                    }
                  >
                    <option value="">选择表</option>
                    {tableOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.field}>
                  <label className={styles.fieldLabel}>右字段</label>
                  <select
                    className={styles.select}
                    value={join.rightField}
                    onChange={(e) =>
                      onUpdateJoin(join.id, { rightField: e.target.value })
                    }
                  >
                    <option value="">选择字段</option>
                    {getFieldOptions(join.rightTable).map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
