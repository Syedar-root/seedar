import { AlertCircle, Lock } from "lucide-react";
import type { DatasetFormData } from "../../../types/editor.types";
import styles from "./FieldConfigStep.module.scss";

interface FieldConfigStepProps {
  formData: DatasetFormData;
  lockedFields: Set<string>;
  onToggleField: (fieldId: string) => void;
}

interface Field {
  id: string;
  name: string;
}

interface TableFields {
  tableId: string;
  tableName: string;
  fields: Field[];
}

export const FieldConfigStep = ({
  formData,
  lockedFields,
  onToggleField,
}: FieldConfigStepProps) => {
  const fieldsByTable: TableFields[] = formData.tables.map((table) => ({
    tableId: table.tableId,
    tableName: table.tableName,
    fields: Array.from({ length: 5 }, (_, i) => ({
      id: `${table.tableId}-field-${i}`,
      name: `field_${i}`,
    })),
  }));

  const selectedCount = formData.fields.length;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h3 className={styles.title}>选择字段</h3>
          <p className={styles.hint}>
            选择需要包含在数据集中的字段。Join 关联字段和指标引用字段已锁定。
          </p>
        </div>
        <div className={styles.stat}>
          已选择 <span className={styles.statNumber}>{selectedCount}</span> 个字段
        </div>
      </div>

      <div className={styles.tableList}>
        {fieldsByTable.map((table) => (
          <div key={table.tableId} className={styles.tableSection}>
            <div className={styles.tableHeader}>
              <h4 className={styles.tableName}>{table.tableName}</h4>
              <span className={styles.tableFieldCount}>
                {table.fields.length} 个字段
              </span>
            </div>

            <div className={styles.fieldGrid}>
              {table.fields.map((field) => {
                const isSelected = formData.fields.includes(field.id);
                const isLocked = lockedFields.has(field.id);

                return (
                  <div
                    key={field.id}
                    className={`${styles.fieldItem} ${
                      isSelected ? styles.selected : ""
                    } ${isLocked ? styles.locked : ""}`}
                    onClick={() => !isLocked && onToggleField(field.id)}
                    role="checkbox"
                    aria-checked={isSelected}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      disabled={isLocked}
                      onChange={() => {}}
                      className={styles.checkbox}
                    />
                    <span className={styles.fieldName}>{field.name}</span>
                    {isLocked && (
                      <Lock size={12} className={styles.lockIcon} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {selectedCount === 0 && (
        <div className={styles.emptyWarning}>
          <AlertCircle size={16} />
          <span>请至少选择一个字段</span>
        </div>
      )}
    </div>
  );
};