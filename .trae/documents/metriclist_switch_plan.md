# MetricList Switch 替换 - 实施计划

## [x] Task 1: 检查和创建基础 Switch 组件
- **Priority**: P0
- **Depends On**: None
- **Description**: 
  - 检查 `core/components/ui` 目录是否已有 Switch 组件
  - 如果没有，创建封装好的 Switch 组件，参考 Select 组件的结构
  - 使用 @base-ui/react 的 Switch 组件作为底层
  - 添加必要的样式（使用 SCSS Modules）
- **Success Criteria**:
  - Switch 组件可正常导入和使用
  - 组件包含基本的 checked、onCheckedChange 等 props
  - 有基本的样式支持
- **Test Requirements**:
  - `programmatic` TR-1.1: 组件能正常渲染
  - `programmatic` TR-1.2: checked 状态切换正常
  - `human-judgement` TR-1.3: 样式符合项目整体风格
- **Notes**: 参考 Select 组件的组织方式（组件目录 + index.ts + 样式文件）

## [x] Task 2: 修改 MetricList 组件
- **Priority**: P0
- **Depends On**: Task 1
- **Description**:
  - 导入新创建的 Switch 组件
  - 替换现有的 toggle 按钮部分
  - 保留"业务名称"文字标签
  - 绑定 Switch 状态与 displayMode:
    - checked=true → displayMode="business"
    - checked=false → displayMode="original"
- **Success Criteria**:
  - Switch 组件替代了原有的按钮切换
  - 默认显示业务名称（Switch 打开状态）
  - 点击 Switch 能正常切换显示模式
- **Test Requirements**:
  - `programmatic` TR-2.1: 默认 checked 为 true，displayMode 为 business
  - `programmatic` TR-2.2: 点击 Switch 后 displayMode 正确切换
  - `human-judgement` TR-2.3: UI 布局合理，文字标签和 Switch 对齐
- **Notes**: 保持其他功能不变，只替换切换组件

## [x] Task 3: 清理样式和测试
- **Priority**: P1
- **Depends On**: Task 2
- **Description**:
  - 移除 MetricList.module.scss 中不再使用的 toggle 和 toggleButton 样式
  - 测试整体功能是否正常
  - 检查是否有任何回归问题
- **Success Criteria**:
  - 不再使用的样式被清理
  - 所有功能正常工作
- **Test Requirements**:
  - `programmatic` TR-3.1: MetricList 的所有原有功能正常
  - `programmatic` TR-3.2: 样式文件中没有未使用的类名
  - `human-judgement` TR-3.3: 整体视觉体验良好
