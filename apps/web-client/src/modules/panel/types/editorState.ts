import {
  PanelStatus,
  type DerivedDimensionDSL,
  PeriodCalculationMode,
  type PeriodOverPeriodType,
  type QueryDSL,
  type QueryDimensionDSL,
  type QueryOrderByDSL,
  type QueryOrderDirection,
  FieldType,
} from "#pkg/seedar/types";
import type { DragItem } from "./dragItem";

export type LocalPanelStatus =
  | "unsaved"
  | PanelStatus.DRAFT
  | PanelStatus.PUBLISHED;

export type QueryDsl = QueryDSL;

export type PanelDimensionDsl = Exclude<QueryDimensionDSL, number>;

export type DerivedDimensionInput = DerivedDimensionDSL;

export interface DimensionItem extends DragItem {
  id: string | number;
  name: string;
  businessName?: string;
  isDerived: boolean;
  derivedKind?: DerivedDimensionInput["derivedKind"];
  fieldType?: FieldType;
  dimensionDsl: PanelDimensionDsl;
}

export interface TempMetricConfig {
  id: string;
  type: "period_comparison";
  alias?: string;
  businessName?: string;
  baseMetricId: number;
  timeFieldId?: number;
  periodType?: PeriodOverPeriodType;
  calculationMode?: PeriodCalculationMode;
}

export interface PeriodOverPeriodConfig {
  periodType?: PeriodOverPeriodType;
  calculationMode?: PeriodCalculationMode;
}

export type SortSourceType = "dimension" | "metric" | "temp_metric";

export interface SortItem {
  id: string;
  sourceType: SortSourceType;
  sourceId: string;
  label: string;
  orderBy: QueryOrderByDSL;
  dir: QueryOrderDirection;
}

export interface SortCandidate {
  id: string;
  sourceType: SortSourceType;
  sourceId: string;
  label: string;
  orderBy: QueryOrderByDSL;
  defaultDir: QueryOrderDirection;
}

export const CALCULATION_MODE_LABELS: Record<PeriodCalculationMode, string> = {
  [PeriodCalculationMode.PERCENTAGE]: "增长率",
  [PeriodCalculationMode.ABSOLUTE]: "差值",
  [PeriodCalculationMode.BOTH]: "增长率+差值",
};
