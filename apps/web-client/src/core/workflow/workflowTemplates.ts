import type { WorkflowTemplate } from "#pkg/seedar/types";

export const FRONTEND_WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: "query_current_panel_as_table_v1",
    title: "查询当前图表并以表格展示",
    actions: [
      {
        page: "panel",
        type: "trigger_action",
        target: "set_query_state",
      },
      {
        page: "panel",
        type: "trigger_action",
        target: "set_display_type",
        payload: {
          displayType: "table",
        },
      },
      {
        page: "panel",
        type: "trigger_action",
        target: "run_preview",
      },
    ],
  },
];

const workflowTemplateMap = new Map(
  FRONTEND_WORKFLOW_TEMPLATES.map((template) => [template.id, template]),
);

export const getWorkflowTemplate = (workflowId: string) => {
  return workflowTemplateMap.get(workflowId);
};
