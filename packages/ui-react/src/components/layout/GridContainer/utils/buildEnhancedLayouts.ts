import type { Layouts } from "#pkg/seedar/types";

import type { SeedarBreakpoint } from "../../../../utils/dashboard-layout/constants";
import { getMaterializedBreakpointLayout } from "../../../../utils/dashboard-layout/layoutEditor";

export const buildEnhancedLayouts = ({
  activeBreakpoint,
  layouts,
  mode,
}: {
  activeBreakpoint: SeedarBreakpoint;
  layouts: Layouts;
  mode: "edit" | "view";
}): Layouts => {
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
};
