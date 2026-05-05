export const COLS_RATE = 10;
export const DEFAULT_W = 6 * COLS_RATE;
export const DEFAULT_H = 4 * COLS_RATE;

export const BREAKPOINTS = {
  lg: 1200,
  md: 996,
  sm: 768,
  xs: 480,
  xxs: 0,
} as const;

export type SeedarBreakpoint = keyof typeof BREAKPOINTS;
export type AddPanelScope = "active" | "configured" | "all";
export type DashboardViewportScaleMode = "auto" | "custom";

export const BREAKPOINT_ORDER: SeedarBreakpoint[] = [
  "lg",
  "md",
  "sm",
  "xs",
  "xxs",
];

export const BREAKPOINT_LABELS: Record<SeedarBreakpoint, string> = {
  lg: "Large",
  md: "Desktop",
  sm: "Tablet",
  xs: "Mobile",
  xxs: "Compact",
};

export const BREAKPOINT_CANVAS_WIDTHS: Record<SeedarBreakpoint, number> = {
  lg: 1440,
  md: 1100,
  sm: 820,
  xs: 560,
  xxs: 360,
};

export const DASHBOARD_VIEWPORT_SCALE_OPTIONS = [
  0.5, 0.67, 0.75, 0.9, 1, 1.25,
] as const;

export const DEFAULT_DASHBOARD_VIEWPORT_SCALE = 1;
export const MIN_DASHBOARD_VIEWPORT_SCALE = 0.05;
export const MAX_DASHBOARD_VIEWPORT_SCALE = 2;
export const DASHBOARD_FRAME_PADDING = 32;

export const COLS = {
  lg: 12 * COLS_RATE,
  md: 10 * COLS_RATE,
  sm: 6 * COLS_RATE,
  xs: 4 * COLS_RATE,
  xxs: 2 * COLS_RATE,
};
export const MARGIN = 0;
