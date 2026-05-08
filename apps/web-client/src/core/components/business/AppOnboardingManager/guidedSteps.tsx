import { OnboardingCelebrationDescription } from "./components/OnboardingCelebrationDescription";
import type { OnboardingStepConfig } from "./types";

export const GUIDED_ONBOARDING_STEPS: OnboardingStepConfig[] = [
  {
    step: {
      title: "欢迎使用 Seedar",
      description:
        "你好，欢迎来到 Seedar！这里是全局导航区，四大核心模块都从这里进入。接下来我会带你快速了解一遍主流程，你可以按自己的节奏继续探索。",
      selector: '[data-tour-id="global-nav"]',
      placement: "bottom",
    },
  },
  {
    step: {
      title: "先从数据源开始",
      description:
        "数据源是整个系统的起点。你可以在这里连接 MySQL、PostgreSQL、MongoDB 等数据库，也可以管理 API 数据接口。后面的数据集和图表面板都会基于这些连接，所以先认识这个模块就很有帮助。",
      selector: '[data-tour-id="global-nav-datasource"]',
      placement: "bottom",
    },
  },
  {
    step: {
      title: "再进行数据集建模",
      description:
        "数据集是整理和建模数据的核心模块。你可以在这里选择数据源、配置表关系、整理字段和指标定义。建好后，图表面板可以直接复用这些结果，不用重复配置。",
      selector: '[data-tour-id="global-nav-dataset"]',
      placement: "bottom",
    },
  },
  {
    step: {
      title: "用图表面板做分析",
      description:
        "图表面板是做可视化分析的工作台。你可以选择数据集，配置图表类型（柱状图、折线图、饼图等），再通过维度、指标和筛选条件搭建查询。通常可以先保存草稿，确认效果后再发布到仪表板。",
      selector: '[data-tour-id="global-nav-panel"]',
      placement: "bottom",
    },
  },
  {
    step: {
      title: "最后组合到仪表板",
      description:
        "仪表板是最终展示层。你可以把多个图表面板组合到一个看板里，设置布局、添加筛选器，用于业务汇报或日常监控。很多团队会把它作为固定的业务看板来使用。",
      selector: '[data-tour-id="global-nav-dashboard"]',
      placement: "bottom",
    },
  },
  {
    step: {
      title: "SeeMind AI 助手",
      description:
        "打开右上角的 SeeMind 开关后，右侧会出现 AI 助手侧栏。你可以用自然语言提问，让它辅助你做图表配置建议、数据分析和结果解读，提升上手效率。",
      selector: '[data-tour-id="global-nav-seemind-switch"]',
      placement: "left",
    },
  },
  {
    step: {
      title: "引导已完成",
      description: (
        <OnboardingCelebrationDescription
          imageAlt="引导完成庆祝插画"
          message="引导已经完成，你已经了解了 Seedar 的四大核心模块。接下来可以从数据源开始，按自己的节奏搭建数据分析工作流。"
        />
      ),
      placement: "center",
    },
  },
];
