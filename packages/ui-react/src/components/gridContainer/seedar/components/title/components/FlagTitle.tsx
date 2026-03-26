import React from "react";
import { FlagTitleProps } from "../types";
import styles from "../title.module.css";

export const FlagTitle: React.FC<FlagTitleProps> = ({
  content,
  flagColor = "#008ffa",
  maxTitleWidth = "100%",
}) => {
  return (
    <div
      className={styles.flagContainer}
      style={
        {
          "--flag-color": flagColor,
          "--max-title-width": maxTitleWidth,
        } as React.CSSProperties
      }
    >
      <div className={styles.flagMarker}></div>
      <div className={styles.flagContent}>{content}</div>
    </div>
  );
};
