import { SeedarPanel } from "#pkg/seedar/ui-react";
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

export const PanelPage = () => {
  const { panelId } = useParams();
  const navigate = useNavigate();

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

  return panelId ? (
    <div className={styles.container}>
      <aside className={styles.sidebar}>
        <Aside
          fields={datasetData?.fields || []}
          metrics={datasetData?.metrics || []}
          datasetId={datasetData?.id}
          onMetricCreated={handleMetricCreated}
        />
      </aside>
      <aside className={styles.editor}>
        <PanelEditor
          fields={dropFields}
          metrics={dropMetrics}
          config={editorConfig}
          displayType={displayType}
          onChange={handleEditorChange}
        />
      </aside>
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
            panel={
              panelData
                ? ({
                    ...panelData,
                    type:
                      displayType === "table" || displayType === "card"
                        ? displayType
                        : "chart",
                    config: previewSpec,
                  } as any)
                : undefined
            }
          />
        </main>
      </main>
    </div>
  ) : (
    <DatasetSelector datasets={datasets || []} onSelect={handleSelectDataset} />
  );
};
