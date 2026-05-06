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

const getDatasourceInfoSchema = z.object({
  datasourceId: z.union([z.string(), z.number()]).describe('数据源 ID'),
});

type GetDatasourceInfoParams = z.infer<typeof getDatasourceInfoSchema>;

const operatorList = [
  '=',
  '!=',
  '>',
  '>=',
  '<',
  '<=',
  'in',
  'not_in',
  'between',
  'not_between',
  'like',
  'not_like',
  'is_null',
  'is_not_null',
  'recent_days',
  'recent_weeks',
  'recent_months',
] as const;

const timeGrainList = ['day', 'week', 'month', 'quarter', 'year'] as const;
const periodTypeList = [
  'day_over_day',
  'week_over_week',
  'month_over_month',
  'quarter_over_quarter',
  'year_over_year',
] as const;
const calculationModeList = ['percentage', 'absolute', 'both'] as const;
const orderDirectionList = ['asc', 'desc'] as const;

const baseDimensionSchema = z.object({
  fieldId: z.number(),
  alias: z
    .string()
    .optional()
    .describe('普通字段维度请尽量不要传 alias；仅派生维度需要强制 alias'),
});

const timeGrainDimensionSchema = z.object({
  derivedKind: z.literal('time_grain'),
  fieldId: z.number(),
  grain: z.enum(timeGrainList),
  alias: z.string(),
});

const bucketDimensionSchema = z.object({
  derivedKind: z.literal('bucket'),
  fieldId: z.number(),
  ranges: z.array(
    z.object({
      lt: z.number(),
      label: z.string(),
    }),
  ),
  defaultLabel: z.string().optional(),
  alias: z.string(),
});

const mappingDimensionSchema = z.object({
  derivedKind: z.literal('mapping'),
  fieldId: z.number(),
  rules: z.array(
    z.object({
      in: z.array(z.union([z.string(), z.number(), z.boolean()])),
      label: z.string(),
    }),
  ),
  defaultLabel: z.string().optional(),
  alias: z.string(),
});

const expressionDimensionSchema = z.object({
  derivedKind: z.literal('expression'),
  expression: z.string(),
  alias: z.string(),
});

const queryDimensionSchema = z.union([
  z.number(),
  baseDimensionSchema,
  timeGrainDimensionSchema,
  bucketDimensionSchema,
  mappingDimensionSchema,
  expressionDimensionSchema,
]);

const queryMetricSchema = z.object({
  id: z.number(),
  alias: z.string().optional(),
});

const queryFilterSchema = z.object({
  fieldId: z.number(),
  op: z.enum(operatorList),
  value: z.any().optional(),
  raw: z.boolean().optional(),
});

const tempMetricSchema = z.object({
  id: z.string(),
  type: z.literal('period_comparison').optional(),
  alias: z.string().optional(),
  businessName: z.string().optional(),
  baseMetricId: z.number(),
  timeFieldId: z.number().optional(),
  periodType: z.enum(periodTypeList).optional(),
  calculationMode: z.enum(calculationModeList).optional(),
});

const orderBySchema = z.object({
  fieldId: z.number().optional(),
  metricId: z.number().optional(),
  tempMetricId: z.string().optional(),
  alias: z.string().optional(),
  field: z.string().optional(),
  dir: z.enum(orderDirectionList).optional(),
  direction: z.enum(orderDirectionList).optional(),
});

const getDataAtTempSchema = z.object({
  dsl: z.object({
    datasetId: z.union([z.string(), z.number()]).describe('数据集 ID'),
    tableId: z.number().optional().describe('主表 ID；V2 中可选，无法自动推导时再显式指定'),
    dimensions: z
      .array(queryDimensionSchema)
      .describe('维度列表，支持普通字段维度与 derivedKind 派生维度')
      .optional(),
    metrics: z.array(queryMetricSchema).describe('指标列表').optional(),
    filters: z.array(queryFilterSchema).describe('筛选条件列表').optional(),
    tempMetrics: z
      .array(tempMetricSchema)
      .describe('临时指标列表，当前主要用于 period_comparison 同环比指标')
      .optional(),
    orderBy: z
      .array(orderBySchema)
      .describe('排序列表，支持 fieldId、metricId、tempMetricId、alias 排序')
      .optional(),
    topN: z.number().int().positive().optional().describe('TopN 语义糖，必须配合 orderBy'),
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
  getDatasourceInfoSchema,
  getDatasetInfoSchema,
  startWorkflowSchema,
  toolMarketExecutorSchema,
  type AskQuestionParams,
  type GetDataAtTempParams,
  type GetDatasourceInfoParams,
  type GetDatasetInfoParams,
  type StartWorkflowParams,
  type ToolMarketExecutorParams,
};
