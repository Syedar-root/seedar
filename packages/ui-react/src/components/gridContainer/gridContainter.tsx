import {
  getCompactor,
  noCompactor,
  Responsive,
  useContainerWidth,
} from "react-grid-layout";
import type { Layout } from "react-grid-layout";
import type { LayoutItem, Layouts } from "#pkg/seedar/types";
import { useEffect, useMemo } from "react";
import { usePreventTextSelection } from "#pkg/seedar/ui-react";
import { useAutoScroll } from "#pkg/seedar/ui-react";

import { MARGIN, COLS } from "./seedar/const";

interface GridContainerProps {
  layouts: Layouts;
  onLayoutChange?: (layouts: Layouts) => void;
  mode?: "edit" | "view";
  children: React.ReactNode;
}

export const GridContainer: React.FC<GridContainerProps> = ({
  layouts,
  onLayoutChange,
  mode = "edit",
  children,
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

  const currentCols =
    width >= 1200
      ? COLS.lg
      : width >= 996
        ? COLS.md
        : width >= 768
          ? COLS.sm
          : width >= 480
            ? COLS.xs
            : COLS.xxs;
  const rowHeight = (width - MARGIN * (currentCols - 1)) / currentCols;

  const myCompactor = {
    ...noCompactor,
    preventCollision: true,
  };

  useEffect(() => {
    if (containerRef.current) {
      findScrollViewport(containerRef.current);
    }
  }, [containerRef, findScrollViewport]);

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
      const newLayouts = { ...layouts };
      const currentBreakpoint = Object.keys(COLS).find(
        (key) => COLS[key as keyof typeof COLS] === currentCols,
      );
      newLayouts[currentBreakpoint!] = layout as LayoutItem[];
      onLayoutChange(newLayouts);
    }
  };

  const handleResizeStop = (layout: Layout) => {
    disablePreventTextSelection();
    stopAutoScroll();
    if (mode === "edit" && onLayoutChange) {
      const newLayouts = { ...layouts };
      const currentBreakpoint = Object.keys(COLS).find(
        (key) => COLS[key as keyof typeof COLS] === currentCols,
      );
      newLayouts[currentBreakpoint!] = layout as LayoutItem[];
      onLayoutChange(newLayouts);
    }
  };

  const enhancedLayouts = useMemo(() => {
    const enhanced: Layouts = {};
    Object.keys(layouts).forEach((breakpoint) => {
      enhanced[breakpoint] = layouts[breakpoint]?.map((item) => ({
        ...item,
        isDraggable: mode === "edit",
        isResizable: mode === "edit",
      }));
    });
    return enhanced;
  }, [layouts, mode]);

  return (
    containerRef && (
      <div
        style={{ overflow: "hidden", userSelect: "none" }}
        ref={containerRef as React.RefObject<HTMLDivElement>}
      >
        {mounted && (
          <Responsive
            layouts={enhancedLayouts}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={COLS}
            margin={[MARGIN, MARGIN]}
            rowHeight={rowHeight}
            width={width}
            compactor={myCompactor}
            onDragStart={handleDragStart}
            onResizeStart={handleResizeStart}
            onDragStop={handleDragStop}
            onResizeStop={handleResizeStop}
          >
            {children}
          </Responsive>
        )}
      </div>
    )
  );
};
