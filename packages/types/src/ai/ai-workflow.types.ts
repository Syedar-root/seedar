export type WorkflowId = string;

export type WorkflowActionStatus =
  | 'pending'
  | 'running'
  | 'done'
  | 'failed';

export interface WorkflowActionError {
  code: string;
  message: string;
}

export type WorkflowPage =
  | 'panel'
  | 'dataset';

export type PanelWorkflowNavigateTarget =
  | '/panel/create'
  | '/panel/:id';

export type PanelWorkflowTriggerActionTarget =
  | 'save_draft'
  | 'open_dataset_selector'
  | 'select_dataset'
  | 'confirm_dataset_selection'
  | 'set_panel_title'
  | 'set_display_type'
  | 'run_preview';

export type DatasetWorkflowNavigateTarget =
  | '/dataset'
  | '/dataset/create'
  | '/dataset/:id';

export type DatasetWorkflowTriggerActionTarget =
  | 'search_dataset'
  | 'filter_dataset'
  | 'open_dataset_detail'
  | 'open_dataset_editor'
  | 'create_dataset';

export interface WorkflowNavigateAction {
  type: 'navigate';
  target:
    | PanelWorkflowNavigateTarget
    | DatasetWorkflowNavigateTarget;
  payload?: Record<string, unknown>;
}

export interface PanelWorkflowTriggerAction {
  page: 'panel';
  type: 'trigger_action';
  target: PanelWorkflowTriggerActionTarget;
  payload?: Record<string, unknown>;
}

export interface DatasetWorkflowTriggerAction {
  page: 'dataset';
  type: 'trigger_action';
  target: DatasetWorkflowTriggerActionTarget;
  payload?: Record<string, unknown>;
}

export type WorkflowAction =
  | WorkflowNavigateAction
  | PanelWorkflowTriggerAction
  | DatasetWorkflowTriggerAction;

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
  status: WorkflowActionStatus;
  result?: Record<string, unknown>;
  error?: WorkflowActionError;
}
