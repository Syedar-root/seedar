import React from "react";
import { VChart } from "@visactor/react-vchart";
import { CardSurface } from "../CardSurface";
import { renderTrend, generateChartConfig } from "../../utils";
import { useChartHeight } from "./hooks/useChartHeight.hook";
import type { ChartCardProps } from "../../types";
import styles from "./LineChartCard.module.scss";

export const LineChartCard: React.FC<ChartCardProps> = ({
  title,
  value,
  icon,
  suffix,
  prefix,
  loading = false,
  onClick,
  className,
  trendDirection = "none",
  changeRate,
  changeValue,
  width,
  chartData = [],
  chartColor = "#165DFF",
  chartSmooth = true,
  chartHighlightKeys = [],
  variant: _variant,
}) => {
  const cardClasses = [styles["line-chart-card"], className]
    .filter(Boolean)
    .join(" ");
  const { containerRef, chartHeight } = useChartHeight();

  const { spec } = generateChartConfig({
    chartData,
    chartColor,
    chartSmooth,
    chartHighlightKeys,
  });

  const trendElement = renderTrend({
    trendDirection,
    changeRate,
    changeValue,
    classNames: {
      trendSection: styles["trend-section"],
      trendItem: styles["trend-item"],
      trendDivider: styles["trend-divider"],
    },
  });

  return (
    <CardSurface
      bodyClassName={styles["card-body"]}
      className={cardClasses}
      loading={loading}
      loadingVariant="chart"
      onClick={onClick}
      width={width}
    >
      <div className={styles["chart-card-content"]}>
        <div ref={containerRef} className={styles["left-section"]}>
          {icon && <div className={styles["icon-wrapper"]}>{icon}</div>}
          <div className={styles["info-wrapper"]}>
            {title && <div className={styles["title-area"]}>{title}</div>}
            <div className={styles["value-row"]}>
              {prefix && <span className={styles["prefix-text"]}>{prefix}</span>}
              <span className={styles["value-text"]}>{value}</span>
              {suffix && <span className={styles["suffix-text"]}>{suffix}</span>}
            </div>
            {trendElement}
          </div>
        </div>
        <div className={styles["right-section"]}>
          <div
            className={styles["chart-wrapper"]}
            style={{ height: chartHeight }}
          >
            <VChart spec={spec} style={{ height: "100%", width: "100%" }} />
          </div>
        </div>
      </div>
    </CardSurface>
  );
};
