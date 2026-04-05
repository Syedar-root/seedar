import { DatasetResponse } from '@/module/dataset/dataset.types';
import path from 'path';
import fs from 'fs/promises';

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

const loadSkill = async (skillName: string) => {
  const promptPath = path.join(__dirname, `../skills/${skillName}/SKILL.md`);
  return await fs.readFile(promptPath, 'utf8');
};
export { getDatasetInfoCompact, loadSkill };
