import { Responsive } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import styles from "./GridContainer.module.css";
import {
  BREAKPOINTS,
  BREAKPOINT_LABELS,
  COLS,
  MARGIN,
} from "../../../utils/dashboard-layout/constants";
import { useGridContainerController } from "./hooks/useGridContainerController.hook";
import type { GridContainerProps } from "./types";

export const GridContainer: React.FC<GridContainerProps> = ({
  layouts,
  onLayoutChange,
  mode = "edit",
  children,
  activeBreakpoint,
  lockedCanvasWidth,
  onMetricsChange,
}) => {
  const {
    containerRef,
    containerWidth,
    mounted,
    containerBreakpoint,
    currentCols,
    effectiveGridWidth,
    enhancedLayouts,
    compactor,
    handleDragStart,
    handleResizeStart,
    handleDragStop,
    handleResizeStop,
    rowHeight,
  } = useGridContainerController({
    layouts,
    onLayoutChange,
    mode,
    activeBreakpoint,
    lockedCanvasWidth,
    onMetricsChange,
  });

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
                容器 {Math.round(containerWidth)}px · {containerBreakpoint.toUpperCase()}
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
                  rowHeight={rowHeight}
                  width={effectiveGridWidth}
                  compactor={compactor}
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
