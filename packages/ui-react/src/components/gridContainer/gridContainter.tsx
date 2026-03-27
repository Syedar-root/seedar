import {
  getCompactor,
  noCompactor,
  Responsive,
  useContainerWidth,
} from "react-grid-layout";
import type { Layout } from "react-grid-layout";
import type { LayoutItem, Layouts } from "#pkg/seedar/types";
import { useRef, useEffect, useMemo } from "react";

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

  const handleDragStop = (layout: Layout) => {
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
        style={{ overflow: "hidden" }}
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
