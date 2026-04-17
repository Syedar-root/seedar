import React from "react";
import type { CSSProperties } from "react";
import { CardSurface } from "../CardSurface";
import { getProgressCardMetrics } from "../../utils";
import type { ProgressCardProps } from "../../types";
import styles from "./ProgressCard.module.scss";

export const ProgressCard: React.FC<ProgressCardProps> = ({
  title,
  value,
  icon,
  suffix,
  prefix,
  loading = false,
  onClick,
  className,
  width,
  target,
  targetLabel = "Target",
  remainingLabel = "Remaining",
  progressColor = "#6366f1",
  variant: _variant,
}) => {
  const cardClasses = [styles["progress-card"], className]
    .filter(Boolean)
    .join(" ");
  const { progressPercent, formattedRemainingValue } = getProgressCardMetrics({
    value,
    target,
    suffix,
  });
  const progressStyles = {
    "--progress-color": progressColor,
    "--progress-value": `${progressPercent}%`,
  } as CSSProperties;

  return (
    <CardSurface
      className={cardClasses}
      loading={loading}
      loadingVariant="progress"
      onClick={onClick}
      style={progressStyles}
      width={width}
    >
      <div className={styles["card-content"]}>
        <div className={styles["header-section"]}>
          {icon && <div className={styles["icon-wrapper"]}>{icon}</div>}
          <span className={styles["title-text"]}>{title}</span>
        </div>

        <div className={styles["value-section"]}>
          <div className={styles["value-group"]}>
            {prefix && <span className={styles.prefix}>{prefix}</span>}
            <span className={styles["value-number"]}>{value}</span>
            {suffix && <span className={styles.suffix}>{suffix}</span>}
          </div>
          <span className={styles["progress-percent"]}>{Math.round(progressPercent)}%</span>
        </div>

        <div className={styles["progress-section"]}>
          <div
            aria-label={`${title} progress`}
            aria-valuemax={100}
            aria-valuemin={0}
            aria-valuenow={Math.round(progressPercent)}
            className={styles["progress-track"]}
            role="progressbar"
          >
            <div className={styles["progress-fill"]} />
          </div>
        </div>

        <div className={styles["meta-section"]}>
          <div className={styles["meta-item"]}>
            <span className={styles["meta-label"]}>{targetLabel}</span>
            <span className={styles["meta-value"]}>
              {prefix}
              {target}
              {suffix}
            </span>
          </div>
          <div className={styles["meta-divider"]} />
          <div className={styles["meta-item"]}>
            <span className={styles["meta-label"]}>{remainingLabel}</span>
            <span className={styles["meta-value"]}>
              {prefix}
              {formattedRemainingValue}
              {suffix}
            </span>
          </div>
        </div>
      </div>
    </CardSurface>
  );
};
