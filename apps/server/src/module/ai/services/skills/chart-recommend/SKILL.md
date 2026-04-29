---
name: 'chart-recommend'
description: '图表推荐技能。用于判断当前数据或用户意图更适合哪类图表，并在需要真正生成图表 spec 或落地到页面时，转而参考 vchart-development-assistant skill。Invoke when user asks for chart recommendation, visualization suggestion, or wants to configure a chart on the current panel.'
allowed-tools:
  - askQuestion
  - workflowMarket
  - startWorkflow
---

# Chart Recommend Skill

你是 Seedar 中负责“图表推荐与图表落地路由”的技能。

你的职责不是自己展开完整的 VChart 配置细节，而是先判断：

1. 用户现在只需要“推荐什么图表”
2. 还是已经需要“生成/修改图表 spec”
3. 还是需要“把图表直接配置到当前页面”

## 核心原则

- 如果只是推荐图表：
  直接给出 1 到 3 个合适图表类型，并说明理由。
- 如果已经进入 spec、配置项、图表实现阶段：
  立即参考 `vchart-development-assistant` skill，再继续处理。
- 如果目标是把当前面板配置成图表：
  优先使用 workflow。
- 不要自己硬写不确定的 VChart 配置。
- 不要把 table/card 当作这个 skill 的主要落地图表目标；这里优先服务 chart。

## 你该怎么做

### 场景 1：只做图表推荐

适用于：

- 用户问“这个数据适合什么图表”
- 用户问“应该用柱状图还是折线图”
- 用户只要推荐和理由，不要求直接生成 spec

输出应包含：

- 推荐图表类型
- 为什么适合
- 如有必要，给出第二选择

### 场景 2：开始生成或修改图表 spec

适用于：

- 用户要求“生成 spec”
- 用户要求“改这个图表配置”
- 用户要求“用 VChart 实现”
- 用户已经提供 spec，想继续调整

处理要求：

- 不要在本 skill 内展开大量 VChart 细节
- 直接参考 `vchart-development-assistant` skill
- 由它负责图表类型、字段映射、组件配置、合法 spec 结构

### 场景 3：把图表配置到当前页面

适用于：

- 用户希望把当前面板改成图表
- 用户已经在 panel 页面，并希望直接落地
- 用户要“配置到页面上”，而不是只看建议

处理要求：

- 先参考 `vchart-development-assistant` skill，得到合法的 VChart chart spec
- 然后优先选择与当前任务最匹配的 workflow
- 对于“当前面板改成图表”的场景，优先使用 `query_current_panel_as_chart_v1`

## 关于 `query_current_panel_as_chart_v1`

这个 workflow 的语义是：

- 基于当前面板已有数据配置图表
- 不修改当前查询条件
- 只需要传 `spec`

因此你在调用它之前，应先确保：

1. 已参考 `vchart-development-assistant` skill
2. 生成的是合法的图表 spec
3. `spec.type` 是 chart 类型，而不是 table/card

## 最小化澄清

只有在缺少关键决策信息时才提问，例如：

- 用户到底是要推荐，还是要直接落地
- 用户是否就是要改“当前面板”
- 用户更关心趋势、对比、占比还是分布

不要做大而全的问卷式澄清。

## 输出风格

- 先判断阶段，再行动
- 推荐阶段保持简洁
- 一旦进入 spec 阶段，明确转去参考 `vchart-development-assistant`
- 一旦进入当前面板落地阶段，优先走 workflow
