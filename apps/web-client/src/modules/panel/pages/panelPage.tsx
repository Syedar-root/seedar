import { SeedarPanel } from "#pkg/seedar/ui-react";
import { useNavigate, useParams } from "react-router-dom";
import styles from "./styles/panel.module.scss";
import { Aside } from "../components/aside";
import { QueryZone } from "../components/queryZone";
import { PanelEditor } from "../components/panelEditor";
import { EditableTitle } from "../components/editableTitle";
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
    handleEditorChange,
    handleRun,
    title,
    handleTitleChange,
  } = usePanelEditorState(panelId);

  const { handleSave, handleSaveAs } = usePanelActions({
    panelId,
    panelData,
    queryData,
    datasetData,
    dropFields,
    dropMetrics,
    displayType,
    editorConfig,
    handleRun,
    navigate,
    title,
  });

  const previewSpec = usePreviewSpec(displayType, editorConfig);

  const onRun = () => {
    if (!dropFields.length && !dropMetrics.length) {
      toast.error("请添加维度或指标");
      return;
    }
    handleRun();
  };

  return panelId ? (
    <div className={styles.container}>
      <aside className={styles.sidebar}>
        <Aside
          fields={datasetData?.fields || []}
          metrics={datasetData?.metrics || []}
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
            <EditableTitle title={title} onTitleChange={handleTitleChange} />
          </div>
          <QueryZone
            onDropField={handleDropField}
            onDropMetric={handleDropMetric}
            onRemoveField={handleRemoveField}
            onRemoveMetric={handleRemoveMetric}
            dropFields={dropFields}
            dropMetrics={dropMetrics}
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
    <div className={styles.datasetSelector}>
      <div className={styles.datasetSelectorContent}>
        <h2 className={styles.datasetSelectorTitle}>选择数据集</h2>
        <p className={styles.datasetSelectorDesc}>
          请选择一个数据集来创建新的看板
        </p>
        <div className={styles.datasetList}>
          {datasets?.map((dataset) => (
            <button
              key={dataset.id}
              className={styles.datasetItem}
              onClick={() => handleSelectDataset(dataset)}
            >
              <div className={styles.datasetItemName}>{dataset.name}</div>
              {dataset.description && (
                <div className={styles.datasetItemDesc}>
                  {dataset.description}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
