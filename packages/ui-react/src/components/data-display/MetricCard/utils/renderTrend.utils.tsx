import type { ReactNode } from "react";
import type { TrendDirection } from "../types";

interface RenderTrendParams {
  trendDirection: TrendDirection;
  changeRate?: string;
  changeValue?: string;
  classNames: {
    trendSection: string;
    trendItem: string;
    trendDivider: string;
  };
}

export function renderTrend(params: RenderTrendParams): ReactNode {
  const { trendDirection, changeRate, changeValue, classNames } = params;
  const trendItems: ReactNode[] = [];

  if (trendDirection === "up" || trendDirection === "down") {
    const trendIcon = trendDirection === "up" ? "↑" : "↓";
    if (changeRate) {
      trendItems.push(
        <span key="rate" className={classNames.trendItem}>
          <span aria-hidden="true">{trendIcon}</span>
          <span>{changeRate}</span>
        </span>
      );
    }
    if (changeValue) {
      trendItems.push(
        <span key="value" className={classNames.trendItem}>
          {trendItems.length > 0 && (
            <span className={classNames.trendDivider}>|</span>
          )}
          <span>{changeValue}</span>
        </span>
      );
    }
  }

  if (trendItems.length === 0) {
    return null;
  }

  return (
    <div className={classNames.trendSection} data-direction={trendDirection}>
      {trendItems}
    </div>
  );
}
