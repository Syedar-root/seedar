import { DatasetMetricResponse, MetricType, MetricAggregateFunction } from "#pkg/seedar/types";
import styles from "./MetricList.module.scss";

interface MetricListProps {
  metrics: DatasetMetricResponse[];
}

const getMetricTypeLabel = (type: MetricType): string => {
  const typeMap: Record<MetricType, string> = {
    [MetricType.ROW_LEVEL]: "行级指标",
    [MetricType.AGGREGATE]: "聚合指标",
    [MetricType.POST_AGGREGATE]: "后聚合指标",
    [MetricType.ARITHMETIC]: "算术指标",
    [MetricType.PERIOD_OVER_PERIOD]: "同环比指标",
  };
  return typeMap[type] || type;
};

const getAggregateLabel = (func: MetricAggregateFunction): string => {
  const funcMap: Record<MetricAggregateFunction, string> = {
    [MetricAggregateFunction.SUM]: "SUM",
    [MetricAggregateFunction.COUNT]: "COUNT",
    [MetricAggregateFunction.AVG]: "AVG",
    [MetricAggregateFunction.MAX]: "MAX",
    [MetricAggregateFunction.MIN]: "MIN",
    [MetricAggregateFunction.DISTINCT_COUNT]: "COUNT(DISTINCT)",
  };
  return funcMap[func] || func;
};

const getMetricFormula = (metric: DatasetMetricResponse): string => {
  if (metric.metricType === MetricType.AGGREGATE && metric.aggregateFunction) {
    const distinct = metric.distinct ? "DISTINCT " : "";
    const column = metric.dataSourceColumnName || "?";
    return `${getAggregateLabel(metric.aggregateFunction)}(${distinct}${column})`;
  }

  if (metric.metricType === MetricType.ARITHMETIC) {
    const left = metric.leftMetricName || metric.leftOperandFieldName || "?";
    const op = metric.arithmeticOperator || "?";
    const right = metric.rightMetricOperandFieldName || "?";
    return `${left} ${op} ${right}`;
  }

  if (metric.metricType === MetricType.ROW_LEVEL) {
    const left = metric.leftOperandFieldName || "?";
    const op = metric.rowOperator || "?";
    const right = metric.rightOperandFieldName || metric.rightOperand?.toString() || "?";
    return `${left} ${op} ${right}`;
  }

  return "-";
};

export const MetricList = ({ metrics }: MetricListProps) => {
  if (!metrics || metrics.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p className={styles.emptyText}>暂无指标</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {metrics.map((metric) => (
        <div key={metric.id} className={styles.metricItem}>
          <div className={styles.metricHeader}>
            <span className={styles.metricName}>{metric.businessName || metric.name}</span>
            <span className={styles.metricType}>{getMetricTypeLabel(metric.metricType)}</span>
          </div>
          <div className={styles.metricFormula}>{getMetricFormula(metric)}</div>
          {metric.description && (
            <p className={styles.metricDesc}>{metric.description}</p>
          )}
        </div>
      ))}
    </div>
  );
};
