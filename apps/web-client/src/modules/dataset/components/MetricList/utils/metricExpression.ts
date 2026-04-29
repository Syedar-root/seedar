import { DatasetMetricResponse, MetricType } from "#pkg/seedar/types";

const METRIC_TYPE_LABELS: Record<string, string> = {
  [MetricType.AGGREGATE]: "聚合",
  [MetricType.ROW_LEVEL]: "行级",
  [MetricType.POST_AGGREGATE]: "后聚合",
  [MetricType.ARITHMETIC]: "算术",
  [MetricType.PERIOD_OVER_PERIOD]: "同比环比",
};

export const getMetricTypeLabel = (metricType?: DatasetMetricResponse["metricType"]) =>
  metricType ? METRIC_TYPE_LABELS[metricType] || metricType : "未分类";
