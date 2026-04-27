import { useState, useCallback, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { useDatasource } from "#pkg/seedar/ui-react";
import type {
  DatasetFormData,
  JoinConfig,
  MetricConfig,
  EditorSteps,
  EditorMode,
  FormField,
} from "../types/editor.types";
import type { DatasourceResponse } from "#pkg/seedar/types";

const STEPS: EditorSteps[] = [
  "basicInfo",
  "dataSource",
  "joinConfig",
  "fieldConfig",
  "metricConfig",
  "confirm",
];

const createEmptyFormData = (): DatasetFormData => {
  return {
    name: "",
    description: "",
    type: "semantic",
    datasourceId: "",
    tables: [],
    mainTable: "",
    joins: [],
    fields: [],
    metrics: [],
  };
};

interface UseDatasetFormProps {
  mode: EditorMode;
  initialData?: DatasetFormData;
  onSubmit?: (data: DatasetFormData) => void;
}

export const useDatasetForm = ({
  mode,
  initialData,
  onSubmit,
}: UseDatasetFormProps) => {
  const [formData, setFormData] = useState<DatasetFormData>(
    initialData || createEmptyFormData(),
  );

  useEffect(() => {
    if (initialData && initialData.name) {
      setFormData(initialData);
    }
  }, [initialData?.name]); // name 是稳定字符串，不会引起无限循环

  const [currentStep, setCurrentStep] = useState<EditorSteps>("basicInfo");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const datasourceId = formData.datasourceId
    ? parseInt(formData.datasourceId, 10)
    : 0;
  const { data: selectedDatasource } = useDatasource(datasourceId);

  const isCreateMode = mode === "create";

  useEffect(() => {
    if (formData.datasourceId && isCreateMode) {
      updateFormData(
        {
          tables: [],
          mainTable: "",
          joins: [],
        },
        "useEffect formData.datasourceId && isCreateMode",
      );
    }
  }, [formData.datasourceId, isCreateMode]);

  const currentStepIndex = useMemo(
    () => STEPS.indexOf(currentStep),
    [currentStep],
  );

  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === STEPS.length - 1;

  const onBeforeNext: Partial<Record<EditorSteps, () => boolean>> = {
    dataSource: () => {
      const validTableIds = new Set(formData.tables.map((t) => t.tableId));
      const validJoins = formData.joins.filter(
        (join) =>
          validTableIds.has(join.leftTable) &&
          validTableIds.has(join.rightTable),
      );
      if (validJoins.length !== formData.joins.length) {
        updateFormData({ joins: validJoins }, "onBeforeNext dataSource");
      }
      return true;
    },
    joinConfig: () => {
      if (formData.tables.length <= 1) return true;
      const tableIds = formData.tables.map((table) => table.tableId);
      const startTableId = formData.mainTable || tableIds[0];
      if (!startTableId) {
        return false;
      }

      const adjacencyMap = new Map<string, Set<string>>();
      tableIds.forEach((tableId) => {
        adjacencyMap.set(tableId, new Set());
      });

      formData.joins.forEach((join) => {
        if (
          adjacencyMap.has(join.leftTable) &&
          adjacencyMap.has(join.rightTable)
        ) {
          adjacencyMap.get(join.leftTable)?.add(join.rightTable);
          adjacencyMap.get(join.rightTable)?.add(join.leftTable);
        }
      });

      const visited = new Set<string>();
      const queue = [startTableId];

      while (queue.length > 0) {
        const currentTableId = queue.shift();
        if (!currentTableId || visited.has(currentTableId)) {
          continue;
        }

        visited.add(currentTableId);
        adjacencyMap.get(currentTableId)?.forEach((nextTableId) => {
          if (!visited.has(nextTableId)) {
            queue.push(nextTableId);
          }
        });
      }

      const unreachableTableIds = tableIds.filter(
        (tableId) => !visited.has(tableId),
      );

      if (unreachableTableIds.length > 0) {
        const unreachableTableNames = unreachableTableIds.map(
          (tableId) =>
            formData.tables.find((table) => table.tableId === tableId)
              ?.tableName || tableId,
        );
        const entryTableName =
          formData.tables.find((table) => table.tableId === startTableId)
            ?.tableName || startTableId;

        toast.error(
          `以下表与默认入口表 ${entryTableName} 不连通：${unreachableTableNames.join("、")}`,
        );
        return false;
      }
      return true;
    },
  };

  const canGoNext = useCallback(() => {
    switch (currentStep) {
      case "basicInfo":
        return !!formData.name.trim();
      case "dataSource":
        return (
          !!formData.datasourceId &&
          formData.tables.length > 0 &&
          !!formData.mainTable
        );
      case "joinConfig":
        return formData.tables.length <= 1 || formData.joins.length > 0;
      case "fieldConfig":
        return formData.fields.length > 0;
      default:
        return true;
    }
  }, [currentStep, formData]);

  const goToNextStep = useCallback(() => {
    if (isLastStep) return;
    if (onBeforeNext[currentStep]?.() === false) return;
    if (canGoNext()) {
      setCurrentStep(STEPS[currentStepIndex + 1]);
    }
  }, [currentStepIndex, isLastStep, currentStep, onBeforeNext, canGoNext]);

  const goToPrevStep = useCallback(() => {
    if (!isFirstStep) {
      setCurrentStep(STEPS[currentStepIndex - 1]);
    }
  }, [currentStepIndex, isFirstStep]);

  const goToStep = useCallback(
    (step: EditorSteps) => {
      const targetIndex = STEPS.indexOf(step);
      if (targetIndex <= currentStepIndex) {
        setCurrentStep(step);
      }
    },
    [currentStepIndex],
  );

  const updateFormData = useCallback(
    (updates: Partial<DatasetFormData>, tag?: string) => {
      console.log(`hcs update ${tag}`, updates);
      setFormData((prev) => ({ ...prev, ...updates }));
    },
    [],
  );

  const getLockedFields = useCallback(
    (selectedDatasource?: DatasourceResponse | null): Set<string> => {
      const lockedFields = new Set<string>();

      formData.joins.forEach((join) => {
        lockedFields.add(join.leftField);
        lockedFields.add(join.rightField);
      });

      formData.metrics.forEach((metric) => {
        const fieldMatches = formData.fields.filter((field) =>
          metric.expression.includes(field.id),
        );
        fieldMatches.forEach((field) => lockedFields.add(field.id));
      });

      if (selectedDatasource?.tables) {
        formData.tables.forEach((table) => {
          const datasourceTable = selectedDatasource.tables?.find(
            (dt) => dt.tableName === table.tableName,
          );
          if (datasourceTable) {
            datasourceTable.columns.forEach((column) => {
              if (column.isPrimaryKey && column.columnId) {
                lockedFields.add(column.columnId.toString());
              }
            });
          }
        });
      }

      return lockedFields;
    },
    [formData.joins, formData.metrics, formData.fields, formData.tables],
  );

  const toggleField = useCallback(
    (fieldId: string, lockedFields: Set<string>) => {
      if (lockedFields.has(fieldId)) {
        return;
      }
      setFormData((prev) => {
        const isSelected = prev.fields.some((f) => f.id === fieldId);
        if (isSelected) {
          return {
            ...prev,
            fields: prev.fields.filter((f) => f.id !== fieldId),
          };
        } else {
          let newField: FormField | undefined;

          if (selectedDatasource?.tables) {
            for (const table of prev.tables) {
              const datasourceTable = selectedDatasource.tables.find(
                (dt) => dt.tableName === table.tableName,
              );
              if (datasourceTable?.columns) {
                const column = datasourceTable.columns.find(
                  (c) => c.columnId?.toString() === fieldId,
                );
                if (column) {
                  newField = {
                    id: fieldId,
                    dataSourceColumnId: column.columnId,
                    tableId: parseInt(table.tableId, 10),
                    name: column.columnName,
                    businessName: column.columnName,
                    isPrimaryKey: column.isPrimaryKey,
                  };
                  break;
                }
              }
            }
          }

          if (!newField) {
            newField = {
              id: fieldId,
              name: fieldId,
              businessName: fieldId,
            };
          }

          return {
            ...prev,
            fields: [...prev.fields, newField],
          };
        }
      });
    },
    [selectedDatasource],
  );

  const updateFieldBusinessName = useCallback(
    (fieldId: string, businessName: string) => {
      setFormData((prev) => ({
        ...prev,
        fields: prev.fields.map((field) => {
          if (field.id === fieldId) {
            return {
              ...field,
              businessName: businessName.trim() || field.name,
            };
          }
          return field;
        }),
      }));
    },
    [],
  );

  const addJoin = useCallback((join: JoinConfig) => {
    setFormData((prev) => ({
      ...prev,
      joins: [...prev.joins, join],
    }));
  }, []);

  const removeJoin = useCallback((joinId: string) => {
    setFormData((prev) => ({
      ...prev,
      joins: prev.joins.filter((j) => j.id !== joinId),
    }));
  }, []);

  const updateJoin = useCallback(
    (joinId: string, updates: Partial<JoinConfig>) => {
      setFormData((prev) => ({
        ...prev,
        joins: prev.joins.map((j) =>
          j.id === joinId ? { ...j, ...updates } : j,
        ),
      }));
    },
    [],
  );

  const updateFieldBusinessNames = useCallback(
    (updates: Array<{ fieldId: string; businessName: string }>) => {
      const businessNameMap = new Map(
        updates.map((item) => [item.fieldId, item.businessName]),
      );

      setFormData((prev) => ({
        ...prev,
        fields: prev.fields.map((field) => {
          const nextBusinessName = businessNameMap.get(field.id);
          if (!nextBusinessName) {
            return field;
          }

          return {
            ...field,
            businessName: nextBusinessName.trim() || field.name,
          };
        }),
      }));
    },
    [],
  );

  const replaceJoins = useCallback((joins: JoinConfig[]) => {
    setFormData((prev) => ({
      ...prev,
      joins,
    }));
  }, []);

  const addMetric = useCallback((metric: MetricConfig) => {
    setFormData((prev) => ({
      ...prev,
      metrics: [...prev.metrics, metric],
    }));
  }, []);

  const removeMetric = useCallback((metricId: string) => {
    setFormData((prev) => ({
      ...prev,
      metrics: prev.metrics.filter((m) => m.id !== metricId),
    }));
  }, []);

  const updateMetric = useCallback(
    (metricId: string, updates: Partial<MetricConfig>) => {
      setFormData((prev) => ({
        ...prev,
        metrics: prev.metrics.map((m) =>
          m.id === metricId ? { ...m, ...updates } : m,
        ),
      }));
    },
    [],
  );

  const handleSubmit = useCallback(async () => {
    if (!canGoNext()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit?.(formData);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, canGoNext, onSubmit]);

  useEffect(() => {
    const lockedFields = new Set<string>();

    formData.joins.forEach((join) => {
      lockedFields.add(join.leftField);
      lockedFields.add(join.rightField);
    });

    formData.metrics.forEach((metric) => {
      const fieldMatches = formData.fields.filter((field) =>
        metric.expression.includes(field.id),
      );
      fieldMatches.forEach((field) => lockedFields.add(field.id));
    });

    if (selectedDatasource?.tables) {
      formData.tables.forEach((table) => {
        const datasourceTable = selectedDatasource.tables?.find(
          (dt) => dt.tableName === table.tableName,
        );
        if (datasourceTable) {
          datasourceTable.columns.forEach((column) => {
            if (column.isPrimaryKey && column.columnId) {
              lockedFields.add(column.columnId.toString());
            }
          });
        }
      });
    }

    const existingFieldIds = new Set(formData.fields.map((f) => f.id));
    const missingLockedFields = [...lockedFields].filter(
      (fieldId) => !existingFieldIds.has(fieldId),
    );

    if (missingLockedFields.length > 0) {
      const newFields: FormField[] = [];
      for (const fieldId of missingLockedFields) {
        let newField: FormField | undefined;
        if (selectedDatasource?.tables) {
          for (const table of formData.tables) {
            const datasourceTable = selectedDatasource.tables.find(
              (dt) => dt.tableName === table.tableName,
            );
            if (datasourceTable?.columns) {
              const column = datasourceTable.columns.find(
                (c) => c.columnId?.toString() === fieldId,
              );
              if (column) {
                newField = {
                  id: fieldId,
                  dataSourceColumnId: column.columnId,
                  tableId: parseInt(table.tableId, 10),
                  name: column.columnName,
                  businessName: column.columnName,
                  isPrimaryKey: column.isPrimaryKey,
                };
                break;
              }
            }
          }
        }
        if (!newField) {
          newField = {
            id: fieldId,
            name: fieldId,
            businessName: fieldId,
          };
        }
        newFields.push(newField);
      }

      setFormData((prev) => ({
        ...prev,
        fields: [...prev.fields, ...newFields],
      }));
    }
  }, [formData.tables, formData.joins, formData.metrics, selectedDatasource]);

  return {
    formData,
    selectedDatasource,
    currentStep,
    currentStepIndex,
    isFirstStep,
    isLastStep,
    isSubmitting,
    isCreateMode,
    steps: STEPS,
    canGoNext,
    goToNextStep,
    goToPrevStep,
    goToStep,
    updateFormData,
    getLockedFields,
    toggleField,
    updateFieldBusinessName,
    updateFieldBusinessNames,
    addJoin,
    removeJoin,
    updateJoin,
    replaceJoins,
    addMetric,
    removeMetric,
    updateMetric,
    handleSubmit,
  };
};
