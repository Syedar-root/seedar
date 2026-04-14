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

export interface PanelEditorConfig {
  type?: ChartType;
  xField?: string;
  yField?: string;
  seriesField?: string;
  categoryField?: string;
  valueField?: string;
  sizeField?: string;
  color?: string[];
  label?: LabelConfig;
  legends?: LegendConfig;
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
  xField: "X field",
  yField: "Y field",
  seriesField: "Series field",
  categoryField: "Category field",
  valueField: "Value field",
  sizeField: "Size field",
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

export const DEFAULT_LEGENDS_CONFIG: LegendConfig = {
  visible: false,
  orient: "top",
  layout: "horizontal",
};

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
