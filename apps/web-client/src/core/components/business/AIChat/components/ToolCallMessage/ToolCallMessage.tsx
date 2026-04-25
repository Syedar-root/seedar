import React, { useState } from "react";
import { Wrench, ChevronUp, ChevronRight, CheckCircle } from "lucide-react";
import type { ToolCallMessageProps } from "./types";
import styles from "./ToolCallMessage.module.scss";
import { ToolResultMessage } from "../ToolResultMessage";

const ToolCallMessage: React.FC<ToolCallMessageProps> = ({
  meta,
  toolCallId,
  resultContent,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const toolName = meta?.name || meta?.tool_call?.name || "未知工具";
  const hasResult = !!resultContent;

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className={styles["container"]}>
      <div
        className={styles["header"]}
        onClick={hasResult ? handleToggle : undefined}
      >
        <Wrench
          size={16}
          color="var(--chat-color-muted)"
          className={styles["icon"]}
        />
        <span className={styles["label"]}>{toolName}</span>
        {hasResult && (
          <span className={styles["toggle-icon"]}>
            {isExpanded ? <ChevronUp size={16} /> : <ChevronRight size={16} />}
          </span>
        )}
      </div>
      {hasResult && isExpanded && <ToolResultMessage content={resultContent} />}
    </div>
  );
};

export default ToolCallMessage;
