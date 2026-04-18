import type { MetricCardCommonProps } from "../types";

export function resolveCardWidth(width?: MetricCardCommonProps["width"]) {
  if (width === undefined || width === null || width === "") {
    return undefined;
  }

  if (typeof width === "number") {
    return `${width}px`;
  }

  const normalizedWidth = Number(width);

  if (!Number.isNaN(normalizedWidth)) {
    return `${normalizedWidth}px`;
  }

  return width;
}
