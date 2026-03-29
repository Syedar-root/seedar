# JoinRelationGraph 优化实施计划

## 概述
优化 JoinRelationGraph 组件的边样式，实现三行错开的标签布局、自适应方向、点击交互等功能。

---

## [ ] 任务 1: 扩展 useGraphData，传递布局方向
- **Priority**: P0
- **Depends On**: None
- **Description**:
  - 修改 `useGraphData` 接口，添加 `direction` 参数
  - 将 `direction` 信息传递到边的数据中，供 JoinEdge 组件使用
  - 保持向后兼容性
- **Success Criteria**:
  - 边数据中包含 layout direction 信息
  - 不破坏现有功能
- **Test Requirements**:
  - `programmatic` TR-1.1: 检查边数据中是否包含 direction 字段
  - `human-judgement` TR-1.2: 验证图表正常渲染，无错误
- **Notes**: direction 可选值: "TB" | "LR" | "BT" | "RL"

---

## [ ] 任务 2: 修改 JoinRelationGraph，添加选中状态管理
- **Priority**: P0
- **Depends On**: 任务 1
- **Description**:
  - 添加 `direction` 作为组件 prop（默认 "TB"）
  - 添加状态管理：`selectedEdgeId` 和 `selectedTableId`
  - 实现点击边时选中/取消选中该边
  - 实现点击表时选中/取消选中该表，并高亮相关边
  - 实现点击空白处取消所有选中
  - 将选中状态通过 ReactFlow 的 `onEdgeClick`、`onNodeClick`、`onPaneClick` 处理
- **Success Criteria**:
  - 点击边可以选中/取消选中
  - 点击表可以选中/取消选中并高亮相关边
  - 点击空白处取消所有选中
- **Test Requirements**:
  - `programmatic` TR-2.1: 验证状态更新正常
  - `human-judgement` TR-2.2: 交互流畅，状态正确
- **Notes**: 使用 ReactFlow 的事件回调

---

## [ ] 任务 3: 重写 JoinEdge 组件，实现新的标签布局
- **Priority**: P0
- **Depends On**: 任务 1, 任务 2
- **Description**:
  - 接收 `selected` 和 `direction` 作为 props 或从 data 中获取
  - 实现三行错开的标签布局
  - 自适应 TB/LR 方向
  - 默认状态只显示线条，不显示标签
  - 选中状态显示标签
  - 使用项目主题色（暖棕主题）
  - 添加 join type 图标（INNER/LEFT/RIGHT）
  - 去掉阴影、边框、monospace 字体
  - 使用极淡的背景色（--bg-elevated）
- **Success Criteria**:
  - 三行错开布局正常显示
  - 自适应 TB/LR 方向
  - 默认隐藏标签，选中显示
  - 视觉符合项目主题
- **Test Requirements**:
  - `human-judgement` TR-3.1: 标签布局美观，层次清晰
  - `human-judgement` TR-3.2: 自适应方向正确
  - `human-judgement` TR-3.3: 颜色符合暖棕主题
- **Notes**: 参考 Impeccable 技能的 distill 和 typeset 子技能

---

## [ ] 任务 4: 更新样式文件 JoinRelationGraph.module.scss
- **Priority**: P0
- **Depends On**: 任务 3
- **Description**:
  - 重写 `.edgeLabel` 样式，去掉卡片感
  - 添加新的样式类：
    - `.edgeLabelLeftField` - 左字段样式
    - `.edgeLabelType` - 类型图标样式
    - `.edgeLabelRightField` - 右字段样式
    - `.edgeLabelHidden` - 隐藏状态
    - `.edgeLabelSelected` - 选中状态
  - 更新边的颜色样式，使用项目主题色
  - 添加选中高亮样式
- **Success Criteria**:
  - 样式符合设计要求
  - 使用项目 CSS 变量
  - 响应式布局正确
- **Test Requirements**:
  - `human-judgement` TR-4.1: 视觉简洁美观，无卡片感
  - `human-judgement` TR-4.2: 颜色使用项目主题变量
- **Notes**: 引用 Impeccable 技能："Remove decorations: Eliminate borders, shadows, backgrounds that don't serve hierarchy or function"

---

## [ ] 任务 5: 测试和验证
- **Priority**: P1
- **Depends On**: 任务 1-4
- **Description**:
  - 测试 TB 方向布局
  - 测试 LR 方向布局
  - 测试点击边交互
  - 测试点击表交互
  - 测试点击空白处取消选中
  - 验证视觉效果符合设计要求
  - 检查 TypeScript 类型错误
- **Success Criteria**:
  - 所有功能正常工作
  - 无类型错误
  - 视觉效果符合预期
- **Test Requirements**:
  - `programmatic` TR-5.1: 运行 TypeScript 检查无错误
  - `human-judgement` TR-5.2: 完整功能验证
- **Notes**: 可以运行项目的 lint/typecheck 命令

---

## 依赖关系图
```
任务 1 ──┐
         ├──> 任务 2 ──┐
任务 1 ──┘             ├──> 任务 3 ──> 任务 4 ──> 任务 5
```

## 并行执行策略
- 任务 1 可以独立先完成
- 任务 2 依赖任务 1，但可以与任务 3 的部分工作并行（如样式设计）
- 任务 3 和任务 4 紧密相关，建议顺序执行
- 任务 5 必须在所有任务完成后执行
