import { z } from 'zod';
import {
  PeriodCalculationMode,
  PeriodOverPeriodType,
} from '../dataset';
import {
  type PanelWorkflowSetItemFormattingPayload,
  type PanelQueryStateDimensionPayload,
  type PanelQueryStateFilterPayload,
  type PanelQueryStateMetricPayload,
  type PanelQueryStateOrderByPayload,
  type PanelQueryStatePayload,
  type PanelQueryStateTempMetricPayload,
  type PanelWorkflowSetAdvancedSpecPayload,
} from './ai-workflow.types';

// ----------------------------------------------------------------------------
// Shared schema helpers
// ----------------------------------------------------------------------------

const panelQueryStateDimensionPayloadSchema:
  z.ZodType<PanelQueryStateDimensionPayload> = z.object({
    fieldId: z.number().int().optional(),
    alias: z
      .string()
      .optional()
      .describe(
        'legacy alias (base field dimensions should avoid alias; use derived dimensions when a renamed field is required)',
      ),
    name: z.string().optional(),
    businessName: z.string().optional(),
    dimensionDsl: z.record(z.string(), z.unknown()).optional(),
  });

const panelQueryStateMetricPayloadSchema:
  z.ZodType<PanelQueryStateMetricPayload> = z.object({
    id: z.number().int(),
    alias: z.string().optional(),
    name: z.string().optional(),
    businessName: z.string().optional(),
  });

const panelQueryStateFilterPayloadSchema:
  z.ZodType<PanelQueryStateFilterPayload> = z.object({
    fieldId: z.number().int(),
    op: z.string(),
    value: z.unknown(),
    raw: z.boolean().optional(),
  });

const panelQueryStateTempMetricPayloadSchema:
  z.ZodType<PanelQueryStateTempMetricPayload> = z.object({
    id: z.string().optional(),
    alias: z.string(),
    businessName: z.string().optional(),
    expression: z.string().optional(),
    dataType: z.string().optional(),
    format: z.string().optional(),
    baseMetricId: z.number().int().optional(),
    timeFieldId: z.number().int().optional(),
    periodType: z.nativeEnum(PeriodOverPeriodType).optional(),
    calculationMode: z.nativeEnum(PeriodCalculationMode).optional(),
    popConfig: z.record(z.string(), z.unknown()).optional(),
  });

const panelQueryStateOrderByPayloadSchema:
  z.ZodType<PanelQueryStateOrderByPayload> = z.object({
    fieldId: z.number().int().optional(),
    metricId: z.number().int().optional(),
    tempMetricId: z.string().optional(),
    alias: z.string().optional(),
    field: z.string().optional(),
    dir: z.enum(['asc', 'desc']).optional(),
    direction: z.enum(['asc', 'desc']).optional(),
  });

export const panelQueryStatePayloadSchema: z.ZodType<PanelQueryStatePayload> =
  z.object({
    datasetId: z.number().int().optional(),
    dimensions: z.array(panelQueryStateDimensionPayloadSchema).optional(),
    metrics: z.array(panelQueryStateMetricPayloadSchema).optional(),
    filters: z.array(panelQueryStateFilterPayloadSchema).optional(),
    tempMetrics: z.array(panelQueryStateTempMetricPayloadSchema).optional(),
    orderBy: z.array(panelQueryStateOrderByPayloadSchema).optional(),
    topN: z.number().int().positive().optional(),
  });

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const buildPanelQueryStateFromRecord = (record: Record<string, unknown>) =>
  isRecord(record.queryState)
    ? { ...record.queryState }
    : {
        datasetId: record.datasetId,
        dimensions: record.dimensions,
        metrics: record.metrics,
        filters: record.filters,
        tempMetrics: record.tempMetrics,
        orderBy: record.orderBy,
        topN: record.topN,
      };

// ----------------------------------------------------------------------------
// Template: query_current_panel_as_table_v1
// ----------------------------------------------------------------------------

export interface QueryCurrentPanelAsTableWorkflowParams
  extends Record<string, unknown> {
  set_query_state: PanelQueryStatePayload;
}

const normalizeQueryCurrentPanelAsTableWorkflowParams = (
  input: unknown,
): QueryCurrentPanelAsTableWorkflowParams | unknown => {
  if (!isRecord(input)) {
    return input;
  }

  const record = input;
  if (isRecord(record.set_query_state)) {
    return record;
  }

  return {
    set_query_state: buildPanelQueryStateFromRecord(record),
  };
};

export const queryCurrentPanelAsTableWorkflowParamsSchema:
  z.ZodType<QueryCurrentPanelAsTableWorkflowParams> = z.preprocess(
    normalizeQueryCurrentPanelAsTableWorkflowParams,
    z.object({
      set_query_state: panelQueryStatePayloadSchema,
    }),
  );

// ----------------------------------------------------------------------------
// Template: query_current_panel_as_chart_v1
// ----------------------------------------------------------------------------

const panelWorkflowSetAdvancedSpecPayloadSchema:
  z.ZodType<PanelWorkflowSetAdvancedSpecPayload> = z
    .object({
      spec: z.record(z.string(), z.unknown()),
    })
    .superRefine((payload, ctx) => {
      if (
        typeof payload.spec.type !== 'string' ||
        payload.spec.type.trim().length === 0
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'set_advanced_spec.spec.type 必须是非空字符串',
          path: ['spec', 'type'],
        });
      }

      if (Object.prototype.hasOwnProperty.call(payload.spec, 'data')) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            'set_advanced_spec.spec 不允许包含 data；当前面板数据会由前端自动注入，请只传 spec 结构与字段映射',
          path: ['spec', 'data'],
        });
      }
    });

const panelWorkflowSetItemFormattingRulePayloadSchema = z.object({
  id: z.string().optional(),
  target: z.object({
    kind: z.enum([
      'field',
      'metric',
      'derived_dimension',
      'temp_metric',
      'unknown',
    ]),
    datasetId: z.number().int().optional(),
    id: z.string().optional(),
    key: z.string().optional(),
  }),
  role: z.enum(['dimension', 'metric']),
  kind: z.enum(['number', 'percent', 'currency', 'date', 'datetime']),
  enabled: z.boolean().optional(),
  decimals: z.number().int().min(0).max(20).optional(),
  useGrouping: z.boolean().optional(),
  currency: z.string().optional(),
  percentInput: z.enum(['ratio', 'percent']).optional(),
});

const panelWorkflowSetItemFormattingPayloadSchema:
  z.ZodType<PanelWorkflowSetItemFormattingPayload> = z
    .object({
      rule: panelWorkflowSetItemFormattingRulePayloadSchema.optional(),
      rules: z.array(panelWorkflowSetItemFormattingRulePayloadSchema).optional(),
    })
    .superRefine((payload, ctx) => {
      if (!payload.rule && (!payload.rules || payload.rules.length === 0)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'set_item_formatting 至少需要提供 rule 或 rules',
          path: ['rule'],
        });
      }
    });

export interface QueryCurrentPanelAsChartWorkflowParams
  extends Record<string, unknown> {
  set_advanced_spec: PanelWorkflowSetAdvancedSpecPayload;
}

const normalizeQueryCurrentPanelAsChartWorkflowParams = (
  input: unknown,
): QueryCurrentPanelAsChartWorkflowParams | unknown => {
  if (!isRecord(input)) {
    return input;
  }

  const record = input;
  const advancedSpecPayload = isRecord(record.set_advanced_spec)
    ? record.set_advanced_spec
    : isRecord(record.advancedSpec)
      ? { spec: record.advancedSpec }
      : isRecord(record.spec)
        ? { spec: record.spec }
        : isRecord(record.chartSpec)
          ? { spec: record.chartSpec }
          : undefined;

  return {
    set_advanced_spec: advancedSpecPayload,
  };
};

export const queryCurrentPanelAsChartWorkflowParamsSchema:
  z.ZodType<QueryCurrentPanelAsChartWorkflowParams> = z.preprocess(
    normalizeQueryCurrentPanelAsChartWorkflowParams,
    z.object({
      set_advanced_spec: panelWorkflowSetAdvancedSpecPayloadSchema,
    }),
  );

// ----------------------------------------------------------------------------
// Template: query_current_panel_dsl_only_v1
// ----------------------------------------------------------------------------

export interface QueryCurrentPanelDslOnlyWorkflowParams
  extends Record<string, unknown> {
  set_query_state: PanelQueryStatePayload;
}

const normalizeQueryCurrentPanelDslOnlyWorkflowParams = (
  input: unknown,
): QueryCurrentPanelDslOnlyWorkflowParams | unknown => {
  if (!isRecord(input)) {
    return input;
  }

  const record = input;
  if (isRecord(record.set_query_state)) {
    return record;
  }

  return {
    set_query_state: buildPanelQueryStateFromRecord(record),
  };
};

export const queryCurrentPanelDslOnlyWorkflowParamsSchema:
  z.ZodType<QueryCurrentPanelDslOnlyWorkflowParams> = z.preprocess(
    normalizeQueryCurrentPanelDslOnlyWorkflowParams,
    z.object({
      set_query_state: panelQueryStatePayloadSchema,
    }),
  );

// ----------------------------------------------------------------------------
// Template: set_current_panel_item_formatting_v1
// ----------------------------------------------------------------------------

export interface SetCurrentPanelItemFormattingWorkflowParams
  extends Record<string, unknown> {
  set_item_formatting: PanelWorkflowSetItemFormattingPayload;
}

const normalizeSetCurrentPanelItemFormattingWorkflowParams = (
  input: unknown,
): SetCurrentPanelItemFormattingWorkflowParams | unknown => {
  if (!isRecord(input)) {
    return input;
  }

  const record = input;
  const formattingPayload = isRecord(record.set_item_formatting)
    ? record.set_item_formatting
    : isRecord(record.itemFormatting)
      ? record.itemFormatting
      : undefined;

  return {
    set_item_formatting: formattingPayload,
  };
};

export const setCurrentPanelItemFormattingWorkflowParamsSchema:
  z.ZodType<SetCurrentPanelItemFormattingWorkflowParams> = z.preprocess(
    normalizeSetCurrentPanelItemFormattingWorkflowParams,
    z.object({
      set_item_formatting: panelWorkflowSetItemFormattingPayloadSchema,
    }),
  );
