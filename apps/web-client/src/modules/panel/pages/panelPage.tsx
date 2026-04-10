import { SeedarPanel } from "#pkg/seedar/ui-react";
import { Segmented } from "antd";
import type { SegmentedValue } from "antd/es/segmented";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import styles from "./styles/panel.module.scss";
import { Aside } from "../components/aside";
import { QueryZone } from "../components/queryZone";
import { PanelEditor } from "../components/panelEditor";
import { EditableTitle } from "../components/editableTitle";
import { DatasetSelector } from "../components/datasetSelector";
import { toast } from "sonner";
import {
  usePanelEditorState,
  usePanelActions,
  useDatasetSelector,
  usePreviewSpec,
} from "../hooks";

type SidePaneKey = "aside" | "editor";
type LayoutMode = "expanded" | "collapsed" | "fullCollapsed";
type ViewportMode = "wide" | "medium" | "narrow";
type PreviewPanel = NonNullable<
  React.ComponentProps<typeof SeedarPanel>["panel"]
>;

const COLLAPSED_THRESHOLD = 1200;
const FULL_COLLAPSED_THRESHOLD = 800;
const LAYOUT_EXIT_BUFFER = 16;

export const PanelPage = () => {
  const { panelId } = useParams();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [activePane, setActivePane] = useState<SidePaneKey>("aside");
  const [desktopPreference, setDesktopPreference] = useState<
    Exclude<LayoutMode, "fullCollapsed">
  >("expanded");
  const [isNarrowPaneOpen, setIsNarrowPaneOpen] = useState(false);

  const { datasets, handleSelectDataset } = useDatasetSelector(navigate);

  const {
    dropFields,
    dropMetrics,
    dropFilters,
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
    handleEditorChange,
    handleRun,
    title,
    titleConfig,
    handleTitleChange,
  } = usePanelEditorState(panelId);

  const { handleSave, handleSaveAs } = usePanelActions({
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
    titleConfig,
  });

  const previewSpec = usePreviewSpec(displayType, editorConfig);

  const onRun = () => {
    if (!dropFields.length && !dropMetrics.length) {
      toast.error("请添加维度或指标");
      return;
    }
    handleRun();
  };

  const handleMetricCreated = () => {
    toast.success("指标创建成功");
  };

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

  const previewPanel: PreviewPanel | undefined = panelData
    ? {
        ...panelData,
        type:
          displayType === "table" || displayType === "card"
            ? displayType
            : "chart",
        config: previewSpec,
      }
    : undefined;

  const asideContent = (
    <Aside
      fields={datasetData?.fields || []}
      metrics={datasetData?.metrics || []}
      datasetId={datasetData?.id}
      onMetricCreated={handleMetricCreated}
    />
  );

  const editorContent = (
    <PanelEditor
      fields={dropFields}
      metrics={dropMetrics}
      config={editorConfig}
      displayType={displayType}
      onChange={handleEditorChange}
    />
  );

  return panelId ? (
    <div ref={containerRef} className={styles.container}>
      {layoutMode === "expanded" ? (
        <>
          <aside className={styles.sidebar}>
            <div className={styles.sideHeader}>
              <span className={styles.sideTitle}>字段</span>
              <button
                type="button"
                className={styles.sideAction}
                onClick={() => handleCollapse("aside")}
              >
                收起
              </button>
            </div>
            <div className={styles.sideContent}>{asideContent}</div>
          </aside>
          <aside className={styles.editor}>
            <div className={styles.sideHeader}>
              <span className={styles.sideTitle}>编辑</span>
              <button
                type="button"
                className={styles.sideAction}
                onClick={() => handleCollapse("editor")}
              >
                收起
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
                展开
              </button>
            ) : null}
            <Segmented
              block
              value={activePane}
              onChange={handlePaneChange}
              options={[
                { label: "字段", value: "aside" },
                { label: "编辑", value: "editor" },
              ]}
            />
            {showCollapsedClose ? (
              <button
                type="button"
                className={styles.closeRailAction}
                onClick={handleCloseToRail}
              >
                收起
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
            aria-label="展开侧栏"
            title="展开侧栏"
          >
            <span className={styles.railButtonIcon} aria-hidden="true">
              ⟩
            </span>
          </button>
        </aside>
      )}
      <main className={styles.main}>
        <header className={styles.mainHeader}>
          <div className={styles.titleArea}>
            <EditableTitle
              title={title}
              titleConfig={titleConfig}
              onTitleChange={handleTitleChange}
            />
            <div className={styles.smartMode}>智能模式</div>
          </div>
          <QueryZone
            onDropField={handleDropField}
            onDropMetric={handleDropMetric}
            onDropFilter={handleDropFilter}
            onRemoveField={handleRemoveField}
            onRemoveMetric={handleRemoveMetric}
            onRemoveFilter={handleRemoveFilter}
            onUpdateFilter={handleUpdateFilter}
            dropFields={dropFields}
            dropMetrics={dropMetrics}
            dropFilters={dropFilters}
          />
          <div className={styles.operations}>
            <button className={styles.save} onClick={handleSave}>
              保存
            </button>
            <button className={styles.saveAs} onClick={handleSaveAs}>
              另存为
            </button>
            <button className={styles.run} onClick={onRun}>
              运行
            </button>
          </div>
        </header>

        <main className={styles.mainContent}>
          <SeedarPanel
            showHeader={false}
            panelId={panelId}
            data={tempData}
            panel={previewPanel}
          />
        </main>
      </main>
    </div>
  ) : (
    <DatasetSelector datasets={datasets || []} onSelect={handleSelectDataset} />
  );
};
