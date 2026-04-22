import React from "react";
import { ThoughtChain, type ThoughtChainItemType } from "@ant-design/x";
import {
  getFrontendWorkflowTemplate,
  getWorkflowActionPresentation,
  type AiInterruptPayload,
} from "#pkg/seedar/types";
import type { InterruptRendererProps } from "../../types";
import styles from "./WorkflowRunInterrupt.module.scss";

const WorkflowRunInterrupt: React.FC<InterruptRendererProps> = ({ content }) => {
  if (typeof content === "string") {
    return null;
  }

  const interruptValue: AiInterruptPayload = content.value;
  if (interruptValue.kind !== "workflow_run") {
    return null;
  }

  const { request } = interruptValue;
  const template = getFrontendWorkflowTemplate(request.workflowId);
  const items: ThoughtChainItemType[] =
    template?.actions.map((action, index) => {
      const presentation = getWorkflowActionPresentation(action);

      return {
        key: `${request.workflowId}-${index}`,
        title: presentation.title,
        description: presentation.description,
        status: index === 0 ? "loading" : undefined,
      };
    }) || [];

  return (
    <div className={styles["container"]}>
      <div className={styles["header"]}>{request.workflowId}</div>
      <div className={styles["summary-area"]}>
        {items.length > 0 ? (
          <ThoughtChain
            items={items}
            defaultExpandedKeys={items
              .map((item) => item.key)
              .filter((key): key is string => typeof key === "string")}
          />
        ) : null}
      </div>
    </div>
  );
};

export { WorkflowRunInterrupt };
