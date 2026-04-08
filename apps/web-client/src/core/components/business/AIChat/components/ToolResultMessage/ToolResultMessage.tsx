import React from "react";
import { ScrollArea } from "@/core/components/ui/ScrollArea";
import { XMarkdown } from "@ant-design/x-markdown";
import "@ant-design/x-markdown/themes/light.css";
import type { ToolResultMessageProps } from "./types";
import styles from "./ToolResultMessage.module.scss";

const isJSON = (str: string): boolean => {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
};

const ToolResultMessage: React.FC<ToolResultMessageProps> = ({ content }) => {
  const isJsonContent = isJSON(content);

  return (
    <div className={styles["container"]}>
      <ScrollArea className={styles["content"]}>
        {isJsonContent ? (
          <pre className={styles["jsonContent"]}>
            <code>{JSON.stringify(JSON.parse(content), null, 2)}</code>
          </pre>
        ) : (
          <XMarkdown className="x-markdown-light" content={content} />
        )}
      </ScrollArea>
    </div>
  );
};

export { ToolResultMessage };
export type { ToolResultMessageProps };
