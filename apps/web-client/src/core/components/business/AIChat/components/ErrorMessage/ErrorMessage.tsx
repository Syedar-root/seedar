import React from "react";
import { AlertCircle } from "lucide-react";
import type { ErrorMessageProps } from "./types";
import styles from "./ErrorMessage.module.scss";

const ErrorMessage: React.FC<ErrorMessageProps> = ({ content }) => {
  return (
    <div className={styles["container"]}>
      <AlertCircle
        size={18}
        color="var(--chat-color-error)"
        className={styles["icon"]}
      />
      <div className={styles["content"]}>{content}</div>
    </div>
  );
};

export default ErrorMessage;
