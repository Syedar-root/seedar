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

export const COLS = {
  lg: 12 * COLS_RATE,
  md: 10 * COLS_RATE,
  sm: 6 * COLS_RATE,
  xs: 4 * COLS_RATE,
  xxs: 2 * COLS_RATE,
};
export const MARGIN = 10;
