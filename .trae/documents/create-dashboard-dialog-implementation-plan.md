# 新建看板 Dialog 实现计划

## 📋 任务概述

将 DashboardAside 组件中的"新建看板"功能从直接点击创建改为 Dialog 弹窗形式，提供更好的用户感知和交互体验。

## 🎯 设计目标

- 提供明确的用户感知，让用户清楚知道正在执行"创建"操作
- 用户可以自定义看板名称
- 提供友好的错误处理和反馈
- 与项目现有设计系统保持一致
- 使用 sonner 显示成功/失败提示
- 创建成功后跳转到新看板页面

## 📦 实现步骤

### 步骤 1: 创建 CreateDashboardDialog 组件

**文件路径**: `d:\Program\projects\seedar\apps\web-client\src\modules\dashboard\components\aside\CreateDashboardDialog.tsx`

**功能要求**:
- 使用 `@base-ui/react/dialog` 组件
- 包含表单：看板名称（必填）、描述（可选）
- 表单验证：看板名称不能为空
- 提交状态：显示加载中状态
- 错误处理：显示错误提示
- 成功回调：调用 onSuccess 并关闭 Dialog
- 失败回调：显示错误信息

**组件结构**:
```typescript
interface CreateDashboardDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (dashboardId: string) => void;
}
```

**关键功能点**:
- 状态管理：name, description, isSubmitting, error
- 验证逻辑：validateForm() 检查必填字段
- 提交逻辑：调用 useCreateDashboard mutation
- 焦点管理：Dialog 打开时自动聚焦到名称输入框
- 键盘支持：Enter 提交，ESC 关闭

---

### 步骤 2: 创建 Dialog 样式文件

**文件路径**: `d:\Program\projects\seedar\apps\web-client\src\modules\dashboard\components\aside\CreateDashboardDialog.module.scss`

**样式要求**:
- 参考 `metricEditorDialog.module.scss` 的设计模式
- Dialog 宽度：480px（固定）
- 使用 CSS 变量：`--spacing-xl`, `--radius-lg`, `--font-xl` 等
- 动画效果：
  - Backdrop 淡入淡出：`opacity` 过渡，时长 `--transition-base` (0.15s)
  - Dialog 弹出：`transform` + `opacity`，时长 `--transition-base` (0.15s)
  - 使用缓动函数：`cubic-bezier(0.25, 1, 0.5, 1)`

**样式模块**:
- `.backdrop`: 固定定位，半透明黑色背景
- `.popup`: Dialog 主体，居中显示
- `.content`: 内容容器，内边距 24px
- `.title`: 标题样式，16px，600 字重
- `.form`: 表单容器，垂直布局
- `.formGroup`: 表单组，标签 + 输入框
- `.label`: 标签样式，13px，500 字重
- `.required`: 必填标记，红色
- `.input`: 输入框样式，36px 高，6px 圆角
- `.textarea`: 文本域样式，80px 最小高度
- `.errorText`: 错误提示样式，12px，红色
- `.actions`: 操作栏，右对齐
- `.cancelButton`: 取消按钮，次要按钮样式
- `.saveButton`: 创建按钮，主要按钮样式

**交互状态**:
- 输入框 Hover: `--border-hover` (#c0a080)
- 输入框 Focus: `--border-focus` (#a0522d), `--shadow-sm`
- 输入框 Error: `--danger` (#b85450), `--danger-light` 背景
- 按钮 Hover: 背景色变化，阴影增加
- 按钮 Disabled: 禁用状态，透明度 0.6

---

### 步骤 3: 修改 DashboardAside 组件

**文件路径**: `d:\Program\projects\seedar\apps\web-client\src\modules\dashboard\components\aside\DashboardAside.tsx`

**修改内容**:
1. 导入 CreateDashboardDialog 组件
2. 导入 toast from 'sonner'
3. 添加状态：`isDialogOpen` (boolean)
4. 修改 `handleCreateDashboard` 函数：
   - 改为打开 Dialog：`setIsDialogOpen(true)`
5. 添加 `handleDialogClose` 函数：
   - 关闭 Dialog：`setIsDialogOpen(false)`
6. 添加 `handleDashboardCreated` 函数：
   - 接收 dashboardId 参数
   - 调用 `toast.success("看板创建成功")`
   - 跳转到新看板页面：`navigate(`/dashboard/${dashboardId}`)`
   - 关闭 Dialog
7. 在 JSX 中添加 CreateDashboardDialog 组件

**修改后的代码结构**:
```typescript
// 导入
import { CreateDashboardDialog } from "./CreateDashboardDialog";
import { toast } from "sonner";

// 状态
const [isDialogOpen, setIsDialogOpen] = useState(false);

// 事件处理
const handleCreateDashboard = () => {
  setIsDialogOpen(true);
};

const handleDialogClose = () => {
  setIsDialogOpen(false);
};

const handleDashboardCreated = (dashboardId: string) => {
  toast.success("看板创建成功");
  navigate(`/dashboard/${dashboardId}`);
  setIsDialogOpen(false);
};

// JSX
<CreateDashboardDialog
  open={isDialogOpen}
  onClose={handleDialogClose}
  onSuccess={handleDashboardCreated}
/>
```

---

### 步骤 4: 更新导出文件

**文件路径**: `d:\Program\projects\seedar\apps\web-client\src\modules\dashboard\components\aside\index.ts`

**修改内容**:
- 导出 CreateDashboardDialog 组件

```typescript
export { DashboardAside } from "./DashboardAside";
export { CreateDashboardDialog } from "./CreateDashboardDialog";
```

---

## 🎨 设计规范

### 颜色使用

| 元素 | 状态 | 颜色变量 | 值 |
|------|------|----------|-----|
| Dialog 背景 | 默认 | `--bg-elevated` | #ffffff |
| 标题文字 | 默认 | `--text-primary` | #5a4a3a |
| 标签文字 | 默认 | `--text-primary` | #5a4a3a |
| 必填标记 | 默认 | `--danger` | #b85450 |
| 输入框边框 | 默认 | `--border-base` | #d5c4b0 |
| 输入框边框 | Hover | `--border-hover` | #c0a080 |
| 输入框边框 | Focus | `--border-focus` | #a0522d |
| 输入框边框 | Error | `--danger` | #b85450 |
| 输入框文字 | 默认 | `--text-primary` | #5a4a3a |
| 占位符文字 | 默认 | `--text-tertiary` | #a0522d |
| 错误提示 | 默认 | `--danger` | #b85450 |
| 取消按钮背景 | 默认 | `--bg-elevated` | #ffffff |
| 取消按钮背景 | Hover | `--bg-hover` | #f5f0e8 |
| 取消按钮文字 | 默认 | `--text-primary` | #5a4a3a |
| 创建按钮背景 | 默认 | `--primary` | #a0522d |
| 创建按钮背景 | Hover | `--primary-hover` | #b8633a |
| 创建按钮背景 | Active | `--primary-active` | #8b4513 |
| 创建按钮文字 | 默认 | `--text-inverse` | #faf6f0 |

### 尺寸规范

| 元素 | 尺寸 | 说明 |
|------|------|------|
| Dialog 宽度 | 480px | 固定宽度 |
| Dialog 最小高度 | 380px | 根据内容自适应 |
| 标题栏高度 | 48px | 固定高度 |
| 操作栏高度 | 56px | 固定高度 |
| Dialog 内边距 | 24px | `--spacing-xl` |
| 输入框高度 | 36px | 固定高度 |
| 输入框内边距 | 8px 12px | `--spacing-sm` `--spacing-md` |
| 文本域最小高度 | 80px | 可调整 |
| 按钮高度 | 36px | 固定高度 |
| 按钮内边距 | 0 24px | 左右内边距 |

### 字体规范

| 元素 | 字体大小 | 字重 | 颜色 |
|------|----------|------|------|
| 标题 | 16px (`--font-xl`) | 600 (Semibold) | `--text-primary` |
| 标签 | 13px (`--font-base`) | 500 (Medium) | `--text-primary` |
| 输入框文字 | 13px (`--font-base`) | 400 (Regular) | `--text-primary` |
| 占位符 | 13px (`--font-base`) | 400 (Regular) | `--text-tertiary` |
| 错误提示 | 12px (`--font-sm`) | 400 (Regular) | `--danger` |
| 按钮文字 | 13px (`--font-base`) | 500 (Medium) | 视状态而定 |

### 间距规范

| 位置 | 间距 | 变量 |
|------|------|------|
| Dialog 内边距 | 24px | `--spacing-xl` |
| 标题与表单 | 24px | `--spacing-xl` |
| 表单组之间 | 16px | `--spacing-lg` |
| 标签与输入框 | 8px | `--spacing-sm` |
| 输入框与错误提示 | 4px | `--spacing-xs` |
| 表单与操作栏 | 24px | `--spacing-xl` |
| 按钮之间 | 12px | `--spacing-md` |

### 圆角规范

| 元素 | 圆角 | 变量 |
|------|------|------|
| Dialog | 8px | `--radius-lg` |
| 输入框 | 6px | `--radius-base` |
| 按钮 | 6px | `--radius-base` |
| 错误提示 | 4px | `--radius-sm` |

### 阴影规范

| 元素 | 阴影 | 变量 |
|------|------|------|
| Dialog | 0 4px 16px rgba(0, 0, 0, 0.12) | `--shadow-lg` |
| 按钮 Hover | 0 1px 2px rgba(0, 0, 0, 0.05) | `--shadow-sm` |
| 输入框 Focus | 0 1px 2px rgba(0, 0, 0, 0.05) | `--shadow-sm` |

### 动画规范

| 动画 | 时长 | 缓动函数 |
|------|------|----------|
| Backdrop 淡入/淡出 | 0.15s | `ease` |
| Dialog 弹出/收起 | 0.15s | `cubic-bezier(0.25, 1, 0.5, 1)` |
| 按钮颜色变化 | 0.1s | `ease` |
| 输入框边框变化 | 0.1s | `ease` |
| 错误提示显示 | 0.1s | `ease` |

---

## 🎭 交互流程

### 1. 打开 Dialog
- 用户点击 "+" 按钮
- 按钮产生微缩放效果 (scale: 0.95 → 1.0)
- 按钮颜色从 `--primary` 过渡到 `--primary-active`
- Dialog 弹出，Backdrop 淡入
- 自动聚焦到"看板名称"输入框

### 2. 表单输入
- 用户输入看板名称（必填）
- 用户输入描述（可选）
- 输入框获得焦点时，边框变为 `--border-focus`，显示阴影
- 输入框失去焦点时，边框恢复为 `--border-base`

### 3. 表单验证
- 点击"创建看板"按钮时验证
- 看板名称为空时，显示错误提示："请输入看板名称"
- 错误提示显示在输入框下方，红色文字

### 4. 提交中
- 按钮文字变为"创建中..."
- 按钮显示加载图标（旋转动画）
- 按钮禁用，不可点击
- 背景颜色变为 `--primary-hover`

### 5. 创建成功
- 关闭 Dialog
- 显示 Toast 提示："看板创建成功"
- 跳转到新看板页面

### 6. 创建失败
- 保持 Dialog 打开状态
- 显示错误提示
- 按钮恢复为可点击状态

### 7. 关闭 Dialog
- 用户点击右上角 × 按钮
- 或点击取消按钮
- 或点击 Backdrop 区域
- 或按 ESC 键
- Dialog 淡出并收起
- 焦点返回到触发按钮

---

## ♿ 可访问性

### 键盘导航
- Tab 键：在输入框和按钮之间切换焦点
- Shift + Tab：反向切换焦点
- Enter 键：在输入框中提交表单
- ESC 键：关闭 Dialog

### 焦点管理
- Dialog 打开时，自动聚焦到"看板名称"输入框
- Dialog 关闭时，焦点返回到触发按钮
- 焦点可见性：使用 `--border-focus` 高亮显示

### 屏幕阅读器
- Dialog 标题：`role="dialog"`, `aria-labelledby="dialog-title"`
- 输入框：`aria-required="true"`, `aria-describedby="name-error"`
- 错误提示：`role="alert"`, `aria-live="polite"`
- 按钮：`aria-label` 描述按钮功能

### 减少动画
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 📝 技术实现要点

### 组件状态管理
```typescript
const [name, setName] = useState("");
const [description, setDescription] = useState("");
const [isSubmitting, setIsSubmitting] = useState(false);
const [error, setError] = useState<string | undefined>();
```

### 表单验证
```typescript
const validateForm = (): boolean => {
  if (!name.trim()) {
    setError("请输入看板名称");
    return false;
  }
  return true;
};
```

### 提交逻辑
```typescript
const handleSubmit = () => {
  setError(undefined);
  if (!validateForm()) return;

  setIsSubmitting(true);
  createDashboard(
    { name, description: description || undefined },
    {
      onSuccess: (data) => {
        setIsSubmitting(false);
        onSuccess(data.id);
      },
      onError: (err) => {
        setIsSubmitting(false);
        setError(err.message || "创建失败，请稍后重试");
      },
    }
  );
};
```

### Toast 提示
```typescript
import { toast } from "sonner";

toast.success("看板创建成功");
toast.error("创建失败，请稍后重试");
```

---

## ✅ 验收标准

1. **功能完整性**
   - Dialog 可以正常打开和关闭
   - 表单验证正常工作
   - 创建看板功能正常
   - 创建成功后跳转到新看板页面
   - Toast 提示正常显示

2. **视觉一致性**
   - Dialog 样式与设计规范一致
   - 颜色、字体、间距符合设计系统
   - 动画效果流畅自然

3. **交互体验**
   - 所有交互状态都有反馈
   - 键盘导航正常工作
   - 焦点管理正确
   - 错误提示清晰明确

4. **代码质量**
   - 代码结构清晰
   - 组件职责单一
   - 样式模块化
   - 无 TypeScript 错误

5. **可访问性**
   - 支持键盘导航
   - 屏幕阅读器友好
   - 支持减少动画偏好设置

---

## 📦 文件清单

### 新建文件
1. `d:\Program\projects\seedar\apps\web-client\src\modules\dashboard\components\aside\CreateDashboardDialog.tsx`
2. `d:\Program\projects\seedar\apps\web-client\src\modules\dashboard\components\aside\CreateDashboardDialog.module.scss`

### 修改文件
1. `d:\Program\projects\seedar\apps\web-client\src\modules\dashboard\components\aside\DashboardAside.tsx`
2. `d:\Program\projects\seedar\apps\web-client\src\modules\dashboard\components\aside\index.ts`

---

## 🔍 参考文件

- `d:\Program\projects\seedar\apps\web-client\src\modules\panel\components\metricEditor\metricEditorDialog.tsx` - Dialog 组件参考
- `d:\Program\projects\seedar\apps\web-client\src\modules\panel\components\metricEditor\metricEditorDialog.module.scss` - 样式参考
- `d:\Program\projects\seedar\apps\web-client\src\core\assets\styles\global.variable.scss` - 设计系统变量
- `d:\Program\projects\seedar\apps\web-client\src\App.tsx` - Toast 组件配置
