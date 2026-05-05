import { useCallback, useEffect, useMemo } from "react";
import { useContainerWidth } from "react-grid-layout";
import type { Layout } from "react-grid-layout";
import type { LayoutItem } from "#pkg/seedar/types";

import { useAutoScroll, usePreventTextSelection } from "../../../../hooks";
import { useElementSize } from "../../../../hooks";
import {
  COLS,
  MARGIN,
} from "../../../../utils/dashboard-layout/constants";
import {
  getBreakpointByWidth,
  getDashboardViewportScale,
  getEffectiveGridWidth,
  getLayoutHeight,
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
  viewportScaleMode,
  viewportScale,
  onMetricsChange,
}: Omit<GridContainerProps, "children">) => {
  const { width, containerRef, mounted } = useContainerWidth();
  const { elementRef: frameRef, elementSize: frameSize } =
    useElementSize<HTMLDivElement>();
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
  const activeLayout = enhancedLayouts[activeBreakpoint] ?? [];
  const canvasHeight = getLayoutHeight(activeLayout as LayoutItem[], rowHeight, MARGIN);
  const effectiveViewportScale =
    mode === "view"
      ? 1
      : getDashboardViewportScale({
          mode: viewportScaleMode,
          customScale: viewportScale,
          canvasWidth: effectiveGridWidth,
          canvasHeight,
          frameWidth: frameSize.width,
          frameHeight: frameSize.height,
        });
  const scaledCanvasWidth = effectiveGridWidth * effectiveViewportScale;
  const scaledCanvasHeight = canvasHeight * effectiveViewportScale;

  useEffect(() => {
    onMetricsChange?.({
      containerWidth: width,
      containerBreakpoint,
      effectiveGridWidth,
      viewportScale: effectiveViewportScale,
    });
  }, [
    containerBreakpoint,
    effectiveGridWidth,
    effectiveViewportScale,
    onMetricsChange,
    width,
  ]);

  return {
    containerRef,
    frameRef,
    containerWidth: width,
    mounted,
    containerBreakpoint,
    currentCols,
    effectiveGridWidth,
    effectiveViewportScale,
    scaledCanvasWidth,
    scaledCanvasHeight,
    enhancedLayouts,
    compactor,
    handleDragStart: startInteractions,
    handleResizeStart: startInteractions,
    handleDragStop: handleLayoutStop,
    handleResizeStop: handleLayoutStop,
    rowHeight,
  };
};
