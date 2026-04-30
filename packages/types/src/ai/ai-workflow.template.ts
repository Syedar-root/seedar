import type { ZodType } from 'zod';
import type {
  WorkflowAction,
  WorkflowId,
} from './ai-workflow.types';
import {
  queryCurrentPanelAsChartWorkflowParamsSchema,
  queryCurrentPanelAsTableWorkflowParamsSchema,
} from './ai-workflow.schema';

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
  // ----------------------------------------------------------------------------
  // Template: query_current_panel_as_table_v1
  // ----------------------------------------------------------------------------
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
  // ----------------------------------------------------------------------------
  // Template: query_current_panel_as_chart_v1
  // ----------------------------------------------------------------------------
  {
    id: 'query_current_panel_as_chart_v1',
    title: '基于当前面板数据配置图表到当前面板',
    description:
      '执行前应先参考 vchart-development-assistant skill 学习并生成合法的 VChart chart spec；该流程不修改当前查询条件，只通过高级 Spec 将当前面板配置为图表展示。只允许传 spec，不要传 data，也不要传 datasetId、dimensions、metrics、filters、orderBy、topN 等查询参数；当前面板数据会由前端自动注入',
    paramsSchema: queryCurrentPanelAsChartWorkflowParamsSchema,
    actions: [
      {
        page: 'panel',
        type: 'trigger_action',
        target: 'set_advanced_spec',
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
