import {
  DatasetMetricResponse,
  DatasetResponse,
} from '@/module/dataset/dataset.types';
import { DatasourceResponse } from '@/module/datasource/dto/datasource.response';
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

const getDatasourceInfoCompact = (
  response: DatasourceResponse | null,
): DatasourceResponse | null =>
  response
    ? {
        ...response,
        tables: response.tables?.map((table) => ({
          tableId: table.tableId,
          tableName: table.tableName,
          columns: table.columns.map((column) => ({
            columnId: column.columnId,
            columnName: column.columnName,
            rawDataType: column.rawDataType,
            normalizedType: column.normalizedType,
            nullable: column.nullable,
            isPrimaryKey: column.isPrimaryKey,
          })),
        })),
        foreignKeys: response.foreignKeys?.map((foreignKey) => ({
          fkName: foreignKey.fkName,
          sourceTableName: foreignKey.sourceTableName,
          sourceColumnName: foreignKey.sourceColumnName,
          targetTableName: foreignKey.targetTableName,
          targetColumnName: foreignKey.targetColumnName,
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
export {
  getDatasetInfoCompact,
  getDatasourceInfoCompact,
  loadSkill,
  loadPrompt,
};
