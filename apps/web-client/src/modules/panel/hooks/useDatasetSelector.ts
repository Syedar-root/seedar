import { useDatasets, useCreateQuery, useCreatePanel } from "#pkg/seedar/ui-react";
import { DatasetResponse, PanelType } from "#pkg/seedar/types";
import { useCallback } from "react";
import { toast } from "sonner";
import { NavigateFunction } from "react-router-dom";

interface UseDatasetSelectorReturn {
  datasets: DatasetResponse[] | undefined;
  handleSelectDataset: (dataset: DatasetResponse) => void;
}

export const useDatasetSelector = (
  navigate: NavigateFunction,
): UseDatasetSelectorReturn => {
  const { data: datasets } = useDatasets();
  const { mutate: createQuery } = useCreateQuery();
  const { mutate: createPanel } = useCreatePanel();

  const handleSelectDataset = useCallback(
    (dataset: DatasetResponse) => {
      createQuery(
        {
          name: "未命名查询",
          datasetId: dataset.id,
          dsl: {
            datasetId: dataset.id,
            tableId: dataset.mainTableId!,
            joins: dataset.joins || [],
            dimensions: [],
            metrics: [],
          },
        },
        {
          onSuccess: (queryData) => {
            createPanel(
              {
                title: "未命名面板",
                queryId: queryData.id,
                type: "table" as PanelType,
                config: {},
              },
              {
                onSuccess: (panelData) => {
                  navigate(`/panel/${panelData.id}`);
                  toast.success("创建看板成功");
                },
              },
            );
          },
        },
      );
    },
    [createQuery, createPanel, navigate],
  );

  return {
    datasets,
    handleSelectDataset,
  };
};
