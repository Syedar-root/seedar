import { Operator } from '@metric-engine/core';
import z from 'zod';

const getDatasetInfoSchema = z.object({
  datasetId: z.union([z.string(), z.number()]).describe('数据集 ID'),
});

type GetDatasetInfoParams = z.infer<typeof getDatasetInfoSchema>;

export interface QueryDSL {
  /** 数据集ID */
  datasetId: number;
  /** 主表ID */
  tableId: number;
  /** 维度 - 使用字段ID引用 */
  dimensions?: Array<number | { fieldId: number; alias?: string }>;
  /** 指标 - 使用指标ID引用 */
  metrics?: Array<{
    id: number;
    alias?: string;
  }>;
  /** 筛选条件 */
  filters?: Array<{
    fieldId: number;
    op: string;
    value?: any;
    raw?: boolean;
  }>;
  /** 限制返回的记录数（可选） */
  limit?: number;
  /** 偏移量（用于分页，可选） */
  offset?: number;
}

const OperatorList = ['=', '!=', '>', '>=', '<', '<='] as const;

const getDataAtTempSchema = z.object({
  dsl: z.object({
    datasetId: z.union([z.string(), z.number()]).describe('数据集 ID'),
    tableId: z.number().describe('主表ID'),
    dimensions: z.array(z.number()).describe('维度ID列表').optional(),
    metrics: z
      .array(z.object({ id: z.number() }))
      .describe('指标ID列表')
      .optional(),
    filters: z
      .array(
        z.object({
          fieldId: z.number(),
          op: z.enum(OperatorList),
          value: z.any(),
          raw: z.boolean().optional(),
        }),
      )
      .optional()
      .describe('筛选条件列表'),
    limit: z.number().optional(),
    offset: z.number().optional(),
  }),
});

type GetDataAtTempParams = z.infer<typeof getDataAtTempSchema>;

export {
  getDatasetInfoSchema,
  type GetDatasetInfoParams,
  getDataAtTempSchema,
  type GetDataAtTempParams,
};
