import type { DragItem } from "../dndHelper/dragZone/dragZone";

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
  xField: "X轴字段",
  yField: "Y轴字段",
  seriesField: "系列字段",
  categoryField: "分类字段",
  valueField: "数值字段",
  sizeField: "大小字段",
};
