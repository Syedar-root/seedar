# EditableTitle 组件优化实施计划

## 📋 任务概述

将现有的简单文本编辑器升级为支持 4 种 title 类型的富文本编辑器，包括类型切换、实时预览和动态表单字段。

## 🎯 核心目标

- 支持 4 种 title 类型：`plain`、`flag`、`editorial`、`brutalist`
- 提供模态框编辑界面，包含类型选择、实时预览和动态表单
- 保持向后兼容性，支持旧的 `title` 字段
- 提供良好的用户体验和设计一致性

## 📁 涉及文件

### 需要修改的文件
1. `apps/web-client/src/modules/panel/components/editableTitle/editableTitle.tsx` - 主组件
2. `apps/web-client/src/modules/panel/components/editableTitle/editableTitle.module.scss` - 样式文件
3. `apps/web-client/src/modules/panel/components/editableTitle/index.ts` - 导出文件

### 需要创建的文件
4. `apps/web-client/src/modules/panel/components/editableTitle/types.ts` - 类型定义
5. `apps/web-client/src/modules/panel/components/editableTitle/TitleEditorDialog.tsx` - 编辑对话框组件
6. `apps/web-client/src/modules/panel/components/editableTitle/TitleEditorDialog.module.scss` - 对话框样式

### 需要更新的文件
7. `apps/web-client/src/modules/panel/hooks/usePanelEditorState.ts` - 添加 titleConfig 状态管理
8. `apps/web-client/src/modules/panel/hooks/usePanelActions.ts` - 更新保存逻辑
9. `apps/web-client/src/modules/panel/pages/panelPage.tsx` - 传递 titleConfig 到 EditableTitle

## 🔧 实施步骤

### 步骤 1：创建类型定义文件

**文件**: `apps/web-client/src/modules/panel/components/editableTitle/types.ts`

**内容**:
```typescript
import type { TitleType, TitleProps } from "#pkg/seedar/ui-react";

export interface TitleConfig {
  type: TitleType;
  content: string;
  flagColor?: string;
  subtitle?: string;
  accentText?: string;
  enableTooltip?: boolean;
  maxTitleWidth?: string;
}

export interface EditableTitleProps {
  title: string;
  titleConfig?: TitleConfig;
  onTitleChange: (title: string, titleConfig?: TitleConfig) => void;
}
```

**说明**: 定义 TitleConfig 接口，与 ui-react 包中的 Title 组件保持一致。

---

### 步骤 2：创建编辑对话框组件

**文件**: `apps/web-client/src/modules/panel/components/editableTitle/TitleEditorDialog.tsx`

**功能**:
- 使用 `@base-ui/react/dialog` 创建模态框
- 实现类型选择器（4 种类型单选按钮）
- 实现实时预览区域（使用现有的 Title 组件）
- 实现动态表单字段（根据类型显示/隐藏）
- 实现表单验证（content 必填）
- 实现保存和取消逻辑

**组件结构**:
```typescript
interface TitleEditorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (title: string, titleConfig: TitleConfig) => void;
  initialTitle: string;
  initialTitleConfig?: TitleConfig;
}

export const TitleEditorDialog: React.FC<TitleEditorDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  initialTitle,
  initialTitleConfig
}) => {
  // 状态管理
  const [config, setConfig] = useState<TitleConfig>(...);
  const [error, setError] = useState<string | undefined>();

  // 初始化逻辑
  useEffect(() => {
    if (isOpen) {
      setConfig(getInitialConfig(initialTitle, initialTitleConfig));
      setError(undefined);
    }
  }, [isOpen, initialTitle, initialTitleConfig]);

  // 类型切换处理
  const handleTypeChange = (newType: TitleType) => {
    setConfig(prev => ({
      ...prev,
      type: newType,
      // 清理不相关的字段
      flagColor: shouldKeepFlagColor(newType) ? prev.flagColor : undefined,
      subtitle: shouldKeepSubtitle(newType) ? prev.subtitle : undefined,
      accentText: newType === "editorial" ? prev.accentText : undefined,
    }));
  };

  // 表单字段更新处理
  const handleFieldChange = (field: keyof TitleConfig, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  // 验证和保存
  const handleSave = () => {
    if (!config.content.trim()) {
      setError("主标题不能为空");
      return;
    }
    onSave(config.content, config);
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Backdrop className={styles.backdrop} />
        <Dialog.Popup className={styles.popup}>
          {/* 对话框内容 */}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
```

**关键实现细节**:
- **类型选择器**: 使用 Radio Group 样式的单选按钮，4 个选项横向排列
- **实时预览**: 在表单上方显示预览区域，使用 `Title` 组件渲染当前配置
- **动态表单字段**:
  - `content`: 所有类型都显示（必填）
  - `flagColor`: 仅 `flag` 和 `brutalist` 类型显示，使用原生 `<input type="color">`
  - `subtitle`: 仅 `editorial` 和 `brutalist` 类型显示
  - `accentText`: 仅 `editorial` 类型显示
- **表单验证**: 只验证 `content` 字段是否为空
- **错误提示**: 在对话框底部显示错误信息

---

### 步骤 3：创建对话框样式文件

**文件**: `apps/web-client/src/modules/panel/components/editableTitle/TitleEditorDialog.module.scss`

**样式设计**:
- 参考 `metricEditorDialog.module.scss` 的设计风格
- 保持与现有对话框的一致性
- 预览区域使用虚线边框区分
- 类型选择器使用单选按钮样式
- 表单字段使用标准的输入框样式

**关键样式类**:
```scss
.backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
}

.popup {
  position: fixed;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  background: var(--bg-elevated);
  border-radius: var(--radius-lg);
  width: 600px;
  max-height: 85vh;
  overflow-y: auto;
  z-index: 1001;
}

.content {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.title {
  font-size: var(--font-xl);
  font-weight: 600;
  margin: 0;
  color: var(--text-primary);
}

.typeSelector {
  display: flex;
  gap: 16px;
  padding: 16px;
  background: var(--bg-base);
  border-radius: var(--radius-lg);
}

.typeOption {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.previewArea {
  padding: 24px;
  background: var(--bg-base);
  border: 2px dashed var(--border-base);
  border-radius: var(--radius-lg);
  min-height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.formGroup {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.label {
  font-size: var(--font-base);
  font-weight: 500;
  color: var(--text-primary);
}

.required {
  color: var(--danger);
}

.input {
  padding: 8px 12px;
  border: 1px solid var(--border-base);
  border-radius: var(--radius-base);
  font-size: var(--font-base);
  background: var(--bg-elevated);
  color: var(--text-primary);
}

.input:focus {
  outline: none;
  border-color: var(--border-focus);
}

.colorInput {
  width: 60px;
  height: 36px;
  padding: 2px;
  border: 1px solid var(--border-base);
  border-radius: var(--radius-base);
  cursor: pointer;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 8px;
}

.saveButton {
  padding: 8px 24px;
  background: var(--primary);
  color: var(--text-inverse);
  border: none;
  border-radius: var(--radius-base);
  cursor: pointer;
  font-size: var(--font-base);
  transition: background-color var(--transition-fast);
}

.saveButton:hover {
  background: var(--primary-hover);
}

.cancelButton {
  padding: 8px 24px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-base);
  border-radius: var(--radius-base);
  cursor: pointer;
  font-size: var(--font-base);
  color: var(--text-primary);
  transition: background-color var(--transition-fast);
}

.cancelButton:hover {
  background: var(--bg-hover);
}

.errorText {
  color: var(--danger);
  font-size: var(--font-sm);
}
```

---

### 步骤 4：重构 EditableTitle 主组件

**文件**: `apps/web-client/src/modules/panel/components/editableTitle/editableTitle.tsx`

**功能更新**:
- 导入新的 Title 组件和类型定义
- 更新 Props 接口，添加 `titleConfig` 参数
- 使用 Title 组件替代原来的简单文本显示
- 添加编辑对话框的集成
- 实现数据兼容性处理

**组件结构**:
```typescript
import React, { useState } from "react";
import { Pencil } from "lucide-react";
import { Title } from "#pkg/seedar/ui-react";
import { TitleEditorDialog } from "./TitleEditorDialog";
import { EditableTitleProps, TitleConfig } from "./types";
import styles from "./editableTitle.module.scss";

export const EditableTitle: React.FC<EditableTitleProps> = ({
  title,
  titleConfig,
  onTitleChange,
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // 获取当前显示的配置（兼容旧数据）
  const getCurrentConfig = (): TitleConfig => {
    if (titleConfig) {
      return titleConfig;
    }
    // 兼容旧数据：只有 title 字段的情况
    return {
      type: "plain",
      content: title,
    };
  };

  const currentConfig = getCurrentConfig();

  const handleEdit = () => {
    setIsDialogOpen(true);
  };

  const handleSave = (newTitle: string, newTitleConfig: TitleConfig) => {
    onTitleChange(newTitle, newTitleConfig);
    setIsDialogOpen(false);
  };

  const handleClose = () => {
    setIsDialogOpen(false);
  };

  return (
    <>
      <div className={styles.editableTitle}>
        <Title
          type={currentConfig.type}
          content={currentConfig.content}
          flagColor={currentConfig.flagColor}
          subtitle={currentConfig.subtitle}
          accentText={currentConfig.accentText}
          enableTooltip={currentConfig.enableTooltip}
          maxTitleWidth={currentConfig.maxTitleWidth}
        />
        <Pencil
          size={14}
          className={styles.editIcon}
          onClick={handleEdit}
        />
      </div>

      <TitleEditorDialog
        isOpen={isDialogOpen}
        onClose={handleClose}
        onSave={handleSave}
        initialTitle={title}
        initialTitleConfig={titleConfig}
      />
    </>
  );
};
```

**说明**:
- 移除了原来的内联编辑模式，改为使用对话框编辑
- 使用新的 Title 组件显示标题
- 保持数据兼容性，支持只有 `title` 字段的旧数据
- 铅笔图标点击打开编辑对话框

---

### 步骤 5：更新 EditableTitle 样式

**文件**: `apps/web-client/src/modules/panel/components/editableTitle/editableTitle.module.scss`

**样式更新**:
- 移除 `.input` 和 `.actionIcon` 样式（不再使用内联编辑）
- 保留 `.editableTitle`、`.title`、`.editIcon` 样式
- 调整样式以适应新的 Title 组件

**更新后的样式**:
```scss
.editableTitle {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.editIcon {
  cursor: pointer;
  transition:
    opacity var(--transition-slow),
    color var(--transition-slow);
  color: var(--text-secondary);

  &:hover {
    color: var(--primary);
  }
}
```

---

### 步骤 6：更新导出文件

**文件**: `apps/web-client/src/modules/panel/components/editableTitle/index.ts`

**内容**:
```typescript
export { EditableTitle } from "./editableTitle";
export type { EditableTitleProps, TitleConfig } from "./types";
```

---

### 步骤 7：更新 usePanelEditorState Hook

**文件**: `apps/web-client/src/modules/panel/hooks/usePanelEditorState.ts`

**更新内容**:
1. 导入 TitleConfig 类型
2. 添加 titleConfig 状态
3. 更新接口定义，添加 titleConfig 和 handleTitleConfigChange
4. 在 useEffect 中初始化 titleConfig
5. 添加 handleTitleConfigChange 回调

**具体修改**:
```typescript
// 在文件顶部导入
import type { TitleConfig } from "../components/editableTitle";

// 更新接口
interface UsePanelEditorStateReturn {
  // ... 现有字段
  title: string;
  titleConfig?: TitleConfig;
  handleTitleChange: (title: string, titleConfig?: TitleConfig) => void;
}

// 在组件内部添加状态
const [title, setTitle] = useState<string>("未命名面板");
const [titleConfig, setTitleConfig] = useState<TitleConfig | undefined>();

// 添加初始化 titleConfig 的 useEffect
useEffect(() => {
  if (panelData?.titleConfig) {
    setTitleConfig(panelData.titleConfig as TitleConfig);
  }
}, [panelData]);

// 更新 handleTitleChange
const handleTitleChange = useCallback((newTitle: string, newTitleConfig?: TitleConfig) => {
  setTitle(newTitle);
  if (newTitleConfig) {
    setTitleConfig(newTitleConfig);
  }
}, []);

// 更新返回值
return {
  // ... 现有返回值
  title,
  titleConfig,
  handleTitleChange,
};
```

---

### 步骤 8：更新 usePanelActions Hook

**文件**: `apps/web-client/src/modules/panel/hooks/usePanelActions.ts`

**更新内容**:
1. 导入 TitleConfig 类型
2. 更新接口参数，添加 titleConfig
3. 在 handleSave 和 handleSaveAs 中保存 titleConfig

**具体修改**:
```typescript
// 在文件顶部导入
import type { TitleConfig } from "../components/editableTitle";

// 更新接口
interface UsePanelActionsParams {
  // ... 现有参数
  title: string;
  titleConfig?: TitleConfig;
}

// 在 handleSave 中添加 titleConfig
const handleSave = useCallback(() => {
  if (!panelData || !panelId) return;

  const { panelType, config } = getPanelTypeAndConfig();
  const dsl = getQueryDsl(queryData?.dsl);

  updatePanel(
    {
      id: panelId,
      data: {
        title,
        titleConfig,
        type: panelType as any,
        config,
      },
    },
    {
      onSuccess: () => {
        updateQuery(
          {
            id: panelData?.queryId!,
            data: {
              dsl,
            },
          },
          {
            onSuccess: () => {
              handleRun();
              toast.success("保存成功");
            },
          },
        );
      },
    },
  );
}, [
  panelData,
  panelId,
  queryData,
  title,
  titleConfig,  // 添加到依赖数组
  getPanelTypeAndConfig,
  getQueryDsl,
  updateQuery,
  updatePanel,
  handleRun,
]);

// 在 handleSaveAs 中添加 titleConfig
const handleSaveAs = useCallback(() => {
  if (!panelData || !panelId) return;

  const dsl = getQueryDsl(queryData?.dsl);
  const { panelType, config } = getPanelTypeAndConfig();

  createQuery(
    {
      name: "未命名查询",
      datasetId: datasetData?.id!,
      dsl,
    },
    {
      onSuccess: (data) => {
        createPanel(
          {
            title: title || "未命名面板",
            titleConfig,  // 添加 titleConfig
            queryId: data.id,
            type: panelType as PanelType,
            config,
          },
          {
            onSuccess: (data) => {
              navigate(`/panel/${data.id}`);
              toast.success("另存为成功");
            },
          },
        );
      },
    },
  );
}, [
  panelData,
  panelId,
  datasetData,
  queryData,
  title,
  titleConfig,  // 添加到依赖数组
  getQueryDsl,
  getPanelTypeAndConfig,
  createQuery,
  createPanel,
  navigate,
]);
```

---

### 步骤 9：更新 PanelPage 组件

**文件**: `apps/web-client/src/modules/panel/pages/panelPage.tsx`

**更新内容**:
1. 从 usePanelEditorState 中解构 titleConfig
2. 将 titleConfig 传递给 EditableTitle 组件
3. 将 titleConfig 传递给 usePanelActions

**具体修改**:
```typescript
// 在 usePanelEditorState 解构中添加 titleConfig
const {
  dropFields,
  dropMetrics,
  dropFilters,
  displayType,
  editorConfig,
  tempData,
  panelData,
  queryData,
  datasetData,
  handleDropField,
  handleRemoveField,
  handleDropMetric,
  handleRemoveMetric,
  handleDropFilter,
  handleRemoveFilter,
  handleUpdateFilter,
  handleEditorChange,
  handleRun,
  title,
  titleConfig,  // 添加
  handleTitleChange,
} = usePanelEditorState(panelId);

// 更新 usePanelActions 调用
const { handleSave, handleSaveAs } = usePanelActions({
  panelId,
  panelData,
  queryData,
  datasetData,
  dropFields,
  dropMetrics,
  dropFilters,
  displayType,
  editorConfig,
  handleRun,
  navigate,
  title,
  titleConfig,  // 添加
});

// 更新 EditableTitle 组件调用
<EditableTitle
  title={title}
  titleConfig={titleConfig}
  onTitleChange={handleTitleChange}
/>
```

---

## ✅ 验收标准

### 功能完整性
- ✅ 点击铅笔图标能打开编辑对话框
- ✅ 对话框显示 4 种 title 类型选择器
- ✅ 类型切换时表单字段正确显示/隐藏
- ✅ 实时预览区域正确显示当前配置的 title 效果
- ✅ 表单验证正常工作（content 必填）
- ✅ 保存后 title 和 titleConfig 正确更新
- ✅ 取消操作不修改数据
- ✅ 兼容只有 `title` 字段的旧数据

### 设计质量
- ✅ 对话框样式与 MetricEditorDialog 保持一致
- ✅ 预览区域使用虚线边框清晰区分
- ✅ 类型选择器使用单选按钮样式
- ✅ 表单字段布局清晰，间距合理
- ✅ 颜色选择器使用原生 input，样式统一
- ✅ 错误提示显示在对话框底部

### 用户体验
- ✅ 编辑流程清晰直观
- ✅ 实时预览让用户立即看到效果
- ✅ 表单验证提示明确
- ✅ 键盘导航支持（Tab、Enter、Escape）
- ✅ 对话框打开时自动聚焦到第一个输入框
- ✅ 对话框关闭时清理状态

### 代码质量
- ✅ TypeScript 类型定义完整
- ✅ 组件职责清晰，可维护性好
- ✅ 代码风格与项目保持一致
- ✅ 无 lint 错误
- ✅ 无 TypeScript 类型错误

---

## 📝 注意事项

1. **向后兼容性**: 确保旧的 panel 数据（只有 `title` 字段）能正常显示和编辑
2. **默认值处理**: 新创建的 panel 默认使用 `plain` 类型
3. **表单验证**: 只验证 `content` 字段，其他字段都是可选的
4. **颜色选择器**: 使用原生 `<input type="color">`，简单可靠
5. **预览区域**: 使用虚线边框区分，不需要特殊背景
6. **状态管理**: 确保对话框状态正确管理，避免内存泄漏
7. **性能优化**: 使用 useCallback 和 useMemo 优化性能

---

## 🚀 后续优化建议

1. **移动端适配**: 如果需要支持移动端，可以考虑全屏模态框
2. **主题切换**: 支持深色/浅色主题切换
3. **快捷键**: 添加快捷键支持（如 Ctrl/Cmd + E 打开编辑）
4. **历史记录**: 保存编辑历史，支持撤销/重做
5. **预设模板**: 提供常用的 title 配置模板
