import type {
  ExecuteQueryResponse,
  PanelFormattingConfig,
  QueryColumnMapping,
} from "#pkg/seedar/types";
import type { ComponentType, ReactNode } from "react";

export type TrendDirection = "up" | "down" | "none";
export type MetricCardVariant = "default" | "withLineChart" | "withProgress";
export type CardValuePickMode = "first" | "last";

export interface ChartDataPoint {
  x: string | number;
  y: number;
}

export interface MetricCardPanelConfig {
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
  chartHighlightKeys?: Array<string | number>;
  progressTarget?: number;
  progressTargetLabel?: string;
  progressRemainingLabel?: string;
  progressColor?: string;
}

export interface MetricCardCommonProps {
  title?: string;
  value?: number | string;
  icon?: ReactNode;
  suffix?: string;
  prefix?: string;
  loading?: boolean;
  onClick?: () => void;
  className?: string;
  trendDirection?: TrendDirection;
  changeRate?: string;
  changeValue?: string;
  width?: string | number;
}

export interface DefaultCardProps extends MetricCardCommonProps {
  variant?: "default";
}

export interface ChartCardProps extends MetricCardCommonProps {
  variant?: "withLineChart";
  chartData?: ChartDataPoint[];
  chartColor?: string;
  chartSmooth?: boolean;
  chartHighlightKeys?: Array<string | number>;
}

export interface ProgressCardProps extends MetricCardCommonProps {
  variant?: "withProgress";
  target?: number;
  targetLabel?: string;
  remainingLabel?: string;
  progressColor?: string;
}

export interface CustomCardProps extends MetricCardCommonProps {
  variant?: string;
}

export type MetricCardResolvedProps =
  | DefaultCardProps
  | ChartCardProps
  | ProgressCardProps
  | CustomCardProps;

export interface MetricCardProps extends MetricCardCommonProps {
  queryId?: string;
  data?: ExecuteQueryResponse;
  formatting?: PanelFormattingConfig;
  config?: MetricCardPanelConfig;
  variant?: string;
  chartData?: ChartDataPoint[];
  chartColor?: string;
  chartSmooth?: boolean;
  chartHighlightKeys?: Array<string | number>;
  target?: number;
  targetLabel?: string;
  remainingLabel?: string;
  progressColor?: string;
}

export interface CardTypeConfig {
  component: ComponentType<MetricCardResolvedProps>;
  defaultProps?: Partial<MetricCardResolvedProps>;
}

export type CardTypeRegistry = Map<string, CardTypeConfig>;

export interface MetricCardDerivedData {
  rows: unknown[][];
  title?: string;
  value?: number | string;
  secondaryTitle?: string;
  secondaryValue?: unknown;
  chartData: ChartDataPoint[];
  chartHighlightKeys: Array<string | number>;
  mappings: QueryColumnMapping[];
}
