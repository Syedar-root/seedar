# 数据源模块交互功能修复计划

## 一、任务概述

修复 `d:\Program\projects\seedar\apps\web-client\src\modules\datasource\` 模块中所有不可达或无效的交互功能，确保所有用户交互都能正常工作。

**排除项**：连接测试功能（CreateDatasourceDialog.tsx 中的 ConnectionTest 组件）

## 二、问题清单

### 问题 1：datasourcePage.tsx - 删除功能未实现
- **文件**：`datasourcePage.tsx`
- **位置**：第 36-38 行
- **当前状态**：`handleDelete` 函数只有 `console.log`，未实现实际删除逻辑
- **影响**：用户在列表页点击删除按钮无效
- **严重程度**：🔴 高

### 问题 2：datasourceDetailPage.tsx - 返回按钮无响应
- **文件**：`datasourceDetailPage.tsx`
- **位置**：第 86-89 行
- **当前状态**：返回按钮没有 `onClick` 处理函数
- **影响**：用户无法从详情页返回列表页
- **严重程度**：🔴 高

### 问题 3：DatasourceCard.tsx - 删除功能不可达
- **文件**：`datasourcePage.tsx`（调用方）
- **位置**：第 36-38 行
- **当前状态**：删除按钮调用父组件传入的 `onDelete` 回调，但该回调未实现
- **影响**：删除功能不可达
- **严重程度**：🔴 高

## 三、修复步骤

### 步骤 1：修复 datasourcePage.tsx 的删除功能

**文件**：`datasourcePage.tsx`

**操作**：
1. 导入 `useDeleteDatasource` hook
2. 导入 `DeleteConfirmDialog` 组件
3. 添加状态管理：`deleteDialogOpen`、`selectedDatasource`
4. 实现 `handleDelete` 函数，打开删除确认对话框
5. 实现 `handleDeleteDialogClose` 函数，关闭对话框
6. 实现 `handleDeleteSuccess` 函数，删除成功后刷新列表
7. 在组件底部添加 `DeleteConfirmDialog` 组件
8. 将 `handleDelete` 传递给 `DatasourceCard` 组件

**预期结果**：
- 用户点击删除按钮时，打开删除确认对话框
- 确认删除后，数据源被删除并从列表中移除

---

### 步骤 2：修复 datasourceDetailPage.tsx 的返回按钮

**文件**：`datasourceDetailPage.tsx`

**操作**：
1. 导入 `useNavigate` hook
2. 在组件内部调用 `const navigate = useNavigate()`
3. 为返回按钮添加 `onClick` 处理函数
4. 在点击时调用 `navigate('/datasource')` 返回列表页

**预期结果**：
- 用户点击返回按钮时，能够返回到数据源列表页

---

### 步骤 3：验证修复效果

**验证点**：
1. 在数据源列表页，点击任意数据源的"删除"按钮，确认删除对话框能够正常打开
2. 在删除确认对话框中，点击"确定删除"，数据源能够被成功删除并从列表中移除
3. 在数据源详情页，点击返回按钮，能够成功返回到数据源列表页
4. 删除功能在有数据集使用该数据源时，能够正确显示错误提示并阻止删除

---

## 四、技术细节

### 4.1 datasourcePage.tsx 修改内容

#### 需要添加的导入
```typescript
import { DeleteConfirmDialog } from "../components/DeleteConfirmDialog/DeleteConfirmDialog";
import { useDeleteDatasource } from "#pkg/seedar/ui-react";
```

#### 需要添加的状态
```typescript
const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
const [selectedDatasource, setSelectedDatasource] = useState<{
  id: number;
  name: string;
} | null>(null);
```

#### 需要实现的函数
```typescript
const handleDelete = (id: number) => {
  const datasource = datasources?.find(ds => ds.id === id);
  if (datasource) {
    setSelectedDatasource({
      id: datasource.id,
      name: datasource.name,
    });
    setDeleteDialogOpen(true);
  }
};

const handleDeleteDialogClose = () => {
  setDeleteDialogOpen(false);
  setSelectedDatasource(null);
};

const handleDeleteSuccess = () => {
  handleDeleteDialogClose();
};
```

#### 需要添加的组件
```typescript
{selectedDatasource && (
  <DeleteConfirmDialog
    open={deleteDialogOpen}
    onClose={handleDeleteDialogClose}
    datasourceId={selectedDatasource.id}
    datasourceName={selectedDatasource.name}
    onSuccess={handleDeleteSuccess}
  />
)}
```

#### 需要修改的 props 传递
```typescript
<DatasourceCard
  key={datasource.id}
  datasource={datasource}
  onViewDetails={handleViewDetails}
  onDelete={handleDelete}
/>
```

---

### 4.2 datasourceDetailPage.tsx 修改内容

#### 需要添加的导入
```typescript
import { useNavigate } from "react-router-dom";
```

#### 需要添加的 hook 调用
```typescript
const navigate = useNavigate();
```

#### 需要修改的返回按钮
```typescript
<button
  className={styles.backButton}
  onClick={() => navigate('/datasource')}
>
  <ArrowLeft size={16} />
</button>
```

---

## 五、验收标准

### 功能验收
- [ ] 数据源列表页的删除按钮能够打开删除确认对话框
- [ ] 删除确认对话框能够正确显示数据源名称
- [ ] 删除确认对话框能够正确检查数据源是否被使用
- [ ] 删除成功后，数据源能够从列表中移除
- [ ] 数据源详情页的返回按钮能够返回列表页
- [ ] 所有交互都有适当的加载状态和错误提示

### 代码质量验收
- [ ] 代码符合项目现有的代码风格
- [ ] 所有导入语句正确且无冗余
- [ ] 状态管理逻辑清晰
- [ ] 错误处理完善
- [ ] 无 TypeScript 类型错误

---

## 六、风险评估

### 低风险
- 修改仅涉及现有组件的逻辑补充
- 不涉及数据结构变更
- 不影响其他模块

### 注意事项
- 删除操作需要确保数据源未被使用
- 导航功能需要确保路由配置正确
- 状态管理需要避免内存泄漏

---

## 七、实施顺序

1. **优先级 P0**：修复 datasourceDetailPage.tsx 的返回按钮（影响用户导航体验）
2. **优先级 P0**：修复 datasourcePage.tsx 的删除功能（影响核心业务功能）
3. **验证**：对所有修复的功能进行完整测试

---

## 八、预计工作量

- datasourceDetailPage.tsx 修改：5 分钟
- datasourcePage.tsx 修改：15 分钟
- 测试验证：10 分钟
- **总计**：约 30 分钟
