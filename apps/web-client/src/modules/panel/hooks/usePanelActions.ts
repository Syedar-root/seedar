import { useCallback, useMemo, useState } from "react";
import {
  useCreatePanel,
  useCreateQuery,
  useExecuteTempQuery,
  useUpdatePanel,
  useUpdateQuery,
} from "#pkg/seedar/ui-react";
import { PanelStatus } from "#pkg/seedar/types";
import type {
  DatasetResponse,
  ExecuteQueryResponse,
  PanelResponse,
  PanelType,
  QueryDimensionDSL,
  QueryDSL,
  QueryResponse,
} from "#pkg/seedar/types";
import type { NavigateFunction } from "react-router-dom";
import { toast } from "sonner";
import type { DragItem } from "../components/dndHelper/dragZone/dragZone";
import type { TitleConfig } from "../components/editableTitle";
import type {
  DisplayPanelType,
  PanelEditorConfig,
} from "../components/panelEditor/types";
import { buildPersistedChartConfig } from "../components/panelEditor/chartSpec";
import type { FilterItem } from "../components/queryZone/types";

type PanelWorkflowStatus = "unsaved" | "draft" | "published";
type QueryDsl = QueryDSL;

interface PersistedPanelPayload {
  panelId: string;
  queryId: string;
  status: PanelWorkflowStatus;
}

interface UsePanelActionsParams {
  panelId?: string;
  panelData?: PanelResponse;
  queryData?: QueryResponse;
  datasetData?: DatasetResponse;
  selectedDataset?: DatasetResponse;
  panelStatus?: PanelWorkflowStatus;
  dropFields: DragItem[];
  dropMetrics: DragItem[];
  dropFilters: FilterItem[];
  displayType: DisplayPanelType;
  editorConfig: PanelEditorConfig;
  buildDsl?: (baseDsl?: QueryDsl) => QueryDsl | undefined;
  runPreview?: (dsl?: QueryDsl) => Promise<ExecuteQueryResponse | undefined>;
  handleRun?: () => void;
  navigate?: NavigateFunction;
  title: string;
  titleConfig?: TitleConfig;
  onStatusChange?: (status: PanelWorkflowStatus) => void;
  onPanelPersisted?: (payload: PersistedPanelPayload) => void;
}

interface UsePanelActionsReturn {
  handlePrimarySave: () => Promise<void>;
  handleRun: () => Promise<void>;
  handleRevertToDraft: () => Promise<void>;
  isSaving: boolean;
  isRunning: boolean;
  isReverting: boolean;
  primaryActionLabel: string;
  handleSave: () => Promise<void>;
  handleSaveAs: () => Promise<void>;
}

const toPanelType = (displayType: DisplayPanelType): PanelType => {
  if (displayType === "table") {
    return "table" as PanelType;
  }

  if (displayType === "card") {
    return "card" as PanelType;
  }

  return "chart" as PanelType;
};

const getPanelConfig = (
  displayType: DisplayPanelType,
  editorConfig: PanelEditorConfig,
) => {
  if (displayType === "table" || displayType === "card") {
    return { ...editorConfig };
  }

  return buildPersistedChartConfig(displayType, editorConfig) ?? {
    type: displayType,
  };
};

export const usePanelActions = ({
  panelId,
  panelData,
  queryData,
  datasetData,
  selectedDataset,
  panelStatus,
  dropFields,
  dropMetrics,
  dropFilters,
  displayType,
  editorConfig,
  buildDsl,
  runPreview,
  handleRun: legacyHandleRun,
  navigate,
  title,
  titleConfig,
  onStatusChange,
  onPanelPersisted,
}: UsePanelActionsParams): UsePanelActionsReturn => {
  const { mutateAsync: updateQueryAsync, isPending: isUpdateQueryPending } =
    useUpdateQuery();
  const { mutateAsync: updatePanelAsync, isPending: isUpdatePanelPending } =
    useUpdatePanel();
  const { mutateAsync: createQueryAsync, isPending: isCreateQueryPending } =
    useCreateQuery();
  const { mutateAsync: createPanelAsync, isPending: isCreatePanelPending } =
    useCreatePanel();
  const { mutateAsync: executeTempQueryAsync } = useExecuteTempQuery();

  const [isSavingState, setIsSavingState] = useState(false);
  const [isRunningState, setIsRunningState] = useState(false);
  const [isRevertingState, setIsRevertingState] = useState(false);
  const [persistedState, setPersistedState] = useState<
    PersistedPanelPayload | undefined
  >();

  const effectivePanelId = panelId ?? panelData?.id ?? persistedState?.panelId;
  const effectiveQueryId =
    queryData?.id ?? panelData?.queryId ?? persistedState?.queryId;
  const effectiveDataset = selectedDataset ?? datasetData;

  const effectiveStatus: PanelWorkflowStatus = useMemo(() => {
    if (panelStatus) {
      return panelStatus;
    }
    if (panelData?.status === PanelStatus.PUBLISHED) {
      return "published";
    }
    if (panelData?.status === PanelStatus.DRAFT) {
      return "draft";
    }
    if (persistedState?.status) {
      return persistedState.status;
    }
    if (effectivePanelId) {
      return "draft";
    }
    return "unsaved";
  }, [
    effectivePanelId,
    panelData?.status,
    panelStatus,
    persistedState?.status,
  ]);

  const primaryActionLabel =
    effectiveStatus === "published" ? "Save and update" : "Save and publish";

  const buildDslFallback = useCallback(
    (baseDsl?: QueryDsl): QueryDsl | undefined => {
      if (!effectiveDataset?.id || !effectiveDataset.mainTableId) {
        return undefined;
      }

      return {
        ...(baseDsl ?? {}),
        datasetId: effectiveDataset.id,
        tableId: effectiveDataset.mainTableId,
        // joins: effectiveDataset.joins || [],
        dimensions: dropFields.map((field) => {
          const dimensionDsl = (
            field as DragItem & { dimensionDsl?: QueryDimensionDSL }
          ).dimensionDsl;
          if (dimensionDsl) {
            return dimensionDsl;
          }
          return {
            fieldId: Number(field.id),
            alias: field.alias,
          };
        }),
        metrics: dropMetrics.map((metric) => ({
          id: Number(metric.id),
          alias: metric.alias,
        })),
        filters: dropFilters.map((filter) => ({
          fieldId: filter.fieldId,
          op: filter.op,
          value: filter.value,
        })),
      };
    },
    [dropFields, dropFilters, dropMetrics, effectiveDataset],
  );

  const resolveDsl = useCallback(
    (baseDsl?: QueryDsl): QueryDsl | undefined =>
      buildDsl?.(baseDsl) ?? buildDslFallback(baseDsl),
    [buildDsl, buildDslFallback],
  );

  const runPreviewWithDsl = useCallback(
    async (dsl?: QueryDsl): Promise<ExecuteQueryResponse | undefined> => {
      if (!dsl) {
        return undefined;
      }

      if (runPreview) {
        return runPreview(dsl);
      }

      if (legacyHandleRun) {
        legacyHandleRun();
        return undefined;
      }

      return executeTempQueryAsync(dsl);
    },
    [executeTempQueryAsync, legacyHandleRun, runPreview],
  );

  const ensurePanelPersisted = useCallback(
    async (options: {
      publishAfterCreate: boolean;
    }): Promise<PersistedPanelPayload> => {
      const dsl = resolveDsl(
        (queryData?.dsl as QueryDsl | undefined) ?? undefined,
      );
      if (!dsl) {
        throw new Error(
          "No dataset selected or dataset metadata is incomplete.",
        );
      }

      if (effectivePanelId && effectiveQueryId) {
        return {
          panelId: effectivePanelId,
          queryId: effectiveQueryId,
          status: effectiveStatus,
        };
      }

      if (!effectiveDataset?.id) {
        throw new Error("Dataset is required before persisting panel.");
      }

      const createdQuery = await createQueryAsync({
        name: "Untitled Query",
        datasetId: effectiveDataset.id,
        dsl,
      });

      const panelType = toPanelType(displayType);
      const panelConfig = getPanelConfig(displayType, editorConfig);
      const createdPanel = await createPanelAsync({
        title: title || "Untitled Panel",
        titleConfig,
        queryId: createdQuery.id,
        type: panelType,
        config: panelConfig,
      });

      let nextStatus: PanelWorkflowStatus = "draft";
      if (options.publishAfterCreate) {
        await updatePanelAsync({
          id: createdPanel.id,
          data: {
            title: title || "Untitled Panel",
            titleConfig,
            type: panelType,
            config: panelConfig,
            status: PanelStatus.PUBLISHED,
          },
        });
        nextStatus = "published";
      }

      navigate?.(`/panel/${createdPanel.id}`, { replace: true });
      onStatusChange?.(nextStatus);

      const payload = {
        panelId: createdPanel.id,
        queryId: createdQuery.id,
        status: nextStatus,
      };
      setPersistedState(payload);
      onPanelPersisted?.(payload);
      return payload;
    },
    [
      createPanelAsync,
      createQueryAsync,
      displayType,
      editorConfig,
      effectiveDataset,
      effectivePanelId,
      effectiveQueryId,
      effectiveStatus,
      navigate,
      onPanelPersisted,
      onStatusChange,
      persistedState?.panelId,
      persistedState?.queryId,
      queryData?.dsl,
      resolveDsl,
      title,
      titleConfig,
      updatePanelAsync,
    ],
  );

  const handlePrimarySave = useCallback(async () => {
    try {
      setIsSavingState(true);
      const panelType = toPanelType(displayType);
      const panelConfig = getPanelConfig(displayType, editorConfig);
      const dsl = resolveDsl(
        (queryData?.dsl as QueryDsl | undefined) ?? undefined,
      );

      if (!dsl) {
        toast.error("Please select a dataset first.");
        return;
      }

      if (effectiveStatus === "unsaved") {
        await ensurePanelPersisted({ publishAfterCreate: true });
        toast.success("Panel published.");
        return;
      }

      if (!effectivePanelId || !effectiveQueryId) {
        toast.error("Panel resource is incomplete.");
        return;
      }

      await updateQueryAsync({
        id: effectiveQueryId,
        data: { dsl },
      });

      if (effectiveStatus === "draft") {
        await updatePanelAsync({
          id: effectivePanelId,
          data: {
            title: title || "Untitled Panel",
            titleConfig,
            type: panelType,
            config: panelConfig,
            status: PanelStatus.PUBLISHED,
          },
        });
        setPersistedState((current) =>
          current
            ? {
                ...current,
                status: "published",
              }
            : current,
        );
        onStatusChange?.("published");
        toast.success("Panel published.");
        return;
      }

      await updatePanelAsync({
        id: effectivePanelId,
        data: {
          title: title || "Untitled Panel",
          titleConfig,
          type: panelType,
          config: panelConfig,
        },
      });
      toast.success("Panel updated.");
    } catch {
      toast.error("Save failed. Please try again.");
    } finally {
      setIsSavingState(false);
    }
  }, [
    displayType,
    editorConfig,
    effectivePanelId,
    effectiveQueryId,
    effectiveStatus,
    ensurePanelPersisted,
    onStatusChange,
    queryData?.dsl,
    resolveDsl,
    title,
    titleConfig,
    updatePanelAsync,
    updateQueryAsync,
  ]);

  const handleRun = useCallback(async () => {
    try {
      setIsRunningState(true);
      const dsl = resolveDsl(
        (queryData?.dsl as QueryDsl | undefined) ?? undefined,
      );

      if (!dsl) {
        toast.error("Please select a dataset first.");
        return;
      }

      if (!dropFields.length && !dropMetrics.length) {
        toast.error("Please add at least one dimension or metric.");
        return;
      }

      if (effectiveStatus === "unsaved") {
        await ensurePanelPersisted({ publishAfterCreate: false });
      }

      await runPreviewWithDsl(dsl);
    } catch (error) {
      console.error("Run failed:", error);
      toast.error("Run failed. Please try again.");
    } finally {
      setIsRunningState(false);
    }
  }, [
    dropFields.length,
    dropMetrics.length,
    effectiveStatus,
    ensurePanelPersisted,
    queryData?.dsl,
    resolveDsl,
    runPreviewWithDsl,
  ]);

  const handleRevertToDraft = useCallback(async () => {
    if (!effectivePanelId) {
      toast.error("No panel available.");
      return;
    }

    try {
      setIsRevertingState(true);
      await updatePanelAsync({
        id: effectivePanelId,
        data: {
          status: PanelStatus.DRAFT,
        },
      });
      setPersistedState((current) =>
        current
          ? {
              ...current,
              status: "draft",
            }
          : current,
      );
      onStatusChange?.("draft");
      toast.success("Panel reverted to draft.");
    } catch {
      toast.error("Revert failed. Please try again.");
    } finally {
      setIsRevertingState(false);
    }
  }, [effectivePanelId, onStatusChange, updatePanelAsync]);

  const isSaving =
    isSavingState ||
    isCreateQueryPending ||
    isCreatePanelPending ||
    isUpdateQueryPending ||
    isUpdatePanelPending;

  return {
    handlePrimarySave,
    handleRun,
    handleRevertToDraft,
    isSaving,
    isRunning: isRunningState,
    isReverting: isRevertingState,
    primaryActionLabel,
    handleSave: handlePrimarySave,
    handleSaveAs: handlePrimarySave,
  };
};
