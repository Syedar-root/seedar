# 数据源详情页面组件拆分实施计划

## [ ] 任务 1: 分析现有代码结构并确定拆分方案
- **Priority**: P0
- **Depends On**: None
- **Description**: 
  - 分析 datasourceDetailPage.tsx 的现有结构
  - 识别可复用的组件部分
  - 规划组件组织方式
- **Success Criteria**:
  - 确定清晰的组件拆分方案
  - 符合项目现有的组件组织风格
- **Test Requirements**:
  - `human-judgement` TR-1.1: 拆分方案合理，每个组件职责单一
  - `human-judgement` TR-1.2: 组件命名和目录结构与现有项目风格一致
- **Notes**: 参考 TableStructure、DatasourceCard 等现有组件的组织方式

## [ ] 任务 2: 创建 DatasourceHero 组件（Hero 区域）
- **Priority**: P0
- **Depends On**: 任务 1
- **Description**: 
  - 提取 HeroSection 相关代码到独立组件
  - 包含：返回按钮、数据源类型图标、状态徽章、标题、连接信息、统计数据
  - 创建对应的 SCSS 样式文件
  - 导出组件并创建 index.ts
- **Success Criteria**:
  - DatasourceHero 组件独立可用
  - 保持原有视觉效果和动画
  - 完整的 TypeScript 类型定义
- **Test Requirements**:
  - `programmatic` TR-2.1: 组件接收 datasource 作为 prop 并正确渲染
  - `human-judgement` TR-2.2: 样式与原页面一致

## [ ] 任务 3: 创建 TableExplorer 组件（表结构区域）
- **Priority**: P0
- **Depends On**: 任务 1
- **Description**: 
  - 提取表结构相关代码到独立组件
  - 包含：表格列表、单个表格展示、字段列表
  - 创建对应的 SCSS 样式文件
  - 导出组件并创建 index.ts
- **Success Criteria**:
  - TableExplorer 组件独立可用
  - 保持原有视觉效果和动画
  - 完整的 TypeScript 类型定义
- **Test Requirements**:
  - `programmatic` TR-3.1: 组件接收 tables 数组作为 prop 并正确渲染
  - `human-judgement` TR-3.2: 样式与原页面一致

## [ ] 任务 4: 创建 RelationshipTimeline 组件（外键关系区域）
- **Priority**: P0
- **Depends On**: 任务 1
- **Description**: 
  - 提取外键关系相关代码到独立组件
  - 包含：外键关系列表、单个关系展示
  - 创建对应的 SCSS 样式文件
  - 导出组件并创建 index.ts
- **Success Criteria**:
  - RelationshipTimeline 组件独立可用
  - 保持原有视觉效果和动画
  - 完整的 TypeScript 类型定义
- **Test Requirements**:
  - `programmatic` TR-4.1: 组件接收 foreignKeys 数组作为 prop 并正确渲染
  - `human-judgement` TR-4.2: 样式与原页面一致

## [ ] 任务 5: 创建 MetadataBar 组件（元数据栏）
- **Priority**: P1
- **Depends On**: 任务 1
- **Description**: 
  - 提取元数据栏相关代码到独立组件
  - 包含：创建时间、最后更新、最后验证
  - 创建对应的 SCSS 样式文件
  - 导出组件并创建 index.ts
- **Success Criteria**:
  - MetadataBar 组件独立可用
  - 保持原有视觉效果
  - 完整的 TypeScript 类型定义
- **Test Requirements**:
  - `programmatic` TR-5.1: 组件接收 datasource 作为 prop 并正确渲染
  - `human-judgement` TR-5.2: 样式与原页面一致

## [ ] 任务 6: 创建 LoadingState 和 ErrorState 组件
- **Priority**: P1
- **Depends On**: 任务 1
- **Description**: 
  - 提取加载和错误状态相关代码到独立组件
  - 创建 LoadingState 组件
  - 创建 ErrorState 组件
  - 创建 EmptyState 组件（用于数据源不存在的情况）
  - 创建对应的 SCSS 样式文件
  - 导出组件并创建 index.ts
- **Success Criteria**:
  - 三个状态组件都独立可用
  - 保持原有视觉效果
  - 完整的 TypeScript 类型定义
- **Test Requirements**:
  - `programmatic` TR-6.1: 各组件接收对应 props 并正确渲染
  - `human-judgement` TR-6.2: 样式与原页面一致

## [ ] 任务 7: 重构主页面组件
- **Priority**: P0
- **Depends On**: 任务 2, 3, 4, 5, 6
- **Description**: 
  - 更新 datasourceDetailPage.tsx 使用新拆分的组件
  - 移除不再需要的内联代码
  - 清理 SCSS 文件，移除被拆分组件的样式
  - 更新 index.ts 导出
- **Success Criteria**:
  - 主页面组件更加简洁
  - 功能与原页面完全一致
  - 没有 TypeScript 或 Lint 错误
- **Test Requirements**:
  - `programmatic` TR-7.1: 页面加载并正确显示所有信息
  - `programmatic` TR-7.2: 没有控制台错误
  - `human-judgement` TR-7.3: 视觉效果与原页面一致

## [ ] 任务 8: 验证和测试
- **Priority**: P0
- **Depends On**: 任务 7
- **Description**: 
  - 手动测试页面功能
  - 验证所有交互元素正常工作
  - 检查响应式布局
- **Success Criteria**:
  - 所有功能正常工作
  - 响应式布局在不同屏幕尺寸下正常显示
- **Test Requirements**:
  - `human-judgement` TR-8.1: 所有功能正常
  - `human-judgement` TR-8.2: 响应式布局正常
