import type { ChatMessage, SSEData, CommandItem, ModelItem } from "../types";
import { FileText, Image, Code, Sparkles, Bot, Cpu } from "lucide-react";

export const mockCommands: CommandItem[] = [
  {
    key: "generate-code",
    label: "生成代码",
    description: "根据需求快速生成代码片段",
    icon: <Code size={16} />,
  },
  {
    key: "analyze-image",
    label: "分析图片",
    description: "上传并分析图片内容",
    icon: <Image size={16} />,
  },
  {
    key: "write-document",
    label: "编写文档",
    description: "帮助编写技术文档和说明",
    icon: <FileText size={16} />,
  },
  {
    key: "brainstorm",
    label: "头脑风暴",
    description: "激发创意，产生新想法",
    icon: <Sparkles size={16} />,
  },
];

export const mockModels: ModelItem[] = [
  {
    key: "gpt-4",
    label: "GPT-4",
    description: "最强大的模型，适合复杂任务",
    icon: <Cpu size={16} />,
  },
  {
    key: "gpt-3.5",
    label: "GPT-3.5",
    description: "快速高效，适合日常对话",
    icon: <Bot size={16} />,
  },
  {
    key: "claude-3",
    label: "Claude 3",
    description: "优秀的推理和理解能力",
    icon: <Sparkles size={16} />,
  },
];

export const mockChatMessages: ChatMessage[] = [
  {
    id: "msg-1",
    type: "text",
    content: "你好，我想了解一下今天的天气情况。",
    role: "user",
    timestamp: Date.now() - 180000,
    done: true,
  },
  {
    id: "msg-2",
    type: "reasoning",
    content:
      "用户问天气，我需要先调用 web_search 工具来查询当前天气信息，然后根据结果回复用户。",
    role: "assistant",
    timestamp: Date.now() - 175000,
    done: true,
  },
  {
    id: "msg-3",
    type: "tool_call",
    content: "",
    role: "assistant",
    timestamp: Date.now() - 170000,
    done: true,
    meta: {
      id: "tool-001",
      name: "web_search",
      tool_call: {
        id: "call_001",
        name: "web_search",
        query: "北京今天天气",
      },
    },
  },
  {
    id: "msg-4",
    type: "tool_result",
    content: "搜索结果：北京今天天气晴朗，温度 18-25°C，空气质量优。",
    role: "assistant",
    timestamp: Date.now() - 165000,
    done: true,
    meta: {
      id: "tool-001",
      name: "web_search",
      tool_call_id: "call_001",
      tool_result: {
        tool_call_id: "call_001",
        result: "北京今天天气晴朗，温度 18-25°C，空气质量优。",
      },
    },
  },
  {
    id: "msg-5",
    type: "text",
    content: `## 今天的天气情况

好的，根据搜索结果，**北京今天天气晴朗**，温度在 **18-25°C** 之间，空气质量优。

### 适合的活动

- ✅ 户外活动
- ✅ 野餐
- ✅ 骑行
- ✅ 跑步

\`\`\`typescript
const weather = {
  city: "北京",
  temp: "18-25°C",
  condition: "晴朗",
  airQuality: "优"
};
\`\`\`

适合外出活动！`,
    role: "assistant",
    timestamp: Date.now() - 160000,
    done: true,
  },
  {
    id: "msg-6",
    type: "text",
    content: "太棒了！那你能推荐一些北京的户外景点吗？",
    role: "user",
    timestamp: Date.now() - 150000,
    done: true,
  },
  {
    id: "msg-7",
    type: "reasoning",
    content:
      "用户要推荐户外景点，我需要先问一下用户的偏好，然后根据偏好进行推荐。",
    role: "assistant",
    timestamp: Date.now() - 145000,
    done: true,
  },
  {
    id: "msg-8",
    type: "interrupt",
    content: [
      {
        id: "q1",
        question: "你更喜欢哪种类型的景点？",
        type: "choice",
        options: [
          {
            label: "自然景观",
            value: "nature",
            description: "公园、山景等自然风光",
          },
          {
            label: "人文景点",
            value: "culture",
            description: "历史古迹、博物馆等文化遗产",
          },
          { label: "都可以", value: "any" },
          { label: "其他", value: "other", isOther: true },
        ],
        multiple: true,
      },
    ],
    role: "assistant",
    timestamp: Date.now() - 140000,
    done: false,
  },
  {
    id: "msg-9",
    type: "text",
    content:
      "根据你的选择，我为你推荐以下景点：\n\n1. **故宫** - 人文景点\n2. **长城** - 人文/自然结合\n3. **颐和园** - 自然景观与人文结合",
    role: "assistant",
    timestamp: Date.now() - 130000,
    done: true,
  },
  {
    id: "msg-10",
    type: "text",
    content: "这个行程看起来不错！帮我规划一下明天的行程吧。",
    role: "user",
    timestamp: Date.now() - 120000,
    done: true,
  },
  {
    id: "msg-11",
    type: "reasoning",
    content:
      "用户想要规划明天的行程，我需要先了解一下用户的具体需求，比如时间预算等。",
    role: "assistant",
    timestamp: Date.now() - 115000,
    done: true,
  },
  {
    id: "msg-12",
    type: "interrupt",
    content: [
      {
        id: "q2",
        question: "你明天大概有多少时间游玩？",
        type: "confirm",
        multiple: false,
      },
      {
        id: "q3",
        question: "你更倾向于深度游还是打卡游？",
        type: "choice",
        options: [
          { label: "深度游", value: "deep", description: "少景点，深体验" },
          { label: "打卡游", value: "quick", description: "多景点，快节奏" },
        ],
        multiple: false,
      },
    ],
    role: "assistant",
    timestamp: Date.now() - 110000,
    done: false,
  },
  {
    id: "msg-13",
    type: "error",
    content: "抱歉，调用天气 API 时出现了网络错误，请稍后重试。",
    role: "assistant",
    timestamp: Date.now() - 100000,
    done: true,
  },
  {
    id: "msg-14",
    type: "tool_call",
    content: "",
    role: "assistant",
    timestamp: Date.now() - 95000,
    done: true,
    meta: {
      id: "tool-002",
      name: "calendar_event",
      tool_call: {
        id: "call_002",
        name: "calendar_event",
        action: "create",
      },
    },
  },
  {
    id: "msg-15",
    type: "tool_result",
    content: "日历事件已创建成功！",
    role: "assistant",
    timestamp: Date.now() - 90000,
    done: true,
    meta: {
      id: "tool-002",
      name: "calendar_event",
      tool_call_id: "call_002",
      tool_result: {
        tool_call_id: "call_002",
        result: "已创建事件",
      },
    },
  },
  {
    id: "msg-16",
    type: "text",
    content: "我已经为你安排好了明天的行程！",
    role: "assistant",
    timestamp: Date.now() - 85000,
    done: true,
  },
  {
    id: "msg-17",
    type: "interrupt",
    content: "请确认是否发送日程到你的邮箱？",
    role: "assistant",
    timestamp: Date.now() - 80000,
    done: false,
  },
];

export const mockSSEData: SSEData[] = [
  {
    type: "text",
    data: {
      content: "你",
      type: "text",
      done: false,
      role: "act",
      sessionId: "61c9ab6a-4548-4959-910b-f902a5470460",
    },
  },
  {
    type: "text",
    data: {
      content: "好！",
      type: "text",
      done: false,
      role: "act",
      sessionId: "61c9ab6a-4548-4959-910b-f902a5470460",
    },
  },
  {
    type: "reasoning",
    data: {
      content: "用户打招呼，我应该友好地回应并询问有什么可以帮助的。",
      type: "reasoning",
      done: false,
      role: "act",
      sessionId: "61c9ab6a-4548-4959-910b-f902a5470460",
    },
  },
  {
    type: "text",
    data: {
      content: "有什么可以帮助你的吗？",
      type: "text",
      done: true,
      role: "act",
      sessionId: "61c9ab6a-4548-4959-910b-f902a5470460",
    },
  },
];

export const mockToolCallScenario: ChatMessage[] = [
  {
    id: "tool-scenario-1",
    type: "text",
    content: "帮我查一下上海迪士尼的门票价格",
    role: "user",
    timestamp: Date.now() - 60000,
    done: true,
  },
  {
    id: "tool-scenario-2",
    type: "reasoning",
    content: "用户想查迪士尼门票，我需要调用搜索工具来获取最新价格信息。",
    role: "assistant",
    timestamp: Date.now() - 55000,
    done: true,
  },
  {
    id: "tool-scenario-3",
    type: "tool_call",
    content: "",
    role: "assistant",
    timestamp: Date.now() - 50000,
    done: true,
    meta: {
      id: "tool-disney",
      name: "search",
      tool_call: {
        id: "call_disney_1",
        name: "search",
        query: "上海迪士尼门票价格 2024",
      },
    },
  },
  {
    id: "tool-scenario-4",
    type: "tool_result",
    content:
      "🎢 上海迪士尼乐园门票价格：\n\n**平日：** 475元/成人\n**周末及节假日：** 719元/成人\n\n建议提前在官网预约购票。",
    role: "assistant",
    timestamp: Date.now() - 45000,
    done: true,
    meta: {
      id: "tool-disney",
      name: "search",
      tool_call_id: "call_disney_1",
      tool_result: {
        tool_call_id: "call_disney_1",
        result: "平日475元，周末719元",
      },
    },
  },
];

export const mockInterruptTextScenario: ChatMessage[] = [
  {
    id: "interrupt-text-1",
    type: "text",
    content: "你好，我想预订一张机票",
    role: "user",
    timestamp: Date.now() - 30000,
    done: true,
  },
  {
    id: "interrupt-text-2",
    type: "interrupt",
    content: [
      {
        id: "q-text-1",
        question: "请问你要从哪里出发？",
        type: "text",
      },
    ],
    role: "assistant",
    timestamp: Date.now() - 25000,
    done: false,
  },
];

export const mockInterruptConfirmScenario: ChatMessage[] = [
  {
    id: "interrupt-confirm-1",
    type: "text",
    content: "帮我取消这个会议",
    role: "user",
    timestamp: Date.now() - 20000,
    done: true,
  },
  {
    id: "interrupt-confirm-2",
    type: "interrupt",
    content: [
      {
        id: "q-confirm-1",
        question: "确定要取消这个会议吗？取消后将发送通知给所有参会者。",
        type: "confirm",
        multiple: false,
      },
    ],
    role: "assistant",
    timestamp: Date.now() - 15000,
    done: false,
  },
];

export const mockInterruptChoiceScenario: ChatMessage[] = [
  {
    id: "interrupt-choice-1",
    type: "text",
    content: "我想点外卖",
    role: "user",
    timestamp: Date.now() - 10000,
    done: true,
  },
  {
    id: "interrupt-choice-2",
    type: "interrupt",
    content: [
      {
        id: "q-choice-1",
        question: "你想吃什么类型的食物？",
        type: "choice",
        options: [
          { label: "中餐", value: "chinese" },
          { label: "西餐", value: "western" },
          { label: "日料", value: "japanese" },
          { label: "东南亚菜", value: "thai", isOther: true },
        ],
        multiple: true,
      },
    ],
    role: "assistant",
    timestamp: Date.now() - 5000,
    done: false,
  },
];

export const mockMultiStepInterruptScenario: ChatMessage[] = [
  {
    id: "multi-step-1",
    type: "text",
    content: "帮我预订一张下周去上海的机票",
    role: "user",
    timestamp: Date.now(),
    done: true,
  },
  {
    id: "multi-step-2",
    type: "interrupt",
    content: [
      {
        id: "ms-q1",
        question: "你从哪里出发？",
        type: "text",
      },
      {
        id: "ms-q2",
        question: "你希望的出发时间是？",
        type: "choice",
        options: [
          { label: "上午", value: "morning", description: "6:00-12:00" },
          { label: "下午", value: "afternoon", description: "12:00-18:00" },
          { label: "晚上", value: "evening", description: "18:00-24:00" },
          { label: "不限时间", value: "any", isOther: true },
        ],
        multiple: false,
      },
      {
        id: "ms-q3",
        question: "是否需要报销凭证？",
        type: "confirm",
      },
    ],
    role: "assistant",
    timestamp: Date.now(),
    done: false,
  },
];

export const mockDailyPlanScenario: ChatMessage[] = [
  {
    id: "daily-plan-1",
    type: "interrupt",
    content: [
      {
        id: "dp-q1",
        question: "你今天有什么计划或想完成的事情吗？",
        type: "choice",
        options: [
          {
            label: "写代码",
            value: "coding",
            description: "专注于编程和开发工作",
          },
          {
            label: "学习新知识",
            value: "learning",
            description: "学习新技术或概念",
          },
          {
            label: "项目规划",
            value: "planning",
            description: "规划和设计项目架构",
          },
          {
            label: "其他",
            value: "other",
            description: "其他类型的任务或活动",
            isOther: true,
          },
        ],
        multiple: true,
      },
    ],
    role: "assistant",
    timestamp: Date.now(),
    done: false,
  },
];
