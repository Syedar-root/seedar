import type { SeedarBreakpoint } from "../../../../utils/dashboard-layout/constants";
import type {
  SeedarDashboardBaseState,
  SeedarDashboardState,
} from "../types";

interface BuildSeedarDashboardStateParams {
  baseState: SeedarDashboardBaseState;
  mode: "edit" | "view";
  activeBreakpoint: SeedarBreakpoint;
  containerBreakpoint: SeedarBreakpoint;
  containerWidth: number;
  effectiveGridWidth: number;
  lockedCanvasWidth: number;
  configuredBreakpoints: SeedarBreakpoint[];
  activeBreakpointSource: SeedarBreakpoint | null;
}

export const buildSeedarDashboardState = ({
  baseState,
  mode,
  activeBreakpoint,
  containerBreakpoint,
  containerWidth,
  effectiveGridWidth,
  lockedCanvasWidth,
  configuredBreakpoints,
  activeBreakpointSource,
}: BuildSeedarDashboardStateParams): SeedarDashboardState => ({
  ...baseState,
  activeBreakpoint: mode === "view" ? containerBreakpoint : activeBreakpoint,
  containerBreakpoint,
  containerWidth,
  effectiveGridWidth,
  lockedCanvasWidth,
  configuredBreakpoints,
  activeBreakpointSource,
});
