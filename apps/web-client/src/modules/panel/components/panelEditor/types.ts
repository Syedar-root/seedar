import type { DragItem } from "../dndHelper/dragZone/dragZone";
import type { TempMetricConfig } from "../../types";
import type {
  PanelFormattingConfig,
  PanelSimpleFormattingRule,
} from "#pkg/seedar/types";

export type DisplayPanelType =
  | "table"
  | "card"
  | "line"
  | "bar"
  | "area"
  | "pie"
  | "scatter"
  | "radar";

export type ChartType = "line" | "bar" | "area" | "pie" | "scatter" | "radar";
export type BarDirection = "vertical" | "horizontal";
export type TrendDirection = "up" | "down" | "none";
export type LabelSourceField =
  | "auto"
  | "xField"
  | "yField"
  | "seriesField"
  | "categoryField"
  | "valueField"
  | "sizeField";

export interface LabelConfig {
  visible: boolean;
  sourceField?: LabelSourceField;
}

export type LegendOrient = "left" | "top" | "right" | "bottom";
export type LegendLayout = "horizontal" | "vertical";

export interface LegendConfig {
  visible: boolean;
  orient: LegendOrient;
  layout: LegendLayout;
  title?: string;
}

export type AxisScaleType = "linear" | "log";

export interface AxisItemConfig {
  visible: boolean;
  labelVisible: boolean;
  tickVisible: boolean;
  gridVisible: boolean;
  scaleType?: AxisScaleType;
  logBase?: number;
  min?: number;
  max?: number;
  nice?: boolean;
  labelRotate?: number;
  title?: string;
  zero?: boolean;
}

export interface AxisConfig {
  x: AxisItemConfig;
  y: AxisItemConfig;
}

export type MetricCardVariant = "default" | "withLineChart" | "withProgress";
export type CardValuePickMode = "first" | "last";

export interface CardPanelConfig {
  variant?: MetricCardVariant;
  title?: string;
  valueField?: string;
  valuePickMode?: CardValuePickMode;
  changeValueField?: string;
  chartXField?: string;
  chartYField?: string;
  prefix?: string;
  suffix?: string;
  width?: string | number;
  trendDirection?: TrendDirection;
  changeRate?: string;
  changeValue?: string;
  chartColor?: string;
  chartSmooth?: boolean;
  progressTarget?: number;
  progressTargetLabel?: string;
  progressRemainingLabel?: string;
  progressColor?: string;
}

export interface PanelEditorConfig {
  type?: ChartType;
  xField?: string;
  yField?: string;
  seriesField?: string;
  categoryField?: string;
  valueField?: string;
  sizeField?: string;
  smooth?: boolean;
  direction?: BarDirection;
  color?: string[];
  label?: LabelConfig;
  legends?: LegendConfig;
  axis?: AxisConfig;
  formatting?: PanelFormattingConfig;
  card?: CardPanelConfig;
  isAdvancedSpecMode?: boolean;
  advancedSpec?: Record<string, unknown>;
}

export interface ConfigPanelProps {
  fields: DragItem[];
  metrics: DragItem[];
  tempMetrics?: TempMetricConfig[];
  config: PanelEditorConfig;
  onChange: (config: Partial<PanelEditorConfig>) => void;
}

export interface ChartFieldConfig {
  required: string[];
  optional: string[];
}

export const METRIC_CARD_VARIANT_OPTIONS: Array<{
  value: MetricCardVariant;
  label: string;
  description: string;
}> = [
  {
    value: "default",
    label: "基础卡片",
    description: "聚焦展示单个核心指标",
  },
  {
    value: "withLineChart",
    label: "趋势卡片",
    description: "在卡片中附带一条小型趋势线",
  },
  {
    value: "withProgress",
    label: "进度卡片",
    description: "展示当前值相对于目标值的完成情况",
  },
];

export const CHART_FIELD_CONFIGS: Record<ChartType, ChartFieldConfig> = {
  line: { required: ["xField", "yField"], optional: ["seriesField"] },
  bar: { required: ["xField", "yField"], optional: ["seriesField"] },
  area: { required: ["xField", "yField"], optional: ["seriesField"] },
  pie: { required: ["categoryField", "valueField"], optional: [] },
  scatter: {
    required: ["xField", "yField"],
    optional: ["seriesField", "sizeField"],
  },
  radar: {
    required: ["categoryField", "valueField"],
    optional: ["seriesField"],
  },
};

export const DEFAULT_COLORS = [
  "#5d7a8c",
  "#6b8e4e",
  "#c4842a",
  "#b85450",
  "#8b7355",
  "#6b8a8a",
  "#a67c52",
  "#7a6b8a",
];

export const FIELD_LABELS: Record<string, string> = {
  xField: "X字段/指标",
  yField: "Y字段/指标",
  seriesField: "系列字段/指标",
  categoryField: "分类字段/指标",
  valueField: "值字段/指标",
  sizeField: "大小字段/指标",
};

export const LABEL_SOURCE_FIELD_LABELS: Record<LabelSourceField, string> = {
  auto: "自动",
  xField: FIELD_LABELS.xField,
  yField: FIELD_LABELS.yField,
  seriesField: FIELD_LABELS.seriesField,
  categoryField: FIELD_LABELS.categoryField,
  valueField: FIELD_LABELS.valueField,
  sizeField: FIELD_LABELS.sizeField,
};

export const LEGEND_ORIENT_OPTIONS: { value: LegendOrient; label: string }[] = [
  { value: "top", label: "顶部" },
  { value: "bottom", label: "底部" },
  { value: "left", label: "左侧" },
  { value: "right", label: "右侧" },
];

export const LEGEND_LAYOUT_OPTIONS: { value: LegendLayout; label: string }[] = [
  { value: "horizontal", label: "横向" },
  { value: "vertical", label: "纵向" },
];

export const BAR_DIRECTION_OPTIONS: { value: BarDirection; label: string }[] = [
  { value: "vertical", label: "纵向柱状图" },
  { value: "horizontal", label: "横向柱状图" },
];

export const DEFAULT_LEGENDS_CONFIG: LegendConfig = {
  visible: false,
  orient: "top",
  layout: "horizontal",
};

export const CARTESIAN_CHART_TYPES: ChartType[] = [
  "line",
  "bar",
  "area",
  "scatter",
];

export const createDefaultAxisConfig = (): AxisConfig => ({
  x: {
    visible: true,
    labelVisible: true,
    tickVisible: true,
    gridVisible: false,
    scaleType: "linear",
    nice: true,
  },
  y: {
    visible: true,
    labelVisible: true,
    tickVisible: true,
    gridVisible: true,
    scaleType: "linear",
    nice: true,
    zero: true,
  },
});

export const DEFAULT_PANEL_FORMATTING_CONFIG: PanelFormattingConfig = {
  version: 3,
  nullText: "--",
  locale: {
    mode: "browser",
    value: null,
  },
  timeZone: {
    mode: "browser",
    value: null,
  },
  rules: [],
};

export const SIMPLE_FORMAT_KIND_OPTIONS: Array<{
  value: PanelSimpleFormattingRule["kind"];
  label: string;
}> = [
  { value: "number", label: "数字" },
  { value: "percent", label: "百分比" },
  { value: "currency", label: "货币" },
  { value: "date", label: "日期" },
  { value: "datetime", label: "日期时间" },
];
