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
          datasetName: undefined,
        })),
        fields: response.fields.map((field) => ({
          ...field,
          datasourceColumnId: undefined,
        })),
        metrics: response.metrics.map((metric) => ({
          ...metric,
          expression: undefined,
        })),
      }
    : null;
export { getDatasetInfoCompact };
