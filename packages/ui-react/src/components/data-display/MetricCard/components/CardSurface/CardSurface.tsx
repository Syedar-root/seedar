import React from "react";
import type { KeyboardEvent } from "react";
import { resolveCardWidth } from "../../utils";
import type { CardSurfaceProps } from "./types";
import styles from "./CardSurface.module.scss";

function renderLoadingSkeleton(loadingVariant: NonNullable<CardSurfaceProps["loadingVariant"]>) {
  if (loadingVariant === "chart") {
    return (
      <div className={styles["loading-chart"]}>
        <div className={styles["loading-chart-main"]}>
          <span className={styles["loading-bar"]} data-size="sm" />
          <span className={styles["loading-bar"]} data-size="lg" />
          <span className={styles["loading-bar"]} data-size="md" />
        </div>
        <div className={styles["loading-chart-side"]}>
          <span className={styles["loading-bar"]} data-size="xl" />
        </div>
      </div>
    );
  }

  if (loadingVariant === "progress") {
    return (
      <div className={styles["loading-progress"]}>
        <div className={styles["loading-row"]}>
          <span className={styles["loading-circle"]} />
          <span className={styles["loading-bar"]} data-size="md" />
        </div>
        <div className={styles["loading-stack"]}>
          <span className={styles["loading-bar"]} data-size="lg" />
          <span className={styles["loading-bar"]} data-size="sm" />
        </div>
        <span className={styles["loading-bar"]} data-size="full" />
        <div className={styles["loading-row"]}>
          <div className={styles["loading-stack"]}>
            <span className={styles["loading-bar"]} data-size="xs" />
            <span className={styles["loading-bar"]} data-size="sm" />
          </div>
          <div className={styles["loading-stack"]}>
            <span className={styles["loading-bar"]} data-size="xs" />
            <span className={styles["loading-bar"]} data-size="sm" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles["loading-default"]}>
      <span className={styles["loading-circle"]} />
      <div className={styles["loading-stat"]}>
        <span className={styles["loading-bar"]} data-size="sm" />
        <span className={styles["loading-bar"]} data-size="lg" />
        <span className={styles["loading-bar"]} data-size="md" />
      </div>
    </div>
  );
}

export const CardSurface: React.FC<CardSurfaceProps> = ({
  children,
  className,
  bodyClassName,
  width,
  loading = false,
  loadingVariant = "default",
  onClick,
  style,
}) => {
  const resolvedWidth = resolveCardWidth(width);
  const cardClasses = [styles["card-surface"], onClick ? styles.clickable : "", className]
    .filter(Boolean)
    .join(" ");
  const bodyClasses = [styles["card-body"], bodyClassName].filter(Boolean).join(" ");
  const surfaceStyle = {
    ...style,
    width: resolvedWidth ?? style?.width,
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!onClick) {
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClick();
    }
  };

  return (
    <div
      aria-busy={loading}
      className={cardClasses}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role={onClick ? "button" : undefined}
      style={surfaceStyle}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className={bodyClasses}>
        {loading ? <div className={styles["loading-state"]}>{renderLoadingSkeleton(loadingVariant)}</div> : children}
      </div>
    </div>
  );
};
