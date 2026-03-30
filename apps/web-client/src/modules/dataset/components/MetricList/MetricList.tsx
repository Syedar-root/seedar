import { useState, useMemo } from "react";
import { DatasetMetricResponse, DatasetFieldResponse } from "#pkg/seedar/types";
import { Switch } from "@/core/components/ui/Switch";
import styles from "./MetricList.module.scss";

interface MetricListProps {
  metrics: DatasetMetricResponse[];
  fields: DatasetFieldResponse[];
}

type DisplayMode = "business" | "original";

const resolveExpression = (
  expression: string,
  fields: DatasetFieldResponse[],
  metrics: DatasetMetricResponse[],
  mode: DisplayMode,
): string => {
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

export const MetricList = ({ metrics, fields }: MetricListProps) => {
  const [displayMode, setDisplayMode] = useState<DisplayMode>("business");

  const resolvedMetrics = useMemo(() => {
    return metrics.map((metric) => ({
      ...metric,
      resolvedExpression: metric.expression
        ? resolveExpression(metric.expression, fields, metrics, displayMode)
        : null,
    }));
  }, [metrics, fields, displayMode]);

  if (!metrics || metrics.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p className={styles.emptyText}>暂无指标</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.count}>共 {metrics.length} 个指标</span>
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
              <span className={styles.metricName}>
                {metric.businessName || metric.name}
              </span>
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
    </div>
  );
};
