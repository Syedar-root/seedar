import { Operator } from '@metric-engine/core';
import {
  FRONTEND_WORKFLOW_TEMPLATES,
  type AskQuestionItem,
  type StartWorkflowRequest,
} from '@seedar/types';
import z from 'zod';

const supportedWorkflowIds = new Set(
  FRONTEND_WORKFLOW_TEMPLATES.map((template) => template.id),
);

const getDatasetInfoSchema = z.object({
  datasetId: z.union([z.string(), z.number()]).describe('数据集 ID'),
});

type GetDatasetInfoParams = z.infer<typeof getDatasetInfoSchema>;

const operatorList = ['=', '!=', '>', '>=', '<', '<='] as const;

const getDataAtTempSchema = z.object({
  dsl: z.object({
    datasetId: z.union([z.string(), z.number()]).describe('数据集 ID'),
    tableId: z.number().describe('主表 ID'),
    dimensions: z.array(z.number()).describe('维度 ID 列表').optional(),
    metrics: z
      .array(z.object({ id: z.number() }))
      .describe('指标 ID 列表')
      .optional(),
    filters: z
      .array(
        z.object({
          fieldId: z.number(),
          op: z.enum(operatorList),
          value: z.any(),
          raw: z.boolean().optional(),
        }),
      )
      .describe('筛选条件列表')
      .optional(),
    limit: z.number().optional(),
    offset: z.number().optional(),
  }),
});

type GetDataAtTempParams = z.infer<typeof getDataAtTempSchema>;

const askQuestionSchema = z.object({
  questions: z
    .array(
      z.object({
        question: z.string().describe('用户问题'),
        type: z
          .enum(['confirm', 'choice', 'text'])
          .describe('问题类型'),
        options: z
          .array(
            z.object({
              label: z.string().describe('选项标签'),
              value: z.string().describe('选项值'),
              description: z.string().describe('选项描述').optional(),
              isOther: z.boolean().default(false).describe('是否为其他选项'),
            }),
          )
          .describe('选项列表')
          .optional(),
        multiple: z.boolean().optional().describe('是否支持多选'),
      }),
    )
    .describe('用户问题列表'),
});

type AskQuestionInputItem = Omit<AskQuestionItem, 'id'>;

type AskQuestionParams = {
  questions: AskQuestionInputItem[];
};

const startWorkflowSchema = z.object({
  workflowId: z
    .string()
    .refine((value) => supportedWorkflowIds.has(value), {
      message: '不支持的 workflow 模板 ID',
    })
    .describe('要执行的 workflow 模板 ID'),
  params: z.record(z.string(), z.any()).optional().describe('workflow 启动参数'),
});

type StartWorkflowParams = StartWorkflowRequest;

const toolMarketExecutorSchema = z.object({
  toolName: z.string().describe('工具名称'),
  toolParams: z.any().describe('工具参数'),
});

type ToolMarketExecutorParams = z.infer<typeof toolMarketExecutorSchema>;

export {
  askQuestionSchema,
  getDataAtTempSchema,
  getDatasetInfoSchema,
  startWorkflowSchema,
  toolMarketExecutorSchema,
  type AskQuestionParams,
  type GetDataAtTempParams,
  type GetDatasetInfoParams,
  type StartWorkflowParams,
  type ToolMarketExecutorParams,
};
