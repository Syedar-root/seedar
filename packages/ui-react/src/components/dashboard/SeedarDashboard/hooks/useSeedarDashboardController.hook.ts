import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Layouts } from "#pkg/seedar/types";

import { useDashboardActions } from "../../../../hooks";
import {
  BREAKPOINT_ORDER,
  DEFAULT_DASHBOARD_VIEWPORT_SCALE,
  type AddPanelScope,
  type DashboardViewportScaleMode,
  type SeedarBreakpoint,
} from "../../../../utils/dashboard-layout/constants";
import {
  clampDashboardViewportScale,
  copyBreakpointLayout,
  findNearestConfiguredBreakpoint,
  getConfiguredBreakpoints,
  getDefaultLockedCanvasWidth,
  resolvePanelTargetBreakpoints,
} from "../../../../utils/dashboard-layout/layoutEditor";
import type { GridContainerProps } from "../../../layout/GridContainer/types";
import type {
  SeedarDashboardActions,
  SeedarDashboardContextValue,
  SeedarDashboardProps,
} from "../types";
import { buildSeedarDashboardState } from "../utils/buildSeedarDashboardState";

interface SeedarDashboardControllerResult {
  isReady: boolean;
  contextValue?: SeedarDashboardContextValue;
  gridContainerProps?: Omit<GridContainerProps, "children">;
}

export const useSeedarDashboardController = ({
  autoUpdate = false,
  dashboardId,
  mode = "edit",
}: Pick<
  SeedarDashboardProps,
  "autoUpdate" | "dashboardId" | "mode"
>): SeedarDashboardControllerResult => {
  const {
    data,
    actions: dashboardActions,
    state: dashboardState,
  } = useDashboardActions(dashboardId, autoUpdate);
  const [activeBreakpoint, setActiveBreakpoint] =
    useState<SeedarBreakpoint>("lg");
  const [lockedCanvasWidth, setLockedCanvasWidth] = useState(
    getDefaultLockedCanvasWidth("lg"),
  );
  const [containerWidth, setContainerWidth] = useState(0);
  const [containerBreakpoint, setContainerBreakpoint] =
    useState<SeedarBreakpoint>("lg");
  const [effectiveGridWidth, setEffectiveGridWidth] = useState(
    getDefaultLockedCanvasWidth("lg"),
  );
  const [viewportScaleMode, setViewportScaleMode] =
    useState<DashboardViewportScaleMode>("auto");
  const [viewportScale, setViewportScale] = useState(
    DEFAULT_DASHBOARD_VIEWPORT_SCALE,
  );
  const [effectiveViewportScale, setEffectiveViewportScale] = useState(
    DEFAULT_DASHBOARD_VIEWPORT_SCALE,
  );
  const hasEditedBreakpointRef = useRef(false);

  const configuredBreakpoints = useMemo(
    () => getConfiguredBreakpoints(dashboardState.localLayout),
    [dashboardState.localLayout],
  );
  const activeBreakpointSource = useMemo(
    () =>
      findNearestConfiguredBreakpoint(dashboardState.localLayout, activeBreakpoint),
    [activeBreakpoint, dashboardState.localLayout],
  );
  const effectiveActiveBreakpoint =
    mode === "view" ? containerBreakpoint : activeBreakpoint;

  useEffect(() => {
    hasEditedBreakpointRef.current = false;
  }, [dashboardId]);

  useEffect(() => {
    if (!hasEditedBreakpointRef.current && containerWidth > 0) {
      setActiveBreakpoint(containerBreakpoint);
      setLockedCanvasWidth(getDefaultLockedCanvasWidth(containerBreakpoint));
    }
  }, [containerBreakpoint, containerWidth]);

  const handleLayoutChange = useCallback(
    (newLayouts: Layouts) => {
      dashboardActions.updateLayout(newLayouts);
    },
    [dashboardActions],
  );

  const handleAddPanel = useCallback<SeedarDashboardActions["addPanel"]>(
    (panelId, options) => {
      dashboardActions.addPanel(panelId, {
        defaultSize: options?.defaultSize,
        targetBreakpoints: resolvePanelTargetBreakpoints({
          scope: (options?.scope || "active") as AddPanelScope,
          activeBreakpoint: effectiveActiveBreakpoint,
          configuredBreakpoints,
        }),
      });
    },
    [configuredBreakpoints, dashboardActions, effectiveActiveBreakpoint],
  );

  const handleSetActiveBreakpoint = useCallback(
    (breakpoint: SeedarBreakpoint) => {
      hasEditedBreakpointRef.current = true;
      setActiveBreakpoint(breakpoint);
      setLockedCanvasWidth(getDefaultLockedCanvasWidth(breakpoint));
      setViewportScaleMode("auto");
    },
    [],
  );

  const handleSetViewportScale = useCallback((scale: number) => {
    setViewportScaleMode("custom");
    setViewportScale(clampDashboardViewportScale(scale));
  }, []);

  const handleCopyActiveBreakpointToOthers = useCallback(() => {
    dashboardActions.updateLayout(
      copyBreakpointLayout(
        dashboardState.localLayout,
        effectiveActiveBreakpoint,
        BREAKPOINT_ORDER.filter(
          (breakpoint) => breakpoint !== effectiveActiveBreakpoint,
        ),
      ),
    );
  }, [
    dashboardActions,
    dashboardState.localLayout,
    effectiveActiveBreakpoint,
  ]);

  const handleMetricsChange = useCallback<
    NonNullable<GridContainerProps["onMetricsChange"]>
  >(
    ({
      containerWidth,
      containerBreakpoint,
      effectiveGridWidth,
      viewportScale,
    }) => {
      setContainerWidth((previousWidth) =>
        previousWidth === containerWidth ? previousWidth : containerWidth,
      );
      setContainerBreakpoint((previousBreakpoint) =>
        previousBreakpoint === containerBreakpoint
          ? previousBreakpoint
          : containerBreakpoint,
      );
      setEffectiveGridWidth((previousWidth) =>
        previousWidth === effectiveGridWidth ? previousWidth : effectiveGridWidth,
      );
      setEffectiveViewportScale((previousScale) =>
        previousScale === viewportScale ? previousScale : viewportScale,
      );
      if (viewportScaleMode === "custom") {
        setViewportScale((previousScale) =>
          previousScale === viewportScale ? previousScale : viewportScale,
        );
      }
    },
    [viewportScaleMode],
  );

  const contextActions = useMemo<SeedarDashboardActions>(
    () => ({
      ...dashboardActions,
      addPanel: handleAddPanel,
      setActiveBreakpoint: handleSetActiveBreakpoint,
      setLockedCanvasWidth,
      setViewportScaleMode,
      setViewportScale: handleSetViewportScale,
      copyActiveBreakpointToOthers: handleCopyActiveBreakpointToOthers,
    }),
    [
      dashboardActions,
      handleAddPanel,
      handleCopyActiveBreakpointToOthers,
      handleSetActiveBreakpoint,
      handleSetViewportScale,
    ],
  );

  const contextState = useMemo(
    () =>
      buildSeedarDashboardState({
        baseState: dashboardState,
        mode,
        activeBreakpoint,
        containerBreakpoint,
        containerWidth,
        effectiveGridWidth,
        lockedCanvasWidth,
        viewportScaleMode,
        viewportScale,
        effectiveViewportScale,
        configuredBreakpoints,
        activeBreakpointSource,
      }),
    [
      activeBreakpoint,
      activeBreakpointSource,
      configuredBreakpoints,
      containerBreakpoint,
      containerWidth,
      dashboardState,
      effectiveGridWidth,
      lockedCanvasWidth,
      viewportScaleMode,
      viewportScale,
      effectiveViewportScale,
      mode,
    ],
  );

  const gridContainerProps = useMemo<Omit<GridContainerProps, "children">>(
    () => ({
      layouts: dashboardState.localLayout,
      onLayoutChange: handleLayoutChange,
      mode,
      activeBreakpoint: contextState.activeBreakpoint,
      lockedCanvasWidth,
      viewportScaleMode,
      viewportScale,
      onMetricsChange: handleMetricsChange,
    }),
    [
      contextState.activeBreakpoint,
      dashboardState.localLayout,
      handleLayoutChange,
      handleMetricsChange,
      lockedCanvasWidth,
      viewportScaleMode,
      viewportScale,
      mode,
    ],
  );

  if (dashboardState.isLoading || dashboardState.isError || !data) {
    return { isReady: false };
  }

  return {
    isReady: true,
    contextValue: {
      dashboardId,
      data,
      actions: contextActions,
      state: contextState,
      mode,
    },
    gridContainerProps,
  };
};
