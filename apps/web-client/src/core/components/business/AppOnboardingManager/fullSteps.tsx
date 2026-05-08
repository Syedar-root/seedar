import { OnboardingCelebrationDescription } from "./components/OnboardingCelebrationDescription";
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
      title: "欢迎使用 Seedar",
      description:
        "你好，欢迎来到 Seedar！这里是全局导航区，四大核心模块都从这里进入。接下来我会带你快速逛一圈，帮你建立整体认知；你可以按自己的节奏继续或暂停。",
      selector: '[data-tour-id="global-nav"]',
      placement: "bottom",
    },
  },
  {
    step: {
      title: "数据源入口",
      description:
        "这是数据源模块的入口。数据源是整个系统的数据根基，后续的数据集、图表面板都会依赖这里创建的连接。点击进入数据源管理页面。",
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
      title: "数据源页面结构",
      description:
        "页面顶部区域包含模块标题和「新建数据源」按钮。你可以通过这里进入数据源的创建流程，或查看已有的数据连接。",
      selector: '[data-tour-id="datasource-page-header"]',
      placement: "bottom",
    },
  },
  {
    step: {
      title: "数据源列表管理区",
      description:
        "这里是数据源的核心管理区域，展示了所有已创建的数据连接。每个数据源卡片上都有快捷操作入口，你可以点击进入详情或执行管理操作。当还没有数据源时，会显示引导创建的空态提示。",
      selector: '[data-tour-id="datasource-page-content"]',
      placement: "top",
    },
  },
  {
    step: {
      title: "开始创建数据源",
      description:
        "点击「新建数据源」按钮，将打开数据源配置弹窗。这里你可以配置数据库连接参数、测试连接可用性，并保存数据源。点击后请稍等，弹窗加载需要一点时间。",
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
      title: "数据源配置弹窗",
      description:
        "这个弹窗就是创建数据源时会用到的配置区：连接类型、主机地址、端口、数据库名称、用户名和密码等常用信息都在这里。底部有「取消」和「保存」两个按钮。先熟悉结构就好，稍后你可以再回来正式创建。",
      selector: '[data-tour-id="datasource-form-dialog"]',
      placement: "left",
    },
  },
  {
    step: {
      title: "关闭弹窗继续引导",
      description:
        "这一步先不急着创建数据源，点击「取消」回到列表页即可。接下来我们继续看数据集模块，后面你随时都可以再回来创建。",
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
      title: "数据集模块入口",
      description:
        "接下来进入数据集模块。数据集是用来组织和管理数据的核心层，你可以在这里选择数据源、配置表关系、整理字段和指标定义。数据集创建完成后，图表面板可以直接复用这些建模结果。点击进入数据集页面。",
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
      title: "数据集页面结构",
      description:
        "页面顶部包含数据集模块标题和「新建数据集」按钮。你可以通过这里进入数据集的创建向导，或管理已有的数据集。",
      selector: '[data-tour-id="dataset-page-header"]',
      placement: "bottom",
    },
  },
  {
    step: {
      title: "数据集搜索与筛选区",
      description:
        "数据集较多时，你可以使用筛选功能快速定位目标数据集。通过关键词搜索、数据源筛选等条件组合，帮助你在大量数据集中迅速找到需要编辑或查看的数据集。",
      selector: '[data-tour-id="dataset-page-filters"]',
      placement: "bottom",
    },
  },
  {
    step: {
      title: "数据集列表管理区",
      description:
        "这里展示了所有已创建的数据集。每个数据集卡片显示名称、关联的数据源和创建时间等信息。通过卡片上的快捷操作，你可以快速进入数据集编辑器或执行复制、删除等管理操作。当还没有数据集时，会显示引导创建的空态提示。",
      selector: '[data-tour-id="dataset-page-content"]',
      placement: "top",
    },
  },
  {
    step: {
      title: "开始创建数据集",
      description:
        "点击「新建数据集」按钮，将进入数据集创建向导。向导会引导你完成数据源选择、表关系配置、字段整理等步骤。创建完成后，数据集就可以被图表面板复用了。",
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
      title: "数据集编辑器布局",
      description:
        "数据集编辑器采用分栏布局：左侧是创建步骤导航，展示创建流程中的各个阶段；中间区域显示当前步骤的配置内容；底部提供「上一步」「下一步」和「提交」按钮，帮助你逐步完成数据集创建。整个编辑器围绕这三个核心区域展开。",
      selector: '[data-tour-id="dataset-editor-page"]',
      placement: "right",
    },
  },
  {
    step: {
      title: "图表面板模块入口",
      description:
        "现在进入图表面板模块。面板是数据可视化的核心，你可以在此选择数据集、配置查询条件、设计图表样式。每个面板都是独立的可视化单元，后续可以添加到仪表板中进行组合展示。点击进入面板列表页面。",
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
      title: "面板列表页面结构",
      description:
        "页面顶部包含面板模块标题和「新建面板」按钮。你可以通过这里进入面板的创建流程，或管理已有的图表面板。",
      selector: '[data-tour-id="panel-list-page-header"]',
      placement: "bottom",
    },
  },
  {
    step: {
      title: "面板搜索与筛选区",
      description:
        "面板列表支持按名称关键词搜索和按状态筛选。你可以通过这些筛选条件在众多面板中快速定位目标，便于管理和查看特定的面板。",
      selector: '[data-tour-id="panel-list-filters"]',
      placement: "bottom",
    },
  },
  {
    step: {
      title: "面板列表管理区",
      description:
        "这里展示了所有已创建的图表面板。每个面板卡片显示名称、关联的数据集、图表类型和状态。通过卡片上的快捷操作，你可以快速进入面板编辑器或执行其他管理操作。当还没有面板时，会显示引导创建的空态提示。",
      selector: '[data-tour-id="panel-list-page-content"]',
      placement: "top",
    },
  },
  {
    step: {
      title: "开始创建面板",
      description:
        "点击「新建面板」按钮，将进入面板编辑器。在编辑器中，你可以选择数据集、配置维度与指标、设置图表类型和样式。面板创建完成后，可以单独使用或添加到仪表板中进行组合展示。",
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
      title: "面板编辑器布局",
      description:
        "面板编辑器采用多区域协作布局：左侧是字段与配置区域，提供可拖拽的字段资源；中间上方是查询配置区，包含标题、维度、指标、筛选和排序等核心设置；中间下方是实时预览区，展示当前配置生成的图表效果。完整模式下，重点关注这些区块如何配合工作。",
      selector: '[data-tour-id="panel-page"]',
      placement: "center",
    },
  },
  {
    step: {
      title: "面板左侧字段与配置区",
      description:
        "这是面板编辑器的资源区域，展示了数据集提供的所有可用字段，包括维度字段和指标字段。你可以将这些字段拖拽到上方配置区的对应位置，构建查询条件。这个区域是整个面板编辑的基础支撑区。",
      selector: '[data-tour-id="panel-left-fields-and-editor"]',
      placement: "right",
    },
  },
  {
    step: {
      title: "面板查询配置区",
      description:
        "这是面板编辑的核心操作区域，包含了面板标题设置、维度选择、指标配置、筛选条件和排序规则等。你可以在这里组织查询逻辑，设置完成后点击「运行」或「保存」按钮，预览区会即时展示生成的图表效果。",
      selector: '[data-tour-id="panel-main-header"]',
      placement: "bottom",
    },
  },
  {
    step: {
      title: "面板图表预览区",
      description:
        "这是面板编辑器的预览区域，根据你在上方配置区的设置，实时展示生成的图表效果。你可以通过预览确认数据查询结果、图表样式和展示效果是否符合预期。如果配置有问题，预览区也会显示相应的错误提示。",
      selector: '[data-tour-id="panel-main-content"]',
      placement: "top",
    },
  },
  {
    step: {
      title: "仪表板模块入口",
      description:
        "最后进入仪表板模块。仪表板是数据展示的最终形态，你可以将多个图表面板组合到一个看板中，设置布局、添加筛选器，创建业务汇报或数据监控页面。仪表板非常适合沉淀为团队日常查看的业务看板。点击进入仪表板页面。",
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
      title: "仪表板页面布局",
      description:
        "仪表板页面采用左侧边栏 + 右侧主内容区的布局模式。左侧是看板列表和新建入口；右侧在未选中任何看板时显示空态提示，选中看板后会切换到看板详情信息、编辑模式和画布区域。",
      selector: '[data-tour-id="dashboard-page"]',
      placement: "center",
    },
  },
  {
    step: {
      title: "仪表板左侧看板列表",
      description:
        "这是仪表板的看板管理侧栏，展示了所有已创建的看板。你可以通过点击切换到不同的看板，也可以点击「新建看板」按钮创建新的仪表板。这里是进入看板创建和管理流程的起点。",
      selector: '[data-tour-id="dashboard-sidebar"]',
      placement: "right",
    },
  },
  {
    step: {
      title: "仪表板主视图区",
      description:
        "这是仪表板的中央主区域，承载所选看板的信息和图表画布。当还没有选中任何看板时，区域会显示空态提示，指导你创建或选择一个看板。选中看板后，这里会展示完整的看板内容，包括所有添加的图表面板和看板信息。",
      selector: '[data-tour-id="dashboard-main"]',
      placement: "left",
    },
  },
  {
    step: {
      title: "仪表板看板内容区",
      description:
        "这里是看板的实际内容展示区域，包含看板的基础信息（如名称、描述、创建时间等）、视图模式切换按钮（编辑模式/预览模式）以及核心的图表画布区域。在画布中你可以自由布局、调整图表面板的大小和位置。",
      selector: '[data-tour-id="dashboard-content"]',
      placement: "top",
    },
  },
  {
    step: {
      title: "完整引导已结束",
      description: (
        <OnboardingCelebrationDescription
          imageAlt="完整引导完成庆祝插画"
          message="恭喜你，完整引导到这里就结束了。你已经看完数据源、数据集、图表面板和仪表板四大核心模块的关键入口。接下来可以从数据源开始，按你的节奏搭起第一个数据分析工作流。"
        />
      ),
      placement: "center",
    },
  },
];
