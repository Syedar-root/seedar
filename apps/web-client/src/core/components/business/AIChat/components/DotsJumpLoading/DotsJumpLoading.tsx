import React from "react";
import styles from "./DotsJumpLoading.module.css";
import type { DotsJumpLoadingProps } from "./types";

const DotsJumpLoading: React.FC<DotsJumpLoadingProps> = ({
  size = "medium",
  color,
  dotSize,
  speed = 1,
}) => {
  const containerClasses = [styles.container, styles[size]]
    .filter(Boolean)
    .join(" ");

  const dotStyle: React.CSSProperties = {
    color,
    width: dotSize,
    height: dotSize,
    animationDuration: `${0.6 / speed}s`,
  };

  return (
    <div className={containerClasses}>
      <span className={styles.dot} style={dotStyle} />
      <span className={styles.dot} style={dotStyle} />
      <span className={styles.dot} style={dotStyle} />
    </div>
  );
};

export default DotsJumpLoading;
