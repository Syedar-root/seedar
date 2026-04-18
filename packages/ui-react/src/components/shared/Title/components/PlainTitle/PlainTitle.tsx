import React from "react";
import { PlainTitleProps } from "../../types";
import styles from "./PlainTitle.module.css";

export const PlainTitle: React.FC<PlainTitleProps> = ({ content }) => {
  return <h3 className={styles.plain}>{content}</h3>;
};
