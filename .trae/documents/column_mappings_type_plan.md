# ColumnMappings 类型定义实现计划

## 任务分解和优先级

### [ ] 任务 1: 定义 ColumnMapping 接口
- **优先级**: P0
- **依赖**: 无
- **描述**:
  - 在 `knex-sql-generator.ts` 文件中定义一个 `ColumnMapping` 接口
  - 该接口应包含所有 columnMappings 中对象的属性，包括 businessName
- **成功标准**:
  - 接口定义完整，包含所有必要的属性
  - 类型定义准确反映代码中的使用情况
- **测试要求**:
  - `programmatic` TR-1.1: 代码编译通过，无类型错误
  - `human-judgement` TR-1.2: 接口定义清晰，符合 TypeScript 最佳实践
- **注意**:
  - 接口需要处理两种类型的映射：维度(dimension)和指标(metric)
  - 维度映射包含 field 属性，指标映射包含 metric 属性
  - 需要包含 businessName 属性，因为 header 应该使用 businessName

### [ ] 任务 2: 更新 generateSelect 方法的返回类型
- **优先级**: P0
- **依赖**: 任务 1
- **描述**:
  - 将 `generateSelect` 方法返回类型中的 `columnMappings: any[]` 改为 `columnMappings: ColumnMapping[]`
- **成功标准**:
  - 方法返回类型已更新
  - 代码编译通过，无类型错误
- **测试要求**:
  - `programmatic` TR-2.1: 代码编译通过，无类型错误
  - `programmatic` TR-2.2: 所有使用该方法的地方都能正确处理返回的 columnMappings

### [ ] 任务 3: 更新 buildSelectItems 方法的返回类型
- **优先级**: P0
- **依赖**: 任务 1
- **描述**:
  - 将 `buildSelectItems` 方法返回类型中的 `columnMappings: any[]` 改为 `columnMappings: ColumnMapping[]`
- **成功标准**:
  - 方法返回类型已更新
  - 代码编译通过，无类型错误
- **测试要求**:
  - `programmatic` TR-3.1: 代码编译通过，无类型错误

### [ ] 任务 4: 更新其他使用 columnMappings 的地方
- **优先级**: P0
- **依赖**: 任务 1
- **描述**:
  - 检查代码中其他使用 columnMappings 的地方，确保类型一致
  - 特别是 innerColumnMappings 和 outerColumnMappings 变量的类型
  - 确保在构建 columnMappings 时添加 businessName 属性
  - 确保 query.service.ts 中使用 columnMappings 的地方能够正确处理类型
- **成功标准**:
  - 所有使用 columnMappings 的地方都使用了正确的类型
  - 代码编译通过，无类型错误
  - ESLint 错误已解决
- **测试要求**:
  - `programmatic` TR-4.1: 代码编译通过，无类型错误
  - `programmatic` TR-4.2: ESLint 检查通过，无类型安全错误

### [ ] 任务 5: 更新 query.service.ts 使用 businessName 生成 header
- **优先级**: P0
- **依赖**: 任务 1-4
- **描述**:
  - 修改 query.service.ts 中的代码，使用 businessName 而不是 displayName 生成 header
  - 确保在 businessName 不存在时使用 displayName 作为 fallback
- **成功标准**:
  - header 现在使用 businessName 生成
  - 代码编译通过，无类型错误
- **测试要求**:
  - `programmatic` TR-5.1: 代码编译通过，无类型错误
  - `human-judgement` TR-5.2: header 生成逻辑正确，优先使用 businessName

### [ ] 任务 6: 验证类型定义的正确性
- **优先级**: P1
- **依赖**: 任务 1-5
- **描述**:
  - 运行类型检查，确保所有类型定义正确
  - 运行 ESLint 检查，确保无类型安全错误
  - 确保代码能够正常编译
- **成功标准**:
  - 类型检查通过，无类型错误
  - ESLint 检查通过，无类型安全错误
  - 代码编译成功
- **测试要求**:
  - `programmatic` TR-6.1: 运行 `tsc --noEmit` 无错误
  - `programmatic` TR-6.2: 运行 `eslint` 无类型安全错误
  - `programmatic` TR-6.3: 项目构建成功

## 类型定义设计

### ColumnMapping 接口

```typescript
interface ColumnMapping {
  alias: string;
  type: 'dimension' | 'metric';
  field?: Field;
  metric?: Metric;
  originalName: string;
  displayName: string;
  businessName?: string;
}
```

### 说明
- `alias`: 列的别名，如 "column_1"
- `type`: 列的类型，只能是 "dimension" 或 "metric"
- `field`: 当类型为 "dimension" 时存在，是 Field 类型
- `metric`: 当类型为 "metric" 时存在，是 Metric 类型
- `originalName`: 原始名称，如字段名或指标名
- `displayName`: 显示名称，如别名或原始名称
- `businessName`: 业务名称，从 field 或 metric 中获取，用于生成 header

## 实现步骤

1. 在 `knex-sql-generator.ts` 文件顶部定义 ColumnMapping 接口
2. 更新 `generateSelect` 方法的返回类型
3. 更新 `buildSelectItems` 方法的返回类型
4. 更新 `innerColumnMappings` 和 `outerColumnMappings` 变量的类型
5. 确保在构建 columnMappings 时添加 businessName 属性
6. 修改 query.service.ts 中的代码，使用 businessName 而不是 displayName 生成 header
7. 运行类型检查和 ESLint 检查
8. 验证代码编译成功

## 预期成果

- 代码中不再使用 `any[]` 类型来表示 columnMappings
- 所有 columnMappings 相关的类型都已明确定义
- 代码编译通过，无类型错误
- ESLint 检查通过，无类型安全错误
- 类型定义准确反映了 columnMappings 的实际结构
- ColumnMapping 接口包含 businessName 属性
- header 现在使用 businessName 生成，当 businessName 不存在时使用 displayName 作为 fallback