import type { OnboardingRuntime, OnboardingStepConfig } from "./types";
import {
  DEFAULT_WAIT_TIMEOUT_MS,
  HIDDEN_ACTION_STYLE,
  waitForTarget,
} from "./utils";

const createNavigationCompletion = ({
  selector,
  path,
  waitSelector,
  label,
}: {
  selector: string;
  path: string;
  waitSelector: string;
  label: string;
}) => ({
  selector,
  eventName: "click" as const,
  onComplete: async ({ navigate, tour }: OnboardingRuntime) => {
    navigate(path);
    await waitForTarget(waitSelector, DEFAULT_WAIT_TIMEOUT_MS);
    tour.next();
  },
  onError: (error: unknown) => {
    console.error(`引导步骤[${label}]执行失败:`, error);
  },
  onTimeout: () => {
    console.warn(`引导步骤[${label}]等待目标超时。`);
  },
});

const createWaitAndAdvanceCompletion = (
  selector: string,
  waitSelector: string,
  label: string,
) => ({
  selector,
  eventName: "click" as const,
  onComplete: async ({ tour }: OnboardingRuntime) => {
    await waitForTarget(waitSelector, DEFAULT_WAIT_TIMEOUT_MS);
    tour.next();
  },
  onError: (error: unknown) => {
    console.error(`引导步骤[${label}]执行失败:`, error);
  },
  onTimeout: () => {
    console.warn(`引导步骤[${label}]等待目标超时。`);
  },
});

const createAdvanceCompletion = (selector: string, label: string) => ({
  selector,
  eventName: "click" as const,
  onComplete: ({ tour }: OnboardingRuntime) => {
    tour.next();
  },
  onError: (error: unknown) => {
    console.error(`引导步骤[${label}]执行失败:`, error);
  },
});

export const FULL_ONBOARDING_STEPS: OnboardingStepConfig[] = [
  {
    step: {
      title: "完整模式说明",
      description:
        "完整模式会按数据源、数据集、图表面板和仪表板的顺序走一遍，重点看每个页面的区块作用，不展开字段级填写细节。",
      selector: '[data-tour-id="global-nav"]',
      placement: "bottom",
    },
  },
  {
    step: {
      title: "进入数据源",
      description: "先从数据源入口开始，后面的页面都会围绕它建立连接和复用。",
      selector: '[data-tour-id="global-nav-datasource"]',
      placement: "bottom",
      nextButtonProps: { style: HIDDEN_ACTION_STYLE },
      prevButtonProps: { style: HIDDEN_ACTION_STYLE },
    },
    completion: createNavigationCompletion({
      selector: '[data-tour-id="global-nav-datasource"]',
      path: "/datasource",
      waitSelector: '[data-tour-id="datasource-page-header"]',
      label: "进入数据源",
    }),
  },
  {
    step: {
      title: "数据源页头",
      description: "顶部是页面标题和新建入口，负责进入数据源管理和创建流程。",
      selector: '[data-tour-id="datasource-page-header"]',
      placement: "bottom",
    },
  },
  {
    step: {
      title: "数据源列表区",
      description:
        "中间区域承载数据源列表或空态，用来查看、管理和进入已有连接。",
      selector: '[data-tour-id="datasource-page-content"]',
      placement: "top",
    },
  },
  {
    step: {
      title: "打开新建数据源",
      description:
        "这里是强制步骤，点击新建后进入弹窗，先看整体结构，再继续后面的页面。",
      selector: '[data-tour-id="datasource-create-button"]',
      placement: "bottom",
      nextButtonProps: { style: HIDDEN_ACTION_STYLE },
      prevButtonProps: { style: HIDDEN_ACTION_STYLE },
    },
    completion: createWaitAndAdvanceCompletion(
      '[data-tour-id="datasource-create-button"]',
      '[data-tour-id="datasource-form-dialog"]',
      "打开新建数据源",
    ),
  },
  {
    step: {
      title: "数据源弹窗",
      description:
        "弹窗主体是连接配置区，底部动作区负责取消和保存。这里先看整体结构，不展开字段填写细节。",
      selector: '[data-tour-id="datasource-form-dialog"]',
      placement: "left",
    },
  },
  {
    step: {
      title: "关闭数据源弹窗",
      description:
        "这是强制步骤：本次不提交，点击取消返回数据源页面继续后面的引导。",
      selector: '[data-tour-id="datasource-form-cancel-button"]',
      placement: "leftBottom",
      nextButtonProps: { style: HIDDEN_ACTION_STYLE },
      prevButtonProps: { style: HIDDEN_ACTION_STYLE },
    },
    completion: createAdvanceCompletion(
      '[data-tour-id="datasource-form-cancel-button"]',
      "关闭数据源弹窗",
    ),
  },
  {
    step: {
      title: "进入数据集",
      description:
        "接下来切到数据集，关注它如何复用数据源并组织字段、指标和筛选。",
      selector: '[data-tour-id="global-nav-dataset"]',
      placement: "bottom",
      nextButtonProps: { style: HIDDEN_ACTION_STYLE },
      prevButtonProps: { style: HIDDEN_ACTION_STYLE },
    },
    completion: createNavigationCompletion({
      selector: '[data-tour-id="global-nav-dataset"]',
      path: "/dataset",
      waitSelector: '[data-tour-id="dataset-page-header"]',
      label: "进入数据集",
    }),
  },
  {
    step: {
      title: "数据集页头",
      description: "顶部是页面标题和新建入口，负责进入数据集管理和创建流程。",
      selector: '[data-tour-id="dataset-page-header"]',
      placement: "bottom",
    },
  },
  {
    step: {
      title: "数据集筛选区",
      description: "这里负责搜索和筛选数据集，帮助你在进入编辑前快速定位目标。",
      selector: '[data-tour-id="dataset-page-filters"]',
      placement: "bottom",
    },
  },
  {
    step: {
      title: "数据集列表区",
      description:
        "列表区展示已有数据集或空态，承担查看、进入编辑和管理的主要入口。",
      selector: '[data-tour-id="dataset-page-content"]',
      placement: "top",
    },
  },
  {
    step: {
      title: "打开数据集编辑",
      description:
        "这里是强制步骤，点击新建后进入编辑器，后面只看区块作用，不讲字段填写。",
      selector: '[data-tour-id="dataset-create-button"]',
      placement: "bottom",
      nextButtonProps: { style: HIDDEN_ACTION_STYLE },
      prevButtonProps: { style: HIDDEN_ACTION_STYLE },
    },
    completion: createNavigationCompletion({
      selector: '[data-tour-id="dataset-create-button"]',
      path: "/dataset/create",
      waitSelector: '[data-tour-id="dataset-editor-page"]',
      label: "打开数据集编辑",
    }),
  },
  {
    step: {
      title: "数据集编辑器",
      description:
        "左侧是步骤导航，中间是当前步骤内容，底部是上一步、下一步和提交按钮，完整流程都围绕这三个区域展开。",
      selector: '[data-tour-id="dataset-editor-page"]',
      placement: "right",
    },
  },
  {
    step: {
      title: "进入面板列表",
      description:
        "下面进入图表面板列表，先看它的筛选和入口，再进入面板编辑区。",
      selector: '[data-tour-id="global-nav-panel"]',
      placement: "bottom",
      nextButtonProps: { style: HIDDEN_ACTION_STYLE },
      prevButtonProps: { style: HIDDEN_ACTION_STYLE },
    },
    completion: createNavigationCompletion({
      selector: '[data-tour-id="global-nav-panel"]',
      path: "/panel",
      waitSelector: '[data-tour-id="panel-list-page-header"]',
      label: "进入面板列表",
    }),
  },
  {
    step: {
      title: "面板页头",
      description: "顶部是标题和新建入口，负责进入面板管理和创建流程。",
      selector: '[data-tour-id="panel-list-page-header"]',
      placement: "bottom",
    },
  },
  {
    step: {
      title: "面板筛选区",
      description: "这里负责搜索和状态筛选，用来在面板列表里快速定位目标。",
      selector: '[data-tour-id="panel-list-filters"]',
      placement: "bottom",
    },
  },
  {
    step: {
      title: "面板列表区",
      description:
        "列表区展示已有面板、状态和操作入口，承担查看和进入编辑的主要作用。",
      selector: '[data-tour-id="panel-list-page-content"]',
      placement: "top",
    },
  },
  {
    step: {
      title: "打开面板编辑",
      description:
        "这里是强制步骤，点击新建后进入面板编辑器，后面只看布局和功能区块。",
      selector: '[data-tour-id="panel-create-button"]',
      placement: "bottom",
      nextButtonProps: { style: HIDDEN_ACTION_STYLE },
      prevButtonProps: { style: HIDDEN_ACTION_STYLE },
    },
    completion: createNavigationCompletion({
      selector: '[data-tour-id="panel-create-button"]',
      path: "/panel/create",
      waitSelector: '[data-tour-id="panel-page"]',
      label: "打开面板编辑",
    }),
  },
  {
    step: {
      title: "面板编辑器",
      description:
        "左侧是字段与配置侧栏，中间上方是查询区和操作区，中间下方是预览区，完整模式重点看这些区块如何配合。",
      selector: '[data-tour-id="panel-page"]',
      placement: "center",
    },
  },
  {
    step: {
      title: "左侧字段与配置区",
      description:
        "这一整块承载左侧字段列表和编辑配置区，负责提供可拖拽资源并维持面板编辑的基础结构。",
      selector: '[data-tour-id="panel-left-fields-and-editor"]',
      placement: "right",
    },
  },
  {
    step: {
      title: "中上操作区",
      description:
        "中上区域承载标题、维度、指标、筛选、排序和保存运行等操作，是组织查询和触发预览的核心位置。",
      selector: '[data-tour-id="panel-main-header"]',
      placement: "bottom",
    },
  },
  {
    step: {
      title: "中下预览区",
      description:
        "中下区域展示当前配置生成的图表或空态，用来确认数据、样式和展示效果是否符合预期。",
      selector: '[data-tour-id="panel-main-content"]',
      placement: "top",
    },
  },
  {
    step: {
      title: "进入仪表板",
      description:
        "最后看仪表板页。这里左侧负责看板切换，主区会在选中看板后展示信息和画布。",
      selector: '[data-tour-id="global-nav-dashboard"]',
      placement: "bottom",
      nextButtonProps: { style: HIDDEN_ACTION_STYLE },
      prevButtonProps: { style: HIDDEN_ACTION_STYLE },
    },
    completion: createNavigationCompletion({
      selector: '[data-tour-id="global-nav-dashboard"]',
      path: "/dashboard",
      waitSelector: '[data-tour-id="dashboard-page"]',
      label: "进入仪表板",
    }),
  },
  {
    step: {
      title: "仪表板页面",
      description:
        "左侧是看板列表和新建入口；中间在未选中看板时显示空态，选中后会切到看板信息、模式切换和画布区。",
      selector: '[data-tour-id="dashboard-page"]',
      placement: "center",
    },
  },
  {
    step: {
      title: "仪表板侧栏区",
      description:
        "左侧是看板列表和新建入口，用于切换不同看板，也是进入创建流程的起点。",
      selector: '[data-tour-id="dashboard-sidebar"]',
      placement: "right",
    },
  },
  {
    step: {
      title: "仪表板主视图区",
      description:
        "主区域承载所选看板的信息和画布。未选中看板时展示空态，选中后展示完整内容。",
      selector: '[data-tour-id="dashboard-main"]',
      placement: "left",
    },
  },
  {
    step: {
      title: "仪表板内容区",
      description:
        "这里展示看板的实际内容，包括看板信息、模式切换和图表画布。",
      selector: '[data-tour-id="dashboard-content"]',
      placement: "top",
    },
  },
  {
    step: {
      title: "完整引导完成",
      description:
        "完整流程已经结束。你已经看过数据源、数据集、图表面板和仪表板的主要区块与关键入口。",
      placement: "center",
    },
  },
];
