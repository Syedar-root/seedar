import { useEffect, useMemo, useRef } from "react";
import type {
  WorkflowAction,
  WorkflowPage,
} from "#pkg/seedar/types";
import { useWorkflowActionsStore } from "@/core/store";

type WorkflowTriggerAction = Extract<WorkflowAction, { type: "trigger_action" }>;
type WorkflowActionHandlerResult = Record<string, unknown> | void;

export interface WorkflowActionHandler {
  (
    action: WorkflowTriggerAction,
  ): Promise<WorkflowActionHandlerResult> | WorkflowActionHandlerResult;
}

interface UseWorkflowActionConsumerParams {
  page: WorkflowPage;
  handlers: Partial<Record<WorkflowTriggerAction["target"], WorkflowActionHandler>>;
  onActionFailed?: (
    action: WorkflowTriggerAction,
    error: { code: string; message: string },
  ) => void;
}

const normalizeWorkflowActionError = (error: unknown) => {
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    "message" in error &&
    typeof error.code === "string" &&
    typeof error.message === "string"
  ) {
    return {
      code: error.code,
      message: error.message,
    };
  }

  if (error instanceof Error) {
    return {
      code: "WORKFLOW_ACTION_FAILED",
      message: error.message,
    };
  }

  return {
    code: "WORKFLOW_ACTION_FAILED",
    message: "前端动作执行失败",
  };
};

const waitForReactStateFlush = async () => {
  if (typeof window === "undefined") {
    return;
  }

  await new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => resolve());
  });

  await new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => resolve());
  });
};

export const useWorkflowActionConsumer = ({
  page,
  handlers,
  onActionFailed,
}: UseWorkflowActionConsumerParams) => {
  const actions = useWorkflowActionsStore((state) => state.actions);
  const pendingActions = useMemo(
    () =>
      actions.filter(
      (task) =>
        task.status === "pending" &&
        task.action.type === "trigger_action" &&
        task.action.page === page,
      ),
    [actions, page],
  );

  const handlersRef = useRef(handlers);
  const processingIdsRef = useRef(new Set<string>());

  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  useEffect(() => {
    pendingActions.forEach((task) => {
      if (processingIdsRef.current.has(task.id)) {
        return;
      }

      processingIdsRef.current.add(task.id);

      void (async () => {
        const store = useWorkflowActionsStore.getState();
        const startedTask = store.startAction(task.id);

        if (!startedTask || startedTask.action.type !== "trigger_action") {
          return;
        }

        const handler = handlersRef.current[startedTask.action.target];

        if (!handler) {
          store.failAction(task.id, {
            code: "WORKFLOW_ACTION_HANDLER_NOT_FOUND",
            message: `页面 ${page} 未注册动作处理器: ${startedTask.action.target}`,
          });
          return;
        }

        try {
          const result = await handler(startedTask.action);
          await waitForReactStateFlush();
          store.finishAction(task.id, result ?? undefined);
        } catch (error) {
          const normalizedError = normalizeWorkflowActionError(error);
          store.failAction(task.id, normalizedError);
          onActionFailed?.(startedTask.action, normalizedError);
        }
      })().finally(() => {
        processingIdsRef.current.delete(task.id);
      });
    });
  }, [onActionFailed, page, pendingActions]);
};
