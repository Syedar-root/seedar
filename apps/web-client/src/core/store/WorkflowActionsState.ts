import type {
  WorkflowAction,
  WorkflowActionError,
  WorkflowActionStatus,
} from '#pkg/seedar/types';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export type { WorkflowActionError, WorkflowActionStatus } from '#pkg/seedar/types';

export interface WorkflowActionTask {
  id: string;
  action: WorkflowAction;
  status: WorkflowActionStatus;
  result?: Record<string, unknown>;
  error?: WorkflowActionError;
}

export interface DispatchWorkflowActionParams {
  action: WorkflowAction;
}

interface WorkflowActionsState {
  actions: WorkflowActionTask[];
  enqueueAction: (params: DispatchWorkflowActionParams) => WorkflowActionTask;
  startAction: (actionId: string) => WorkflowActionTask | null;
  finishAction: (
    actionId: string,
    result?: Record<string, unknown>,
  ) => WorkflowActionTask | null;
  failAction: (
    actionId: string,
    error: WorkflowActionError,
  ) => WorkflowActionTask | null;
  removeAction: (actionId: string) => void;
  clearFinishedActions: () => void;
  clearAllActions: () => void;
}

const pendingResolvers = new Map<string, (task: WorkflowActionTask) => void>();

const createActionId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `workflow-action-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
};

const resolvePendingAction = (task: WorkflowActionTask) => {
  const resolve = pendingResolvers.get(task.id);

  if (!resolve) {
    return;
  }

  pendingResolvers.delete(task.id);
  resolve(task);
};

export const useWorkflowActionsStore = create<WorkflowActionsState>()(
  devtools(
    (set, get) => ({
      actions: [],

      enqueueAction: (params) => {
        const task: WorkflowActionTask = {
          id: createActionId(),
          action: params.action,
          status: 'pending',
        };

        set(
          (state) => ({
            actions: [...state.actions, task],
          }),
          false,
          'workflow-actions/enqueueAction',
        );

        return task;
      },

      startAction: (actionId) => {
        const currentTask = get().actions.find((item) => item.id === actionId);

        if (!currentTask || currentTask.status !== 'pending') {
          return null;
        }

        const nextTask: WorkflowActionTask = {
          ...currentTask,
          status: 'running',
        };

        set(
          (state) => ({
            actions: state.actions.map((item) =>
              item.id === actionId ? nextTask : item,
            ),
          }),
          false,
          'workflow-actions/startAction',
        );

        return nextTask;
      },

      finishAction: (actionId, result) => {
        const currentTask = get().actions.find((item) => item.id === actionId);

        if (!currentTask) {
          return null;
        }

        const nextTask: WorkflowActionTask = {
          ...currentTask,
          status: 'done',
          result,
          error: undefined,
        };

        set(
          (state) => ({
            actions: state.actions.map((item) =>
              item.id === actionId ? nextTask : item,
            ),
          }),
          false,
          'workflow-actions/finishAction',
        );

        resolvePendingAction(nextTask);
        return nextTask;
      },

      failAction: (actionId, error) => {
        const currentTask = get().actions.find((item) => item.id === actionId);

        if (!currentTask) {
          return null;
        }

        const nextTask: WorkflowActionTask = {
          ...currentTask,
          status: 'failed',
          error,
        };

        set(
          (state) => ({
            actions: state.actions.map((item) =>
              item.id === actionId ? nextTask : item,
            ),
          }),
          false,
          'workflow-actions/failAction',
        );

        resolvePendingAction(nextTask);
        return nextTask;
      },

      removeAction: (actionId) => {
        pendingResolvers.delete(actionId);

        set(
          (state) => ({
            actions: state.actions.filter((item) => item.id !== actionId),
          }),
          false,
          'workflow-actions/removeAction',
        );
      },

      clearFinishedActions: () => {
        set(
          (state) => ({
            actions: state.actions.filter(
              (item) =>
                item.status === 'pending' || item.status === 'running',
            ),
          }),
          false,
          'workflow-actions/clearFinishedActions',
        );
      },

      clearAllActions: () => {
        pendingResolvers.clear();

        set(
          {
            actions: [],
          },
          false,
          'workflow-actions/clearAllActions',
        );
      },
    }),
    {
      name: 'workflow-actions-store',
    },
  ),
);

export const dispatchWorkflowAction = (
  params: DispatchWorkflowActionParams,
) => {
  const task = useWorkflowActionsStore.getState().enqueueAction(params);

  return new Promise<WorkflowActionTask>((resolve) => {
    pendingResolvers.set(task.id, resolve);
  });
};

export default useWorkflowActionsStore;
