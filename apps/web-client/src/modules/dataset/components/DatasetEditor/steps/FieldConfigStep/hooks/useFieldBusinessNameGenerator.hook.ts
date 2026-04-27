import { useMemo } from "react";
import {
  useAis,
  useGenerateFieldBusinessNames,
} from "#pkg/seedar/ui-react";
import type {
  AiResponse,
  GenerateFieldBusinessNameRequest,
  GenerateFieldBusinessNameResponse,
  DatasourceResponse,
} from "#pkg/seedar/types";
import { AiStatus } from "#pkg/seedar/types";
import type {
  DatasetFormData,
  FormField,
} from "../../../../../types/editor.types";

const isAvailableModel = (ai: AiResponse) => {
  const llmConfig = ai.config?.llm as Record<string, unknown> | undefined;
  const apiKey = llmConfig?.apiKey;
  const model = llmConfig?.model;

  return (
    ai.status === AiStatus.ACTIVE &&
    typeof apiKey === "string" &&
    apiKey.trim().length > 0 &&
    (typeof model === "string" && model.trim().length > 0
      ? true
      : typeof ai.name === "string" && ai.name.trim().length > 0)
  );
};

const getColumnNameMap = (
  formData: DatasetFormData,
  selectedDatasource?: DatasourceResponse,
) => {
  const columnNameMap = new Map<string, string>();

  formData.tables.forEach((table) => {
    const datasourceTable = selectedDatasource?.tables?.find(
      (item) => item.tableName === table.tableName,
    );

    datasourceTable?.columns.forEach((column) => {
      if (!column.columnId) {
        return;
      }

      columnNameMap.set(
        `${table.tableId}:${String(column.columnId)}`,
        column.columnName,
      );
    });
  });

  return columnNameMap;
};

interface UseFieldBusinessNameGeneratorOptions {
  formData: DatasetFormData;
  selectedDatasource?: DatasourceResponse;
}

export const useFieldBusinessNameGenerator = ({
  formData,
  selectedDatasource,
}: UseFieldBusinessNameGeneratorOptions) => {
  const { data: aisData } = useAis();
  const generateMutation = useGenerateFieldBusinessNames();

  const availableModels = useMemo(() => {
    return (aisData?.data || []).filter(isAvailableModel);
  }, [aisData]);

  const generateBusinessNames = async (
    selectedFields: FormField[],
    aiId: string,
  ): Promise<GenerateFieldBusinessNameResponse> => {
    const columnNameMap = getColumnNameMap(formData, selectedDatasource);
    const entryTableId = formData.mainTable || formData.tables[0]?.tableId;
    const entryTableName = formData.tables.find(
      (table) => table.tableId === entryTableId,
    )?.tableName;

    const payload: GenerateFieldBusinessNameRequest = {
      aiId,
      entryTableId,
      entryTableName,
      tables: formData.tables.map((table) => ({
        tableId: table.tableId,
        tableName: table.tableName,
        isEntryTable: table.tableId === entryTableId,
      })),
      joins: formData.joins.map((join) => ({
        leftTableId: join.leftTable,
        leftTableName:
          formData.tables.find((table) => table.tableId === join.leftTable)
            ?.tableName || join.leftTable,
        leftFieldId: join.leftField,
        leftFieldName:
          columnNameMap.get(`${join.leftTable}:${join.leftField}`) ||
          join.leftField,
        joinType: join.joinType,
        rightTableId: join.rightTable,
        rightTableName:
          formData.tables.find((table) => table.tableId === join.rightTable)
            ?.tableName || join.rightTable,
        rightFieldId: join.rightField,
        rightFieldName:
          columnNameMap.get(`${join.rightTable}:${join.rightField}`) ||
          join.rightField,
      })),
      fields: selectedFields.map((field) => ({
        fieldId: field.id,
        tableId: String(field.tableId || ""),
        tableName:
          formData.tables.find(
            (table) => table.tableId === String(field.tableId || ""),
          )?.tableName || "",
        fieldName: field.name,
        currentBusinessName: field.businessName,
        isPrimaryKey: field.isPrimaryKey,
      })),
    };

    return generateMutation.mutateAsync(payload);
  };

  return {
    availableModels,
    isGenerating: generateMutation.isPending,
    generateBusinessNames,
  };
};
