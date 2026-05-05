import { useMemo } from "react";

import { useSeedarDashboardContext } from "../../../context/SeedarDashboardContext";
import {
  BREAKPOINT_ORDER,
  DASHBOARD_VIEWPORT_SCALE_OPTIONS,
  type SeedarBreakpoint,
} from "../../../../../../utils/dashboard-layout/constants";
import {
  getBreakpointRangeLabel,
  getBreakpointSummaryLabel,
} from "../../../../../../utils/dashboard-layout/layoutEditor";
import {
  formatWidth,
  formatViewportScale,
  getConfiguredLayoutHint,
  getDifferentViewportHint,
  getEmptyLayoutHint,
  getInheritedLayoutHint,
  getSameViewportHint,
} from "../utils/getLayoutEditorToolbarCopy";

const LOCKED_WIDTH_OPTIONS: Record<SeedarBreakpoint, number[]> = {
  lg: [1200, 1440, 1600, 1920],
  md: [996, 1100, 1190],
  sm: [768, 820, 940],
  xs: [480, 560, 720],
  xxs: [320, 360, 440],
};

export const useLayoutEditorToolbarViewModel = () => {
  const { actions, state, mode } = useSeedarDashboardContext();

  return useMemo(() => {
    if (mode === "view") {
      return null;
    }

    const activeBreakpointConfigured = state.configuredBreakpoints.includes(
      state.activeBreakpoint,
    );
    const copyDisabled =
      !state.activeBreakpointSource &&
      (state.localLayout[state.activeBreakpoint] ?? []).length === 0;
    const activeBreakpointLabel = getBreakpointSummaryLabel(state.activeBreakpoint);
    const activeBreakpointRange = getBreakpointRangeLabel(state.activeBreakpoint);
    const containerBreakpointLabel = getBreakpointSummaryLabel(
      state.containerBreakpoint,
    );
    const containerBreakpointRange = getBreakpointRangeLabel(
      state.containerBreakpoint,
    );
    const isEditingDifferentBreakpoint =
      state.activeBreakpoint !== state.containerBreakpoint;

    const helperText = activeBreakpointConfigured
      ? getConfiguredLayoutHint(activeBreakpointLabel, activeBreakpointRange)
      : state.activeBreakpointSource
        ? getInheritedLayoutHint(
            activeBreakpointLabel,
            activeBreakpointRange,
            getBreakpointSummaryLabel(state.activeBreakpointSource),
          )
        : getEmptyLayoutHint(activeBreakpointLabel, activeBreakpointRange);

    const viewportHint = isEditingDifferentBreakpoint
      ? getDifferentViewportHint(
          containerBreakpointLabel,
          containerBreakpointRange,
          activeBreakpointLabel,
        )
      : getSameViewportHint(containerBreakpointLabel, containerBreakpointRange);

    return {
      actions,
      breakpoints: BREAKPOINT_ORDER.map((breakpoint: SeedarBreakpoint) => ({
        breakpoint,
        configured: state.configuredBreakpoints.includes(breakpoint),
        isActive: breakpoint === state.activeBreakpoint,
        range: getBreakpointRangeLabel(breakpoint),
      })),
      containerBreakpointLabel,
      copyDisabled,
      effectiveGridWidthText: formatWidth(state.effectiveGridWidth),
      helperText,
      lockedCanvasWidth: state.lockedCanvasWidth,
      lockedWidthOptions: LOCKED_WIDTH_OPTIONS[state.activeBreakpoint].map(
        (width) => ({
          label: `${activeBreakpointLabel} / ${formatWidth(width)}`,
          value: width,
        }),
      ),
      viewportHint,
      viewportScale: state.viewportScale,
      viewportScaleLabel: formatViewportScale(state.effectiveViewportScale),
      viewportScaleMode: state.viewportScaleMode,
      viewportScaleOptions: DASHBOARD_VIEWPORT_SCALE_OPTIONS.map((scale) => ({
        label: formatViewportScale(scale),
        value: scale,
      })),
      widthText: formatWidth(state.containerWidth),
    };
  }, [actions, mode, state]);
};
