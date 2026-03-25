# 指标编辑器优化计划

## 问题分析

### 问题1：布局问题
**根因**：
- 预览区域和引用面板放在输入框**下方**，占用垂直空间，导致核心编辑区域不突出
- 智能提示使用 `position: absolute`，但其容器 `editorWrapper` 样式可能不完整
- 对话框宽度可能不够，内容被挤压

### 问题2：函数选中后没有完全补全
**根因**：在 `FormulaEditor.tsx` 第63行：
```typescript
insertText = `${fn.name}(`  // 只添加了左括号
```
应该是 `SUM()` 并将光标移到括号中间

### 问题3：#F #M 没有智能提示
**根因**：在 `FormulaEditor.tsx` 第43-48行：
```typescript
const filteredItems = [...AGGREGATE_FUNCTIONS, ...fields, ...metrics]
```
无论输入 `#F` 还是 `#M`，都显示**全部列表**，没有根据类型过滤

### 问题4：颜色没有使用主题变量
**根因**：直接使用硬编码颜色（如 `#e5e7eb`, `#3b82f6`），项目有完整的主题系统 CSS 变量（`--cv-*`）

---

## 优化方案

### 1. 布局优化

**改进布局结构**：
```
┌──────────────────────────────────────────────────────────┐
│  基础信息                                                │
│  ├─ 指标名称: [____________________]                    │
│  └─ 业务名称: [____________________]                    │
├──────────────────────────────────────────────────────────┤
│  公式编辑                              │  预览           │
│  ┌────────────────────────────────┐    │  ┌──────────┐  │
│  │  SUM(amount) * price           │    │  │ KaTeX    │  │
│  │  ↳ 智能提示(浮层)              │    │  │ 渲染     │  │
│  └────────────────────────────────┘    │  └──────────┘  │
│  ─────────────────────────────────────────────────────── │
│  可用函数    │  可用字段              │  可用指标        │
│  [SUM][COUNT]│  [amount][price]     │  [revenue]      │
└──────────────────────────────────────────────────────────┘
```

**具体改动**：
- 预览区域放到**右侧**（与输入框并排）
- 引用面板改为**横向排列**或**更紧凑**的布局
- 智能提示使用 **Popover** 策略，避免遮挡

### 2. 函数补全优化

**改动点**：
```typescript
// 选中函数时，添加完整的括号并将光标移到中间
insertText = `${fn.name}()`;
newCursorPos = newTextBefore.length + fn.name.length + 1; // 在括号内
```

### 3. #F #M 智能提示过滤

**改动逻辑**：
```typescript
if (lastWord.startsWith('#F')) {
  // 只显示字段列表
  setSuggestions(fields.filter(...));
} else if (lastWord.startsWith('#M')) {
  // 只显示指标列表
  setSuggestions(metrics.filter(...));
} else if (suggestionType === 'function') {
  // 只显示函数列表
  setSuggestions(AGGREGATE_FUNCTIONS.filter(...));
}
```

### 4. 使用主题变量

**项目 CSS 变量**（来自 `global.variable.scss`）：
```scss
// 文字色
--cv-text-primary
--cv-text-secondary
--cv-text-tertiary

// 背景色
--cv-bg-base
--cv-bg-elevated
--cv-bg-hover
--cv-bg-selected

// 边框色
--cv-border-base
--cv-border-focus

// 功能色
--cv-success
--cv-warning
--cv-danger
--cv-info

// 阴影
--cv-shadow-sm
--cv-shadow-md
--cv-shadow-lg

// 圆角
--cv-radius-sm
--cv-radius-base
--cv-radius-lg
```

**改动示例**：
```scss
// 之前
background: #ffffff;
border: 1px solid #e5e7eb;

// 之后
background: var(--cv-bg-elevated);
border: 1px solid var(--cv-border-base);
```

---

## 实现步骤

### 步骤 1：修改 `FormulaEditor.tsx`

1. 修复函数选中逻辑：添加完整括号，光标移到中间
2. 修复 #F #M 智能提示过滤逻辑
3. 调整布局：右侧预览 + 紧凑引用面板

### 步骤 2：修改样式文件

1. `formulaEditor.module.scss` - 使用 CSS 变量
2. `formulaSuggestion.module.scss` - 使用 CSS 变量，优化定位
3. `metricEditorDialog.module.scss` - 调整对话框布局

### 步骤 3：可选 - 添加 Popover 组件

如果智能提示位置问题持续存在，考虑使用 `@base-ui/react` 的 Popover 组件

---

## 验收标准

1. ✅ 输入 `#F` 只显示字段列表，输入 `#M` 只显示指标列表
2. ✅ 选中函数如 `SUM` 后显示 `SUM()` 且光标在括号内
3. ✅ 布局清晰：输入框核心区域突出，预览在右侧
4. ✅ 所有颜色使用项目主题变量
