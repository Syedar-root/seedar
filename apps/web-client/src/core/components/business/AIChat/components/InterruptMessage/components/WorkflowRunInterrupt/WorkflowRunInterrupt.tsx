import React from "react";
import type { AiInterruptPayload } from "#pkg/seedar/types";
import styles from "../../InterruptMessage.module.scss";
import type { InterruptRendererProps } from "../../types";

const WorkflowRunInterrupt: React.FC<InterruptRendererProps> = ({ content }) => {
  if (typeof content === "string") {
    return null;
  }

  const interruptValue: AiInterruptPayload = content.value;
  if (interruptValue.kind !== "workflow_run") {
    return null;
  }

  const { request } = interruptValue;

  return (
    <div className={styles["container"]}>
      <div className={styles["header"]}>Workflow 请求</div>
      <div className={styles["summary-area"]}>
        <h3>{request.workflowId}</h3>
        <p>前端正在自动执行当前 workflow，请稍候。</p>
        {request.params ? (
          <pre>{JSON.stringify(request.params, null, 2)}</pre>
        ) : null}
      </div>
    </div>
  );
};

export { WorkflowRunInterrupt };
