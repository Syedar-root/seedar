# AI 模块概览

## 1. 模块职责

AI 模块当前不是普通聊天模块，而是四部分能力的组合：

1. AI 模型配置管理
2. 会话管理
3. 流式聊天
4. workflow interrupt 与工具调用

## 2. 为什么它很特殊

它同时穿过前后端：

- 前端负责会话 UI、消息流、interrupt 恢复、动作分发
- 后端负责模型、代理、工具、技能、图执行

## 3. 核心对象

- `Ai`
- `AiSession`
- `AiChatScene`
- `WorkflowRunInterrupt`
- `AskUserInterrupt`
