import React from "react";
import type { TextMessageProps } from "./types";
import { XMarkdown } from "@ant-design/x-markdown";
import "@ant-design/x-markdown/themes/light.css";
import { getFrontendWorkflowTemplate } from "#pkg/seedar/types";

const TextMessage: React.FC<TextMessageProps> = ({ message }) => {
  switch (message.type) {
    case "text":
      return (
        <XMarkdown
          className="x-markdown-light"
          content={
            typeof message.content === "string"
              ? message.content
              : message.content.value.kind === "ask_user"
                ? message.content.value.questions
                    .map((q) => q.question)
                    .join("\n")
                : message.content.value.kind === "workflow_run"
                  ? `Workflow: ${
                      getFrontendWorkflowTemplate(
                        message.content.value.request.workflowId,
                      )?.title ?? message.content.value.request.workflowId
                    }`
                  : ""
          }
        />
      );
    default:
      return (
        <span>
          {typeof message.content === "string" ? message.content : ""}
        </span>
      );
  }
};

export default TextMessage;
