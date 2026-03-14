# Title 组件样式分离计划

## 任务分解与优先级

### [x] 任务 1: 分析当前内联样式
- **优先级**: P1
- **Depends On**: None
- **Description**:
  - 分析 `title.tsx` 中 'flag' 类型的内联样式
  - 识别需要提取的样式属性和结构
- **Success Criteria**:
  - 完整识别所有内联样式属性
  - 理解样式的层次结构和关系
- **Test Requirements**:
  - `programmatic` TR-1.1: 列出所有内联样式属性及其值
  - `human-judgement` TR-1.2: 确认样式分析的完整性

### [x] 任务 2: 在 CSS 模块中定义样式类
- **优先级**: P1
- **Depends On**: 任务 1
- **Description**:
  - 在 `title.module.css` 文件中创建适当的样式类
  - 为 'flag' 类型的各个元素定义样式
- **Success Criteria**:
  - CSS 文件包含所有必要的样式类
  - 样式类命名清晰且符合项目规范
- **Test Requirements**:
  - `programmatic` TR-2.1: CSS 文件存在且包含样式定义
  - `human-judgement` TR-2.2: 样式类命名合理，结构清晰

### [x] 任务 3: 修改组件使用 CSS 类
- **优先级**: P1
- **Depends On**: 任务 2
- **Description**:
  - 修改 `title.tsx` 文件，移除内联样式
  - 导入 CSS 模块并应用样式类
- **Success Criteria**:
  - 组件不再使用内联样式
  - 组件正确导入和使用 CSS 类
- **Test Requirements**:
  - `programmatic` TR-3.1: 组件文件中没有内联样式
  - `programmatic` TR-3.2: 组件正确导入 CSS 模块
  - `human-judgement` TR-3.3: 代码结构清晰，样式应用正确

### [x] 任务 4: 验证组件功能和样式
- **优先级**: P0
- **Depends On**: 任务 3
- **Description**:
  - 验证组件在 'plain' 和 'flag' 类型下都能正常工作
  - 确认样式与原来保持一致
- **Success Criteria**:
  - 组件功能正常
  - 样式视觉效果与原来一致
- **Test Requirements**:
  - `human-judgement` TR-4.1: 组件渲染正确
  - `human-judgement` TR-4.2: 样式视觉效果与原来一致

## 实现细节

### 样式分析
- 外层 div: 宽度100%，高度100%，flex布局，居中对齐，背景色 #87360022
- 左侧标记 div: 宽度8px，高度100%，右边距4px，背景色 #873600
- 内容 div: 高度100%，上下内边距4px，右边距4px，行高100%，字体大小16px

### CSS 类设计
- `.flagContainer`: 外层容器样式
- `.flagMarker`: 左侧标记样式
- `.flagContent`: 内容区域样式

### 组件修改
- 导入 CSS 模块
- 移除内联样式
- 应用相应的 CSS 类