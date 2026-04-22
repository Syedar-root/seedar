import {
  getFrontendWorkflowTemplate,
  type StartWorkflowRequest,
  type WorkflowAction,
  type WorkflowRunInterrupt,
  type WorkflowRunResult,
} from "#pkg/seedar/types";
import { dispatchWorkflowAction } from "@/core/store";

const WORKFLOW_ACTION_TIMEOUT_MS = 15_000;

interface WorkflowExecutorDependencies {
  navigate: (to: string, options?: { replace?: boolean }) => void;
}

type WorkflowParams = StartWorkflowRequest["params"];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const createWorkflowResult = (
  interruptId: string,
  workflowId: string,
  status: WorkflowRunResult["status"],
  result?: Record<string, unknown>,
  error?: WorkflowRunResult["error"],
): WorkflowRunResult => ({
  kind: "workflow_result",
  interruptId,
  workflowId,
  status,
  result,
  error,
});

const normalizeWorkflowError = (
  error: unknown,
  fallbackCode: string,
): NonNullable<WorkflowRunResult["error"]> => {
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
      code: fallbackCode,
      message: error.message,
    };
  }

  return {
    code: fallbackCode,
    message: "工作流执行失败",
  };
};

const waitForNextPaint = async () => {
  await new Promise<void>((resolve) => {
    if (typeof window === "undefined") {
      resolve();
      return;
    }

    window.requestAnimationFrame(() => resolve());
  });

  await new Promise<void>((resolve) => {
    if (typeof window === "undefined") {
      resolve();
      return;
    }

    window.requestAnimationFrame(() => resolve());
  });
};

const resolveNavigateTarget = (
  target: WorkflowAction["target"],
  params?: WorkflowParams,
) => {
  if (target === "/panel/:id") {
    const panelId = params?.panelId;
    if (panelId === undefined || panelId === null) {
      throw {
        code: "WORKFLOW_PARAM_MISSING",
        message: "缺少 panelId，无法跳转到图表详情页",
      };
    }

    return `/panel/${String(panelId)}`;
  }

  if (target === "/dataset/:id") {
    const datasetId = params?.datasetId;
    if (datasetId === undefined || datasetId === null) {
      throw {
        code: "WORKFLOW_PARAM_MISSING",
        message: "缺少 datasetId，无法跳转到数据集详情页",
      };
    }

    return `/dataset/${String(datasetId)}`;
  }

  return target;
};

const resolveActionPayload = (
  action: WorkflowAction,
  params?: WorkflowParams,
): WorkflowAction => {
  if (action.type !== "trigger_action") {
    return action;
  }

  const targetParams = params?.[action.target];
  if (targetParams === undefined) {
    return action;
  }

  if (!isRecord(targetParams)) {
    throw {
      code: "WORKFLOW_PARAM_INVALID",
      message: `workflow 参数 ${action.target} 必须是对象`,
    };
  }

  return {
    ...action,
    payload: {
      ...(action.payload ?? {}),
      ...targetParams,
    },
  };
};

const executeAction = async (
  action: WorkflowAction,
  params: WorkflowParams,
  dependencies: WorkflowExecutorDependencies,
) => {
  if (action.type === "navigate") {
    const target = resolveNavigateTarget(action.target, params);
    dependencies.navigate(target);
    await waitForNextPaint();
    return {
      target,
      status: "done",
    };
  }

  const resolvedAction = resolveActionPayload(action, params);
  const task = await dispatchWorkflowAction(
    {
      action: resolvedAction,
    },
    {
      timeoutMs: WORKFLOW_ACTION_TIMEOUT_MS,
    },
  );

  if (task.status === "failed") {
    throw task.error ?? {
      code: "WORKFLOW_ACTION_FAILED",
      message: `前端动作 ${resolvedAction.target} 执行失败`,
    };
  }

  if (task.status !== "done") {
    throw {
      code: "WORKFLOW_ACTION_INCOMPLETE",
      message: `前端动作 ${resolvedAction.target} 未完成`,
    };
  }

  return {
    actionId: task.id,
    target: resolvedAction.target,
    status: task.status,
    result: task.result,
  };
};

export const executeWorkflowInterrupt = async (
  interrupt: WorkflowRunInterrupt,
  dependencies: WorkflowExecutorDependencies,
): Promise<WorkflowRunResult> => {
  const { interruptId, request } = interrupt;
  const { workflowId, params } = request;
  const template = getFrontendWorkflowTemplate(workflowId);

  if (!template) {
    return createWorkflowResult(
      interruptId,
      workflowId,
      "failed",
      undefined,
      {
        code: "WORKFLOW_TEMPLATE_NOT_SUPPORTED",
        message: `前端暂不支持 workflow: ${workflowId}`,
      },
    );
  }

  try {
    const steps: Array<Record<string, unknown>> = [];

    for (const action of template.actions) {
      const stepResult = await executeAction(action, params, dependencies);
      steps.push(stepResult);
    }

    return createWorkflowResult(interruptId, workflowId, "done", {
      steps,
    });
  } catch (error) {
    return createWorkflowResult(
      interruptId,
      workflowId,
      "failed",
      undefined,
      normalizeWorkflowError(error, "WORKFLOW_EXECUTION_FAILED"),
    );
  }
};
