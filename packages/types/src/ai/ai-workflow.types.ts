import type {
  PeriodCalculationMode,
  PeriodOverPeriodType,
} from '../dataset';

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

export interface PanelQueryStateDimensionPayload {
  fieldId?: number;
  alias?: string;
  name?: string;
  businessName?: string;
  dimensionDsl?: Record<string, unknown>;
}

export interface PanelQueryStateMetricPayload {
  id: number;
  alias?: string;
  name?: string;
  businessName?: string;
}

export interface PanelQueryStateFilterPayload {
  fieldId: number;
  op: string;
  value: unknown;
  raw?: boolean;
}

export interface PanelQueryStateTempMetricPayload {
  id?: string;
  alias: string;
  businessName?: string;
  expression?: string;
  dataType?: string;
  format?: string;
  baseMetricId?: number;
  timeFieldId?: number;
  periodType?: PeriodOverPeriodType;
  calculationMode?: PeriodCalculationMode;
  popConfig?: Record<string, unknown>;
}

export interface PanelQueryStatePayload {
  datasetId?: number;
  dimensions?: PanelQueryStateDimensionPayload[];
  metrics?: PanelQueryStateMetricPayload[];
  filters?: PanelQueryStateFilterPayload[];
  tempMetrics?: PanelQueryStateTempMetricPayload[];
}

export interface WorkflowActionPresentation {
  title: string;
  description?: string;
}

export type PanelWorkflowNavigateTarget =
  | '/panel/create'
  | '/panel/:id';

export type PanelWorkflowTriggerActionTarget =
  | 'save_draft'
  | 'open_dataset_selector'
  | 'select_dataset'
  | 'confirm_dataset_selection'
  | 'set_query_state'
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

export const PANEL_WORKFLOW_TRIGGER_ACTION_PRESENTATION: Record<
  PanelWorkflowTriggerActionTarget,
  WorkflowActionPresentation
> = {
  save_draft: {
    title: '保存草稿',
    description: '将当前图表状态保存为草稿。',
  },
  open_dataset_selector: {
    title: '打开数据集选择器',
    description: '打开数据集选择面板，准备切换查询数据源。',
  },
  select_dataset: {
    title: '选择数据集',
    description: '选择本次查询要使用的数据集。',
  },
  confirm_dataset_selection: {
    title: '确认数据集',
    description: '确认数据集切换并应用到当前图表。',
  },
  set_query_state: {
    title: '更新查询条件',
    description: '写入维度、指标、筛选和临时指标等查询状态。',
  },
  set_panel_title: {
    title: '设置图表标题',
    description: '更新当前图表的标题展示。',
  },
  set_display_type: {
    title: '切换展示类型',
    description: '将当前图表切换到目标展示形式。',
  },
  run_preview: {
    title: '执行预览',
    description: '基于最新查询状态重新运行图表预览。',
  },
};

export const DATASET_WORKFLOW_TRIGGER_ACTION_PRESENTATION: Record<
  DatasetWorkflowTriggerActionTarget,
  WorkflowActionPresentation
> = {
  search_dataset: {
    title: '搜索数据集',
    description: '根据条件搜索目标数据集。',
  },
  filter_dataset: {
    title: '筛选数据集',
    description: '按指定条件过滤数据集列表。',
  },
  open_dataset_detail: {
    title: '打开数据集详情',
    description: '进入数据集详情页面查看信息。',
  },
  open_dataset_editor: {
    title: '打开数据集编辑器',
    description: '进入数据集编辑页面。',
  },
  create_dataset: {
    title: '创建数据集',
    description: '新建一个数据集。',
  },
};

export const WORKFLOW_NAVIGATE_ACTION_PRESENTATION: Record<
  PanelWorkflowNavigateTarget | DatasetWorkflowNavigateTarget,
  WorkflowActionPresentation
> = {
  '/panel/create': {
    title: '跳转到图表创建页',
    description: '进入图表创建页面。',
  },
  '/panel/:id': {
    title: '跳转到图表详情页',
    description: '打开指定图表页面。',
  },
  '/dataset': {
    title: '跳转到数据集列表页',
    description: '进入数据集列表页面。',
  },
  '/dataset/create': {
    title: '跳转到数据集创建页',
    description: '进入数据集创建页面。',
  },
  '/dataset/:id': {
    title: '跳转到数据集详情页',
    description: '打开指定数据集页面。',
  },
};

export const getWorkflowActionPresentation = (
  action: WorkflowAction,
): WorkflowActionPresentation => {
  if (action.type === 'navigate') {
    return (
      WORKFLOW_NAVIGATE_ACTION_PRESENTATION[action.target] ?? {
        title: action.target,
      }
    );
  }

  if (action.page === 'panel') {
    return (
      PANEL_WORKFLOW_TRIGGER_ACTION_PRESENTATION[action.target] ?? {
        title: action.target,
      }
    );
  }

  return (
    DATASET_WORKFLOW_TRIGGER_ACTION_PRESENTATION[action.target] ?? {
      title: action.target,
    }
  );
};

export interface WorkflowTemplate {
  id: WorkflowId;
  title: string;
  actions: WorkflowAction[];
}

export const FRONTEND_WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'query_current_panel_as_table_v1',
    title: '查询当前图表并以表格展示',
    actions: [
      {
        page: 'panel',
        type: 'trigger_action',
        target: 'set_query_state',
      },
      {
        page: 'panel',
        type: 'trigger_action',
        target: 'set_display_type',
        payload: {
          displayType: 'table',
        },
      },
      {
        page: 'panel',
        type: 'trigger_action',
        target: 'run_preview',
      },
    ],
  },
];

const frontendWorkflowTemplateMap = new Map(
  FRONTEND_WORKFLOW_TEMPLATES.map((template) => [template.id, template]),
);

export const getFrontendWorkflowTemplate = (workflowId: string) => {
  return frontendWorkflowTemplateMap.get(workflowId);
};

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
