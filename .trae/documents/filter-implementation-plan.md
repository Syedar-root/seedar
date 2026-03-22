# 字段筛选功能实现计划

## 概述
为 QueryZone 的筛选区域实现完整的字段筛选功能，支持操作符选择和值输入。

## 实现步骤

### 1. 类型定义
**文件**: `apps/web-client/src/modules/panel/components/queryZone/types.ts` (新建)

- 定义 `FilterItem` 接口
- 定义 `OPERATORS_BY_TYPE` 操作符映射（按字段类型）
- 导出相关类型

### 2. 状态管理扩展
**文件**: `apps/web-client/src/modules/panel/hooks/usePanelEditorState.ts`

- 新增 `dropFilters: FilterItem[]` 状态
- 新增 `handleDropFilter` 函数 - 添加筛选项
- 新增 `handleRemoveFilter` 函数 - 移除筛选项
- 新增 `handleUpdateFilter` 函数 - 更新筛选条件（操作符、值）
- 从 `queryData.dsl.filters` 初始化筛选状态

### 3. 筛选项组件
**文件**: `apps/web-client/src/modules/panel/components/queryZone/filterItem.tsx` (新建)

- 渲染筛选项：名称、操作符下拉、值输入、删除按钮
- 根据字段类型动态显示操作符选项
- 根据字段类型切换值输入组件：
  - STRING/NUMBER/DECIMAL → Input 输入框
  - DATE/DATETIME → DatePicker 日期选择器
  - BOOLEAN → Select 下拉选择
- 处理特殊操作符（is_null/is_not_null 不需要值输入）

### 4. QueryZone 组件修改
**文件**: `apps/web-client/src/modules/panel/components/queryZone/queryZone.tsx`

- Props 新增：`onDropFilter`, `onRemoveFilter`, `onUpdateFilter`, `dropFilters`
- 修复筛选区域：使用正确的 `dropFilters` 数据源和回调函数
- 渲染 `FilterItem` 组件列表

### 5. 数据提交
**文件**: `apps/web-client/src/modules/panel/hooks/usePanelActions.ts`

- 在 `handleSave` 中将 `dropFilters` 转换为 DSL filters 格式
- 格式：`{ fieldId: number, op: string, value?: any }`

### 6. 父组件集成
**文件**: `apps/web-client/src/modules/panel/pages/panelEditor/panelEditor.tsx`

- 传递新的 props 到 QueryZone 组件
- 确保状态正确流转

## 文件变更清单

| 文件 | 操作 |
|------|------|
| `components/queryZone/types.ts` | 新建 |
| `components/queryZone/filterItem.tsx` | 新建 |
| `components/queryZone/queryZone.tsx` | 修改 |
| `hooks/usePanelEditorState.ts` | 修改 |
| `hooks/usePanelActions.ts` | 修改 |
| `pages/panelEditor/panelEditor.tsx` | 修改 |

## 数据流

```
用户拖拽字段到筛选区
    ↓
handleDropFilter (创建 FilterItem，默认操作符 '=')
    ↓
FilterItem 组件渲染
    ↓
用户选择操作符/输入值
    ↓
handleUpdateFilter (更新 FilterItem)
    ↓
用户保存面板
    ↓
dropFilters → DSL filters 格式 → 后端
```
