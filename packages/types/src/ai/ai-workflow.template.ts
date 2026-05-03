import type { ZodType } from 'zod';
import type {
  WorkflowAction,
  WorkflowId,
} from './ai-workflow.types';
import {
  queryCurrentPanelAsChartWorkflowParamsSchema,
  queryCurrentPanelAsTableWorkflowParamsSchema,
  setCurrentPanelItemFormattingWorkflowParamsSchema,
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
    description: '查询当前面板的数据，并将其以表格形式展示。',
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
      '执行前应先参考 vchart-development-assistant skill 学习并生成合法的 VChart chart spec；该流程不修改当前查询条件，只通过高级 Spec 将当前面板配置为图表展示。只允许传 spec，不要传 data，也不要传 datasetId、dimensions、metrics、filters、orderBy、topN 等查询参数；当前面板数据会由前端自动注入。',
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
  // ----------------------------------------------------------------------------
  // Template: set_current_panel_item_formatting_v1
  // ----------------------------------------------------------------------------
  {
    id: 'set_current_panel_item_formatting_v1',
    title: '配置当前面板字段或指标格式',
    description:
      '为当前 panel 的字段或指标设置格式化规则（数值、百分比、货币、日期等），不修改查询 DSL 与图表结构。',
    paramsSchema: setCurrentPanelItemFormattingWorkflowParamsSchema,
    actions: [
      {
        page: 'panel',
        type: 'trigger_action',
        target: 'set_item_formatting',
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
