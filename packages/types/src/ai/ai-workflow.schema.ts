import { z } from 'zod';
import {
  PeriodCalculationMode,
  PeriodOverPeriodType,
} from '../dataset';
import type {
  PanelQueryStatePayload,
  PanelQueryStateDimensionPayload,
  PanelQueryStateFilterPayload,
  PanelQueryStateMetricPayload,
  PanelQueryStateTempMetricPayload,
} from './ai-workflow.types';

const panelQueryStateDimensionPayloadSchema:
  z.ZodType<PanelQueryStateDimensionPayload> = z.object({
    fieldId: z.number().int().optional(),
    alias: z.string().optional(),
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

export const panelQueryStatePayloadSchema: z.ZodType<PanelQueryStatePayload> =
  z.object({
    datasetId: z.number().int().optional(),
    dimensions: z.array(panelQueryStateDimensionPayloadSchema).optional(),
    metrics: z.array(panelQueryStateMetricPayloadSchema).optional(),
    filters: z.array(panelQueryStateFilterPayloadSchema).optional(),
    tempMetrics: z.array(panelQueryStateTempMetricPayloadSchema).optional(),
  });

export interface QueryCurrentPanelAsTableWorkflowParams
  extends Record<string, unknown> {
  set_query_state: PanelQueryStatePayload;
}

const normalizeQueryCurrentPanelAsTableWorkflowParams = (
  input: unknown,
): QueryCurrentPanelAsTableWorkflowParams | unknown => {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return input;
  }

  const record = input as Record<string, unknown>;
  if (
    record.set_query_state &&
    typeof record.set_query_state === 'object' &&
    !Array.isArray(record.set_query_state)
  ) {
    return record;
  }

  const queryState =
    record.queryState &&
    typeof record.queryState === 'object' &&
    !Array.isArray(record.queryState)
      ? { ...(record.queryState as Record<string, unknown>) }
      : {
          datasetId: record.datasetId,
          dimensions: record.dimensions,
          metrics: record.metrics,
          filters: record.filters,
          tempMetrics: record.tempMetrics,
        };

  return {
    set_query_state: queryState,
  };
};

export const queryCurrentPanelAsTableWorkflowParamsSchema:
  z.ZodType<QueryCurrentPanelAsTableWorkflowParams> = z.preprocess(
    normalizeQueryCurrentPanelAsTableWorkflowParams,
    z.object({
      set_query_state: panelQueryStatePayloadSchema,
    }),
  );
