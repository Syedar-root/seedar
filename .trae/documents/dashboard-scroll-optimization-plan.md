# Dashboard 滚动功能优化实施计划

## 任务目标
为 SeedarDashboard 组件添加滚动功能，确保当 dashboard 内容过长时可以滚动查看，同时保持 header 固定不动。需要在 ui-react 包中创建独立的 ScrollArea 组件，不依赖项目的具体实现。

## 背景分析
- 当前 SeedarDashboard 组件没有滚动容器，内容过长时无法查看
- 用户希望使用 ScrollArea 组件来实现滚动功能
- ui-react 包应该保持独立性，不应依赖项目的具体组件和样式变量
- 需要参考 Impeccable 技能包中的 `arrange` 和 `harden` 子技能指导

## 实施步骤

### 步骤 1: 创建独立的 ScrollArea 组件
**文件路径**: `packages/ui-react/src/components/common/ScrollArea/`

#### 1.1 创建 ScrollArea 组件文件
- **文件**: `ScrollArea.tsx`
- **内容**:
  - 导入 `@base-ui/react/scroll-area` 的基础组件
  - 定义 `ScrollAreaProps` 接口，包含 `children`, `className`, `style` 属性
  - 实现 ScrollArea 组件，使用 BaseScrollArea 的 Root, Viewport, Content, Scrollbar, Thumb, Corner 子组件
  - 使用 CSS Modules 进行样式管理

#### 1.2 创建 ScrollArea 样式文件
- **文件**: `ScrollArea.module.css`
- **内容**:
  - `.root`: 相对定位，宽高 100%，overflow: hidden
  - `.viewport`: 相对定位，宽高 100%，继承 border-radius
  - `.content`: 相对定位，宽度 100%
  - `.scrollbar`: flex 布局，user-select: none，初始 opacity: 0，hover 时 opacity: 1
  - `.thumb`: flex: 1，使用灰色背景，圆角样式，hover 时颜色加深
  - `.corner`: 透明背景

**CSS 兼容性调整**（参考 Impeccable `harden` 子技能）:
- 将 CSS 变量替换为具体值（如 `8px` 替代 `var(--spacing-sm)`）
- 使用标准的 CSS 过渡时间（`0.2s ease`）
- 使用标准的颜色值（`#e5e7eb`, `#d1d5db`）
- 确保跨浏览器兼容性

#### 1.3 创建 ScrollArea 导出文件
- **文件**: `index.ts`
- **内容**: 导出 ScrollArea 组件

### 步骤 2: 更新 common 模块导出
**文件路径**: `packages/ui-react/src/components/common/index.ts`

- 添加 ScrollArea 组件的导出
- 保持与现有导出格式一致

### 步骤 3: 修改 SeedarDashboard 组件
**文件路径**: `packages/ui-react/src/components/gridContainer/seedar/seedarDashboard.tsx`

#### 3.1 更新导入语句
- 添加 ScrollArea 组件的导入: `import { ScrollArea } from "../../common/ScrollArea";`

#### 3.2 修改组件渲染逻辑
- 保持 `{header}` 和 `{children}` 在 ScrollArea 外部（固定不滚动）
- 用 ScrollArea 包裹 GridContainer
- 保持 `{footer}` 在 ScrollArea 外部（固定不滚动）

**最终结构**:
```
SeedarDashboard
├── header (固定，不滚动)
├── children (固定，不滚动)
├── ScrollArea (可滚动)
│   └── GridContainer (面板内容)
└── footer (固定，不滚动)
```

### 步骤 4: 验证和测试
#### 4.1 代码检查
- 确保 ui-react 包没有引入项目特定的依赖
- 验证 ScrollArea 组件的样式独立性
- 检查 TypeScript 类型定义是否正确

#### 4.2 功能测试
- 在 dashboardPage.tsx 中使用 SeedarDashboard 组件
- 测试 header 是否固定不动
- 测试内容过长时是否可以滚动
- 测试滚动条样式是否符合预期

## 技术要点

### 参考的 Impeccable 技能指导

1. **`arrange` 子技能** - "布局、间距、视觉节奏、网格优化"
   - 引用原文: "优化间距/层级，赋予界面自然节奏"
   - 应用: 确保 ScrollArea 的布局合理，滚动区域层次清晰

2. **`harden` 子技能** - "健壮性、错误处理、国际化、边缘情况"
   - 引用原文: "补充 AI 生成内容缺失的「生产级能力」"
   - 应用: 确保 ScrollArea 组件的 CSS 兼容性，使用硬编码值而非 CSS 变量

### 设计原则
- **独立性**: ui-react 包不依赖项目的具体实现
- **可复用性**: ScrollArea 组件可以在其他地方复用
- **兼容性**: 使用标准 CSS 值，确保跨浏览器兼容
- **用户体验**: 滚动条 hover 时显示，平时隐藏，界面更简洁

## 预期结果
- ✅ SeedarDashboard 的 header 固定在顶部
- ✅ 只有面板内容区域可以滚动
- ✅ 使用统一的 ScrollArea 组件，样式一致
- ✅ ui-react 包保持独立性，不依赖项目特定代码
- ✅ 跨浏览器兼容性良好

## 风险和注意事项
1. 确保 `@base-ui/react` 版本兼容性（当前版本: ^1.3.0）
2. CSS Modules 的类名命名避免冲突
3. ScrollArea 的高度需要正确设置为 100% 才能正常工作
4. 需要确保父容器有明确的高度设置

## 后续优化建议
1. 考虑添加水平滚动支持（如果需要）
2. 可以添加自定义滚动条样式的配置选项
3. 考虑添加滚动位置的记忆功能
