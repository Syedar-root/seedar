import { noCompactor, Responsive, useContainerWidth } from "react-grid-layout";
import type { Layout } from "react-grid-layout";
import type { LayoutItem, Layouts } from "#pkg/seedar/types";
import { useEffect, useMemo } from "react";
import { usePreventTextSelection } from "../../../hooks";
import { useAutoScroll } from "../../../hooks";

import styles from "./GridContainer.module.css";
import {
  BREAKPOINTS,
  BREAKPOINT_LABELS,
  COLS,
  MARGIN,
  CONTAINER_PADDING,
  type SeedarBreakpoint,
} from "../../../utils/dashboard-layout/constants";
import {
  getBreakpointByWidth,
  getEffectiveGridWidth,
  getMaterializedBreakpointLayout,
  updateBreakpointLayout,
} from "../../../utils/dashboard-layout/layoutEditor";

interface GridContainerProps {
  layouts: Layouts;
  onLayoutChange?: (layouts: Layouts) => void;
  mode?: "edit" | "view";
  children: React.ReactNode;
  activeBreakpoint: SeedarBreakpoint;
  lockedCanvasWidth: number;
  onMetricsChange?: (metrics: {
    containerWidth: number;
    containerBreakpoint: SeedarBreakpoint;
    effectiveGridWidth: number;
  }) => void;
}

export const GridContainer: React.FC<GridContainerProps> = ({
  layouts,
  onLayoutChange,
  mode = "edit",
  children,
  activeBreakpoint,
  lockedCanvasWidth,
  onMetricsChange,
}) => {
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

  const myCompactor = {
    ...noCompactor,
    preventCollision: true,
  };

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

  const handleDragStart = () => {
    enablePreventTextSelection();
    startAutoScroll();
  };

  const handleResizeStart = () => {
    enablePreventTextSelection();
    startAutoScroll();
  };

  const handleDragStop = (layout: Layout) => {
    disablePreventTextSelection();
    stopAutoScroll();
    if (mode === "edit" && onLayoutChange) {
      onLayoutChange(
        updateBreakpointLayout(
          layouts,
          activeBreakpoint,
          layout as LayoutItem[],
        ),
      );
    }
  };

  const handleResizeStop = (layout: Layout) => {
    disablePreventTextSelection();
    stopAutoScroll();
    if (mode === "edit" && onLayoutChange) {
      onLayoutChange(
        updateBreakpointLayout(
          layouts,
          activeBreakpoint,
          layout as LayoutItem[],
        ),
      );
    }
  };

  const enhancedLayouts = useMemo(() => {
    const enhanced: Layouts = { ...layouts };

    Object.keys(layouts).forEach((breakpoint) => {
      enhanced[breakpoint] = layouts[breakpoint]?.map((item) => ({
        ...item,
        isDraggable: mode === "edit",
        isResizable: mode === "edit",
      }));
    });

    enhanced[activeBreakpoint] = getMaterializedBreakpointLayout(
      layouts,
      activeBreakpoint,
    ).map((item) => ({
      ...item,
      isDraggable: mode === "edit",
      isResizable: mode === "edit",
    }));

    return enhanced;
  }, [activeBreakpoint, layouts, mode]);

  return (
    containerRef && (
      <div className={styles.viewport}>
        <div
          aria-hidden="true"
          className={styles.measure}
          ref={containerRef as React.RefObject<HTMLDivElement>}
        />
        {mounted && (
          <>
            <div className={styles.metaBar}>
              <span className={styles.metaChip}>
                编辑 {activeBreakpoint.toUpperCase()} ·{" "}
                {BREAKPOINT_LABELS[activeBreakpoint]}
              </span>
              <span className={styles.metaChip}>
                容器 {Math.round(width)}px · {containerBreakpoint.toUpperCase()}
              </span>
              <span className={styles.metaChip}>
                画布 {Math.round(effectiveGridWidth)}px
              </span>
            </div>
            <div className={styles.frame}>
              <div
                className={styles.canvas}
                style={
                  {
                    width: mode === "edit" ? effectiveGridWidth : "100%",
                    "--grid-columns": currentCols,
                  } as React.CSSProperties
                }
              >
                <Responsive
                  layouts={enhancedLayouts}
                  breakpoints={BREAKPOINTS}
                  cols={COLS}
                  margin={[MARGIN, MARGIN]}
                  containerPadding={[CONTAINER_PADDING, CONTAINER_PADDING]}
                  rowHeight={rowHeight}
                  width={effectiveGridWidth}
                  compactor={myCompactor}
                  onDragStart={handleDragStart}
                  onResizeStart={handleResizeStart}
                  onDragStop={handleDragStop}
                  onResizeStop={handleResizeStop}
                >
                  {children}
                </Responsive>
              </div>
            </div>
          </>
        )}
      </div>
    )
  );
};
