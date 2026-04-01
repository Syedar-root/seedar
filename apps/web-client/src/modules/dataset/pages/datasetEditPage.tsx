import { useParams, useNavigate } from "react-router-dom";
import { useDataset, useUpdateDataset } from "#pkg/seedar/ui-react";
import { useDatasetForm } from "../hooks/useDatasetForm";
import type { EditorMode, DatasetFormData } from "../types/editor.types";
import { DatasetEditorPage } from "../components/DatasetEditor/DatasetEditorPage";
import { useMemo } from "react";
import { DatasetTableResponse } from "#pkg/seedar/types";

export const DatasetEditPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const datasetId = id ? parseInt(id, 10) : 0;

  const { data: dataset, isLoading } = useDataset(datasetId);
  const updateMutation = useUpdateDataset();

  const handleSubmit = async (data: DatasetFormData) => {
    if (!dataset) return;

    const initialFields = initialData?.fields || [];
    const currentFields = data.fields;

    const addedFields = currentFields
      .filter((f) => !f.backendId)
      .map((f) => ({
        dataSourceColumnId: f.dataSourceColumnId,
        businessName: f.businessName,
      }));

    const updatedFields = currentFields
      .filter((f) => f.backendId)
      .map((f) => ({
        id: f.backendId,
        businessName: f.businessName,
        description: f.description,
      }));

    const initialFieldIds = new Set(initialFields.map((f) => f.backendId));
    const deletedIds = initialFields
      .filter(
        (initialField) =>
          !currentFields.some((f) => f.backendId === initialField.backendId),
      )
      .map((f) => f.backendId!);

    await updateMutation.mutateAsync({
      dataSetId: dataset.id,
      name: data.name,
      description: data.description,
      fields: {
        added: addedFields,
        updated: updatedFields,
        deletedIds,
      },
    });

    navigate(`/dataset/${dataset.id}`);
  };

  const initialData: DatasetFormData | undefined = useMemo(() => {
    if (!dataset) return undefined;
    const datasetTableIdMap = new Map<number, DatasetTableResponse>();
    dataset.tables.forEach((t) => datasetTableIdMap.set(t.id, t));

    return {
      name: dataset.name,
      description: dataset.description || "",
      type: dataset.type === "semantic" ? "semantic" : "wideTable",
      datasourceId: dataset.datasource?.id.toString() || "",
      tables: dataset.tables.map((t) => ({
        tableId: t.datasourceTableId.toString(),
        tableName: t.tableName,
        alias: t.alias,
      })),
      mainTable:
        datasetTableIdMap
          .get(dataset.mainTableId || 0)
          ?.datasourceTableId.toString() || "",
      joins: (dataset.joins || []).map((j) => ({
        id: j.id.toString(),
        leftTable:
          datasetTableIdMap
            .get(j.leftTableId || 0)
            ?.datasourceTableId.toString() || "",
        leftField: j.leftField,
        joinType: j.joinType as "inner" | "left" | "right" | "full",
        rightTable:
          datasetTableIdMap
            .get(j.rightTableId || 0)
            ?.datasourceTableId.toString() || "",
        rightField: j.rightField,
      })),
      fields: (dataset.fields || []).map((f) => ({
        id: f.datasourceColumnId?.toString() || "", // 使用dataSourceColumnId作为id，因为id是只读的，不能修改
        backendId: f.datasourceColumnId,
        dataSourceColumnId: f.datasourceColumnId,
        tableId: f.tableId,
        name: f.name,
        businessName: f.businessName || f.name,
        description: f.description,
        isPrimaryKey: f.isPrimaryKey,
      })),
      metrics: (dataset.metrics || []).map((m) => ({
        id: m.id.toString(),
        name: m.name,
        expression: m.expression || "",
        description: m.description,
      })),
    };
  }, [dataset]);

  const formProps = useDatasetForm({
    mode: "edit" as EditorMode,
    initialData,
    onSubmit: handleSubmit,
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return <DatasetEditorPage {...formProps} isLoading={isLoading} />;
};
