import { useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import type {
  AiChatResumeDto,
  WorkflowRunInterrupt,
} from "#pkg/seedar/types";
import { executeWorkflowInterrupt } from "@/core/workflow";
import type {
  ChatMessage,
  MessageUpdate,
  WorkflowExecutionState,
} from "../types";

interface UseWorkflowInterruptExecutorParams {
  enabled?: boolean;
  messages: ChatMessage[];
  onResume: (resumePayload: AiChatResumeDto) => Promise<unknown>;
  onUpdateMessage: (id: string, updates: MessageUpdate) => void;
  persistedHandledInterruptIds?: string[];
  onHandledInterruptIdsChange?: (interruptIds: string[]) => void;
}

const getLatestWorkflowInterrupt = (messages: ChatMessage[]) => {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];

    if (
      message.type === "interrupt" &&
      typeof message.content !== "string" &&
      message.content.value.kind === "workflow_run"
    ) {
      return {
        interrupt: message.content.value,
        messageId: message.id,
      };
    }
  }

  return undefined;
};

export const useWorkflowInterruptExecutor = ({
  enabled = true,
  messages,
  onResume,
  onUpdateMessage,
  persistedHandledInterruptIds = [],
  onHandledInterruptIdsChange,
}: UseWorkflowInterruptExecutorParams) => {
  const navigate = useNavigate();
  const handledInterruptIdsRef = useRef(new Set<string>());
  const latestWorkflowInterrupt = useMemo(
    () => getLatestWorkflowInterrupt(messages),
    [messages],
  );

  useEffect(() => {
    handledInterruptIdsRef.current = new Set(persistedHandledInterruptIds);
  }, [persistedHandledInterruptIds]);

  useEffect(() => {
    if (messages.length === 0) {
      handledInterruptIdsRef.current.clear();
      onHandledInterruptIdsChange?.([]);
    }
  }, [messages.length, onHandledInterruptIdsChange]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    if (!latestWorkflowInterrupt) {
      return;
    }

    const interruptId = latestWorkflowInterrupt.interrupt.interruptId;
    if (handledInterruptIdsRef.current.has(interruptId)) {
      return;
    }

    handledInterruptIdsRef.current.add(interruptId);
    onHandledInterruptIdsChange?.([
      ...handledInterruptIdsRef.current,
    ]);

    void (async () => {
      const interrupt = latestWorkflowInterrupt.interrupt as WorkflowRunInterrupt;
      const messageId = latestWorkflowInterrupt.messageId;
      const interruptResult = await executeWorkflowInterrupt(
        interrupt,
        {
          navigate,
        },
        {
          onStateChange: (workflowExecution) => {
            onUpdateMessage(messageId, (previous) => ({
              ...previous,
              workflowExecution: workflowExecution as WorkflowExecutionState,
            }));
          },
        },
      );

      try {
        await onResume({
          kind: "interrupt_result",
          interruptResult,
        });
      } catch (error) {
        handledInterruptIdsRef.current.delete(interruptId);
        onHandledInterruptIdsChange?.([
          ...handledInterruptIdsRef.current,
        ]);
        throw error;
      }
    })().catch((error) => {
      console.error("Workflow interrupt execution failed:", error);
    });
  }, [enabled, latestWorkflowInterrupt, navigate, onResume, onUpdateMessage]);
};
