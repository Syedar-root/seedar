# AI 模块文档

## 1. 模块目标

AI 模块负责把大模型能力、页面上下文和前端 workflow 串起来，形成“可操作的助手”。

它是 Seedar 最有特色的增强层之一。

## 2. 模块价值

很多系统里的 AI 只能回答问题，但 Seedar 当前的 AI 还具备：

- 场景感知
- 工具调用
- workflow interrupt
- 恢复执行

这使它更像“分析工作台助手”，而不是普通聊天框。

## 3. 文档列表

- [overview.md](./overview.md)
- [chat-flow.md](./chat-flow.md)
- [workflow-flow.md](./workflow-flow.md)
- [tooling.md](./tooling.md)

## 4. 适合谁阅读

- 需要改 AI 功能或工具系统的开发者
- 需要理解 workflow interrupt 的前端开发者
- 需要写“智能模块设计”的论文作者

## 5. 关键代码入口

- [AIChat.Preview.tsx](/D:/Program/projects/seedar/apps/web-client/src/core/components/business/AIChat/AIChat.Preview.tsx)
- [ai.controller.ts](/D:/Program/projects/seedar/apps/server/src/module/ai/ai.controller.ts)
- [chat.service.ts](/D:/Program/projects/seedar/apps/server/src/module/ai/services/chat.service.ts)
- [tool.service.ts](/D:/Program/projects/seedar/apps/server/src/module/ai/services/tool.service.ts)

## 6. 阅读时建议关注

1. `clarify -> act` 为什么要拆成两步。
2. 前端为什么要保存 handled interrupt ID。
3. workflow 为什么通过 interrupt 而不是直接让 AI 改状态。
