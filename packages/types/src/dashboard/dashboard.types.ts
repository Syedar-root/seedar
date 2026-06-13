import type { PanelFormattingConfig } from "./panel-formatting.types";

export enum PanelType {
  CHART = "chart",
  TABLE = "table",
  TEXT = "text",
  CARD = "card",
}

export enum PanelStatus {
  DRAFT = "draft",
  PUBLISHED = "published",
}

export interface LayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
  static?: boolean;
  isDraggable?: boolean;
  isResizable?: boolean;
}

export interface Layouts {
  lg?: LayoutItem[];
  md?: LayoutItem[];
  sm?: LayoutItem[];
  xs?: LayoutItem[];
  xxs?: LayoutItem[];
  [key: string]: LayoutItem[] | undefined;
}

export interface PanelResponse {
  id: string;
  title?: string;
  type: PanelType;
  status: PanelStatus;
  queryId?: string;
  config?: PanelConfig;
  titleConfig?: Record<string, any>;
  width?: number;
  height?: number;
  createdAt: Date;
  updatedAt: Date;
  datasetId?: number;
  datasetName?: string;
}

export type PanelConfig = Record<string, any> & {
  formatting?: PanelFormattingConfig;
};

export interface DashboardResponse {
  id: string;
  name: string;
  layout: Layouts | null;
  panels: PanelResponse[];
  createdAt: Date;
  updatedAt: Date;
}
