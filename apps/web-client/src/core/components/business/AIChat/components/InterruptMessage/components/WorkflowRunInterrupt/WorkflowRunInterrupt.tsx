import React from "react";
import { ThoughtChain, type ThoughtChainItemType } from "@ant-design/x";
import {
  getFrontendWorkflowTemplate,
  getWorkflowActionPresentation,
  type AiInterruptPayload,
} from "#pkg/seedar/types";
import type { InterruptRendererProps } from "../../types";
import styles from "./WorkflowRunInterrupt.module.scss";

const STATUS_LABELS = {
  pending: "等待执行",
  running: "执行中",
  done: "执行完成",
  failed: "执行失败",
} as const;

const mapThoughtChainStatus = (
  status: "pending" | "running" | "done" | "failed",
) => {
  if (status === "running") {
    return "loading";
  }

  if (status === "done") {
    return "success";
  }

  if (status === "failed") {
    return "error";
  }

  return undefined;
};

const WorkflowRunInterrupt: React.FC<InterruptRendererProps> = ({
  content,
  message,
}) => {
  if (typeof content === "string") {
    return null;
  }

  const interruptValue: AiInterruptPayload = content.value;
  if (interruptValue.kind !== "workflow_run") {
    return null;
  }

  const { request, interruptId } = interruptValue;
  const template = getFrontendWorkflowTemplate(request.workflowId);
  const execution = message?.workflowExecution;
  const workflowTitle = template?.title ?? request.workflowId;

  const items: ThoughtChainItemType[] =
    template?.actions.map((action, index) => {
      const presentation = getWorkflowActionPresentation(action);
      const stepKey = `${request.workflowId}-${index}`;
      const executionStep = execution?.steps.find((step) => step.key === stepKey);
      const status = executionStep?.status ?? (index === 0 ? "running" : "pending");

      return {
        key: stepKey,
        title: presentation.title,
        description:
          executionStep?.error?.message ??
          executionStep?.description ??
          presentation.description,
        status: mapThoughtChainStatus(status),
      };
    }) || [];

  const summaryText = execution
    ? STATUS_LABELS[execution.status]
    : STATUS_LABELS.running;
  const showConfirmHint =
    execution?.status === "done" || execution?.status === "failed";

  return (
    <div className={styles["container"]}>
      <div className={styles["header-row"]}>
        <div className={styles["header"]}>{workflowTitle}</div>
        <div className={styles["status"]}>{summaryText}</div>
      </div>
      <div className={styles["meta"]}>interruptId: {interruptId}</div>
      {showConfirmHint ? (
        <div className={styles["confirmHint"]}>
          <div className={styles["confirmHintTitle"]}>下一步需要到图表区域确认结果</div>
          <div className={styles["confirmHintDesc"]}>
            请留意页面里的“接受并作为当前结果”或“撤销本轮 AI 修改”操作。
          </div>
        </div>
      ) : null}
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
