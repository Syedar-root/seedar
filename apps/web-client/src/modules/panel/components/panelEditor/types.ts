import type { DragItem } from "../dndHelper/dragZone/dragZone";
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

export interface LabelConfig {
  visible: boolean;
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
}

export interface ConfigPanelProps {
  fields: DragItem[];
  metrics: DragItem[];
  config: PanelEditorConfig;
  onChange: (config: Partial<PanelEditorConfig>) => void;
}

export interface ChartFieldConfig {
  required: string[];
  optional: string[];
}

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
  "#5470c6",
  "#91cc75",
  "#fac858",
  "#ee6666",
  "#73c0de",
  "#3ba272",
  "#fc8452",
  "#9a60b4",
];

export const FIELD_LABELS: Record<string, string> = {
  xField: "X字段/指标",
  yField: "Y字段/指标",
  seriesField: "系列字段/指标",
  categoryField: "分类字段/指标",
  valueField: "值字段/指标",
  sizeField: "大小字段/指标",
};

export const LEGEND_ORIENT_OPTIONS: { value: LegendOrient; label: string }[] = [
  { value: "top", label: "Top" },
  { value: "bottom", label: "Bottom" },
  { value: "left", label: "Left" },
  { value: "right", label: "Right" },
];

export const LEGEND_LAYOUT_OPTIONS: { value: LegendLayout; label: string }[] = [
  { value: "horizontal", label: "Horizontal" },
  { value: "vertical", label: "Vertical" },
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
