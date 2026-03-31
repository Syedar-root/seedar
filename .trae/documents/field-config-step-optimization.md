# 字段配置步骤优化实施计划

## 📋 任务概述
优化 `FieldConfigStep` 组件，使其能够：
1. 渲染已选表的真实字段（从 `selectedDatasource` 获取）
2. 将所有表的主键字段和 join 关联字段设为必选（锁定）
3. 锁定字段不可被取消选择

## 🔑 关键决策
- **字段ID格式**：直接使用 `columnId`（从 `DatasourceResponse` 中获取）
- **锁定字段类型**：
  1. 所有表的主键字段（`column.isPrimaryKey === true`）
  2. Join 关联字段（`join.leftField` 和 `join.rightField`）
  3. 指标引用字段

---

## 📝 详细任务列表

### 阶段1：准备工作（并行执行）

#### 任务1.1：分析现有代码结构
- **描述**：深入分析 `FieldConfigStep.tsx`、`useDatasetForm.ts`、`DatasetEditorPage.tsx` 的代码结构
- **目标**：确认所有需要修改的位置和依赖关系
- **输出**：代码结构分析报告
- **依赖**：无
- **执行方式**：使用 search subagent

#### 任务1.2：分析数据流和类型定义
- **描述**：分析 `DatasourceResponse`、`DatasetFormData`、`JoinConfig` 等类型定义
- **目标**：确认字段ID生成规则和数据映射关系
- **输出**：数据流分析报告
- **依赖**：无
- **执行方式**：使用 search subagent

---

### 阶段2：核心逻辑修改（串行执行，有依赖）

#### 任务2.1：修改 `useDatasetForm.ts` 的 `getLockedFields()` 函数
- **描述**：
  - 修改函数签名，新增 `selectedDatasource?: DatasourceResponse` 参数
  - 添加主键字段锁定逻辑：
    - 遍历 `formData.tables`
    - 在 `selectedDatasource.tables` 中找到对应的表（通过 `tableName` 匹配）
    - 遍历该表的 `columns`
    - 如果 `column.isPrimaryKey === true`，将 `column.columnId.toString()` 加入 `lockedFields`
  - 修改 join 字段锁定逻辑，使用 `columnId` 格式
  - 保持指标引用字段锁定逻辑不变
- **目标**：正确计算所有需要锁定的字段
- **输出**：更新后的 `getLockedFields()` 函数
- **依赖**：任务1.2
- **文件**：`apps/web-client/src/modules/dataset/hooks/useDatasetForm.ts`

#### 任务2.2：修改 `useDatasetForm.ts` 的 `toggleField()` 函数
- **描述**：
  - 确保锁定字段不能被取消选择
  - 在 `toggleField()` 中，如果尝试取消锁定字段，直接返回，不做任何操作
- **目标**：防止用户取消锁定字段
- **输出**：更新后的 `toggleField()` 函数
- **依赖**：任务2.1
- **文件**：`apps/web-client/src/modules/dataset/hooks/useDatasetForm.ts`

#### 任务2.3：添加自动选中锁定字段的逻辑
- **描述**：
  - 在 `useDatasetForm.ts` 中添加 `useEffect`
  - 监听 `lockedFields` 的变化
  - 自动将所有锁定字段添加到 `formData.fields` 中（如果尚未选中）
- **目标**：确保锁定字段始终被选中
- **输出**：新增的 `useEffect` 逻辑
- **依赖**：任务2.1
- **文件**：`apps/web-client/src/modules/dataset/hooks/useDatasetForm.ts`

---

### 阶段3：组件修改（并行执行，依赖阶段2）

#### 任务3.1：修改 `FieldConfigStep.tsx` 的 props 接口
- **描述**：
  - 在 `FieldConfigStepProps` 接口中新增 `selectedDatasource?: DatasourceResponse` 参数
  - 导入 `DatasourceResponse` 类型
- **目标**：使组件能够接收数据源信息
- **输出**：更新后的 `FieldConfigStepProps` 接口
- **依赖**：任务1.2
- **文件**：`apps/web-client/src/modules/dataset/components/DatasetEditor/steps/FieldConfigStep/FieldConfigStep.tsx`

#### 任务3.2：重写 `FieldConfigStep.tsx` 的 `fieldsByTable` 逻辑
- **描述**：
  - 移除硬编码的模拟数据 `Array.from({ length: 5 }, ...)`
  - 从 `selectedDatasource` 获取真实字段数据：
    - 遍历 `formData.tables`
    - 在 `selectedDatasource.tables` 中找到对应的表（通过 `tableName` 匹配）
    - 获取该表的 `columns`
    - 转换为 `fields` 数组，每个 field 的 `id = column.columnId.toString()`
  - 处理 `selectedDatasource` 为空的情况（显示空状态或加载状态）
- **目标**：渲染真实的字段数据
- **输出**：更新后的 `fieldsByTable` 计算逻辑
- **依赖**：任务3.1
- **文件**：`apps/web-client/src/modules/dataset/components/DatasetEditor/steps/FieldConfigStep/FieldConfigStep.tsx`

#### 任务3.3：优化 `FieldConfigStep.tsx` 的字段显示
- **描述**：
  - 为字段添加主键标识（使用 `Key` 图标）
  - 在 `fieldName` 旁边显示 `isPrimaryKey` 标识（如果为主键）
  - 优化字段项的样式，使其更清晰
- **目标**：提升用户体验，清晰标识主键字段
- **输出**：优化后的字段渲染逻辑
- **依赖**：任务3.2
- **文件**：`apps/web-client/src/modules/dataset/components/DatasetEditor/steps/FieldConfigStep/FieldConfigStep.tsx`

#### 任务3.4：修改 `DatasetEditorPage.tsx` 传递数据源
- **描述**：
  - 在调用 `FieldConfigStep` 时，传入 `datasource` 参数
  - 从 `useDatasetEditorStore` 获取的 `datasource` 已经存在，直接传递即可
- **目标**：将数据源信息传递给 `FieldConfigStep`
- **输出**：更新后的 `FieldConfigStep` 调用
- **依赖**：任务1.1
- **文件**：`apps/web-client/src/modules/dataset/components/DatasetEditor/DatasetEditorPage.tsx`

#### 任务3.5：修改 `DatasetEditorPage.tsx` 传递数据源给 `getLockedFields()`
- **描述**：
  - 修改 `getLockedFields()` 的调用，传入 `datasource` 参数
  - 更新 `DatasetEditorPageProps` 接口，添加 `getLockedFields` 的参数类型
- **目标**：使 `getLockedFields()` 能够获取数据源信息
- **输出**：更新后的 `getLockedFields()` 调用
- **依赖**：任务2.1
- **文件**：`apps/web-client/src/modules/dataset/components/DatasetEditor/DatasetEditorPage.tsx`

---

### 阶段4：类型检查和代码质量（并行执行，依赖阶段3）

#### 任务4.1：运行 TypeScript 类型检查
- **描述**：
  - 运行 `npm run typecheck` 或类似的类型检查命令
  - 检查所有修改的文件是否有类型错误
  - 修复发现的类型错误
- **目标**：确保代码类型安全
- **输出**：类型检查结果和修复
- **依赖**：任务3.1, 3.2, 3.3, 3.4, 3.5
- **执行方式**：使用 RunCommand

#### 任务4.2：运行 Lint 检查
- **描述**：
  - 运行 `npm run lint` 或类似的 lint 检查命令
  - 检查所有修改的文件是否有代码风格问题
  - 修复发现的 lint 错误
- **目标**：确保代码质量
- **输出**：Lint 检查结果和修复
- **依赖**：任务3.1, 3.2, 3.3, 3.4, 3.5
- **执行方式**：使用 RunCommand

#### 任务4.3：检查 `DatasetEditorPageProps` 类型定义
- **描述**：
  - 检查 `DatasetEditorPageProps` 接口中的 `getLockedFields` 类型定义
  - 确保它与 `useDatasetForm` 返回的函数签名一致
  - 如果需要，更新类型定义
- **目标**：确保类型一致性
- **输出**：类型定义更新
- **依赖**：任务2.1
- **文件**：`apps/web-client/src/modules/dataset/components/DatasetEditor/DatasetEditorPage.tsx`

---

### 阶段5：测试验证（串行执行，依赖阶段4）

#### 任务5.1：功能测试 - 单表场景
- **描述**：
  - 测试单表场景下，主键字段是否正确锁定
  - 测试能否正常选择和取消非锁定字段
  - 测试锁定字段是否自动被选中
- **目标**：验证单表场景功能正常
- **输出**：测试结果
- **依赖**：任务4.1, 4.2, 4.3

#### 任务5.2：功能测试 - 多表场景
- **描述**：
  - 测试多表场景下，所有表的主键字段是否正确锁定
  - 测试 join 关联字段是否正确锁定
  - 测试能否正常选择和取消非锁定字段
- **目标**：验证多表场景功能正常
- **输出**：测试结果
- **依赖**：任务5.1

#### 任务5.3：功能测试 - 指标引用字段
- **描述**：
  - 测试指标引用字段是否正确锁定
  - 测试指标删除后，相关字段是否解锁
- **目标**：验证指标引用字段锁定功能正常
- **输出**：测试结果
- **依赖**：任务6.2

---

## 🔄 任务依赖关系图

```
阶段1（并行）
├── 任务1.1 ─────────────────────┐
└── 任务1.2 ─────────────────────┤
                                  ├──→ 阶段2（串行）
阶段2（串行）                      │
├── 任务2.1 ─────────────────────┤
├── 任务2.2 ─────────────────────┤
└── 任务2.3 ─────────────────────┤
                                  ├──→ 阶段3（并行）
阶段3（并行）                      │
├── 任务3.1 ─────────────────────┤
├── 任务3.2 ─────────────────────┤
├── 任务3.3 ─────────────────────┤
├── 任务3.4 ─────────────────────┤
└── 任务3.5 ─────────────────────┤
                                  ├──→ 阶段4（并行）
阶段4（并行）                      │
├── 任务4.1 ─────────────────────┤
├── 任务4.2 ─────────────────────┤
└── 任务4.3 ─────────────────────┤
                                  ├──→ 阶段5（串行）
阶段5（串行）                      │
├── 任务5.1 ─────────────────────┤
├── 任务5.2 ─────────────────────┤
└── 任务5.3 ─────────────────────┘
```

---

## 📦 并行执行策略

### 第一轮并行（阶段1）
- 使用 2 个 subagent 并行执行任务1.1和任务1.2

### 第二轮并行（阶段3）
- 使用 5 个 subagent 并行执行任务3.1、3.2、3.3、3.4、3.5

### 第三轮并行（阶段4）
- 使用 3 个 subagent 并行执行任务4.1、4.2、4.3

---

## ✅ 验收标准

1. ✅ `FieldConfigStep` 能够正确渲染已选表的真实字段
2. ✅ 所有表的主键字段都被锁定（显示锁图标，不可取消）
3. ✅ Join 关联字段都被锁定（显示锁图标，不可取消）
4. ✅ 指标引用字段都被锁定（显示锁图标，不可取消）
5. ✅ 锁定字段自动被选中，无法取消
6. ✅ 非锁定字段可以正常选择和取消
7. ✅ TypeScript 类型检查通过
8. ✅ Lint 检查通过
9. ✅ 单表和多表场景功能正常

---

## 📝 注意事项

1. **字段ID格式**：统一使用 `columnId.toString()`，不要混用其他格式
2. **空值处理**：`selectedDatasource` 可能为空，需要做好空值处理
3. **类型安全**：所有修改都要确保 TypeScript 类型正确
4. **向后兼容**：确保修改不会破坏现有功能
5. **性能优化**：避免不必要的重复计算
