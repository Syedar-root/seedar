import React from "react";
import type { InterruptMessageProps } from "../../types";
import type { AiInterruptPayload } from "#pkg/seedar/types";
import {
  AskUserInterrupt,
  WorkflowRunInterrupt,
} from "./components";
import type { InterruptRendererProps } from "./types";

const INTERRUPT_RENDERERS: Record<
  AiInterruptPayload["kind"],
  React.FC<InterruptRendererProps>
> = {
  ask_user: AskUserInterrupt,
  workflow_run: WorkflowRunInterrupt,
};

const InterruptMessage: React.FC<InterruptMessageProps> = ({
  content,
  message,
  onSubmit,
  disabled = false,
}) => {
  if (typeof content === "string") {
    return (
      <AskUserInterrupt
        content={content}
        message={message}
        onSubmit={onSubmit}
        disabled={disabled}
      />
    );
  }

  const interruptValue = content.value;
  const InterruptRenderer = INTERRUPT_RENDERERS[interruptValue.kind];

  return (
    <InterruptRenderer
      content={content}
      message={message}
      onSubmit={onSubmit}
      disabled={disabled}
    />
  );
};

export default InterruptMessage;
