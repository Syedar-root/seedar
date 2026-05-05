import type { LayoutItem, Layouts } from "#pkg/seedar/types";
import {
  correctBounds,
  getFirstCollision,
  sortLayoutItemsByRowCol,
  verticalCompactor,
} from "react-grid-layout/core";

import {
  BREAKPOINT_LABELS,
  BREAKPOINTS,
  BREAKPOINT_CANVAS_WIDTHS,
  BREAKPOINT_ORDER,
  COLS,
  DASHBOARD_FRAME_PADDING,
  DEFAULT_DASHBOARD_VIEWPORT_SCALE,
  MAX_DASHBOARD_VIEWPORT_SCALE,
  MIN_DASHBOARD_VIEWPORT_SCALE,
  type AddPanelScope,
  type DashboardViewportScaleMode,
  type SeedarBreakpoint,
} from "./constants";

const cloneLayoutItems = (items: LayoutItem[]): LayoutItem[] =>
  items.map((item) => ({ ...item }));

const stripTransientLayoutProps = (
  item: LayoutItem & { moved?: boolean },
): LayoutItem => {
  const { moved: _moved, ...stableItem } = item;
  return stableItem;
};

const forceResolveCollisions = (items: LayoutItem[]): LayoutItem[] => {
  const placed: LayoutItem[] = [];

  sortLayoutItemsByRowCol(cloneLayoutItems(items)).forEach((item) => {
    const nextItem = { ...item };

    while (true) {
      const collision = getFirstCollision(placed, nextItem);
      if (!collision) {
        break;
      }

      nextItem.y = collision.y + collision.h;
    }

    placed.push(nextItem);
  });

  return placed;
};

const fitLayoutToBreakpoint = (
  items: LayoutItem[],
  breakpoint: SeedarBreakpoint,
): LayoutItem[] => {
  const cols = COLS[breakpoint];
  const preparedItems = cloneLayoutItems(items).map((item) => {
    const nextWidth = Math.max(1, Math.min(item.w, cols));
    const nextMinWidth =
      item.minW === undefined ? undefined : Math.min(item.minW, cols);
    const nextMaxWidth =
      item.maxW === undefined ? undefined : Math.min(item.maxW, cols);

    return {
      ...item,
      w: nextWidth,
      x: Math.max(0, Math.min(item.x, Math.max(cols - nextWidth, 0))),
      minW: nextMinWidth,
      maxW: nextMaxWidth,
    };
  });

  const boundedItems = correctBounds(preparedItems, { cols });
  const compactedItems = verticalCompactor.compact(boundedItems, cols);
  const stableItems = compactedItems.map((item) => stripTransientLayoutProps(item));

  return forceResolveCollisions(stableItems);
};

export const getBreakpointByWidth = (width: number): SeedarBreakpoint => {
  if (width >= BREAKPOINTS.lg) {
    return "lg";
  }
  if (width >= BREAKPOINTS.md) {
    return "md";
  }
  if (width >= BREAKPOINTS.sm) {
    return "sm";
  }
  if (width >= BREAKPOINTS.xs) {
    return "xs";
  }
  return "xxs";
};

export const getBreakpointMinWidth = (breakpoint: SeedarBreakpoint): number =>
  BREAKPOINTS[breakpoint];

export const getBreakpointMaxWidth = (
  breakpoint: SeedarBreakpoint,
): number | undefined => {
  const index = BREAKPOINT_ORDER.indexOf(breakpoint);
  if (index <= 0) {
    return undefined;
  }
  const previousBreakpoint = BREAKPOINT_ORDER[index - 1];
  return BREAKPOINTS[previousBreakpoint] - 1;
};

export const clampWidthToBreakpoint = (
  width: number,
  breakpoint: SeedarBreakpoint,
): number => {
  const minWidth = getBreakpointMinWidth(breakpoint);
  const maxWidth = getBreakpointMaxWidth(breakpoint);

  if (maxWidth === undefined) {
    return Math.max(width, minWidth);
  }

  return Math.min(Math.max(width, minWidth), maxWidth);
};

export const getEffectiveGridWidth = ({
  activeBreakpoint,
  containerWidth,
  mode,
  lockedCanvasWidth,
}: {
  activeBreakpoint: SeedarBreakpoint;
  containerWidth: number;
  mode: "edit" | "view";
  lockedCanvasWidth: number;
}): number => {
  if (mode === "view") {
    return containerWidth;
  }

  return clampWidthToBreakpoint(lockedCanvasWidth, activeBreakpoint);
};

export const getConfiguredBreakpoints = (layouts: Layouts): SeedarBreakpoint[] =>
  BREAKPOINT_ORDER.filter((breakpoint) => (layouts[breakpoint] ?? []).length > 0);

export const findNearestConfiguredBreakpoint = (
  layouts: Layouts,
  targetBreakpoint: SeedarBreakpoint,
): SeedarBreakpoint | null => {
  if ((layouts[targetBreakpoint] ?? []).length > 0) {
    return targetBreakpoint;
  }

  const targetIndex = BREAKPOINT_ORDER.indexOf(targetBreakpoint);

  for (let distance = 1; distance < BREAKPOINT_ORDER.length; distance += 1) {
    const largerBreakpoint = BREAKPOINT_ORDER[targetIndex - distance];
    if (largerBreakpoint && (layouts[largerBreakpoint] ?? []).length > 0) {
      return largerBreakpoint;
    }

    const smallerBreakpoint = BREAKPOINT_ORDER[targetIndex + distance];
    if (smallerBreakpoint && (layouts[smallerBreakpoint] ?? []).length > 0) {
      return smallerBreakpoint;
    }
  }

  return null;
};

export const getMaterializedBreakpointLayout = (
  layouts: Layouts,
  targetBreakpoint: SeedarBreakpoint,
): LayoutItem[] => {
  const currentLayout = layouts[targetBreakpoint];
  if (currentLayout) {
    return fitLayoutToBreakpoint(currentLayout, targetBreakpoint);
  }

  const sourceBreakpoint = findNearestConfiguredBreakpoint(layouts, targetBreakpoint);
  if (!sourceBreakpoint) {
    return [];
  }

  return fitLayoutToBreakpoint(layouts[sourceBreakpoint] ?? [], targetBreakpoint);
};

export const normalizeLayouts = (layouts: Layouts): Layouts => {
  const normalized: Layouts = {};

  BREAKPOINT_ORDER.forEach((breakpoint) => {
    const items = layouts[breakpoint];
    if (!items) {
      return;
    }

    const seen = new Map<string, LayoutItem>();
    items.forEach((item) => {
      seen.set(item.i, { ...item });
    });
    normalized[breakpoint] = fitLayoutToBreakpoint(
      Array.from(seen.values()),
      breakpoint,
    );
  });

  return normalized;
};

export const updateBreakpointLayout = (
  layouts: Layouts,
  breakpoint: SeedarBreakpoint,
  items: LayoutItem[],
): Layouts =>
  normalizeLayouts({
    ...layouts,
    [breakpoint]: cloneLayoutItems(items),
  });

export const copyBreakpointLayout = (
  layouts: Layouts,
  from: SeedarBreakpoint,
  targets: SeedarBreakpoint[],
): Layouts => {
  const sourceLayout = getMaterializedBreakpointLayout(layouts, from);
  const nextLayouts: Layouts = { ...layouts };

  targets.forEach((target) => {
    nextLayouts[target] =
      target === from
        ? cloneLayoutItems(sourceLayout)
        : fitLayoutToBreakpoint(sourceLayout, target);
  });

  return normalizeLayouts(nextLayouts);
};

export const addPanelToBreakpoints = ({
  layouts,
  panelId,
  breakpoints,
  defaultSize,
}: {
  layouts: Layouts;
  panelId: string;
  breakpoints: SeedarBreakpoint[];
  defaultSize: { w: number; h: number };
}): Layouts => {
  const nextLayouts: Layouts = { ...layouts };

  breakpoints.forEach((breakpoint) => {
    const currentItems = getMaterializedBreakpointLayout(nextLayouts, breakpoint);

    if (currentItems.some((item) => item.i === panelId)) {
      nextLayouts[breakpoint] = currentItems;
      return;
    }

    const maxY =
      currentItems.length > 0
        ? Math.max(...currentItems.map((item) => item.y + item.h))
        : 0;

    nextLayouts[breakpoint] = [
      ...currentItems,
      {
        i: panelId,
        x: 0,
        y: maxY,
        w: defaultSize.w,
        h: defaultSize.h,
        minW: 3,
        minH: 3,
      },
    ];
  });

  return normalizeLayouts(nextLayouts);
};

export const removePanelFromBreakpoints = (
  layouts: Layouts,
  panelId: string,
): Layouts => {
  const nextLayouts: Layouts = {};

  BREAKPOINT_ORDER.forEach((breakpoint) => {
    const items = layouts[breakpoint];
    if (!items) {
      return;
    }

    nextLayouts[breakpoint] = items.filter((item) => item.i !== panelId);
  });

  return normalizeLayouts(nextLayouts);
};

export const getDefaultLockedCanvasWidth = (
  breakpoint: SeedarBreakpoint,
): number => BREAKPOINT_CANVAS_WIDTHS[breakpoint];

export const clampDashboardViewportScale = (scale: number): number => {
  if (!Number.isFinite(scale)) {
    return DEFAULT_DASHBOARD_VIEWPORT_SCALE;
  }

  return Math.min(
    Math.max(scale, MIN_DASHBOARD_VIEWPORT_SCALE),
    MAX_DASHBOARD_VIEWPORT_SCALE,
  );
};

export const getLayoutHeight = (
  items: LayoutItem[],
  rowHeight: number,
  margin = 0,
): number => {
  if (items.length === 0) {
    return 0;
  }

  const rowCount = Math.max(...items.map((item) => item.y + item.h));
  return rowCount * rowHeight + Math.max(rowCount - 1, 0) * margin;
};

export const getDashboardViewportScale = ({
  mode,
  customScale,
  canvasWidth,
  canvasHeight,
  frameWidth,
  frameHeight,
}: {
  mode: DashboardViewportScaleMode;
  customScale: number;
  canvasWidth: number;
  canvasHeight: number;
  frameWidth: number;
  frameHeight: number;
}): number => {
  if (mode === "custom") {
    return clampDashboardViewportScale(customScale);
  }

  const availableWidth = Math.max(frameWidth - DASHBOARD_FRAME_PADDING, 1);
  const availableHeight = Math.max(frameHeight - DASHBOARD_FRAME_PADDING, 1);
  const widthScale = availableWidth / Math.max(canvasWidth, 1);
  const heightScale =
    canvasHeight > 0 ? availableHeight / canvasHeight : DEFAULT_DASHBOARD_VIEWPORT_SCALE;

  return clampDashboardViewportScale(Math.min(1, widthScale, heightScale));
};

export const getBreakpointSummaryLabel = (
  breakpoint: SeedarBreakpoint,
): string => `${breakpoint.toUpperCase()} · ${BREAKPOINT_LABELS[breakpoint]}`;

export const getBreakpointRangeLabel = (
  breakpoint: SeedarBreakpoint,
): string => {
  const minWidth = BREAKPOINTS[breakpoint];
  const maxWidth = getBreakpointMaxWidth(breakpoint);

  if (maxWidth === undefined) {
    return `>= ${minWidth}px`;
  }

  return `${minWidth}-${maxWidth}px`;
};

export const resolvePanelTargetBreakpoints = ({
  scope,
  activeBreakpoint,
  configuredBreakpoints,
}: {
  scope: AddPanelScope;
  activeBreakpoint: SeedarBreakpoint;
  configuredBreakpoints: SeedarBreakpoint[];
}): SeedarBreakpoint[] => {
  if (scope === "active") {
    return [activeBreakpoint];
  }

  if (scope === "configured") {
    return configuredBreakpoints.length > 0
      ? configuredBreakpoints
      : [activeBreakpoint];
  }

  return BREAKPOINT_ORDER;
};
