import { useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import type {
  AiChatResumeDto,
  WorkflowRunInterrupt,
} from "#pkg/seedar/types";
import { executeWorkflowInterrupt } from "@/core/workflow";
import type { ChatMessage } from "../types";

interface UseWorkflowInterruptExecutorParams {
  enabled?: boolean;
  messages: ChatMessage[];
  onResume: (resumePayload: AiChatResumeDto) => Promise<unknown>;
}

const getLatestWorkflowInterrupt = (messages: ChatMessage[]) => {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];

    if (
      message.type === "interrupt" &&
      typeof message.content !== "string" &&
      message.content.value.kind === "workflow_run"
    ) {
      return message.content.value;
    }
  }

  return undefined;
};

export const useWorkflowInterruptExecutor = ({
  enabled = true,
  messages,
  onResume,
}: UseWorkflowInterruptExecutorParams) => {
  const navigate = useNavigate();
  const handledInterruptIdsRef = useRef(new Set<string>());
  const latestWorkflowInterrupt = useMemo(
    () => getLatestWorkflowInterrupt(messages),
    [messages],
  );

  useEffect(() => {
    if (messages.length === 0) {
      handledInterruptIdsRef.current.clear();
    }
  }, [messages.length]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    if (!latestWorkflowInterrupt) {
      return;
    }

    const { interruptId } = latestWorkflowInterrupt;
    if (handledInterruptIdsRef.current.has(interruptId)) {
      return;
    }

    handledInterruptIdsRef.current.add(interruptId);

    void (async () => {
      const interrupt = latestWorkflowInterrupt as WorkflowRunInterrupt;
      const interruptResult = await executeWorkflowInterrupt(interrupt, {
        navigate,
      });

      try {
        await onResume({
          kind: "interrupt_result",
          interruptResult,
        });
      } catch (error) {
        handledInterruptIdsRef.current.delete(interruptId);
        throw error;
      }
    })().catch((error) => {
      console.error("Workflow interrupt execution failed:", error);
    });
  }, [enabled, latestWorkflowInterrupt, navigate, onResume]);
};
