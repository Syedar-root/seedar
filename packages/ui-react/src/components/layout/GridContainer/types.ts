import type { ReactNode } from "react";
import type { Layouts } from "#pkg/seedar/types";

import type { SeedarBreakpoint } from "../../../utils/dashboard-layout/constants";

export interface GridMetrics {
  containerWidth: number;
  containerBreakpoint: SeedarBreakpoint;
  effectiveGridWidth: number;
}

export interface GridContainerProps {
  layouts: Layouts;
  onLayoutChange?: (layouts: Layouts) => void;
  mode?: "edit" | "view";
  children: ReactNode;
  activeBreakpoint: SeedarBreakpoint;
  lockedCanvasWidth: number;
  onMetricsChange?: (metrics: GridMetrics) => void;
}
