import React from "react";
import type { LineLoadingProps } from "./types";
import styles from "./LineLoading.module.scss";

export const LineLoading: React.FC<LineLoadingProps> = ({
  className,
  color,
  width = 120,
  duration = 1.5,
}) => {
  return (
    <div
      className={`${styles["line-loading"]} ${className || ""}`}
      style={{
        width: `${width}px`,
        ["--line-loading-duration" as string]: `${duration}s`,
        ["--line-loading-color" as string]: color || "var(--chat-color-primary, #8b5cf6)",
      }}
    >
      <div className={styles["line-loading__track"]}>
        <div className={styles["line-loading__bar"]} />
      </div>
    </div>
  );
};

export default LineLoading;