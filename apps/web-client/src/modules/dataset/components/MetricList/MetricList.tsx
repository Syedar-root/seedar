import { useState, useMemo } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import {
  DatasetMetricResponse,
  DatasetFieldResponse,
  MetricType,
} from "#pkg/seedar/types";
import { Switch } from "@/core/components/ui/Switch";
import { MetricDialog } from "./components/MetricDialog";
import { MetricListProps } from "./types";
import { getMetricTypeLabel } from "./utils/metricExpression";
import styles from "./MetricList.module.scss";

type DisplayMode = "business" | "original";

const resolveExpression = (
  expression: string,
  fields: DatasetFieldResponse[],
  metrics: DatasetMetricResponse[],
  mode: DisplayMode,
): string => {
  if (!expression) return "";

  const fieldMap = new Map<number, DatasetFieldResponse>();
  fields.forEach((field) => {
    fieldMap.set(field.id, field);
  });

  const metricMap = new Map<number, DatasetMetricResponse>();
  metrics.forEach((metric) => {
    metricMap.set(metric.id, metric);
  });

  let resolved = expression;

  resolved = resolved.replace(/#F(\d+)/g, (match, idStr) => {
    const id = parseInt(idStr, 10);
    const field = fieldMap.get(id);
    if (!field) return match;

    if (mode === "business") {
      return field.businessName || field.name;
    }
    return field.tableName ? `${field.tableName}.${field.name}` : field.name;
  });

  resolved = resolved.replace(/#M(\d+)/g, (match, idStr) => {
    const id = parseInt(idStr, 10);
    const metric = metricMap.get(id);
    if (!metric) return match;

    if (mode === "business") {
      return metric.businessName || metric.alias || metric.name;
    }
    return metric.alias || metric.name;
  });

  return resolved;
};

const getMetricTypeClass = (
  metricType?: DatasetMetricResponse["metricType"],
): string => {
  switch (metricType) {
    case MetricType.AGGREGATE:
      return styles.typeAggregate;
    case MetricType.ROW_LEVEL:
      return styles.typeRowLevel;
    case MetricType.POST_AGGREGATE:
      return styles.typePostAggregate;
    case MetricType.ARITHMETIC:
      return styles.typeArithmetic;
    case MetricType.PERIOD_OVER_PERIOD:
      return styles.typePeriod;
    default:
      return styles.typeDefault;
  }
};

export const MetricList = ({
  metrics,
  fields,
  onAddMetric,
  onUpdateMetric,
  onRemoveMetric,
}: MetricListProps) => {
  const [displayMode, setDisplayMode] = useState<DisplayMode>("business");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMetric, setEditMetric] = useState<
    DatasetMetricResponse | undefined
  >();

  const resolvedMetrics = useMemo(() => {
    return metrics.map((metric) => ({
      ...metric,
      resolvedExpression: metric.expression
        ? resolveExpression(metric.expression, fields, metrics, displayMode)
        : null,
    }));
  }, [metrics, fields, displayMode]);

  const handleAddMetric = () => {
    setEditMetric(undefined);
    setDialogOpen(true);
  };

  const handleEditMetric = (metric: DatasetMetricResponse) => {
    setEditMetric(metric);
    setDialogOpen(true);
  };

  const handleSaveMetric = (metric: DatasetMetricResponse) => {
    if (editMetric) {
      onUpdateMetric(editMetric.id, metric);
    } else {
      onAddMetric(metric);
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditMetric(undefined);
  };

  if (!metrics || metrics.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <span className={styles.count}>共 0 个指标</span>
            <button className={styles.addButton} onClick={handleAddMetric}>
              <Plus size={14} />
              新建指标
            </button>
          </div>
          <div className={styles.switchContainer}>
            <span className={styles.switchLabel}>业务名称</span>
            <Switch
              checked={displayMode === "business"}
              onCheckedChange={(checked) =>
                setDisplayMode(checked ? "business" : "original")
              }
            />
          </div>
        </div>
        <div className={styles.emptyState}>
          <p className={styles.emptyText}>暂无指标</p>
        </div>
        {dialogOpen && (
          <MetricDialog
            open={dialogOpen}
            onClose={handleCloseDialog}
            onSave={handleSaveMetric}
            fields={fields}
            metrics={metrics}
            editMetric={editMetric}
          />
        )}
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.count}>共 {metrics.length} 个指标</span>
          <button className={styles.addButton} onClick={handleAddMetric}>
            <Plus size={14} />
            新建指标
          </button>
        </div>
        <div className={styles.switchContainer}>
          <span className={styles.switchLabel}>业务名称</span>
          <Switch
            checked={displayMode === "business"}
            onCheckedChange={(checked) =>
              setDisplayMode(checked ? "business" : "original")
            }
          />
        </div>
      </div>

      <div className={styles.list}>
        {resolvedMetrics.map((metric) => (
          <div key={metric.id} className={styles.metricItem}>
            <div className={styles.metricHeader}>
              <div className={styles.metricInfo}>
                <span className={styles.metricName}>
                  {metric.businessName || metric.name}
                </span>
                <span
                  className={`${styles.typeTag} ${getMetricTypeClass(metric.metricType)}`}
                >
                  {getMetricTypeLabel(metric.metricType)}
                </span>
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
            <div className={styles.expression}>
              {metric.resolvedExpression || "-"}
            </div>
            {metric.description && (
              <p className={styles.metricDesc}>{metric.description}</p>
            )}
          </div>
        ))}
      </div>

      {dialogOpen && (
        <MetricDialog
          open={dialogOpen}
          onClose={handleCloseDialog}
          onSave={handleSaveMetric}
          fields={fields}
          metrics={metrics}
          editMetric={editMetric}
        />
      )}
    </div>
  );
};
