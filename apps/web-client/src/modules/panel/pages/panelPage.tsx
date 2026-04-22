import { MetricCard, SeedarPanel } from "#pkg/seedar/ui-react";
import type { DatasetResponse, PanelQueryStatePayload } from "#pkg/seedar/types";
import { PanelStatus } from "#pkg/seedar/types";
import { Dialog } from "@base-ui/react/dialog";
import { Segmented } from "antd";
import type { SegmentedValue } from "antd/es/segmented";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  executeWorkflowInterrupt,
  useWorkflowActionConsumer,
} from "@/core/workflow";
import { Aside } from "../components/aside";
import { DatasetSelector } from "../components/datasetSelector";
import datasetSelectorStyles from "../components/datasetSelector/datasetSelector.module.scss";
import { EditableTitle } from "../components/editableTitle";
import { PanelEditor } from "../components/panelEditor";
import {
  QueryZone,
  type MetricWithPopConfig,
} from "../components/queryZone/queryZone";
import type { DisplayPanelType } from "../components/panelEditor/types";
import {
  type PanelEditorSnapshot,
  useDatasetSelector,
  usePanelActions,
  usePanelEditorState,
  usePreviewSpec,
} from "../hooks";
import { serializeDimensions } from "../utils/panelEditorState";
import styles from "./styles/panel.module.scss";

type SidePaneKey = "aside" | "editor";
type LayoutMode = "expanded" | "collapsed" | "fullCollapsed";
type ViewportMode = "wide" | "medium" | "narrow";
type PreviewPanel = NonNullable<
  React.ComponentProps<typeof SeedarPanel>["panel"]
>;

const PANEL_WORKFLOW_DISPLAY_TYPES: DisplayPanelType[] = [
  "table",
  "card",
  "line",
  "bar",
  "area",
  "pie",
  "scatter",
  "radar",
];

interface PanelWorkflowSnapshot {
  editor: PanelEditorSnapshot;
  isDatasetDialogOpen: boolean;
  pendingSelectedDataset?: DatasetResponse;
}

const COLLAPSED_THRESHOLD = 1200;
const FULL_COLLAPSED_THRESHOLD = 800;
const LAYOUT_EXIT_BUFFER = 16;
const COPY = {
  statusUnsaved: "未保存",
  statusDraft: "草稿",
  statusPublished: "已发布",
  saveAndUpdate: "保存并更新",
  saveAndPublish: "保存并发布",
  confirmDatasetChange: "切换数据集会清空当前查询配置和预览结果，是否继续？",
  datasetLocked: "当前面板已绑定数据集，不能修改",
  metricCreated: "指标创建成功",
  selectDatasetFirst: "请先选择数据集",
  addDimensionOrMetric: "请添加维度或指标",
  sideFields: "字段",
  sideEditor: "编辑",
  collapse: "收起",
  expand: "展开",
  railOpen: "展开侧栏",
  smartMode: "智能模式",
  revertToDraft: "撤销为草稿",
  run: "运行",
  copySql: "复制 SQL",
  copySqlSuccess: "SQL 已复制到剪贴板",
  copySqlUnavailable: "当前没有可复制的 SQL，请先运行查询",
  copySqlFailed: "SQL 复制失败，请重试",
  previewEmpty: "先选择数据集，再构建查询并运行预览",
} as const;
const PANEL_STATUS_LABELS = {
  unsaved: COPY.statusUnsaved,
  draft: COPY.statusDraft,
  published: COPY.statusPublished,
} as const;

export const PanelPage = () => {
  const { panelId: rawPanelId } = useParams();
  const panelId = rawPanelId === "create" ? undefined : rawPanelId;
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [activePane, setActivePane] = useState<SidePaneKey>("aside");
  const [desktopPreference, setDesktopPreference] =
    useState<Exclude<LayoutMode, "fullCollapsed">>("expanded");
  const [isNarrowPaneOpen, setIsNarrowPaneOpen] = useState(false);
  const [isDatasetDialogOpen, setIsDatasetDialogOpen] = useState(false);
  const [hasPendingWorkflowChanges, setHasPendingWorkflowChanges] =
    useState(false);
  const workflowSnapshotRef = useRef<PanelWorkflowSnapshot | null>(null);

  const {
    dimensionItems,
    dropFields,
    dropMetrics,
    dropFilters,
    tempMetrics,
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
  const isPublished = panelStatus === PanelStatus.PUBLISHED;
  const panelStatusLabel = PANEL_STATUS_LABELS[panelStatus];
  const primaryActionLabel = isPublished
    ? COPY.saveAndUpdate
    : COPY.saveAndPublish;
  const isDevMode = import.meta.env.DEV;

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

  const viewportMode = useMemo<ViewportMode>(() => {
    if (containerWidth <= FULL_COLLAPSED_THRESHOLD) {
      return "narrow";
    }

    if (containerWidth <= COLLAPSED_THRESHOLD) {
      return "medium";
    }

    return "wide";
  }, [containerWidth]);

  useEffect(() => {
    if (viewportMode !== "narrow") {
      setIsNarrowPaneOpen(false);
    }
  }, [viewportMode]);

  const layoutMode = useMemo<LayoutMode>(() => {
    if (viewportMode === "narrow") {
      return isNarrowPaneOpen ? "collapsed" : "fullCollapsed";
    }

    if (viewportMode === "medium") {
      return "collapsed";
    }

    if (desktopPreference === "collapsed") {
      return "collapsed";
    }

    if (containerWidth > COLLAPSED_THRESHOLD + LAYOUT_EXIT_BUFFER) {
      return "expanded";
    }

    return "collapsed";
  }, [containerWidth, desktopPreference, isNarrowPaneOpen, viewportMode]);

  const canExpand = viewportMode === "wide";
  const showCollapsedClose = viewportMode === "narrow";

  // 标记哪些普通指标已配置了同环比
  const metricsWithPopFlag = useMemo<MetricWithPopConfig[]>(
    () =>
      dropMetrics.map((metric) => ({
        ...metric,
        hasPopConfig: tempMetrics.some(
          (tm) => tm.baseMetricId === Number(metric.id),
        ),
      })),
    [dropMetrics, tempMetrics],
  );

  const handlePaneChange = (value: SegmentedValue) => {
    if (value === "aside" || value === "editor") {
      setActivePane(value);
    }
  };

  const handleCollapse = (pane: SidePaneKey) => {
    setActivePane(pane);
    setDesktopPreference("collapsed");
  };

  const handleExpand = () => {
    if (!canExpand) {
      return;
    }

    setDesktopPreference("expanded");
  };

  const handleOpenFromRail = () => {
    setIsNarrowPaneOpen(true);
  };

  const handleCloseToRail = () => {
    setIsNarrowPaneOpen(false);
  };

  const handleConfirmDatasetSelection = () => {
    const dataset = pendingSelectedDataset;
    if (!dataset) {
      return;
    }

    if (
      isDatasetLocked &&
      activeDataset?.id &&
      dataset.id !== activeDataset.id
    ) {
      toast.info(COPY.datasetLocked);
      setIsDatasetDialogOpen(false);
      return;
    }

    if (activeDataset?.id === dataset.id) {
      setIsDatasetDialogOpen(false);
      return;
    }

    if (activeDataset && hasQueryContent) {
      const confirmed = window.confirm(COPY.confirmDatasetChange);
      if (!confirmed) {
        return;
      }
    }

    if (activeDataset) {
      replaceDataset(dataset);
    } else {
      selectDataset(dataset);
    }

    setPendingSelectedDataset(dataset);
    setIsDatasetDialogOpen(false);
  };

  const handleOpenDatasetSelector = () => {
    if (isDatasetLocked) {
      toast.info(COPY.datasetLocked);
      return;
    }

    setIsDatasetDialogOpen(true);
  };

  const handleMetricCreated = () => {
    toast.success(COPY.metricCreated);
  };

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

  const handleAcceptWorkflowChanges = () => {
    clearWorkflowSnapshot();
    toast.success("已接受本次 AI 修改");
  };

  const handleDiscardWorkflowChanges = () => {
    restoreWorkflowSnapshot();
    toast.success("已撤销本次 AI 修改");
  };

  const onPrimarySave = () => {
    if (!hasDataset) {
      toast.error(COPY.selectDatasetFirst);
      return;
    }

    void handlePrimarySave().then((success) => {
      if (success) {
        clearWorkflowSnapshot();
      }
    });
  };

  const onRun = () => {
    if (!hasDataset) {
      toast.error(COPY.selectDatasetFirst);
      return;
    }

    if (!canRun) {
      toast.error(COPY.addDimensionOrMetric);
      return;
    }

    void handleRun();
  };

  const onCopySql = () => {
    const sql = tempData?.sql?.trim();
    if (!sql) {
      toast.error(COPY.copySqlUnavailable);
      return;
    }

    if (navigator.clipboard?.writeText) {
      void navigator.clipboard
        .writeText(sql)
        .then(() => {
          toast.success(COPY.copySqlSuccess);
        })
        .catch(() => {
          toast.error(COPY.copySqlFailed);
        });
      return;
    }

    const textarea = document.createElement("textarea");
    textarea.value = sql;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    const copied = document.execCommand("copy");
    document.body.removeChild(textarea);

    if (copied) {
      toast.success(COPY.copySqlSuccess);
      return;
    }

    toast.error(COPY.copySqlFailed);
  };

  const onRevertToDraft = () => {
    void handleRevertToDraft().then((success) => {
      if (success) {
        clearWorkflowSnapshot();
      }
    });
  };

  const buildMockQueryState = useCallback((): PanelQueryStatePayload | null => {
    if (!activeDataset?.id) {
      return null;
    }

    const currentDimensions = serializeDimensions(dimensionItems);
    const currentDimensionFieldIds = new Set(
      currentDimensions
        .map((dimension) => ("fieldId" in dimension ? dimension.fieldId : undefined))
        .filter((fieldId): fieldId is number => typeof fieldId === "number"),
    );
    const currentMetricIds = new Set(
      dropMetrics
        .map((metric) => Number(metric.id))
        .filter((metricId) => !Number.isNaN(metricId)),
    );

    const nextDimensionField =
      activeDataset.fields.find((field) => !currentDimensionFieldIds.has(field.id)) ??
      activeDataset.fields[0];
    const nextMetric =
      activeDataset.metrics.find((metric) => !currentMetricIds.has(metric.id)) ??
      activeDataset.metrics[0];

    if (!nextDimensionField || !nextMetric) {
      return null;
    }

    return {
      datasetId: activeDataset.id,
      dimensions: [
        {
          fieldId: nextDimensionField.id,
          alias: undefined,
          name: nextDimensionField.name,
          businessName: nextDimensionField.businessName,
        },
      ],
      metrics: [
        {
          id: nextMetric.id,
          alias: undefined,
          name: nextMetric.name,
          businessName: nextMetric.businessName,
        },
      ],
      filters: [],
      tempMetrics: [],
    };
  }, [activeDataset, dimensionItems, dropMetrics]);

  const handleMockWorkflow = useCallback(async () => {
    const queryState = buildMockQueryState();
    if (!queryState) {
      toast.error("请先选择数据集后再测试 workflow");
      return;
    }

    const interruptId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `mock-workflow-${Date.now()}`;

    const result = await executeWorkflowInterrupt(
      {
        kind: "workflow_run",
        interruptId,
        request: {
          workflowId: "query_current_panel_as_table_v1",
          params: {
            queryState,
          },
        },
      },
      {
        navigate,
      },
    );

    if (result.status === "done") {
      toast.success("Mock workflow 执行成功");
      return;
    }

    toast.error(result.error?.message || "Mock workflow 执行失败");
  }, [buildMockQueryState, navigate]);

  useWorkflowActionConsumer({
    page: "panel",
    onActionFailed: () => {
      restoreWorkflowSnapshot();
    },
    handlers: {
      open_dataset_selector: () => {
        captureWorkflowSnapshot();

        if (isDatasetLocked) {
          throw {
            code: "WORKFLOW_DATASET_LOCKED",
            message: COPY.datasetLocked,
          };
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
          throw {
            code: "WORKFLOW_PARAM_INVALID",
            message: "缺少合法的 datasetId，无法选择数据集",
          };
        }

        const dataset = datasets.find((item) => item.id === datasetId);
        if (!dataset) {
          throw {
            code: "WORKFLOW_DATASET_NOT_FOUND",
            message: `找不到数据集 ${datasetId}`,
          };
        }

        setPendingSelectedDataset(dataset);

        if (activeDataset?.id === dataset.id) {
          return {
            datasetId: dataset.id,
            datasetName: dataset.name,
            changed: false,
          };
        }

        if (activeDataset && hasQueryContent) {
          const confirmed = window.confirm(COPY.confirmDatasetChange);
          if (!confirmed) {
            throw {
              code: "WORKFLOW_ACTION_CANCELLED",
              message: "用户取消了数据集切换",
            };
          }
        }

        if (activeDataset) {
          replaceDataset(dataset);
        } else {
          selectDataset(dataset);
        }

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
            : datasets.find((item) => item.id === datasetId);

        if (!dataset) {
          throw {
            code: "WORKFLOW_DATASET_NOT_FOUND",
            message: "未找到待确认的数据集",
          };
        }

        setPendingSelectedDataset(dataset);

        if (
          isDatasetLocked &&
          activeDataset?.id &&
          dataset.id !== activeDataset.id
        ) {
          throw {
            code: "WORKFLOW_DATASET_LOCKED",
            message: COPY.datasetLocked,
          };
        }

        if (activeDataset?.id === dataset.id) {
          setIsDatasetDialogOpen(false);
          return {
            datasetId: dataset.id,
            changed: false,
          };
        }

        if (activeDataset && hasQueryContent) {
          const confirmed = window.confirm(COPY.confirmDatasetChange);
          if (!confirmed) {
            throw {
              code: "WORKFLOW_ACTION_CANCELLED",
              message: "用户取消了数据集切换",
            };
          }
        }

        if (activeDataset) {
          replaceDataset(dataset);
        } else {
          selectDataset(dataset);
        }

        setIsDatasetDialogOpen(false);
        return {
          datasetId: dataset.id,
          changed: true,
        };
      },
      set_query_state: (action) => {
        captureWorkflowSnapshot();

        if (!action.payload || typeof action.payload !== "object") {
          throw {
            code: "WORKFLOW_PARAM_INVALID",
            message: "缺少合法的 queryState payload",
          };
        }

        const queryState = action.payload as PanelQueryStatePayload;
        const nextDatasetId =
          typeof queryState.datasetId === "number"
            ? queryState.datasetId
            : activeDataset?.id;
        const targetDataset =
          typeof nextDatasetId === "number"
            ? datasets.find((item) => item.id === nextDatasetId)
            : activeDataset;

        if (!targetDataset) {
          throw {
            code: "WORKFLOW_DATASET_NOT_FOUND",
            message: "未找到 queryState 对应的数据集",
          };
        }

        if (
          activeDataset?.id &&
          targetDataset.id !== activeDataset.id &&
          isDatasetLocked
        ) {
          throw {
            code: "WORKFLOW_DATASET_LOCKED",
            message: COPY.datasetLocked,
          };
        }

        if (
          activeDataset?.id &&
          targetDataset.id !== activeDataset.id &&
          hasQueryContent
        ) {
          const confirmed = window.confirm(COPY.confirmDatasetChange);
          if (!confirmed) {
            throw {
              code: "WORKFLOW_ACTION_CANCELLED",
              message: "用户取消了数据集切换",
            };
          }
        }

        applyQueryState(queryState, targetDataset);

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
          throw {
            code: "WORKFLOW_PARAM_INVALID",
            message: "缺少合法的 title，无法设置图表标题",
          };
        }

        handleTitleChange(titlePayload.trim(), titleConfig);
        return {
          title: titlePayload.trim(),
        };
      },
      set_display_type: (action) => {
        captureWorkflowSnapshot();

        const displayType = action.payload?.displayType;
        if (
          typeof displayType !== "string" ||
          !PANEL_WORKFLOW_DISPLAY_TYPES.includes(displayType as DisplayPanelType)
        ) {
          throw {
            code: "WORKFLOW_PARAM_INVALID",
            message: "缺少合法的 displayType，无法设置图表类型",
          };
        }

        handleEditorChange(displayType as DisplayPanelType, editorConfig);
        return {
          displayType,
        };
      },
      run_preview: async () => {
        captureWorkflowSnapshot();

        const success = await handleRun();
        if (!success) {
          throw {
            code: "WORKFLOW_RUN_PREVIEW_FAILED",
            message: "图表预览执行失败",
          };
        }

        return {
          previewExecuted: true,
        };
      },
      save_draft: async () => {
        throw {
          code: "WORKFLOW_ACTION_UNSUPPORTED",
          message: "当前前端未实现 workflow save_draft，请改用临时状态承接后再提交",
        };
      },
    },
  });

  const previewPanel: PreviewPanel | undefined = activeDataset
    ? {
        id: panelData?.id ?? panelId ?? "__draft_panel__",
        title,
        titleConfig,
        type:
          displayType === "table" || displayType === "card"
            ? displayType
            : "chart",
        status: isPublished ? PanelStatus.PUBLISHED : PanelStatus.DRAFT,
        queryId: panelData?.queryId ?? queryData?.id,
        config:
          displayType === "table" || displayType === "card"
            ? editorConfig
            : previewSpec,
        createdAt: panelData?.createdAt ?? new Date(),
        updatedAt: panelData?.updatedAt ?? new Date(),
      }
    : undefined;

  const asideContent = (
    <Aside
      fields={activeDataset?.fields || []}
      metrics={activeDataset?.metrics || []}
      datasetId={activeDataset?.id}
      datasetName={activeDataset?.name}
      hasDataset={hasDataset}
      canChangeDataset={!isDatasetLocked}
      onOpenDatasetSelector={handleOpenDatasetSelector}
      onMetricCreated={handleMetricCreated}
    />
  );

  const editorContent = (
    <PanelEditor
      fields={dimensionItems}
      metrics={dropMetrics}
      tempMetrics={tempMetrics}
      config={editorConfig}
      displayType={displayType}
      onChange={handleEditorChange}
    />
  );

  return (
    <div ref={containerRef} className={styles.container}>
      {layoutMode === "expanded" ? (
        <>
          <aside className={styles.sidebar}>
            <div className={styles.sideHeader}>
              <span className={styles.sideTitle}>{COPY.sideFields}</span>
              <button
                type="button"
                className={styles.sideAction}
                onClick={() => handleCollapse("aside")}
              >
                {COPY.collapse}
              </button>
            </div>
            <div className={styles.sideContent}>{asideContent}</div>
          </aside>
          <aside className={styles.editor}>
            <div className={styles.sideHeader}>
              <span className={styles.sideTitle}>{COPY.sideEditor}</span>
              <button
                type="button"
                className={styles.sideAction}
                onClick={() => handleCollapse("editor")}
              >
                {COPY.collapse}
              </button>
            </div>
            <div className={styles.sideContent}>{editorContent}</div>
          </aside>
        </>
      ) : layoutMode === "collapsed" ? (
        <aside className={styles.collapsedPane}>
          <div className={styles.collapsedSwitchWrap}>
            {canExpand ? (
              <button
                type="button"
                className={styles.expandAction}
                onClick={handleExpand}
              >
                {COPY.expand}
              </button>
            ) : null}
            <Segmented
              block
              value={activePane}
              onChange={handlePaneChange}
              options={[
                { label: COPY.sideFields, value: "aside" },
                { label: COPY.sideEditor, value: "editor" },
              ]}
            />
            {showCollapsedClose ? (
              <button
                type="button"
                className={styles.closeRailAction}
                onClick={handleCloseToRail}
              >
                {COPY.collapse}
              </button>
            ) : null}
          </div>
          <div className={styles.collapsedContent}>
            {activePane === "aside" ? asideContent : editorContent}
          </div>
        </aside>
      ) : (
        <aside className={styles.fullCollapsedRail}>
          <button
            type="button"
            className={styles.railButton}
            onClick={handleOpenFromRail}
            aria-label={COPY.railOpen}
            title={COPY.railOpen}
          >
            <span className={styles.railButtonIcon} aria-hidden="true">
              {"<"}
            </span>
          </button>
        </aside>
      )}
      <main className={styles.main}>
        <header className={styles.mainHeader}>
          <div className={styles.titleArea}>
            <div className={styles.titleMeta}>
              <EditableTitle
                title={title}
                titleConfig={titleConfig}
                onTitleChange={handleTitleChange}
              />
              <span className={styles.statusBadge}>{panelStatusLabel}</span>
            </div>
          </div>
          <QueryZone
            onDropField={handleDropField}
            onDropMetric={handleDropMetric}
            onDropFilter={handleDropFilter}
            onRemoveField={handleRemoveField}
            onRemoveMetric={handleRemoveMetric}
            onRemoveFilter={handleRemoveFilter}
            onUpdateFilter={handleUpdateFilter}
            onUpdateMetricPopConfig={handleUpdateTempMetric}
            tempMetrics={tempMetrics}
            onRemoveTempMetric={handleRemoveTempMetric}
            onAddDerivedDimension={handleAddDerivedDimension}
            onUpdateDerivedDimension={handleUpdateDerivedDimension}
            formatting={editorConfig.formatting}
            onSaveItemFormatting={handleSaveItemFormatting}
            onRemoveItemFormatting={handleRemoveItemFormatting}
            dropFields={dimensionItems}
            dropMetrics={metricsWithPopFlag}
            dropFilters={dropFilters}
            availableFields={activeDataset?.fields || []}
          />
          <div className={styles.operations}>
            {isDevMode ? (
              <button
                className={styles.secondaryAction}
                onClick={() => {
                  void handleMockWorkflow();
                }}
                disabled={isSaving || isRunning || isReverting}
              >
                Mock AI 表格流程
              </button>
            ) : null}
            {hasPendingWorkflowChanges ? (
              <>
                <button
                  className={styles.secondaryAction}
                  onClick={handleDiscardWorkflowChanges}
                  disabled={isSaving || isRunning || isReverting}
                >
                  撤销 AI 修改
                </button>
                <button
                  className={styles.secondaryAction}
                  onClick={handleAcceptWorkflowChanges}
                  disabled={isSaving || isRunning || isReverting}
                >
                  接受 AI 修改
                </button>
              </>
            ) : null}
            <button
              className={styles.save}
              onClick={onPrimarySave}
              disabled={!hasDataset || isSaving || isRunning || isReverting}
            >
              {primaryActionLabel}
            </button>
            {isPublished ? (
              <button
                className={styles.secondaryAction}
                onClick={onRevertToDraft}
                disabled={isSaving || isRunning || isReverting}
              >
                {COPY.revertToDraft}
              </button>
            ) : null}
            <button
              className={styles.run}
              onClick={onRun}
              disabled={!canRun || isSaving || isRunning || isReverting}
            >
              {COPY.run}
            </button>
            <button
              className={styles.secondaryAction}
              onClick={onCopySql}
              disabled={!tempData?.sql}
            >
              {COPY.copySql}
            </button>
          </div>
        </header>

        <main className={styles.mainContent}>
          {previewPanel ? (
            displayType === "card" ? (
              <div className={styles.cardPreviewShell}>
                <MetricCard
                  className={styles.cardPreviewCard}
                  queryId={previewPanel.queryId}
                  data={tempData}
                  formatting={editorConfig.formatting}
                  config={editorConfig.card}
                />
              </div>
            ) : (
              <SeedarPanel
                showHeader={false}
                panelId={panelId ?? previewPanel.id}
                data={tempData}
                panel={previewPanel}
              />
            )
          ) : (
            <div className={styles.previewEmpty}>{COPY.previewEmpty}</div>
          )}
        </main>
      </main>
      <Dialog.Root
        open={isDatasetDialogOpen}
        onOpenChange={(open) => {
          if (open && isDatasetLocked) {
            toast.info(COPY.datasetLocked);
            return;
          }

          setIsDatasetDialogOpen(open);
          if (open) {
            setPendingSelectedDataset(activeDataset);
          }
        }}
      >
        <Dialog.Portal>
          <Dialog.Backdrop className={datasetSelectorStyles.dialogBackdrop} />
          <Dialog.Popup className={datasetSelectorStyles.dialogPopup}>
            <DatasetSelector
              datasets={datasets}
              isLoading={isDatasetsLoading}
              selectedDatasetId={selectedDatasetId}
              onSelectDataset={handlePendingDatasetSelect}
              onConfirm={handleConfirmDatasetSelection}
              onCancel={() => setIsDatasetDialogOpen(false)}
            />
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
};
