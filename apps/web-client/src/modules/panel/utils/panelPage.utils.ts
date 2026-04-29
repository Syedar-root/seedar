import { SeedarPanel } from "#pkg/seedar/ui-react";
import type {
  DatasetResponse,
  ExecuteQueryResponse,
  PanelResponse,
  QueryDSL,
  QueryResponse,
} from "#pkg/seedar/types";
import { PanelStatus } from "#pkg/seedar/types";
import type { ComponentProps } from "react";
import type { DisplayPanelType, PanelEditorConfig } from "../components/panelEditor/types";
import type { MetricWithPopConfig } from "../components/queryZone/queryZone";
import type { DragItem, TempMetricConfig, TitleConfig } from "../types";

export type SidePaneKey = "aside" | "editor";
export type LayoutMode = "expanded" | "collapsed" | "fullCollapsed";
export type ViewportMode = "wide" | "medium" | "narrow";
export type PreviewPanel = NonNullable<ComponentProps<typeof SeedarPanel>["panel"]>;

export const PANEL_WORKFLOW_DISPLAY_TYPES: DisplayPanelType[] = [
  "table",
  "card",
  "line",
  "bar",
  "area",
  "pie",
  "scatter",
  "radar",
];

export const PANEL_WORKFLOW_ADVANCED_SPEC_DISPLAY_TYPES: DisplayPanelType[] = [
  "line",
  "bar",
  "area",
  "pie",
  "scatter",
  "radar",
];

export const PANEL_PAGE_COPY = {
  statusUnsaved: "未保存",
  statusDraft: "草稿",
  statusPublished: "已发布",
  saveAndUpdate: "保存并更新",
  saveAndPublish: "保存并发布",
  confirmDatasetChange: "切换数据集会清空当前查询配置和预览结果，是否继续？",
  datasetLocked: "当前面板已绑定数据集，不能修改",
  metricCreated: "指标创建成功",
  workflowChangesAccepted: "已接受本次 AI 修改",
  workflowChangesDiscarded: "已撤销本次 AI 修改",
  selectDatasetFirst: "请先选择数据集",
  addDimensionOrMetric: "请添加维度或指标",
  invalidDatasetId: "缺少合法的 datasetId，无法选择数据集",
  datasetNotFound: "未找到对应的数据集",
  pendingDatasetNotFound: "未找到待确认的数据集",
  queryStatePayloadInvalid: "缺少合法的 queryState payload",
  queryStateDatasetNotFound: "未找到 queryState 对应的数据集",
  invalidTitle: "缺少合法的 title，无法设置图表标题",
  invalidDisplayType: "缺少合法的 displayType，无法设置图表类型",
  invalidPreviewDsl: "无法构建可执行的 DSL",
  previewFailed: "图表预览执行失败",
  actionCancelled: "用户取消了数据集切换",
  workflowSaveDraftUnsupported:
    "当前前端未实现 workflow save_draft，请改用临时状态承接后再提交",
  sideFields: "字段",
  sideEditor: "编辑",
  collapse: "收起",
  expand: "展开",
  railOpen: "展开侧栏",
  revertToDraft: "撤销为草稿",
  run: "运行",
  copySql: "复制 SQL",
  copySqlSuccess: "SQL 已复制到剪贴板",
  copySqlUnavailable: "当前没有可复制的 SQL，请先运行查询",
  copySqlFailed: "SQL 复制失败，请重试",
  previewEmpty: "先选择数据集，再构建查询并运行预览",
  workflowBannerLabel: "AI 修改待确认",
  workflowBannerTitle: "AI 已经改动当前图表，请现在确认保留还是撤销",
  workflowBannerDescription:
    "接受后，这一轮 AI 修改会成为新的起点。撤销后，会完整回到本轮 AI 修改开始前的状态。",
  workflowDiscardAction: "撤销本轮 AI 修改",
  workflowAcceptAction: "接受并作为当前结果",
  advancedSpecPayloadInvalid:
    "缺少合法的高级 Spec payload，无法配置图表",
  advancedSpecDisplayTypeInvalid:
    "高级 Spec 缺少合法的图表类型，无法配置图表",
  advancedSpecTypeInvalid:
    "高级 Spec 缺少合法的 spec.type，无法配置图表",
} as const;

export const PANEL_STATUS_LABELS = {
  unsaved: PANEL_PAGE_COPY.statusUnsaved,
  draft: PANEL_PAGE_COPY.statusDraft,
  published: PANEL_PAGE_COPY.statusPublished,
} as const;

const COLLAPSED_THRESHOLD = 1200;
const FULL_COLLAPSED_THRESHOLD = 800;
const LAYOUT_EXIT_BUFFER = 16;

export const getViewportMode = (containerWidth: number): ViewportMode => {
  if (containerWidth <= FULL_COLLAPSED_THRESHOLD) {
    return "narrow";
  }

  if (containerWidth <= COLLAPSED_THRESHOLD) {
    return "medium";
  }

  return "wide";
};

export const getLayoutMode = ({
  containerWidth,
  desktopPreference,
  isNarrowPaneOpen,
  viewportMode,
}: {
  containerWidth: number;
  desktopPreference: Exclude<LayoutMode, "fullCollapsed">;
  isNarrowPaneOpen: boolean;
  viewportMode: ViewportMode;
}): LayoutMode => {
  if (viewportMode === "narrow") {
    return isNarrowPaneOpen ? "collapsed" : "fullCollapsed";
  }

  if (viewportMode === "medium") {
    return "collapsed";
  }

  if (desktopPreference === "collapsed") {
    return "collapsed";
  }

  if (containerWidth > COLLAPSED_THRESHOLD + LAYOUT_EXIT_BUFFER) {
    return "expanded";
  }

  return "collapsed";
};

export const buildMetricsWithPopConfig = (
  dropMetrics: DragItem[],
  tempMetrics: TempMetricConfig[],
): MetricWithPopConfig[] =>
  dropMetrics.map((metric) => ({
    ...metric,
    hasPopConfig: tempMetrics.some(
      (tempMetric) => tempMetric.baseMetricId === Number(metric.id),
    ),
  }));

export const buildPreviewPanel = ({
  activeDataset,
  panelData,
  panelId,
  title,
  titleConfig,
  displayType,
  editorConfig,
  previewSpec,
  isPublished,
  queryData,
}: {
  activeDataset?: DatasetResponse;
  panelData?: PanelResponse;
  panelId?: string;
  title: string;
  titleConfig?: TitleConfig;
  displayType: DisplayPanelType;
  editorConfig: PanelEditorConfig;
  previewSpec: PreviewPanel["config"];
  isPublished: boolean;
  queryData?: QueryResponse;
}): PreviewPanel | undefined => {
  if (!activeDataset) {
    return undefined;
  }

  return {
    id: panelData?.id ?? panelId ?? "__draft_panel__",
    title,
    titleConfig,
    type:
      displayType === "table" || displayType === "card"
        ? displayType
        : "chart",
    status: isPublished ? PanelStatus.PUBLISHED : PanelStatus.DRAFT,
    queryId: panelData?.queryId ?? queryData?.id,
    config:
      displayType === "table" || displayType === "card"
        ? editorConfig
        : previewSpec,
    createdAt: panelData?.createdAt ?? new Date(),
    updatedAt: panelData?.updatedAt ?? new Date(),
  };
};

/**
 * 复制 SQL 文本，优先使用 Clipboard API，兼容旧浏览器的 textarea 方案。
 */
export const copyTextToClipboard = async (text: string): Promise<boolean> => {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  const copied = document.execCommand("copy");
  document.body.removeChild(textarea);
  return copied;
};

export const getPreviewRowCount = (
  previewResult: ExecuteQueryResponse | undefined,
): number | undefined => {
  const rows = previewResult?.results?.rows;
  return Array.isArray(rows) ? rows.length : undefined;
};

export const buildCurrentDsl = (
  buildDsl: ((baseDsl?: QueryDSL) => QueryDSL | undefined) | undefined,
  baseDsl: QueryDSL | undefined,
): QueryDSL | undefined => buildDsl?.(baseDsl);
