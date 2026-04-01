import { DatasetMetricResponse, DatasetFieldResponse } from "#pkg/seedar/types";

export interface MetricListProps {
  metrics: DatasetMetricResponse[];
  fields: DatasetFieldResponse[];
  onAddMetric: (metric: DatasetMetricResponse) => void;
  onUpdateMetric: (metricId: number, metric: DatasetMetricResponse) => void;
  onRemoveMetric: (metricId: number) => void;
}
