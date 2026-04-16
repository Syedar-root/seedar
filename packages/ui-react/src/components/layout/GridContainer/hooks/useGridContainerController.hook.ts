import { useCallback, useEffect, useMemo } from "react";
import { useContainerWidth } from "react-grid-layout";
import type { Layout } from "react-grid-layout";
import type { LayoutItem } from "#pkg/seedar/types";

import { useAutoScroll, usePreventTextSelection } from "../../../../hooks";
import {
  COLS,
  MARGIN,
} from "../../../../utils/dashboard-layout/constants";
import {
  getBreakpointByWidth,
  getEffectiveGridWidth,
  updateBreakpointLayout,
} from "../../../../utils/dashboard-layout/layoutEditor";
import type { GridContainerProps } from "../types";
import { buildEnhancedLayouts } from "../utils/buildEnhancedLayouts";
import { createGridCompactor } from "../utils/createGridCompactor";

export const useGridContainerController = ({
  layouts,
  onLayoutChange,
  mode = "edit",
  activeBreakpoint,
  lockedCanvasWidth,
  onMetricsChange,
}: Omit<GridContainerProps, "children">) => {
  const { width, containerRef, mounted } = useContainerWidth();
  const {
    enable: enablePreventTextSelection,
    disable: disablePreventTextSelection,
  } = usePreventTextSelection();
  const {
    findScrollViewport,
    start: startAutoScroll,
    stop: stopAutoScroll,
  } = useAutoScroll();

  const containerBreakpoint = getBreakpointByWidth(width);
  const effectiveGridWidth = getEffectiveGridWidth({
    activeBreakpoint,
    containerWidth: width,
    mode,
    lockedCanvasWidth,
  });
  const renderedBreakpoint = getBreakpointByWidth(effectiveGridWidth);
  const currentCols = COLS[renderedBreakpoint];
  const rowHeight =
    (effectiveGridWidth - MARGIN * (currentCols - 1)) / currentCols;

  useEffect(() => {
    if (containerRef.current) {
      findScrollViewport(containerRef.current);
    }
  }, [containerRef, findScrollViewport]);

  useEffect(() => {
    onMetricsChange?.({
      containerWidth: width,
      containerBreakpoint,
      effectiveGridWidth,
    });
  }, [containerBreakpoint, effectiveGridWidth, onMetricsChange, width]);

  const startInteractions = useCallback(() => {
    enablePreventTextSelection();
    startAutoScroll();
  }, [enablePreventTextSelection, startAutoScroll]);

  const stopInteractions = useCallback(() => {
    disablePreventTextSelection();
    stopAutoScroll();
  }, [disablePreventTextSelection, stopAutoScroll]);

  const handleLayoutStop = useCallback(
    (layout: Layout) => {
      stopInteractions();

      if (mode === "edit" && onLayoutChange) {
        onLayoutChange(
          updateBreakpointLayout(
            layouts,
            activeBreakpoint,
            layout as LayoutItem[],
          ),
        );
      }
    },
    [activeBreakpoint, layouts, mode, onLayoutChange, stopInteractions],
  );

  const enhancedLayouts = useMemo(
    () =>
      buildEnhancedLayouts({
        activeBreakpoint,
        layouts,
        mode,
      }),
    [activeBreakpoint, layouts, mode],
  );

  const compactor = useMemo(() => createGridCompactor(), []);

  return {
    containerRef,
    containerWidth: width,
    mounted,
    containerBreakpoint,
    currentCols,
    effectiveGridWidth,
    enhancedLayouts,
    compactor,
    handleDragStart: startInteractions,
    handleResizeStart: startInteractions,
    handleDragStop: handleLayoutStop,
    handleResizeStop: handleLayoutStop,
    rowHeight,
  };
};
