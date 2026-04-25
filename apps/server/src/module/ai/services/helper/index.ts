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
const loadPrompt = async (promptName: string, mode?: string) => {
  const candidatePaths = mode
    ? [
        path.join(__dirname, `../prompts/${promptName}.${mode}.md`),
        path.join(__dirname, `../prompts/${promptName}.md`),
      ]
    : [path.join(__dirname, `../prompts/${promptName}.md`)];

  for (const promptPath of candidatePaths) {
    try {
      return await fs.readFile(promptPath, 'utf8');
    } catch (error) {
      const nodeError = error as NodeJS.ErrnoException;
      if (nodeError.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  throw new Error(
    `Prompt not found: ${promptName}${mode ? ` (mode: ${mode})` : ''}`,
  );
};
export { getDatasetInfoCompact, loadSkill, loadPrompt };
