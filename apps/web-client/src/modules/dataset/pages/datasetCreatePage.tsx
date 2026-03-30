import { useNavigate } from "react-router-dom";
import { useDatasetForm } from "../hooks/useDatasetForm";
import { useCreateDataset } from "#pkg/seedar/ui-react";
import type { EditorMode, DatasetFormData } from "../types/editor.types";
import { DatasetEditorPage } from "../components/DatasetEditor/DatasetEditorPage";
import { DatasetType } from "#pkg/seedar/types";

export const DatasetCreatePage = () => {
  const navigate = useNavigate();
  const createMutation = useCreateDataset();

  const handleSubmit = async (data: DatasetFormData) => {
    const result = await createMutation.mutateAsync({
      name: data.name,
      description: data.description,
      type: data.type === "wideTable" ? DatasetType.WIDE : DatasetType.SEMANTIC,
      datasourceId: parseInt(data.datasourceId, 10),
      datasourceTableIds: data.tables.map((t) => parseInt(t.tableId, 10)),
      mainTableId: data.mainTable ? parseInt(data.mainTable, 10) : undefined,
    });

    if (result?.id) {
      navigate(`/dataset/${result.id}`);
    }
  };

  const formProps = useDatasetForm({
    mode: "create" as EditorMode,
    onSubmit: handleSubmit,
  });

  return <DatasetEditorPage {...formProps} />;
};