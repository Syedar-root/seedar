import { DatasetResponse } from '@/module/dataset/dataset.types';

const getDatasetInfoCompact = (
  response: DatasetResponse | null,
): DatasetResponse | null =>
  response
    ? {
        ...response,
        mainTable: undefined,
        tables: response.tables.map((table) => ({
          ...table,
        })),
        fields: response.fields.map((field) => ({
          ...field,
          datasourceColumnId: undefined,
        })),
        metrics: response.metrics.map((metric) => ({
          id: metric.id,
          name: metric.name,
          alias: metric.alias,
          description: metric.description,
          businessName: metric.businessName,
          metricType: metric.metricType,
          distinct: metric.distinct,
          expression: undefined,
        })),
      }
    : null;

export { getDatasetInfoCompact };
