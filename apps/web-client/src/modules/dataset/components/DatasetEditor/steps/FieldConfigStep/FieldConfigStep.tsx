import { Dialog } from "@base-ui/react/dialog";
import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Key, Lock, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/core/components/ui/ScrollArea";
import { Select } from "@/core/components/ui/Select";
import type {
  DatasetFormData,
  FormField,
} from "../../../../types/editor.types";
import type { DatasourceResponse } from "#pkg/seedar/types";
import { useFieldBusinessNameGenerator } from "./hooks/useFieldBusinessNameGenerator.hook";
import styles from "./FieldConfigStep.module.scss";

interface FieldConfigStepProps {
  formData: DatasetFormData;
  lockedFields: Set<string>;
  onToggleField: (fieldId: string) => void;
  onUpdateFieldBusinessName: (fieldId: string, businessName: string) => void;
  onUpdateFieldBusinessNames: (
    updates: Array<{ fieldId: string; businessName: string }>,
  ) => void;
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
  onUpdateFieldBusinessNames,
  selectedDatasource,
}: FieldConfigStepProps) => {
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const [isModelDialogOpen, setIsModelDialogOpen] = useState(false);
  const [selectedModelId, setSelectedModelId] = useState("");

  const { availableModels, isGenerating, generateBusinessNames } =
    useFieldBusinessNameGenerator({
      formData,
      selectedDatasource,
    });

  const modelOptions = useMemo(
    () =>
      availableModels.map((model) => ({
        label: model.name,
        value: model.id,
      })),
    [availableModels],
  );

  useEffect(() => {
    setSelectedModelId((previous) => {
      if (
        previous &&
        availableModels.some((model) => model.id === previous)
      ) {
        return previous;
      }

      return availableModels[0]?.id || "";
    });
  }, [availableModels]);

  const fieldsByTable: TableFields[] = formData.tables.map((table) => {
    const datasourceTable = selectedDatasource?.tables?.find(
      (item) => item.tableName === table.tableName,
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
    return formData.fields.find((field) => field.id === fieldId);
  };

  const handleInputChange = (fieldId: string, value: string) => {
    setInputValues((previous) => ({ ...previous, [fieldId]: value }));
  };

  const handleInputBlur = (fieldId: string, originalName: string) => {
    const value = inputValues[fieldId];
    if (value === undefined) {
      return;
    }

    const finalValue = value.trim() || originalName;
    onUpdateFieldBusinessName(fieldId, finalValue);
    setInputValues((previous) => {
      const nextValues = { ...previous };
      delete nextValues[fieldId];
      return nextValues;
    });
  };

  const applyGeneratedBusinessNames = (
    items: Array<{ fieldId: string; businessName: string }>,
  ) => {
    onUpdateFieldBusinessNames(items);

    setInputValues((previous) => {
      const nextValues = { ...previous };
      items.forEach((item) => {
        delete nextValues[item.fieldId];
      });
      return nextValues;
    });
  };

  const requestGenerateBusinessNames = async (aiId: string) => {
    const response = await generateBusinessNames(formData.fields, aiId);
    applyGeneratedBusinessNames(response.items);
    toast.success(`已为 ${response.items.length} 个字段生成业务名称`);
  };

  const handleGenerateBusinessNames = async () => {
    if (formData.fields.length === 0) {
      toast.error("请先至少选择一个字段");
      return;
    }

    if (!selectedDatasource) {
      toast.error("请先选择数据源和表");
      return;
    }

    if (availableModels.length === 0) {
      toast.error("还没有可用模型，请先在模型配置中启用并配置模型");
      return;
    }

    if (availableModels.length > 1) {
      setIsModelDialogOpen(true);
      return;
    }

    try {
      await requestGenerateBusinessNames(availableModels[0].id);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "生成业务名称失败，请稍后重试",
      );
    }
  };

  const handleConfirmModelGenerate = async () => {
    if (!selectedModelId) {
      toast.error("请选择一个可用模型");
      return;
    }

    try {
      await requestGenerateBusinessNames(selectedModelId);
      setIsModelDialogOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "生成业务名称失败，请稍后重试",
      );
    }
  };

  const getTableSelectState = (table: TableFields) => {
    const selectedFieldIds = new Set(formData.fields.map((field) => field.id));
    const totalFields = table.fields.length;
    const lockedCount = table.fields.filter((field) =>
      lockedFields.has(field.id),
    ).length;
    const selectableCount = totalFields - lockedCount;
    const selectableSelectedCount = table.fields.filter(
      (field) => selectedFieldIds.has(field.id) && !lockedFields.has(field.id),
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
    const selectedFieldIds = new Set(formData.fields.map((field) => field.id));
    const { isChecked } = getTableSelectState(table);

    table.fields.forEach((field) => {
      if (lockedFields.has(field.id)) {
        return;
      }

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

        <div className={styles.headerAside}>
          <button
            type="button"
            className={styles.generateButton}
            onClick={handleGenerateBusinessNames}
            disabled={
              isGenerating || selectedCount === 0 || !selectedDatasource
            }
          >
            <Sparkles size={16} />
            {isGenerating ? "生成中..." : "Seemind 生成业务名称"}
          </button>

          <div className={styles.stat}>
            已选择 <span className={styles.statNumber}>{selectedCount}</span>{" "}
            个字段
          </div>
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
                          className={`${styles.checkbox} ${
                            isLocked ? styles.checkboxLocked : ""
                          }`}
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
                            onChange={(event) =>
                              handleInputChange(field.id, event.target.value)
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

      <Dialog.Root
        open={isModelDialogOpen}
        onOpenChange={(open) => {
          if (!isGenerating) {
            setIsModelDialogOpen(open);
          }
        }}
      >
        <Dialog.Portal>
          <Dialog.Backdrop className={styles.dialogBackdrop} />
          <Dialog.Popup className={styles.dialogPopup}>
            <div className={styles.dialogContent}>
              <Dialog.Title className={styles.dialogTitle}>
                选择生成模型
              </Dialog.Title>
              <Dialog.Description className={styles.dialogDescription}>
                检测到有多个可用模型，请先选择本次用于生成字段业务名称的模型。
              </Dialog.Description>

              <div className={styles.dialogForm}>
                <label className={styles.dialogLabel}>可用模型</label>
                <Select
                  value={selectedModelId}
                  onChange={(value) => setSelectedModelId(value ?? "")}
                  options={modelOptions}
                  placeholder="请选择模型"
                  clearable={false}
                />
              </div>

              <div className={styles.dialogActions}>
                <button
                  type="button"
                  className={styles.dialogSecondaryButton}
                  onClick={() => setIsModelDialogOpen(false)}
                  disabled={isGenerating}
                >
                  取消
                </button>
                <button
                  type="button"
                  className={styles.dialogPrimaryButton}
                  onClick={handleConfirmModelGenerate}
                  disabled={isGenerating || !selectedModelId}
                >
                  {isGenerating ? "生成中..." : "确认并生成"}
                </button>
              </div>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
};
