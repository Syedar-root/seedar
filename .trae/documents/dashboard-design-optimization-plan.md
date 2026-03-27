# Dashboard 页面设计优化任务计划

## 项目概述
优化 `d:\Program\projects\seedar\apps\web-client\src\modules\dashboard\pages\` 下的 dashboard 页面设计，使其符合项目的 "Classic Vintage Theme" 设计系统，提升视觉质量和用户体验。

## 优化目标
基于 **Impeccable** 前端设计优化技能包，将 dashboard 页面从"可用级"提升到"生产级"专业设计质量。

## 当前问题分析

### 1. 色彩系统问题
- **问题**：按钮使用硬编码颜色（#6c757d、#85c70c、#007bff），与项目的 Classic Vintage Theme 完全不符
- **影响**：视觉不统一，缺乏品牌识别度
- **引用**：`normalize` 子技能 - "对齐项目设计规范/Token，解决 AI 生成内容'样式不一致'问题"

### 2. 布局与间距问题
- **问题**：Header 使用 `justify-content: flex-start`，所有按钮左对齐，缺乏功能分区；间距统一为 12px，缺乏层次感
- **影响**：视觉节奏单一，功能分区不清晰
- **引用**：`arrange` 子技能 - "打破 AI 生成的'标准化卡片网格'，优化间距/层级"

### 3. 交互反馈不足
- **问题**：只有简单的 hover 效果，缺少 active、focus、disabled 状态；模式切换没有过渡动画
- **影响**：用户体验生硬，可访问性不足
- **引用**：`animate` 子技能 - "为 AI 生成的'无反馈界面'添加有目的的微动画"

### 4. 视觉细节粗糙
- **问题**：圆角不统一（4px），没有阴影效果，字体大小不规范
- **影响**：缺乏立体感和专业质感
- **引用**：`polish` 子技能 - "将 AI 生成的'可用版'升级为'生产级'"

## 实施计划

### 阶段一：色彩系统对齐（P0 - 必须完成）

#### 任务 1.1：替换模式切换按钮颜色
**文件**：`dashboard.module.scss`

**当前代码**：
```scss
.modeToggle {
  $bg-color--toggle: #6c757d;
  padding: 0.5rem 1rem;
  background: $bg-color--toggle;
  color: white;
  // ...
}
```

**优化方案**：
- 背景色：`var(--text-tertiary)` (#a0522d)
- 文字色：`var(--text-inverse)` (#faf6f0)
- Hover 背景色：`var(--primary-hover)` (#b8633a)

#### 任务 1.2：替换新建面板按钮颜色
**文件**：`dashboard.module.scss`

**当前代码**：
```scss
.createPanel {
  $bg-color--create: #85c70c;
  padding: 0.5rem;
  background: $bg-color--create;
  color: white;
  // ...
}
```

**优化方案**：
- 背景色：`var(--primary)` (#a0522d)
- 文字色：`var(--text-inverse)` (#faf6f0)
- Hover 背景色：`var(--primary-hover)` (#b8633a)
- Active 背景色：`var(--primary-active)` (#8b4513)

#### 任务 1.3：替换添加已有面板按钮颜色
**文件**：`dashboard.module.scss`

**当前代码**：
```scss
.addPanel {
  $bg-color--add: #007bff;
  padding: 0.5rem;
  background: $bg-color--add;
  color: white;
  // ...
}
```

**优化方案**：
- 背景色：`var(--info)` (#5d7a8c)
- 文字色：`var(--text-inverse)` (#faf6f0)
- Hover 背景色：`var(--info-hover)` (#6e8a9c)

### 阶段二：布局与间距优化（P0 - 必须完成）

#### 任务 2.1：重新组织 Header 布局
**文件**：`dashboard.module.scss`

**当前代码**：
```scss
.header {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 12px;
}
```

**优化方案**：
- 使用 `justify-content: space-between` 实现左右分区
- 左侧：模式切换按钮
- 右侧：操作按钮组（仅在编辑模式显示）

#### 任务 2.2：优化间距系统
**文件**：`dashboard.module.scss`

**优化方案**：
- 模式切换按钮与操作按钮组之间：`var(--spacing-xl)` (24px)
- 操作按钮组内部：`var(--spacing-md)` (12px)
- 主要操作按钮内边距：`var(--spacing-md)` (12px) 水平，`var(--spacing-sm)` (8px) 垂直
- 次要操作按钮内边距：`var(--spacing-sm)` (8px) 水平，`var(--spacing-sm)` (8px) 垂直

### 阶段三：视觉细节优化（P1 - 重要）

#### 任务 3.1：统一圆角系统
**文件**：`dashboard.module.scss`

**当前代码**：
```scss
border-radius: 4px;
```

**优化方案**：
- 主要操作按钮：`var(--radius-base)` (6px)
- 次要操作按钮：`var(--radius-sm)` (4px)
- 模式切换按钮：`var(--radius-sm)` (4px)

#### 任务 3.2：添加阴影效果
**文件**：`dashboard.module.scss`

**优化方案**：
- 默认状态：`var(--shadow-sm)` (0 1px 2px rgba(0, 0, 0, 0.05))
- Hover 状态：`var(--shadow-md)` (0 2px 8px rgba(0, 0, 0, 0.1))
- Active 状态：无阴影（内收效果）

#### 任务 3.3：统一字体大小
**文件**：`dashboard.module.scss`

**当前代码**：
```scss
font-size: 0.875rem;
```

**优化方案**：
- 主要操作按钮：`var(--font-lg)` (14px)
- 次要操作按钮：`var(--font-base)` (13px)
- 模式切换按钮：`var(--font-base)` (13px)
- 图标大小：与文字基线对齐

### 阶段四：交互状态完善（P1 - 重要）

#### 任务 4.1：添加 Focus 状态
**文件**：`dashboard.module.scss`

**优化方案**：
```scss
&:focus {
  outline: 2px solid var(--border-focus);
  outline-offset: 2px;
}
```

#### 任务 4.2：完善 Active 状态
**文件**：`dashboard.module.scss`

**优化方案**：
- 背景色：使用对应的 active 变量
- 添加 `transform: translateY(1px)` 实现按下效果
- 阴影：移除或减弱

#### 任务 4.3：优化过渡动画
**文件**：`dashboard.module.scss`

**当前代码**：
```scss
transition: background-color 0.2s;
```

**优化方案**：
- 颜色变化：`var(--transition-fast)` (0.1s ease)
- 阴影变化：`var(--transition-base)` (0.15s ease)
- 变换效果：`var(--transition-base)` (0.15s ease)

### 阶段五：代码结构优化（P2 - 优化）

#### 任务 5.1：提取公共样式
**文件**：`dashboard.module.scss`

**优化方案**：
创建按钮基础样式 mixin，减少代码重复：
```scss
@mixin button-base {
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-xs);
  transition: all var(--transition-base);
  font-weight: 500;
  line-height: 1.5;
}
```

#### 任务 5.2：组织样式结构
**文件**：`dashboard.module.scss`

**优化方案**：
按功能模块组织样式：
1. 容器样式
2. Header 样式
3. 按钮基础样式
4. 各按钮特定样式
5. 面板头部额外操作样式

## 验收标准

### 功能完整性
- [ ] 所有按钮功能正常，点击事件不受影响
- [ ] 模式切换功能正常工作
- [ ] 面板操作（新建、添加、删除、跳转）功能正常

### 设计合规性
- [ ] 所有颜色使用 CSS 变量，无硬编码颜色
- [ ] 圆角、间距、字体大小符合设计系统规范
- [ ] 按钮状态（default、hover、active、focus）完整且一致

### 可访问性
- [ ] Focus 状态清晰可见
- [ ] 色彩对比度符合 WCAG 标准
- [ ] 键盘导航体验良好

### 性能
- [ ] 过渡动画流畅，无明显卡顿
- [ ] 样式加载无性能问题

## 风险评估

### 低风险
- 样式修改不影响功能逻辑
- CSS 变量已定义，无需新增

### 中风险
- 布局调整可能影响响应式表现
- 需要测试不同浏览器兼容性

### 缓解措施
- 逐步实施，每完成一个阶段进行测试
- 保留原始样式备份
- 在多个浏览器中验证效果

## 实施顺序

1. **阶段一**：色彩系统对齐（最关键，影响最大）
2. **阶段二**：布局与间距优化（依赖色彩系统）
3. **阶段三**：视觉细节优化（独立，可并行）
4. **阶段四**：交互状态完善（依赖前三阶段）
5. **阶段五**：代码结构优化（最后进行，不影响功能）

## 预期成果

完成后，dashboard 页面将具备：
- ✅ 统一的视觉风格，符合 Classic Vintage Theme
- ✅ 清晰的功能分区和视觉层级
- ✅ 流畅的交互反馈和动画效果
- ✅ 完善的可访问性支持
- ✅ 生产级的设计质量

## 参考资料

- **Impeccable 技能包**：`normalize`、`arrange`、`animate`、`polish`、`typeset`、`colorize` 子技能
- **项目设计系统**：`d:\Program\projects\seedar\apps\web-client\src\core\assets\styles\global.variable.scss`
- **现有组件模式**：参考 `DashboardAside` 和 `CreateDashboardDialog` 的按钮实现
