import type { ZodType } from 'zod';
import type {
  WorkflowAction,
  WorkflowId,
} from './ai-workflow.types';
import { queryCurrentPanelAsTableWorkflowParamsSchema } from './ai-workflow.schema';

export interface WorkflowTemplate<
  TParams extends object = Record<string, unknown>,
> {
  id: WorkflowId;
  title: string;
  description?: string;
  actions: WorkflowAction[];
  paramsSchema?: ZodType<TParams>;
}

export const FRONTEND_WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'query_current_panel_as_table_v1',
    title: '查询数据并以表格展示到当前面板',
    description: '查询当前面板的数据，并将其以表格形式展示',
    paramsSchema: queryCurrentPanelAsTableWorkflowParamsSchema,
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
