import { Responsive } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import styles from "./GridContainer.module.css";
import {
  BREAKPOINTS,
  BREAKPOINT_LABELS,
  COLS,
  COLS_RATE,
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
  viewportScaleMode,
  viewportScale,
  effectiveViewportScale: storedEffectiveViewportScale,
  autoViewportScaleRequestId,
  onMetricsChange,
}) => {
  const isEditMode = mode === "edit";
  const {
    containerRef,
    viewportRef,
    metaBarRef,
    canvasRef,
    containerWidth,
    mounted,
    containerBreakpoint,
    renderedBreakpoint,
    currentCols,
    effectiveGridWidth,
    effectiveViewportScale,
    scaledCanvasWidth,
    scaledCanvasHeight,
    enhancedLayouts,
    compactor,
    positionStrategy,
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
    viewportScaleMode,
    viewportScale,
    effectiveViewportScale: storedEffectiveViewportScale,
    autoViewportScaleRequestId,
    onMetricsChange,
  });

  return (
    containerRef && (
      <div className={styles.viewport} ref={viewportRef}>
        <div
          aria-hidden="true"
          className={styles.measure}
          ref={containerRef as React.RefObject<HTMLDivElement>}
        />
        {mounted && (
          <>
            <div className={styles.metaBar} ref={metaBarRef}>
              <span className={styles.metaChip}>
                编辑 {activeBreakpoint.toUpperCase()} ·{" "}
                {BREAKPOINT_LABELS[activeBreakpoint]}
              </span>
              <span className={styles.metaChip}>
                容器 {Math.round(containerWidth)}px ·{" "}
                {containerBreakpoint.toUpperCase()}
              </span>
              <span className={styles.metaChip}>
                画布 {Math.round(effectiveGridWidth)}px
              </span>
            </div>
            <div className={styles.frame}>
              {isEditMode ? (
                <div
                  className={styles.canvasShell}
                  style={
                    {
                      width: scaledCanvasWidth,
                      height:
                        scaledCanvasHeight > 0 ? scaledCanvasHeight : undefined,
                    } as React.CSSProperties
                  }
                >
                  <div
                    className={styles.canvasEdit}
                    style={
                      {
                        width: effectiveGridWidth,
                        transform: `scale(${effectiveViewportScale})`,
                        "--grid-column-width": `${rowHeight}px`,
                        "--grid-column-step": `${rowHeight + MARGIN}px`,
                        "--grid-major-column-width": `${(rowHeight + MARGIN) * COLS_RATE - MARGIN}px`,
                        "--grid-major-column-step": `${(rowHeight + MARGIN) * COLS_RATE}px`,
                        "--grid-row-height": `${rowHeight}px`,
                        "--grid-row-step": `${rowHeight + MARGIN}px`,
                        "--grid-major-row-height": `${(rowHeight + MARGIN) * COLS_RATE - MARGIN}px`,
                        "--grid-major-row-step": `${(rowHeight + MARGIN) * COLS_RATE}px`,
                      } as React.CSSProperties
                    }
                  >
                    <div aria-hidden="true" className={styles.gridOverlay} />
                    <Responsive
                      layouts={enhancedLayouts}
                      breakpoint={renderedBreakpoint}
                      breakpoints={BREAKPOINTS}
                      cols={COLS}
                      margin={[MARGIN, MARGIN]}
                      rowHeight={rowHeight}
                      width={effectiveGridWidth}
                      compactor={compactor}
                      positionStrategy={positionStrategy}
                      onDragStart={handleDragStart}
                      onResizeStart={handleResizeStart}
                      onDragStop={handleDragStop}
                      onResizeStop={handleResizeStop}
                      containerPadding={[0, 0]}
                    >
                      {children}
                    </Responsive>
                  </div>
                </div>
              ) : (
                <div
                  className={styles.canvas}
                  ref={canvasRef}
                  style={
                    {
                      width: "100%",
                      "--grid-columns": currentCols,
                    } as React.CSSProperties
                  }
                >
                  <Responsive
                    layouts={enhancedLayouts}
                    breakpoint={renderedBreakpoint}
                    breakpoints={BREAKPOINTS}
                    cols={COLS}
                    margin={[MARGIN, MARGIN]}
                    rowHeight={rowHeight}
                    width={effectiveGridWidth}
                    compactor={compactor}
                    positionStrategy={positionStrategy}
                    onDragStart={handleDragStart}
                    onResizeStart={handleResizeStart}
                    onDragStop={handleDragStop}
                    onResizeStop={handleResizeStop}
                    containerPadding={[0, 0]}
                  >
                    {children}
                  </Responsive>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    )
  );
};
