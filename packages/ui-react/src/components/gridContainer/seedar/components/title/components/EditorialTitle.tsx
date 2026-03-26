import React from "react";
import { EditorialTitleProps } from "../types";
import styles from "../title.module.css";

export const EditorialTitle: React.FC<EditorialTitleProps> = ({
  content,
  subtitle,
  accentText,
  maxTitleWidth = "100%",
}) => {
  return (
    <div
      className={styles.editorialContainer}
      style={{ "--max-title-width": maxTitleWidth } as React.CSSProperties}
    >
      {accentText && <span className={styles.editorialAccent}>{accentText}</span>}
      <h2 className={styles.editorialTitle}>{content}</h2>
      {subtitle && <p className={styles.editorialSubtitle}>{subtitle}</p>}
    </div>
  );
};
