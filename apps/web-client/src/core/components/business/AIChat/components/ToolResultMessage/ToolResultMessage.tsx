import React from "react";
import { CheckCircle } from "lucide-react";
import type { ToolResultMessageProps } from "./types";
import styles from "./ToolResultMessage.module.scss";

const ToolResultMessage: React.FC<ToolResultMessageProps> = ({
  content,
  meta,
}) => {
  const toolName = meta?.name || "未知工具";
  return (
    <div className={styles['container']}>
      <div className={styles['header']}>
        <CheckCircle
          size={12}
          color="var(--chat-color-muted)"
          className={styles['header-icon']}
        />
        <span className={styles['header-title']}>
          {toolName}
        </span>
      </div>
      <div className={styles['content']}>
        {content}
      </div>
    </div>
  );
};

export default ToolResultMessage;