import { Responsive } from "react-grid-layout";
import styles from "./GridContainer.module.css";
import {
  BREAKPOINTS,
  BREAKPOINT_LABELS,
  COLS,
  CONTAINER_PADDING,
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
                缂栬緫 {activeBreakpoint.toUpperCase()} 路{" "}
                {BREAKPOINT_LABELS[activeBreakpoint]}
              </span>
              <span className={styles.metaChip}>
                瀹瑰櫒 {Math.round(containerWidth)}px 路 {containerBreakpoint.toUpperCase()}
              </span>
              <span className={styles.metaChip}>
                鐢诲竷 {Math.round(effectiveGridWidth)}px
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
