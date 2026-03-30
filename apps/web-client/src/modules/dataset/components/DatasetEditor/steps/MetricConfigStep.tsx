import { Plus, Pencil, Trash2 } from "lucide-react";
import type { DatasetFormData, MetricConfig } from "../../../types/editor.types";
import styles from "./MetricConfigStep.module.scss";

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

  if (isWideTable) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <p className={styles.emptyText}>
            宽表型数据集不支持指标配置
          </p>
        </div>
      </div>
    );
  }

  const handleAddMetric = () => {
    const newMetric: MetricConfig = {
      id: `metric-${Date.now()}`,
      name: "",
      expression: "",
      description: "",
    };
    onAddMetric(newMetric);
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
                <span className={styles.metricName}>
                  {metric.name || "未命名指标"}
                </span>
                <div className={styles.metricActions}>
                  <button className={styles.actionBtn}>
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

              <div className={styles.metricForm}>
                <div className={styles.field}>
                  <label className={styles.label}>指标名称</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={metric.name}
                    onChange={(e) =>
                      onUpdateMetric(metric.id, { name: e.target.value })
                    }
                    placeholder="请输入指标名称"
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>表达式</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={metric.expression}
                    onChange={(e) =>
                      onUpdateMetric(metric.id, {
                        expression: e.target.value,
                      })
                    }
                    placeholder="请输入指标表达式"
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>描述</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={metric.description || ""}
                    onChange={(e) =>
                      onUpdateMetric(metric.id, {
                        description: e.target.value,
                      })
                    }
                    placeholder="请输入指标描述（可选）"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};