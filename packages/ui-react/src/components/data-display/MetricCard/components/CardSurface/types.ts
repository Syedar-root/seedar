import type { CSSProperties, ReactNode } from "react";

export type CardSurfaceLoadingVariant = "default" | "chart" | "progress";

export interface CardSurfaceProps {
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  width?: number | string;
  loading?: boolean;
  loadingVariant?: CardSurfaceLoadingVariant;
  onClick?: () => void;
  style?: CSSProperties;
}
