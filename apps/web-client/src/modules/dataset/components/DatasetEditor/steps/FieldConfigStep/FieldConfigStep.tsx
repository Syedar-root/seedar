import { AlertCircle, Lock, Key } from "lucide-react";
import { useState } from "react";
import { ScrollArea } from "@/core/components/ui/ScrollArea";
import type {
  DatasetFormData,
  FormField,
} from "../../../../types/editor.types";
import type { DatasourceResponse } from "#pkg/seedar/types";
import styles from "./FieldConfigStep.module.scss";

interface FieldConfigStepProps {
  formData: DatasetFormData;
  lockedFields: Set<string>;
  onToggleField: (fieldId: string) => void;
  onUpdateFieldBusinessName: (fieldId: string, businessName: string) => void;
  selectedDatasource?: DatasourceResponse;
}

interface Field {
  id: string;
  name: string;
  isPrimaryKey: boolean;
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
  onUpdateFieldBusinessName,
  selectedDatasource,
}: FieldConfigStepProps) => {
  const [inputValues, setInputValues] = useState<Record<string, string>>({});

  const fieldsByTable: TableFields[] = formData.tables.map((table) => {
    const datasourceTable = selectedDatasource?.tables?.find(
      (dt) => dt.tableName === table.tableName,
    );
    const fields = datasourceTable?.columns
      ? datasourceTable.columns.map((column) => ({
          id:
            column.columnId?.toString() ||
            `${table.tableId}-${column.columnName}`,
          name: column.columnName,
          isPrimaryKey: column.isPrimaryKey,
        }))
      : [];

    return {
      tableId: table.tableId,
      tableName: table.tableName,
      fields,
    };
  });

  const selectedCount = formData.fields.length;

  const getSelectedField = (fieldId: string): FormField | undefined => {
    return formData.fields.find((f) => f.id === fieldId);
  };

  const handleInputChange = (fieldId: string, value: string) => {
    setInputValues((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleInputBlur = (fieldId: string, originalName: string) => {
    const value = inputValues[fieldId];
    if (value !== undefined) {
      const finalValue = value.trim() || originalName;
      onUpdateFieldBusinessName(fieldId, finalValue);
      setInputValues((prev) => {
        const newValues = { ...prev };
        delete newValues[fieldId];
        return newValues;
      });
    }
  };

  const getTableSelectState = (table: TableFields) => {
    const selectedFieldIds = new Set(formData.fields.map((f) => f.id));
    const totalFields = table.fields.length;
    const selectedCount = table.fields.filter((f) =>
      selectedFieldIds.has(f.id),
    ).length;
    const lockedCount = table.fields.filter((f) =>
      lockedFields.has(f.id),
    ).length;
    const selectableCount = totalFields - lockedCount;
    const selectableSelectedCount = table.fields.filter(
      (f) => selectedFieldIds.has(f.id) && !lockedFields.has(f.id),
    ).length;

    return {
      isIndeterminate:
        selectableSelectedCount > 0 &&
        selectableSelectedCount < selectableCount,
      isChecked:
        selectableCount > 0 && selectableSelectedCount === selectableCount,
    };
  };

  const handleToggleTable = (table: TableFields) => {
    const selectedFieldIds = new Set(formData.fields.map((f) => f.id));
    const { isChecked } = getTableSelectState(table);

    table.fields.forEach((field) => {
      if (lockedFields.has(field.id)) return;

      const isSelected = selectedFieldIds.has(field.id);
      if (isChecked && isSelected) {
        onToggleField(field.id);
      } else if (!isChecked && !isSelected) {
        onToggleField(field.id);
      }
    });
  };

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
          已选择 <span className={styles.statNumber}>{selectedCount}</span>{" "}
          个字段
        </div>
      </div>

      <ScrollArea className={styles.tableList}>
        {fieldsByTable.map((table) => (
          <div key={table.tableId} className={styles.tableSection}>
            <div className={styles.tableHeader}>
              <h4 className={styles.tableName}>{table.tableName}</h4>
              <span className={styles.tableFieldCount}>
                {table.fields.length} 个字段
              </span>
            </div>

            <table className={styles.fieldTable}>
              <thead>
                <tr>
                  <th className={styles.checkboxColumn}>
                    <input
                      type="checkbox"
                      checked={getTableSelectState(table).isChecked}
                      ref={(input) => {
                        if (input) {
                          input.indeterminate =
                            getTableSelectState(table).isIndeterminate;
                        }
                      }}
                      onChange={() => handleToggleTable(table)}
                      className={styles.checkbox}
                    />
                  </th>
                  <th className={styles.nameColumn}>原字段名</th>
                  <th className={styles.businessNameColumn}>业务名称</th>
                  <th className={styles.flagsColumn}>标识</th>
                </tr>
              </thead>
              <tbody>
                {table.fields.map((field) => {
                  const selectedField = getSelectedField(field.id);
                  const isSelected = !!selectedField;
                  const isLocked = lockedFields.has(field.id);

                  return (
                    <tr
                      key={field.id}
                      className={`${styles.fieldRow} ${
                        isSelected ? styles.selected : ""
                      } ${isLocked ? styles.locked : ""}`}
                    >
                      <td className={styles.checkboxColumn}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={isLocked}
                          onChange={() => !isLocked && onToggleField(field.id)}
                          className={`${styles.checkbox} ${isLocked ? styles.checkboxLocked : ""}`}
                        />
                      </td>
                      <td className={styles.nameColumn}>
                        <span className={styles.fieldName}>{field.name}</span>
                      </td>
                      <td className={styles.businessNameColumn}>
                        {isSelected && (
                          <input
                            type="text"
                            value={
                              inputValues[field.id] !== undefined
                                ? inputValues[field.id]
                                : selectedField?.businessName || field.name
                            }
                            onChange={(e) =>
                              handleInputChange(field.id, e.target.value)
                            }
                            onBlur={() => handleInputBlur(field.id, field.name)}
                            className={styles.businessNameInput}
                            placeholder="请输入业务名称"
                          />
                        )}
                      </td>
                      <td className={styles.flagsColumn}>
                        <div className={styles.flags}>
                          {field.isPrimaryKey && (
                            <Key size={16} className={styles.pkIcon} />
                          )}
                          {isLocked && (
                            <Lock size={16} className={styles.lockIcon} />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}
      </ScrollArea>

      {selectedCount === 0 && (
        <div className={styles.emptyWarning}>
          <AlertCircle size={16} />
          <span>请至少选择一个字段</span>
        </div>
      )}
    </div>
  );
};
