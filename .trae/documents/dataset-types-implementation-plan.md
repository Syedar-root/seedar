# 数据集类型定义与使用实现计划

## 任务分解与优先级

### [ ] 任务 1: 在 dataset.types.ts 中定义数据集返回类型
- **优先级**: P0
- **依赖关系**: 无
- **描述**:
  - 定义数据集返回类型 DatasetResponse
  - 定义表返回类型 DatasetTableResponse
  - 定义字段返回类型 DatasetFieldResponse
  - 定义指标返回类型 DatasetMetricResponse
  - 定义数据源返回类型 DatasourceResponse
  - 定义主表返回类型 MainTableResponse
- **成功标准**:
  - 所有类型定义正确，无语法错误
  - 类型结构与 transformDataset 方法返回的结构一致
  - 类型引用了现有的枚举类型
- **测试要求**:
  - `programmatic` TR-1.1: 类型定义语法正确，无类型错误
  - `human-judgement` TR-1.2: 类型结构合理，字段命名清晰
- **注意事项**:
  - 确保类型结构与 transformDataset 方法返回的结构完全一致
  - 确保使用现有的枚举类型

### [ ] 任务 2: 在 dataset.service.ts 中使用新定义的类型
- **优先级**: P0
- **依赖关系**: 任务 1
- **描述**:
  - 导入新定义的类型
  - 为 findOne 方法添加返回类型
  - 为 transformDataset 方法添加返回类型
  - 为 transformMetric 方法添加返回类型
- **成功标准**:
  - 方法返回类型正确，无类型错误
  - 类型使用符合 TypeScript 语法
- **测试要求**:
  - `programmatic` TR-2.1: 方法返回类型正确，无类型错误
  - `human-judgement` TR-2.2: 代码逻辑清晰，类型使用合理
- **注意事项**:
  - 确保方法返回类型与实际返回值一致
  - 确保导入路径正确

### [ ] 任务 3: 在 dsl-transformer.ts 中使用新定义的类型
- **优先级**: P0
- **依赖关系**: 任务 1
- **描述**:
  - 导入新定义的类型
  - 修改 transform 方法的 datasetInfo 参数类型
- **成功标准**:
  - 参数类型正确，无类型错误
  - 类型使用符合 TypeScript 语法
- **测试要求**:
  - `programmatic` TR-3.1: 参数类型正确，无类型错误
  - `human-judgement` TR-3.2: 代码逻辑清晰，类型使用合理
- **注意事项**:
  - 确保参数类型与实际传入的值一致
  - 确保导入路径正确

### [ ] 任务 4: 测试与验证
- **优先级**: P1
- **依赖关系**: 任务 2, 任务 3
- **描述**:
  - 运行 TypeScript 编译器，检查是否有类型错误
  - 确保所有类型使用正确
- **成功标准**:
  - TypeScript 编译通过，无类型错误
  - 类型使用符合预期
- **测试要求**:
  - `programmatic` TR-4.1: TypeScript 编译通过，无类型错误
  - `human-judgement` TR-4.2: 类型使用合理，代码清晰
- **注意事项**:
  - 确保所有类型引用正确
  - 确保所有方法返回类型正确

## 实现细节

### 类型定义结构

1. **DatasourceResponse**:
   - id: number
   - name: string
   - type: string

2. **MainTableResponse**:
   - id: number
   - tableName: string
   - datasetName: string

3. **DatasetTableResponse**:
   - id: number
   - datasourceTableId: number
   - tableName: string
   - datasetName: string
   - primaryFieldId: number

4. **DatasetFieldResponse**:
   - id: number
   - name: string
   - alias: string
   - type: FieldType
   - description: string
   - businessName: string
   - isPrimaryKey: boolean
   - tableId: number
   - tableName: string

5. **DatasetMetricResponse**:
   - id: number
   - name: string
   - alias: string
   - description: string
   - businessName: string
   - metricType: MetricType
   - dataSourceColumnId: number
   - dataSourceColumnName: string
   - aggregateFunction: MetricAggregateFunction
   - distinct: boolean
   - aggregateCondition: AggregateConditionConfig
   - leftOperand: number
   - leftOperandFieldName: string
   - rowOperator: MetricOperator
   - rightOperand: number
   - rightOperandFieldName: string
   - sourceMetricId: number
   - sourceMetricName: string
   - leftMetricId: number
   - leftMetricName: string
   - arithmeticOperator: MetricOperator
   - rightMetricOperand: number
   - rightMetricOperandFieldName: string
   - baseMetricId: number
   - baseMetricName: string
   - timeDataSourceColumnId: number
   - timeDataSourceColumnName: string
   - periodType: PeriodOverPeriodType
   - calculationMode: PeriodCalculationMode

6. **DatasetResponse**:
   - id: number
   - name: string
   - description: string
   - type: DatasetType
   - status: DatasetStatus
   - mainTableId: number
   - datasource: DatasourceResponse | null
   - mainTable: MainTableResponse | null
   - tables: DatasetTableResponse[]
   - fields: DatasetFieldResponse[]
   - metrics: DatasetMetricResponse[]

### 注意事项

- 确保所有类型定义与 transformDataset 和 transformMetric 方法返回的结构完全一致
- 确保使用现有的枚举类型
- 确保导入路径正确
- 确保所有方法返回类型正确
