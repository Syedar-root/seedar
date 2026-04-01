import { Plus, Pencil, Trash2 } from "lucide-react";
import { useState, useMemo } from "react";
import type {
  DatasetFormData,
  MetricConfig,
} from "../../../../types/editor.types";
import styles from "./MetricConfigStep.module.scss";
import { MetricDialog } from "./MetricDialog";
import { useFormulaParser } from "./useFormulaParser";

interface MetricConfigStepProps {
  formData: DatasetFormData;
  onAddMetric: (metric: MetricConfig) => void;
  onRemoveMetric: (metricId: string) => void;
  onUpdateMetric: (metricId: string, updates: Partial<MetricConfig>) => void;
}

export const MetricConfigStep = ({
  formData,
  onAddMetric,
  onRemoveMetric,
  onUpdateMetric,
}: MetricConfigStepProps) => {
  const isWideTable = formData.type === "wideTable";
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMetric, setEditMetric] = useState<MetricConfig | undefined>();

  const { toDisplay } = useFormulaParser({
    fields: formData.fields as any,
    metrics: formData.metrics as any,
  });

  if (isWideTable) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <p className={styles.emptyText}>宽表型数据集不支持指标配置</p>
        </div>
      </div>
    );
  }

  const handleAddMetric = () => {
    setEditMetric(undefined);
    setDialogOpen(true);
  };

  const handleEditMetric = (metric: MetricConfig) => {
    setEditMetric(metric);
    setDialogOpen(true);
  };

  const handleSaveMetric = (metric: MetricConfig) => {
    if (editMetric) {
      onUpdateMetric(metric.id, metric);
    } else {
      onAddMetric(metric);
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditMetric(undefined);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h3 className={styles.title}>指标配置</h3>
          <p className={styles.hint}>
            定义数据集的指标。指标只能引用已选择的字段。
          </p>
        </div>
        <button className={styles.addButton} onClick={handleAddMetric}>
          <Plus size={14} />
          新建指标
        </button>
      </div>

      {formData.metrics.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyText}>暂未配置指标</p>
        </div>
      ) : (
        <div className={styles.metricList}>
          {formData.metrics.map((metric) => (
            <div key={metric.id} className={styles.metricItem}>
              <div className={styles.metricHeader}>
                <div className={styles.metricInfo}>
                  <span className={styles.metricName}>
                    {metric.name || "未命名指标"}
                  </span>
                  {metric.businessName && (
                    <span className={styles.metricBusinessName}>
                      ({metric.businessName})
                    </span>
                  )}
                </div>
                <div className={styles.metricActions}>
                  <button
                    className={styles.actionBtn}
                    onClick={() => handleEditMetric(metric)}
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    className={styles.actionBtn}
                    onClick={() => onRemoveMetric(metric.id)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className={styles.metricExpression}>
                <span className={styles.expressionLabel}>表达式:</span>
                <span className={styles.expressionValue}>
                  {toDisplay(metric.expression)}
                </span>
              </div>

              {metric.description && (
                <div className={styles.metricDescription}>
                  <span className={styles.descriptionLabel}>描述:</span>
                  <span className={styles.descriptionValue}>
                    {metric.description}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <MetricDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        onSave={handleSaveMetric}
        fields={formData.fields}
        metrics={formData.metrics}
        editMetric={editMetric}
      />
    </div>
  );
};
