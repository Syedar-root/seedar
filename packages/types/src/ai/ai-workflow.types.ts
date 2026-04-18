export type WorkflowId = string;

export interface WorkflowAction {
  type: string;
  target?: string;
  payload?: Record<string, unknown>;
}

export interface WorkflowTemplate {
  id: WorkflowId;
  title: string;
  actions: WorkflowAction[];
}

export interface StartWorkflowRequest {
  workflowId: WorkflowId;
  params?: Record<string, unknown>;
}

export interface WorkflowRunResult {
  kind: 'workflow_result';
  interruptId: string;
  workflowId: WorkflowId;
  status: 'success' | 'failed' | 'blocked';
  output?: Record<string, unknown>;
  error?: {
    code: string;
    message: string;
  };
}
