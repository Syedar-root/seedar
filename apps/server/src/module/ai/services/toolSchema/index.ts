import { Operator } from '@metric-engine/core';
import z from 'zod';

const getDatasetInfoSchema = z.object({
  datasetId: z.union([z.string(), z.number()]).describe('数据集 ID'),
});

type GetDatasetInfoParams = z.infer<typeof getDatasetInfoSchema>;

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

interface AskQuestion {
  // 一次可以提多个问题
  questions: Array<{
    // 问题描述
    question: string;
    // 问题类型
    type: 'confirm' | 'radio' | 'checkbox' | 'text';
    // 选项：radio/checkbox 才需要
    options?: string[];
  }>;
}

const askQuestionSchema = z.object({
  questions: z
    .array(
      z
        .object({
          question: z.string().describe('用户问题'),
          type: z
            .enum(['confirm', 'choice', 'text'])
            .describe(
              '问题类型，confirm/choice/text，confirm为确认问题，choice为单选/多选问题，text为文本问题',
            ),
          options: z
            .array(
              z.object({
                label: z.string().describe('选项标签'),
                value: z
                  .string()
                  .describe('选项值, 用于提交时识别, 一般和选项标签一致'),
                description: z.string().describe('选项描述').optional(),
                isOther: z
                  .boolean()
                  .default(false)
                  .describe(
                    '是否为「其他」选项, 有时需要用户补充选项，默认false',
                  ),
              }),
            )
            .describe('选项列表')
            .optional(),
          multiple: z.boolean().optional().describe('是否为多选问题'),
        })
        .refine(
          (data) => {
            if (data.type === 'choice') {
              return Array.isArray(data.options) && data.options.length > 0;
            }
            return true;
          },
          { message: 'radio/checkbox类型的问题需要选项列表' },
        ),
    )
    .describe('用户问题列表'),
});

type AskQuestionParams = z.infer<typeof askQuestionSchema>;

export {
  getDatasetInfoSchema,
  type GetDatasetInfoParams,
  getDataAtTempSchema,
  type GetDataAtTempParams,
  askQuestionSchema,
  type AskQuestionParams,
};
