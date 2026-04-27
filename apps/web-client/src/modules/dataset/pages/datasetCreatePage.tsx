import { useNavigate } from "react-router-dom";
import { useDatasetForm } from "../hooks/useDatasetForm";
import { useCreateDataset } from "#pkg/seedar/ui-react";
import type { EditorMode, DatasetFormData } from "../types/editor.types";
import { DatasetEditorPage } from "../components/DatasetEditor/DatasetEditorPage";
import {
  DatasetType,
  JoinType,
  type CreateDatasetFieldRequest,
} from "#pkg/seedar/types";

type CreateReadyField = DatasetFormData["fields"][number] & {
  dataSourceColumnId: number;
  tableId: number;
};

const isCreateReadyField = (
  field: DatasetFormData["fields"][number],
  selectedTableIds: Set<number>,
): field is CreateReadyField => {
  return (
    typeof field.dataSourceColumnId === "number" &&
    typeof field.tableId === "number" &&
    selectedTableIds.has(field.tableId)
  );
};

export const DatasetCreatePage = () => {
  const navigate = useNavigate();
  const createMutation = useCreateDataset();

  const handleSubmit = async (data: DatasetFormData) => {
    const selectedTableIds = new Set(
      data.tables.map((table) => parseInt(table.tableId, 10)),
    );

    const fields: CreateDatasetFieldRequest[] = data.fields
      .filter((field): field is CreateReadyField =>
        isCreateReadyField(field, selectedTableIds),
      )
      .map((field) => ({
        dataSourceColumnId: field.dataSourceColumnId,
        tableId: field.tableId,
        name: field.name,
        businessName: field.businessName,
        description: field.description,
        isPrimaryKey: field.isPrimaryKey,
      }));

    const joins = data.joins.map((join) => ({
      leftTableId: parseInt(join.leftTable, 10),
      leftColumnId: parseInt(join.leftField, 10),
      rightTableId: parseInt(join.rightTable, 10),
      rightColumnId: parseInt(join.rightField, 10),
      joinType: join.joinType as JoinType,
    }));

    const result = await createMutation.mutateAsync({
      name: data.name,
      description: data.description,
      type: data.type === "wideTable" ? DatasetType.WIDE : DatasetType.SEMANTIC,
      datasourceId: parseInt(data.datasourceId, 10),
      datasourceTableIds: data.tables.map((t) => parseInt(t.tableId, 10)),
      mainTableId: data.mainTable ? parseInt(data.mainTable, 10) : undefined,
      fields,
      joins,
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
