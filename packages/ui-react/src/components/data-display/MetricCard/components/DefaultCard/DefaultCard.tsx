import React from "react";
import { CardSurface } from "../CardSurface";
import { renderTrend } from "../../utils";
import type { DefaultCardProps } from "../../types";
import styles from "./DefaultCard.module.scss";

export const DefaultCard: React.FC<DefaultCardProps> = ({
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
  variant: _variant,
}) => {
  const cardClasses = [styles["default-card"], className]
    .filter(Boolean)
    .join(" ");

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
      className={cardClasses}
      loading={loading}
      loadingVariant="default"
      onClick={onClick}
      width={width}
    >
      <div className={styles["card-content"]}>
        {icon && <div className={styles["icon-wrapper"]}>{icon}</div>}
        <div className={styles["statistic-wrapper"]}>
          <div className={styles["title-text"]}>{title}</div>
          <div className={styles["value-row"]}>
            {prefix && <span className={styles["prefix-text"]}>{prefix}</span>}
            <span className={styles["value-text"]}>{value}</span>
            {suffix && <span className={styles["suffix-text"]}>{suffix}</span>}
          </div>
          {trendElement}
        </div>
      </div>
    </CardSurface>
  );
};
