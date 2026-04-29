import type { CSSProperties, ReactNode } from "react";
import type {
  ExecuteQueryResponse,
  PanelFormattingConfig,
  PanelResponse,
} from "#pkg/seedar/types";
import type { ISpec } from "@visactor/vchart";
import type { MetricCardPanelConfig } from "../../data-display/MetricCard";

import type { GridPanelProps } from "../../layout/GridPanel";

export interface SeedarPanelProps extends Omit<GridPanelProps, "headerExtra"> {
  panelId: string;
  panel?: PanelResponse;
  className?: string;
  style?: CSSProperties;
  headerExtra?: (panelId: string) => ReactNode;
  data?: ExecuteQueryResponse;
  onChartRenderStatusChange?: (status: {
    ok: boolean;
    error?: Error;
  }) => void;
}

export type PanelContentDescriptor =
  | { kind: "chart"; queryId?: string; spec: ISpec }
  | {
      kind: "table";
      queryId?: string;
      formatting?: PanelFormattingConfig;
    }
  | {
      kind: "card";
      queryId?: string;
      formatting?: PanelFormattingConfig;
      config?: MetricCardPanelConfig;
    }
  | { kind: "text"; content?: ReactNode }
  | { kind: "empty" };

export interface SeedarPanelDataState {
  finalPanel?: PanelResponse;
  isPending: boolean;
  isError: boolean;
}
