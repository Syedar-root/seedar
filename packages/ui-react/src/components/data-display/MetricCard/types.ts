import type { ExecuteQueryResponse, PanelFormattingConfig } from "#pkg/seedar/types";

export interface MetricCardProps {
  queryId?: string;
  data?: ExecuteQueryResponse;
  formatting?: PanelFormattingConfig;
}

export interface MetricCardViewData {
  title: string;
  value: unknown;
  subTitle?: string;
  subValue?: unknown;
}
