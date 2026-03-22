import {
  useUpdateQuery,
  useUpdatePanel,
  useCreateQuery,
  useCreatePanel,
} from "#pkg/seedar/ui-react";
import { PanelResponse, PanelType } from "#pkg/seedar/types";
import { DisplayPanelType, PanelEditorConfig } from "../components/panelEditor";
import { DragItem } from "../components/dndHelper/dragZone/dragZone";
import { FilterItem } from "../components/queryZone/types";
import { useCallback } from "react";
import { toast } from "sonner";
import { NavigateFunction } from "react-router-dom";

interface UsePanelActionsParams {
  panelId?: string;
  panelData?: PanelResponse;
  queryData?: any;
  datasetData?: any;
  dropFields: DragItem[];
  dropMetrics: DragItem[];
  dropFilters: FilterItem[];
  displayType: DisplayPanelType;
  editorConfig: PanelEditorConfig;
  handleRun: () => void;
  navigate: NavigateFunction;
  title: string;
}

interface UsePanelActionsReturn {
  handleSave: () => void;
  handleSaveAs: () => void;
}

export const usePanelActions = ({
  panelId,
  panelData,
  queryData,
  datasetData,
  dropFields,
  dropMetrics,
  dropFilters,
  displayType,
  editorConfig,
  handleRun,
  navigate,
  title,
}: UsePanelActionsParams): UsePanelActionsReturn => {
  const { mutate: updateQuery } = useUpdateQuery();
  const { mutate: updatePanel } = useUpdatePanel();
  const { mutate: createQuery } = useCreateQuery();
  const { mutate: createPanel } = useCreatePanel();

  const getPanelTypeAndConfig = useCallback(() => {
    const panelType =
      displayType === "table" || displayType === "card" ? displayType : "chart";

    const config =
      displayType === "table" || displayType === "card"
        ? {}
        : { ...editorConfig, type: displayType };

    return { panelType, config };
  }, [displayType, editorConfig]);

  const getQueryDsl = useCallback(
    (baseDsl?: any) => {
      return {
        datasetId: datasetData?.id!,
        tableId: datasetData?.mainTableId!,
        joins: datasetData?.joins || [],
        ...baseDsl,
        dimensions: dropFields.map((f) => f.id),
        metrics: dropMetrics,
        filters: dropFilters.map((f) => ({
          fieldId: f.fieldId,
          op: f.op,
          value: f.value,
        })),
      };
    },
    [datasetData, dropFields, dropMetrics, dropFilters],
  );

  const handleSave = useCallback(() => {
    if (!panelData || !panelId) return;

    const { panelType, config } = getPanelTypeAndConfig();
    const dsl = getQueryDsl(queryData?.dsl);

    updatePanel(
      {
        id: panelId,
        data: {
          title,
          type: panelType as any,
          config,
        },
      },
      {
        onSuccess: () => {
          updateQuery(
            {
              id: panelData?.queryId!,
              data: {
                dsl,
              },
            },
            {
              onSuccess: () => {
                handleRun();
                toast.success("保存成功");
              },
            },
          );
        },
      },
    );
  }, [
    panelData,
    panelId,
    queryData,
    title,
    getPanelTypeAndConfig,
    getQueryDsl,
    updateQuery,
    updatePanel,
    handleRun,
  ]);

  const handleSaveAs = useCallback(() => {
    if (!panelData || !panelId) return;

    const dsl = getQueryDsl(queryData?.dsl);
    const { panelType, config } = getPanelTypeAndConfig();

    createQuery(
      {
        name: "未命名查询",
        datasetId: datasetData?.id!,
        dsl,
      },
      {
        onSuccess: (data) => {
          createPanel(
            {
              title: title || "未命名面板",
              queryId: data.id,
              type: panelType as PanelType,
              config,
            },
            {
              onSuccess: (data) => {
                navigate(`/panel/${data.id}`);
                toast.success("另存为成功");
              },
            },
          );
        },
      },
    );
  }, [
    panelData,
    panelId,
    datasetData,
    queryData,
    title,
    getQueryDsl,
    getPanelTypeAndConfig,
    createQuery,
    createPanel,
    navigate,
  ]);

  return { handleSave, handleSaveAs };
};
