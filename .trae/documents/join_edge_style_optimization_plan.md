# JoinEdge 组件样式优化计划

## [ ] 任务 1: 修改 JoinEdge.tsx 组件结构
- **Priority**: P0
- **Depends On**: None
- **Description**: 
  - 重新布局标签内容，从垂直布局改为水平布局
  - 左字段 → 右字段水平排列
  - 连接类型（INNER）放在中间下方
  - 添加箭头元素
- **Success Criteria**:
  - JSX 结构符合新的布局要求
- **Test Requirements**:
  - `human-judgement` TR-1.1: JSX 结构包含左字段、箭头、右字段、连接类型四个元素
- **Notes**: 确保在 selected 状态下显示新布局

## [ ] 任务 2: 实现箭头样式（使用 div + 伪元素）
- **Priority**: P0
- **Depends On**: 任务 1
- **Description**:
  - 创建箭头元素的样式
  - 使用 div 和伪元素（::before/::after）绘制箭头
  - 箭头比默认更长一些
- **Success Criteria**:
  - 箭头样式正确显示
- **Test Requirements**:
  - `human-judgement` TR-2.1: 箭头使用纯 CSS 绘制，没有使用图片或 SVG
  - `human-judgement` TR-2.2: 箭头长度合适（比默认稍长）

## [ ] 任务 3: 调整整体布局样式
- **Priority**: P0
- **Depends On**: 任务 1
- **Description**:
  - 将 label 容器的 flex-direction 从 column 改为 row 用于上半部分
  - 整体采用嵌套 flex 布局：上半部分水平，下半部分（连接类型）居中
  - 调整间距和对齐
- **Success Criteria**:
  - 布局正确：左字段 → 右字段在上，连接类型在下居中
- **Test Requirements**:
  - `human-judgement` TR-3.1: 左字段、箭头、右字段水平排列在一行
  - `human-judgement` TR-3.2: 连接类型在中间下方居中显示

## [ ] 任务 4: 调整字体大小和样式
- **Priority**: P1
- **Depends On**: 任务 1
- **Description**:
  - 确保字段名（订单ID、关联订单ID）字体大小合适
  - 连接类型（INNER）字体更小一些
- **Success Criteria**:
  - 连接类型字体比字段名字体小
- **Test Requirements**:
  - `human-judgement` TR-4.1: 连接类型字体明显小于字段名字体

## [ ] 任务 5: 验证水平和垂直方向都正常工作
- **Priority**: P1
- **Depends On**: 任务 2, 3, 4
- **Description**:
  - 确保 isHorizontal 为 true 时也能正常显示
  - 可能需要根据方向调整箭头朝向
- **Success Criteria**:
  - 水平和垂直方向都能正常显示新样式
- **Test Requirements**:
  - `human-judgement` TR-5.1: 水平方向（LR/RL）显示正常
  - `human-judgement` TR-5.2: 垂直方向（TB/BT）显示正常
