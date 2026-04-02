import React from "react";
import { BrutalistTitleProps } from "../../types";
import styles from "./BrutalistTitle.module.css";

export const BrutalistTitle: React.FC<BrutalistTitleProps> = ({
  content,
  flagColor = "#008ffa",
  subtitle,
  maxTitleWidth = "100%",
  number,
}) => {
  return (
    <div
      className={styles.brutalistContainer}
      style={
        {
          "--max-title-width": maxTitleWidth,
          "--accent-color": flagColor,
        } as React.CSSProperties
      }
    >
      <div className={styles.brutalistHeader}>
        <span className={styles.brutalistNumber}>{number}</span>
        <h3 className={styles.brutalistTitle}>{content}</h3>
      </div>
      {subtitle && <p className={styles.brutalistSubtitle}>{subtitle}</p>}
    </div>
  );
};
