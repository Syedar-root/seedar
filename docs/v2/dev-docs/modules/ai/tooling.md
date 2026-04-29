# AI 工具与技能

## 1. ToolService 的定位

[tool.service.ts](/D:/Program/projects/seedar/apps/server/src/module/ai/services/tool.service.ts) 负责：

- 收集工具元数据
- 暴露工具列表
- 提供工具市场
- 启动 workflow
- 向用户追问

## 2. 当前关键工具

- `getDatasetInfo`
- `getDataAtTemp`
- `askQuestion`
- `workflowMarket`
- `startWorkflow`
- `toolMarket`
- `toolMarketExecutor`

## 3. 设计意图

这说明 AI 并不是直接被写死在 prompt 里，而是通过工具层和 workflow 层逐步扩展能力。

## 4. 改动建议

新增工具时，除了后端实现，还要考虑：

1. 是否允许在 `chat` 模式使用
2. 是否需要加入 workflow
3. 是否会影响前端恢复逻辑
