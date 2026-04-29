import type {
  AiChatScene,
  DatasetResponse,
  ExecuteQueryResponse,
  PanelQueryStatePayload,
  QueryDSL,
} from "#pkg/seedar/types";
import { PanelStatus } from "#pkg/seedar/types";
import type { SegmentedValue } from "antd/es/segmented";
import type { ComponentProps, RefObject } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { useAiChatScenesStore } from "@/core/store";
import { useWorkflowActionConsumer } from "@/core/workflow";
import { Aside } from "../components/aside";
import { DatasetSelector } from "../components/datasetSelector";
import { EditableTitle } from "../components/editableTitle";
import { PanelEditor } from "../components/panelEditor";
import type {
  ChartType,
  DisplayPanelType,
} from "../components/panelEditor/types";
import { QueryZone } from "../components/queryZone/queryZone";
import type { PanelEditorSnapshot } from "./usePanelEditorStateComposed.hook";
import { useDatasetSelector } from "./useDatasetSelector";
import { usePanelActions } from "./usePanelActions";
import { usePanelEditorState } from "./usePanelEditorStateComposed.hook";
import { usePreviewSpec } from "./usePreviewSpec";
import {
  buildCurrentDsl,
  buildMetricsWithPopConfig,
  buildPreviewPanel,
  copyTextToClipboard,
  getLayoutMode,
  getPreviewRowCount,
  getViewportMode,
  PANEL_PAGE_COPY,
  PANEL_WORKFLOW_ADVANCED_SPEC_DISPLAY_TYPES,
  PANEL_STATUS_LABELS,
  PANEL_WORKFLOW_DISPLAY_TYPES,
  type LayoutMode,
  type PreviewPanel,
  type SidePaneKey,
} from "../utils/panelPage.utils";

interface PanelWorkflowSnapshot {
  editor: PanelEditorSnapshot;
  isDatasetDialogOpen: boolean;
  pendingSelectedDataset?: DatasetResponse;
}

interface WorkflowPreviewContext {
  hasDataset: boolean;
  canRun: boolean;
  buildDsl?: (baseDsl?: QueryDSL) => QueryDSL | undefined;
  baseDsl?: QueryDSL;
  runPreview: (dsl?: QueryDSL) => Promise<ExecuteQueryResponse | undefined>;
}

interface PanelPageActions {
  onPrimarySave: () => void;
  onRevertToDraft: () => void;
  onRun: () => void;
  onCopySql: () => void;
  isPrimaryDisabled: boolean;
  isRevertDisabled: boolean;
  isRunDisabled: boolean;
  isCopySqlDisabled: boolean;
}

interface PanelPageLayout {
  mode: LayoutMode;
  activePane: SidePaneKey;
  canExpand: boolean;
  showCollapsedClose: boolean;
  handlePaneChange: (value: SegmentedValue) => void;
  handleCollapse: (pane: SidePaneKey) => void;
  handleExpand: () => void;
  handleOpenFromRail: () => void;
  handleCloseToRail: () => void;
}

interface PanelPageWorkflowConfirm {
  visible: boolean;
  bannerLabel: string;
  bannerTitle: string;
  bannerDescription: string;
  discardLabel: string;
  acceptLabel: string;
  onDiscard: () => void;
  onAccept: () => void;
  isActionDisabled: boolean;
}

interface PanelPageHeader {
  titleProps: ComponentProps<typeof EditableTitle>;
  panelStatusLabel: string;
  primaryActionLabel: string;
  isPublished: boolean;
}

interface PanelPagePreview {
  panel?: PreviewPanel;
  displayType: DisplayPanelType;
  tempData: ReturnType<typeof usePanelEditorState>["tempData"];
  formatting: ReturnType<typeof usePanelEditorState>["editorConfig"]["formatting"];
  cardConfig: ReturnType<typeof usePanelEditorState>["editorConfig"]["card"];
  emptyText: string;
  panelId?: string;
}

export interface UsePanelPageViewModelReturn {
  containerRef: RefObject<HTMLDivElement>;
  layout: PanelPageLayout;
  header: PanelPageHeader;
  actions: PanelPageActions;
  workflowConfirm: PanelPageWorkflowConfirm;
  preview: PanelPagePreview;
  copy: Pick<
    typeof PANEL_PAGE_COPY,
    | "sideFields"
    | "sideEditor"
    | "collapse"
    | "expand"
    | "railOpen"
  >;
  asideProps: ComponentProps<typeof Aside>;
  panelEditorProps: ComponentProps<typeof PanelEditor>;
  queryZoneProps: ComponentProps<typeof QueryZone>;
  datasetDialog: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectorProps: ComponentProps<typeof DatasetSelector>;
  };
}

interface WorkflowError {
  code: string;
  message: string;
}

const createWorkflowError = (code: string, message: string): WorkflowError => ({
  code,
  message,
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

/**
 * 聚合 PanelPage 所需的业务状态与事件，确保页面层仅负责布局和组件编排。
 */
export const usePanelPageViewModel = (): UsePanelPageViewModelReturn => {
  const setAiChatScenes = useAiChatScenesStore((state) => state.setScenes);
  const clearAiChatScenes = useAiChatScenesStore((state) => state.clearScenes);
  const { panelId: rawPanelId } = useParams();
  const panelId = rawPanelId === "create" ? undefined : rawPanelId;
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [activePane, setActivePane] = useState<SidePaneKey>("aside");
  const [desktopPreference, setDesktopPreference] =
    useState<Exclude<LayoutMode, "fullCollapsed">>("expanded");
  const [isNarrowPaneOpen, setIsNarrowPaneOpen] = useState(false);
  const [isDatasetDialogOpen, setIsDatasetDialogOpen] = useState(false);
  const [hasPendingWorkflowChanges, setHasPendingWorkflowChanges] =
    useState(false);
  const workflowSnapshotRef = useRef<PanelWorkflowSnapshot | null>(null);
  const workflowPreviewContextRef = useRef<WorkflowPreviewContext>({
    hasDataset: false,
    canRun: false,
    runPreview: async () => undefined,
  });

  const {
    dimensionItems,
    dropFields,
    dropMetrics,
    dropFilters,
    tempMetrics,
    sortItems,
    topN,
    displayType,
    editorConfig,
    tempData,
    panelData,
    queryData,
    datasetData,
    handleDropField,
    handleRemoveField,
    handleDropMetric,
    handleRemoveMetric,
    handleDropFilter,
    handleRemoveFilter,
    handleUpdateFilter,
    handleAddDerivedDimension,
    handleUpdateDerivedDimension,
    handleUpdateTempMetric,
    handleRemoveTempMetric,
    handleApplySortConfig,
    handleEditorChange,
    handleSaveItemFormatting,
    handleRemoveItemFormatting,
    title,
    titleConfig,
    handleTitleChange,
    panelStatus,
    selectedDataset,
    selectDataset,
    replaceDataset,
    hasDataset,
    hasQueryContent,
    canRun,
    buildDsl,
    runPreview,
    setPanelStatus,
    applyQueryState,
    createSnapshot,
    restoreSnapshot,
  } = usePanelEditorState(panelId);

  const activeDataset = selectedDataset ?? datasetData;
  const isDatasetLocked = Boolean(activeDataset?.id);
  const currentDsl = useMemo(
    () => buildCurrentDsl(buildDsl, queryData?.dsl as QueryDSL | undefined),
    [buildDsl, queryData?.dsl],
  );
  const panelScene = useMemo<AiChatScene>(
    () => ({
      path: `/panel/${panelData?.id ?? panelId ?? "create"}`,
      panelId: panelData?.id ?? panelId,
      datasetId: activeDataset?.id,
      queryId: queryData?.id,
      title,
      dsl: currentDsl,
    }),
    [
      activeDataset?.id,
      currentDsl,
      panelData?.id,
      panelId,
      queryData?.id,
      title,
    ],
  );

  const {
    datasets,
    isLoading: isDatasetsLoading,
    selectedDataset: pendingSelectedDataset,
    selectedDatasetId,
    handleSelectDataset: handlePendingDatasetSelect,
    setSelectedDataset: setPendingSelectedDataset,
  } = useDatasetSelector({
    initialSelectedDatasetId: activeDataset?.id,
  });

  const {
    handlePrimarySave,
    handleRun,
    handleRevertToDraft,
    isSaving,
    isRunning,
    isReverting,
  } = usePanelActions({
    panelId,
    panelData,
    queryData,
    datasetData: activeDataset,
    selectedDataset: activeDataset,
    panelStatus,
    dropFields,
    dropMetrics,
    dropFilters,
    displayType,
    editorConfig,
    buildDsl,
    runPreview,
    navigate,
    title,
    titleConfig,
    onStatusChange: (status) =>
      setPanelStatus(
        status === "published"
          ? PanelStatus.PUBLISHED
          : status === "draft"
            ? PanelStatus.DRAFT
            : "unsaved",
      ),
  });

  const previewSpec = usePreviewSpec(displayType, editorConfig);
  workflowPreviewContextRef.current = {
    hasDataset,
    canRun,
    buildDsl,
    baseDsl: queryData?.dsl as QueryDSL | undefined,
    runPreview,
  };

  const isPublished = panelStatus === PanelStatus.PUBLISHED;
  const panelStatusLabel = PANEL_STATUS_LABELS[panelStatus];
  const primaryActionLabel = isPublished
    ? PANEL_PAGE_COPY.saveAndUpdate
    : PANEL_PAGE_COPY.saveAndPublish;

  useEffect(() => {
    setAiChatScenes([panelScene]);

    return () => {
      clearAiChatScenes();
    };
  }, [clearAiChatScenes, panelScene, setAiChatScenes]);

  useEffect(() => {
    if (!isDatasetDialogOpen) {
      return;
    }

    setPendingSelectedDataset(activeDataset);
  }, [activeDataset, isDatasetDialogOpen, setPendingSelectedDataset]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) {
      return;
    }

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) {
        return;
      }

      setContainerWidth(entry.contentRect.width);
    });

    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const viewportMode = useMemo(
    () => getViewportMode(containerWidth),
    [containerWidth],
  );

  useEffect(() => {
    if (viewportMode !== "narrow") {
      setIsNarrowPaneOpen(false);
    }
  }, [viewportMode]);

  const layoutMode = useMemo(
    () =>
      getLayoutMode({
        containerWidth,
        desktopPreference,
        isNarrowPaneOpen,
        viewportMode,
      }),
    [containerWidth, desktopPreference, isNarrowPaneOpen, viewportMode],
  );

  const metricsWithPopFlag = useMemo(
    () => buildMetricsWithPopConfig(dropMetrics, tempMetrics),
    [dropMetrics, tempMetrics],
  );

  const getDatasetById = useCallback(
    (datasetId: number): DatasetResponse | undefined =>
      datasets.find((dataset) => dataset.id === datasetId),
    [datasets],
  );

  const applySelectedDataset = useCallback(
    (dataset: DatasetResponse) => {
      if (activeDataset) {
        replaceDataset(dataset);
        return;
      }

      selectDataset(dataset);
    },
    [activeDataset, replaceDataset, selectDataset],
  );

  const ensureDatasetChangeAllowed = useCallback(
    (dataset: DatasetResponse): "unchanged" | "changed" | "locked" | "cancelled" => {
      if (
        isDatasetLocked &&
        activeDataset?.id &&
        dataset.id !== activeDataset.id
      ) {
        return "locked";
      }

      if (activeDataset?.id === dataset.id) {
        return "unchanged";
      }

      if (activeDataset && hasQueryContent) {
        const confirmed = window.confirm(PANEL_PAGE_COPY.confirmDatasetChange);
        if (!confirmed) {
          return "cancelled";
        }
      }

      return "changed";
    },
    [activeDataset, hasQueryContent, isDatasetLocked],
  );

  const clearWorkflowSnapshot = useCallback(() => {
    workflowSnapshotRef.current = null;
    setHasPendingWorkflowChanges(false);
  }, []);

  const captureWorkflowSnapshot = useCallback(() => {
    if (workflowSnapshotRef.current) {
      return;
    }

    workflowSnapshotRef.current = {
      editor: createSnapshot(),
      isDatasetDialogOpen,
      pendingSelectedDataset,
    };
    setHasPendingWorkflowChanges(true);
  }, [createSnapshot, isDatasetDialogOpen, pendingSelectedDataset]);

  const restoreWorkflowSnapshot = useCallback(() => {
    const snapshot = workflowSnapshotRef.current;
    if (!snapshot) {
      return;
    }

    restoreSnapshot(snapshot.editor);
    setIsDatasetDialogOpen(snapshot.isDatasetDialogOpen);
    setPendingSelectedDataset(snapshot.pendingSelectedDataset);
    clearWorkflowSnapshot();
  }, [clearWorkflowSnapshot, restoreSnapshot, setPendingSelectedDataset]);

  const handlePaneChange = useCallback((value: SegmentedValue) => {
    if (value === "aside" || value === "editor") {
      setActivePane(value);
    }
  }, []);

  const handleCollapse = useCallback((pane: SidePaneKey) => {
    setActivePane(pane);
    setDesktopPreference("collapsed");
  }, []);

  const handleExpand = useCallback(() => {
    if (viewportMode !== "wide") {
      return;
    }

    setDesktopPreference("expanded");
  }, [viewportMode]);

  const handleOpenFromRail = useCallback(() => {
    setIsNarrowPaneOpen(true);
  }, []);

  const handleCloseToRail = useCallback(() => {
    setIsNarrowPaneOpen(false);
  }, []);

  const handleConfirmDatasetSelection = useCallback(() => {
    const dataset = pendingSelectedDataset;
    if (!dataset) {
      return;
    }

    const changeState = ensureDatasetChangeAllowed(dataset);
    if (changeState === "locked") {
      toast.info(PANEL_PAGE_COPY.datasetLocked);
      setIsDatasetDialogOpen(false);
      return;
    }

    if (changeState === "cancelled") {
      return;
    }

    if (changeState === "changed") {
      applySelectedDataset(dataset);
      setPendingSelectedDataset(dataset);
    }

    setIsDatasetDialogOpen(false);
  }, [
    applySelectedDataset,
    ensureDatasetChangeAllowed,
    pendingSelectedDataset,
    setPendingSelectedDataset,
  ]);

  const handleOpenDatasetSelector = useCallback(() => {
    if (isDatasetLocked) {
      toast.info(PANEL_PAGE_COPY.datasetLocked);
      return;
    }

    setIsDatasetDialogOpen(true);
  }, [isDatasetLocked]);

  const handleMetricCreated = useCallback(() => {
    toast.success(PANEL_PAGE_COPY.metricCreated);
  }, []);

  const handleAcceptWorkflowChanges = useCallback(() => {
    clearWorkflowSnapshot();
    toast.success(PANEL_PAGE_COPY.workflowChangesAccepted);
  }, [clearWorkflowSnapshot]);

  const handleDiscardWorkflowChanges = useCallback(() => {
    restoreWorkflowSnapshot();
    toast.success(PANEL_PAGE_COPY.workflowChangesDiscarded);
  }, [restoreWorkflowSnapshot]);

  const onPrimarySave = useCallback(() => {
    if (!hasDataset) {
      toast.error(PANEL_PAGE_COPY.selectDatasetFirst);
      return;
    }

    void handlePrimarySave().then((isSuccess) => {
      if (isSuccess) {
        clearWorkflowSnapshot();
      }
    });
  }, [clearWorkflowSnapshot, handlePrimarySave, hasDataset]);

  const onRun = useCallback(() => {
    if (!hasDataset) {
      toast.error(PANEL_PAGE_COPY.selectDatasetFirst);
      return;
    }

    if (!canRun) {
      toast.error(PANEL_PAGE_COPY.addDimensionOrMetric);
      return;
    }

    void handleRun();
  }, [canRun, handleRun, hasDataset]);

  const onCopySql = useCallback(() => {
    const sql = tempData?.sql?.trim();
    if (!sql) {
      toast.error(PANEL_PAGE_COPY.copySqlUnavailable);
      return;
    }

    void copyTextToClipboard(sql).then((copied) => {
      if (copied) {
        toast.success(PANEL_PAGE_COPY.copySqlSuccess);
        return;
      }

      toast.error(PANEL_PAGE_COPY.copySqlFailed);
    });
  }, [tempData?.sql]);

  const onRevertToDraft = useCallback(() => {
    void handleRevertToDraft().then((isSuccess) => {
      if (isSuccess) {
        clearWorkflowSnapshot();
      }
    });
  }, [clearWorkflowSnapshot, handleRevertToDraft]);

  const handleDatasetDialogOpenChange = useCallback(
    (open: boolean) => {
      if (open && isDatasetLocked) {
        toast.info(PANEL_PAGE_COPY.datasetLocked);
        return;
      }

      setIsDatasetDialogOpen(open);
      if (open) {
        setPendingSelectedDataset(activeDataset);
      }
    },
    [activeDataset, isDatasetLocked, setPendingSelectedDataset],
  );

  useWorkflowActionConsumer({
    page: "panel",
    onActionFailed: () => {
      restoreWorkflowSnapshot();
    },
    handlers: {
      open_dataset_selector: () => {
        captureWorkflowSnapshot();

        if (isDatasetLocked) {
          throw createWorkflowError(
            "WORKFLOW_DATASET_LOCKED",
            PANEL_PAGE_COPY.datasetLocked,
          );
        }

        setIsDatasetDialogOpen(true);
        return {
          dialogOpen: true,
        };
      },
      select_dataset: (action) => {
        captureWorkflowSnapshot();

        const datasetId = Number(action.payload?.datasetId);
        if (Number.isNaN(datasetId)) {
          throw createWorkflowError(
            "WORKFLOW_PARAM_INVALID",
            PANEL_PAGE_COPY.invalidDatasetId,
          );
        }

        const dataset = getDatasetById(datasetId);
        if (!dataset) {
          throw createWorkflowError(
            "WORKFLOW_DATASET_NOT_FOUND",
            `${PANEL_PAGE_COPY.datasetNotFound} ${datasetId}`,
          );
        }

        flushSync(() => {
          setPendingSelectedDataset(dataset);
        });

        const changeState = ensureDatasetChangeAllowed(dataset);
        if (changeState === "unchanged") {
          return {
            datasetId: dataset.id,
            datasetName: dataset.name,
            changed: false,
          };
        }

        if (changeState === "locked") {
          throw createWorkflowError(
            "WORKFLOW_DATASET_LOCKED",
            PANEL_PAGE_COPY.datasetLocked,
          );
        }

        if (changeState === "cancelled") {
          throw createWorkflowError(
            "WORKFLOW_ACTION_CANCELLED",
            PANEL_PAGE_COPY.actionCancelled,
          );
        }

        flushSync(() => {
          applySelectedDataset(dataset);
        });

        return {
          datasetId: dataset.id,
          datasetName: dataset.name,
          changed: true,
        };
      },
      confirm_dataset_selection: (action) => {
        captureWorkflowSnapshot();

        const datasetId = Number(action.payload?.datasetId);
        const dataset =
          Number.isNaN(datasetId) || datasetId <= 0
            ? pendingSelectedDataset
            : getDatasetById(datasetId);

        if (!dataset) {
          throw createWorkflowError(
            "WORKFLOW_DATASET_NOT_FOUND",
            PANEL_PAGE_COPY.pendingDatasetNotFound,
          );
        }

        flushSync(() => {
          setPendingSelectedDataset(dataset);
        });

        const changeState = ensureDatasetChangeAllowed(dataset);
        if (changeState === "locked") {
          throw createWorkflowError(
            "WORKFLOW_DATASET_LOCKED",
            PANEL_PAGE_COPY.datasetLocked,
          );
        }

        if (changeState === "cancelled") {
          throw createWorkflowError(
            "WORKFLOW_ACTION_CANCELLED",
            PANEL_PAGE_COPY.actionCancelled,
          );
        }

        if (changeState === "changed") {
          flushSync(() => {
            applySelectedDataset(dataset);
          });
        }

        flushSync(() => {
          setIsDatasetDialogOpen(false);
        });
        return {
          datasetId: dataset.id,
          changed: changeState === "changed",
        };
      },
      set_query_state: (action) => {
        captureWorkflowSnapshot();

        if (!action.payload || typeof action.payload !== "object") {
          throw createWorkflowError(
            "WORKFLOW_PARAM_INVALID",
            PANEL_PAGE_COPY.queryStatePayloadInvalid,
          );
        }

        const queryState = action.payload as PanelQueryStatePayload;
        const nextDatasetId =
          typeof queryState.datasetId === "number"
            ? queryState.datasetId
            : activeDataset?.id;
        const targetDataset =
          typeof nextDatasetId === "number"
            ? getDatasetById(nextDatasetId)
            : activeDataset;

        if (!targetDataset) {
          throw createWorkflowError(
            "WORKFLOW_DATASET_NOT_FOUND",
            PANEL_PAGE_COPY.queryStateDatasetNotFound,
          );
        }

        const isSwitchingDataset =
          activeDataset?.id !== undefined && targetDataset.id !== activeDataset.id;
        if (isSwitchingDataset) {
          const changeState = ensureDatasetChangeAllowed(targetDataset);
          if (changeState === "locked") {
            throw createWorkflowError(
              "WORKFLOW_DATASET_LOCKED",
              PANEL_PAGE_COPY.datasetLocked,
            );
          }

          if (changeState === "cancelled") {
            throw createWorkflowError(
              "WORKFLOW_ACTION_CANCELLED",
              PANEL_PAGE_COPY.actionCancelled,
            );
          }
        }

        flushSync(() => {
          applyQueryState(queryState, targetDataset);
        });

        return {
          datasetId: targetDataset.id,
          dimensions: queryState.dimensions?.length ?? 0,
          metrics: queryState.metrics?.length ?? 0,
          filters: queryState.filters?.length ?? 0,
          tempMetrics: queryState.tempMetrics?.length ?? 0,
        };
      },
      set_panel_title: (action) => {
        captureWorkflowSnapshot();

        const titlePayload = action.payload?.title;
        if (typeof titlePayload !== "string" || !titlePayload.trim()) {
          throw createWorkflowError(
            "WORKFLOW_PARAM_INVALID",
            PANEL_PAGE_COPY.invalidTitle,
          );
        }

        flushSync(() => {
          handleTitleChange(titlePayload.trim(), titleConfig);
        });
        return {
          title: titlePayload.trim(),
        };
      },
      set_display_type: (action) => {
        captureWorkflowSnapshot();

        const nextDisplayType = action.payload?.displayType;
        if (
          typeof nextDisplayType !== "string" ||
          !PANEL_WORKFLOW_DISPLAY_TYPES.includes(
            nextDisplayType as DisplayPanelType,
          )
        ) {
          throw createWorkflowError(
            "WORKFLOW_PARAM_INVALID",
            PANEL_PAGE_COPY.invalidDisplayType,
          );
        }

        flushSync(() => {
          handleEditorChange(nextDisplayType as DisplayPanelType, editorConfig);
        });
        return {
          displayType: nextDisplayType,
        };
      },
      set_advanced_spec: (action) => {
        captureWorkflowSnapshot();

        if (!isRecord(action.payload)) {
          throw createWorkflowError(
            "WORKFLOW_PARAM_INVALID",
            PANEL_PAGE_COPY.advancedSpecPayloadInvalid,
          );
        }

        const payload = action.payload;
        const spec = payload.spec;
        if (!isRecord(spec)) {
          throw createWorkflowError(
            "WORKFLOW_PARAM_INVALID",
            PANEL_PAGE_COPY.advancedSpecPayloadInvalid,
          );
        }

        const specType =
          typeof spec.type === "string" ? spec.type : undefined;
        if (!specType?.trim()) {
          throw createWorkflowError(
            "WORKFLOW_PARAM_INVALID",
            PANEL_PAGE_COPY.advancedSpecTypeInvalid,
          );
        }

        const nextDisplayType =
          displayType !== "table" && displayType !== "card"
            ? displayType
            : PANEL_WORKFLOW_ADVANCED_SPEC_DISPLAY_TYPES.includes(
                  specType as DisplayPanelType,
                )
              ? (specType as DisplayPanelType)
              : "bar";

        if (!PANEL_WORKFLOW_ADVANCED_SPEC_DISPLAY_TYPES.includes(nextDisplayType)) {
          throw createWorkflowError(
            "WORKFLOW_PARAM_INVALID",
            PANEL_PAGE_COPY.advancedSpecDisplayTypeInvalid,
          );
        }

        flushSync(() => {
          handleEditorChange(nextDisplayType as DisplayPanelType, {
            ...editorConfig,
            type: nextDisplayType as ChartType,
            isAdvancedSpecMode: true,
            advancedSpec: { ...spec },
          });
        });

        return {
          displayType: nextDisplayType,
          advancedSpecMode: true,
          specType: specType ?? null,
        };
      },
      run_preview: async () => {
        captureWorkflowSnapshot();

        const { hasDataset, canRun, buildDsl, baseDsl, runPreview } =
          workflowPreviewContextRef.current;
        if (!hasDataset) {
          throw createWorkflowError(
            "WORKFLOW_RUN_PREVIEW_INVALID",
            PANEL_PAGE_COPY.selectDatasetFirst,
          );
        }

        if (!canRun || !buildDsl) {
          throw createWorkflowError(
            "WORKFLOW_RUN_PREVIEW_INVALID",
            PANEL_PAGE_COPY.addDimensionOrMetric,
          );
        }

        const dsl = buildDsl(baseDsl);
        if (!dsl) {
          throw createWorkflowError(
            "WORKFLOW_RUN_PREVIEW_INVALID",
            PANEL_PAGE_COPY.invalidPreviewDsl,
          );
        }

        const previewResult = await runPreview(dsl);
        if (!previewResult) {
          throw createWorkflowError(
            "WORKFLOW_RUN_PREVIEW_FAILED",
            PANEL_PAGE_COPY.previewFailed,
          );
        }

        return {
          previewExecuted: true,
          rowCount: getPreviewRowCount(previewResult),
        };
      },
      save_draft: async () => {
        throw createWorkflowError(
          "WORKFLOW_ACTION_UNSUPPORTED",
          PANEL_PAGE_COPY.workflowSaveDraftUnsupported,
        );
      },
    },
  });

  const previewPanel = useMemo(
    () =>
      buildPreviewPanel({
        activeDataset,
        panelData,
        panelId,
        title,
        titleConfig,
        displayType,
        editorConfig,
        previewSpec,
        isPublished,
        queryData,
      }),
    [
      activeDataset,
      displayType,
      editorConfig,
      isPublished,
      panelData,
      panelId,
      previewSpec,
      queryData,
      title,
      titleConfig,
    ],
  );

  return {
    containerRef,
    layout: {
      mode: layoutMode,
      activePane,
      canExpand: viewportMode === "wide",
      showCollapsedClose: viewportMode === "narrow",
      handlePaneChange,
      handleCollapse,
      handleExpand,
      handleOpenFromRail,
      handleCloseToRail,
    },
    header: {
      titleProps: {
        title,
        titleConfig,
        onTitleChange: handleTitleChange,
      },
      panelStatusLabel,
      primaryActionLabel,
      isPublished,
    },
    actions: {
      onPrimarySave,
      onRevertToDraft,
      onRun,
      onCopySql,
      isPrimaryDisabled: !hasDataset || isSaving || isRunning || isReverting,
      isRevertDisabled: isSaving || isRunning || isReverting,
      isRunDisabled: !canRun || isSaving || isRunning || isReverting,
      isCopySqlDisabled: !tempData?.sql,
    },
    workflowConfirm: {
      visible: hasPendingWorkflowChanges,
      bannerLabel: PANEL_PAGE_COPY.workflowBannerLabel,
      bannerTitle: PANEL_PAGE_COPY.workflowBannerTitle,
      bannerDescription: PANEL_PAGE_COPY.workflowBannerDescription,
      discardLabel: PANEL_PAGE_COPY.workflowDiscardAction,
      acceptLabel: PANEL_PAGE_COPY.workflowAcceptAction,
      onDiscard: handleDiscardWorkflowChanges,
      onAccept: handleAcceptWorkflowChanges,
      isActionDisabled: isSaving || isRunning || isReverting,
    },
    preview: {
      panel: previewPanel,
      displayType,
      tempData,
      formatting: editorConfig.formatting,
      cardConfig: editorConfig.card,
      emptyText: PANEL_PAGE_COPY.previewEmpty,
      panelId,
    },
    copy: {
      sideFields: PANEL_PAGE_COPY.sideFields,
      sideEditor: PANEL_PAGE_COPY.sideEditor,
      collapse: PANEL_PAGE_COPY.collapse,
      expand: PANEL_PAGE_COPY.expand,
      railOpen: PANEL_PAGE_COPY.railOpen,
    },
    asideProps: {
      fields: activeDataset?.fields ?? [],
      metrics: activeDataset?.metrics ?? [],
      datasetName: activeDataset?.name,
      hasDataset,
      canChangeDataset: !isDatasetLocked,
      onOpenDatasetSelector: handleOpenDatasetSelector,
    },
    panelEditorProps: {
      fields: dimensionItems,
      metrics: dropMetrics,
      tempMetrics,
      config: editorConfig,
      displayType,
      onChange: handleEditorChange,
    },
    queryZoneProps: {
      onDropField: handleDropField,
      onDropMetric: handleDropMetric,
      onDropFilter: handleDropFilter,
      onRemoveField: handleRemoveField,
      onRemoveMetric: handleRemoveMetric,
      onRemoveFilter: handleRemoveFilter,
      onUpdateFilter: handleUpdateFilter,
      onUpdateMetricPopConfig: handleUpdateTempMetric,
      tempMetrics,
      onRemoveTempMetric: handleRemoveTempMetric,
      sortItems,
      topN,
      onApplySortConfig: handleApplySortConfig,
      onAddDerivedDimension: handleAddDerivedDimension,
      onUpdateDerivedDimension: handleUpdateDerivedDimension,
      formatting: editorConfig.formatting,
      onSaveItemFormatting: handleSaveItemFormatting,
      onRemoveItemFormatting: handleRemoveItemFormatting,
      dropFields: dimensionItems,
      dropMetrics: metricsWithPopFlag,
      dropFilters,
      availableFields: activeDataset?.fields ?? [],
    },
    datasetDialog: {
      open: isDatasetDialogOpen,
      onOpenChange: handleDatasetDialogOpenChange,
      selectorProps: {
        datasets,
        isLoading: isDatasetsLoading,
        selectedDatasetId,
        onSelectDataset: handlePendingDatasetSelect,
        onConfirm: handleConfirmDatasetSelection,
        onCancel: () => setIsDatasetDialogOpen(false),
      },
    },
  };
};
