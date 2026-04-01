import { useEffect } from "react";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { ReactFlowProvider } from "@xyflow/react";
import { Timeline } from "./Timeline";
import {
  BasicInfoStep,
  DataSourceStep,
  JoinConfigStep,
  FieldConfigStep,
  MetricConfigStep,
  ConfirmStep,
} from "./steps";
import { useDatasetEditorStore } from "../../store";
import type {
  DatasetFormData,
  EditorSteps,
  JoinConfig,
  MetricConfig,
} from "../../types/editor.types";
import type { DatasourceResponse } from "#pkg/seedar/types";
import styles from "./DatasetEditorPage.module.scss";

const STEP_LABELS: Record<EditorSteps, string> = {
  basicInfo: "基本信息",
  dataSource: "数据源与表",
  joinConfig: "关联配置",
  fieldConfig: "字段选择",
  metricConfig: "指标配置",
  confirm: "确认创建",
};

export interface DatasetEditorPageProps {
  formData: DatasetFormData;
  currentStep: EditorSteps;
  currentStepIndex: number;
  isFirstStep: boolean;
  isLastStep: boolean;
  isSubmitting: boolean;
  isCreateMode: boolean;
  steps: EditorSteps[];
  canGoNext: () => boolean;
  goToNextStep: () => void;
  goToPrevStep: () => void;
  goToStep: (step: EditorSteps) => void;
  updateFormData: (updates: Partial<DatasetFormData>) => void;
  getLockedFields: (selectedDatasource?: DatasourceResponse | null) => Set<string>;
  toggleField: (fieldId: string, lockedFields: Set<string>) => void;
  updateFieldBusinessName: (fieldId: string, businessName: string) => void;
  addJoin: (join: JoinConfig) => void;
  removeJoin: (joinId: string) => void;
  updateJoin: (joinId: string, updates: Partial<JoinConfig>) => void;
  addMetric: (metric: MetricConfig) => void;
  removeMetric: (metricId: string) => void;
  updateMetric: (metricId: string, updates: Partial<MetricConfig>) => void;
  handleSubmit: () => void;
  isLoading?: boolean;
}

export const DatasetEditorPage = (props: DatasetEditorPageProps) => {
  const {
    formData,
    currentStep,
    currentStepIndex,
    isFirstStep,
    isLastStep,
    isSubmitting,
    isCreateMode,
    steps,
    canGoNext,
    goToNextStep,
    goToPrevStep,
    goToStep,
    updateFormData,
    getLockedFields,
    toggleField,
    updateFieldBusinessName,
    addJoin,
    removeJoin,
    updateJoin,
    addMetric,
    removeMetric,
    updateMetric,
    handleSubmit,
    isLoading,
  } = props;

  const { datasource, setDatasourceId, fetchDatasource } =
    useDatasetEditorStore();

  useEffect(() => {
    const id = parseInt(formData.datasourceId, 10);
    if (id > 0) {
      setDatasourceId(id);
      fetchDatasource(id);
    }
  }, [formData.datasourceId]);

  const timelineSteps: Array<{
    key: string;
    label: string;
    status: "completed" | "active" | "pending" | "error";
  }> = steps.map((step) => ({
    key: step,
    label: STEP_LABELS[step],
    status:
      step === currentStep
        ? "active"
        : steps.indexOf(step) < currentStepIndex
          ? "completed"
          : "pending",
  }));

  const handleStepClick = (key: string) => {
    goToStep(key as EditorSteps);
  };

  const renderStepContent = () => {
    const commonProps = { formData, onUpdate: updateFormData };

    switch (currentStep) {
      case "basicInfo":
        return <BasicInfoStep {...commonProps} />;
      case "dataSource":
        return <DataSourceStep {...commonProps} />;
      case "joinConfig":
        return (
          <ReactFlowProvider>
            <JoinConfigStep
              formData={formData}
              selectedDatasource={datasource ?? undefined}
              onAddJoin={addJoin}
              onRemoveJoin={removeJoin}
              onUpdateJoin={updateJoin}
            />
          </ReactFlowProvider>
        );
      case "fieldConfig":
        return (
          <FieldConfigStep
            formData={formData}
            lockedFields={getLockedFields(datasource)}
            onToggleField={(fieldId) => toggleField(fieldId, getLockedFields(datasource))}
            onUpdateFieldBusinessName={updateFieldBusinessName}
            selectedDatasource={datasource ?? undefined}
          />
        );
      case "metricConfig":
        return (
          <MetricConfigStep
            formData={formData}
            onAddMetric={addMetric}
            onRemoveMetric={removeMetric}
            onUpdateMetric={updateMetric}
          />
        );
      case "confirm":
        return <ConfirmStep formData={formData} isSubmitting={isSubmitting} />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        <span>加载中...</span>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {isCreateMode && (
        <aside className={styles.sidebar}>
          <Timeline
            steps={timelineSteps}
            currentStep={currentStep}
            onStepClick={handleStepClick}
          />
        </aside>
      )}

      <main className={styles.mainContent}>
        <div className={styles.header}>
          <h1 className={styles.title}>
            {isCreateMode ? "创建数据集" : "编辑数据集"}
          </h1>
          <p className={styles.stepIndicator}>
            步骤 {currentStepIndex + 1} / {steps.length}：
            {STEP_LABELS[currentStep]}
          </p>
        </div>

        <div className={styles.content}>{renderStepContent()}</div>

        <div className={styles.footer}>
          <div className={styles.footerLeft}>
            {!isFirstStep && (
              <button className={styles.button} onClick={goToPrevStep}>
                <ChevronLeft size={16} />
                上一步
              </button>
            )}
          </div>

          <div className={styles.footerRight}>
            {isLastStep ? (
              <button
                className={`${styles.button} ${styles.primaryButton}`}
                onClick={handleSubmit}
                disabled={!canGoNext() || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className={styles.buttonSpinner} />
                    创建中...
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    创建数据集
                  </>
                )}
              </button>
            ) : (
              <button
                className={`${styles.button} ${styles.primaryButton}`}
                onClick={goToNextStep}
                disabled={!canGoNext()}
              >
                下一步
                <ChevronRight size={16} />
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
