import { useParams, useNavigate } from "react-router-dom";
import { useDataset, useUpdateDataset } from "#pkg/seedar/ui-react";
import { useDatasetForm } from "../hooks/useDatasetForm";
import type { EditorMode, DatasetFormData } from "../types/editor.types";
import type { DatasetEditorPageProps } from "../components/DatasetEditor/DatasetEditorPage";

interface DatasetEditHOCProps {
  children: React.ComponentType<DatasetEditorPageProps>;
}

export const DatasetEditHOC = ({ children: Children }: DatasetEditHOCProps) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const datasetId = id ? parseInt(id, 10) : 0;

  const { data: dataset, isLoading } = useDataset(datasetId);
  const updateMutation = useUpdateDataset();

  const handleSubmit = async (data: DatasetFormData) => {
    if (!dataset) return;

    await updateMutation.mutateAsync({
      dataSetId: dataset.id,
      name: data.name,
      description: data.description,
    });

    navigate(`/dataset/${dataset.id}`);
  };

  const initialData: DatasetFormData | undefined = dataset
    ? {
        name: dataset.name,
        description: dataset.description || "",
        type: dataset.type === "semantic" ? "semantic" : "wideTable",
        datasourceId: dataset.datasource?.id.toString() || "",
        tables: dataset.tables.map((t) => ({
          tableId: t.id.toString(),
          tableName: t.tableName,
          alias: t.alias,
        })),
        mainTable: dataset.mainTableId?.toString() || "",
        joins: (dataset.joins || []).map((j) => ({
          id: j.id.toString(),
          leftTable: j.leftTableId.toString(),
          leftField: j.leftField,
          joinType: j.joinType as "inner" | "left" | "right" | "full",
          rightTable: j.rightTableId.toString(),
          rightField: j.rightField,
        })),
        fields: (dataset.fields || []).map((f) => f.id.toString()),
        metrics: (dataset.metrics || []).map((m) => ({
          id: m.id.toString(),
          name: m.name,
          expression: m.expression || "",
          description: m.description,
        })),
      }
    : undefined;

  const formProps = useDatasetForm({
    mode: "edit" as EditorMode,
    initialData,
    onSubmit: handleSubmit,
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return <Children {...formProps} isLoading={isLoading} />;
};