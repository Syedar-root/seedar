import { OnboardingCelebrationDescription } from "./components/OnboardingCelebrationDescription";
import type { OnboardingStepConfig } from "./types";

export const GUIDED_ONBOARDING_STEPS: OnboardingStepConfig[] = [
  {
    step: {
      title: "欢迎使用 Seedar",
      description:
        "这是全局导航区。引导模式只说明关键入口，不会强制跳转或要求你完成操作。",
      selector: '[data-tour-id="global-nav"]',
      placement: "bottom",
    },
  },
  {
    step: {
      title: "先从数据源开始",
      description:
        "数据源是后续分析的基础。你可以在这里连接数据库或维护已有连接；本模式不会强制你现在创建。",
      selector: '[data-tour-id="global-nav-datasource"]',
      placement: "bottom",
    },
  },
  {
    step: {
      title: "再进行数据集建模",
      description:
        "数据集用于选择数据源、配置表关系、整理字段和指标。建模完成后，图表面板就能复用这些数据。",
      selector: '[data-tour-id="global-nav-dataset"]',
      placement: "bottom",
    },
  },
  {
    step: {
      title: "用图表面板做分析",
      description:
        "图表面板用于选择数据集、配置查询和图表样式。你可以先保存草稿，再发布给仪表板使用。",
      selector: '[data-tour-id="global-nav-panel"]',
      placement: "bottom",
    },
  },
  {
    step: {
      title: "最后组合到仪表板",
      description:
        "仪表板用于组织多个图表面板，适合沉淀成日常查看的业务看板。",
      selector: '[data-tour-id="global-nav-dashboard"]',
      placement: "bottom",
    },
  },
  {
    step: {
      title: "SeeMind 助手",
      description:
        "打开右上角开关后，可以在右侧侧栏使用 AI 助手进行分析与配置。",
      selector: '[data-tour-id="global-nav-seemind-switch"]',
      placement: "left",
    },
  },
  {
    step: {
      title: "引导完成",
      description: (
        <OnboardingCelebrationDescription
          imageAlt="引导完成庆祝插画"
          message="关键入口已经介绍完了。你可以从数据源开始，也可以随时按自己的节奏继续探索。"
        />
      ),
      placement: "center",
    },
  },
];
