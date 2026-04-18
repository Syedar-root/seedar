import type { Meta, StoryObj } from "@storybook/react-vite";
import { ProgressCard } from "./ProgressCard";
import { TrendingUp, Users, Activity } from "lucide-react";
import type { ProgressCardProps } from "../../types";

const meta = {
  title: "Components/MetricCard/ProgressCard",
  component: ProgressCard,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "ProgressCard 是一个显示当前值、目标值、剩余值和进度条的进度指标卡片组件。优化后具有清晰的视觉层级、优化的排版和流畅的微交互效果。",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    title: {
      control: "text",
      description: "卡片标题",
      table: {
        type: { summary: "string" },
      },
    },
    value: {
      control: "number",
      description: "当前值",
      table: {
        type: { summary: "number" },
      },
    },
    target: {
      control: "number",
      description: "目标值",
      table: {
        type: { summary: "number" },
      },
    },
    targetLabel: {
      control: "text",
      description: "目标标签",
      table: {
        type: { summary: "string" },
        defaultValue: { summary: "Target" },
      },
    },
    progressColor: {
      control: "color",
      description: "进度条颜色",
      table: {
        type: { summary: "string" },
        defaultValue: { summary: "#6366f1" },
      },
    },
    icon: {
      control: false,
      description: "自定义图标",
      table: {
        type: { summary: "ReactNode" },
      },
    },
    prefix: {
      control: "text",
      description: "数值前缀（如货币符号）",
      table: {
        type: { summary: "string" },
      },
    },
    suffix: {
      control: "text",
      description: "数值后缀（如单位）",
      table: {
        type: { summary: "string" },
      },
    },
    loading: {
      control: "boolean",
      description: "加载状态",
      table: {
        type: { summary: "boolean" },
        defaultValue: { summary: "false" },
      },
    },
    onClick: {
      control: false,
      description: "点击事件处理函数",
      table: {
        type: { summary: "() => void" },
      },
    },
    className: {
      control: "text",
      description: "自定义 CSS 类名",
      table: {
        type: { summary: "string" },
      },
    },
    width: {
      control: "text",
      description: "卡片宽度（数字会自动加px单位）",
      table: {
        type: { summary: "string | number" },
      },
    },
  },
} satisfies Meta<typeof ProgressCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Q2Revenue: Story = {
  name: "Q2 收入进度",
  args: {
    title: "Q2 Revenue",
    value: 380000,
    target: 500000,
    targetLabel: "Q2 Target",
    prefix: "$",
    icon: <TrendingUp size={24} />,
    progressColor: "#6366f1",
  } as ProgressCardProps,
};

export const UserSignups: Story = {
  name: "用户注册进度",
  args: {
    title: "User Signups",
    value: 7500,
    target: 10000,
    targetLabel: "Monthly Goal",
    icon: <Users size={24} />,
    progressColor: "#10b981",
  } as ProgressCardProps,
};

export const ActiveProjects: Story = {
  name: "活跃项目进度",
  args: {
    title: "Active Projects",
    value: 32,
    target: 40,
    targetLabel: "Target",
    icon: <Activity size={24} />,
    progressColor: "#f59e0b",
  } as ProgressCardProps,
};

export const FullProgress: Story = {
  name: "完成状态",
  args: {
    title: "Task Completion",
    value: 100,
    target: 100,
    targetLabel: "Goal",
    suffix: "%",
    icon: <Activity size={24} />,
    progressColor: "#22c55e",
  } as ProgressCardProps,
};

export const ZeroProgress: Story = {
  name: "初始状态",
  args: {
    title: "New Initiative",
    value: 0,
    target: 100,
    targetLabel: "Target",
    icon: <Activity size={24} />,
    progressColor: "#ef4444",
  } as ProgressCardProps,
};

export const WithClick: Story = {
  name: "可点击",
  args: {
    title: "可点击卡片",
    value: 75,
    target: 100,
    onClick: () => alert("ProgressCard clicked!"),
    icon: <Activity size={24} />,
  } as ProgressCardProps,
  parameters: {
    docs: {
      description: {
        story: "添加 onClick 属性后，卡片变为可点击状态。",
      },
    },
  },
};

export const Loading: Story = {
  name: "加载状态",
  args: {
    title: "数据加载中",
    value: 0,
    target: 100,
    loading: true,
  } as ProgressCardProps,
  parameters: {
    docs: {
      description: {
        story: "设置 loading 为 true 时显示加载状态。",
      },
    },
  },
};
