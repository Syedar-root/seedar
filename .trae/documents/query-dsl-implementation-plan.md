# QueryDSL 重定义与转换实现计划

## 任务分解与优先级

### [ ] 任务 1: 重新定义 QueryDSL 接口
- **优先级**: P0
- **依赖关系**: 无
- **描述**:
  - 移除对 MinimalDSL 的依赖，不再继承自该接口
  - 使用 ID 引用 dataset 模块中的实体，包括表、字段、指标和连接
  - 定义新的接口结构，包含以下字段：
    - datasetId: 数据集 ID
    - tableId: 主表 ID
    - dimensions: 维度数组，每个维度使用字段 ID 引用
    - metrics: 指标数组，每个指标使用指标 ID 引用
    - filters: 筛选条件数组，每个条件使用字段 ID 引用
    - joins: 连接数组，每个连接使用连接 ID 引用
- **成功标准**:
  - QueryDSL 接口不再继承自 MinimalDSL
  - 所有字段都使用 ID 进行引用，符合 dataset 模块的实体结构
  - 接口结构清晰，字段命名合理
  - 接口定义语法正确，无类型错误
- **测试要求**:
  - `programmatic` TR-1.1: 接口定义语法正确，无类型错误
  - `human-judgement` TR-1.2: 接口结构合理，字段命名清晰，符合 dataset 模块的实体结构
- **注意事项**:
  - 确保新接口与 dataset 模块的实体结构保持一致
  - 考虑到 dataset 服务返回的数据格式，确保接口字段与返回数据匹配

### [ ] 任务 2: 修改 DSLTransformer 类的 transform 方法
- **优先级**: P0
- **依赖关系**: 任务 1
- **描述**:
  - 修改 transform 方法的参数，添加 dataset 信息参数（包含表、字段、指标等信息）
  - 实现从 ID 到实际实体的映射逻辑：
    - 表映射：根据 tableId 找到对应的表名
    - 字段映射：根据 fieldId 找到对应的字段名和所属表
    - 指标映射：根据 metricId 找到对应的指标定义
    - 连接映射：根据 joinId 找到对应的连接定义
  - 构建符合 metric-engine 要求的 DSL：
    - 转换维度：将字段 ID 转换为字段名
    - 转换指标：根据指标类型和配置构建指标定义
    - 转换筛选条件：将字段 ID 转换为字段名
    - 转换连接：根据连接 ID 构建连接定义
  - 使用 parseMinimalDslToQuery 方法生成 MetricQuery
- **成功标准**:
  - transform 方法能够接受新的 QueryDSL 格式和 dataset 信息参数
  - 能够正确根据 ID 查询对应的实体
  - 能够构建出符合 metric-engine 要求的 DSL
  - 能够生成并返回有效的 MetricQuery
  - 能够处理各种类型的指标和维度
- **测试要求**:
  - `programmatic` TR-2.1: 方法参数类型正确，无类型错误
  - `programmatic` TR-2.2: 能够处理各种类型的指标（聚合、行级、后聚合、算术运算）
  - `programmatic` TR-2.3: 能够处理各种类型的维度和筛选条件
  - `human-judgement` TR-2.4: 代码逻辑清晰，易于理解和维护
- **注意事项**:
  - 确保处理好各种边界情况，如字段或指标不存在的情况
  - 确保生成的 DSL 符合 metric-engine 的要求
  - 考虑到 dataset 服务返回的数据格式，确保映射逻辑正确

### [ ] 任务 3: 测试与验证
- **优先级**: P1
- **依赖关系**: 任务 2
- **描述**:
  - 编写测试用例，验证新的 QueryDSL 和 transform 方法
  - 测试各种类型的查询场景：
    - 基本查询：包含维度和聚合指标
    - 复杂查询：包含多个指标、筛选条件和连接
    - 特殊指标：包含行级指标、后聚合指标和算术运算指标
  - 确保生成的 MetricQuery 能够正确执行
- **成功标准**:
  - 所有测试用例通过
  - 能够处理复杂的查询场景
  - 生成的 MetricQuery 能够正确执行
  - 测试覆盖各种场景，包括边界情况
- **测试要求**:
  - `programmatic` TR-3.1: 所有测试用例通过，无错误
  - `human-judgement` TR-3.2: 测试覆盖各种场景，包括边界情况
  - `human-judgement` TR-3.3: 测试用例设计合理，能够验证核心功能
- **注意事项**:
  - 测试时需要确保 dataset 服务能够返回正确的实体信息
  - 模拟不同的 dataset 数据，测试各种场景

## 实现细节

### 新的 QueryDSL 接口结构

```typescript
export interface QueryDSL {
  /** 数据集ID */
  datasetId: number;
  /** 主表ID */
  tableId: number;
  /** 维度 - 使用字段ID引用 */
  dimensions?: Array<number | { fieldId: number; alias?: string }>;
  /** 指标 - 使用指标ID引用 */
  metrics?: Array<{
    id: number;
    alias?: string;
  }>;
  /** 筛选条件 */
  filters?: Array<{
    fieldId: number;
    op: string;
    value?: any;
    raw?: boolean;
  }>;
  /** 连接 - 使用表ID引用 */
  joins?: Array<{
    id: number;
    type?: 'left' | 'inner' | 'right' | 'full';
  }>;
}
```

### 转换逻辑详细步骤

1. **获取数据集信息**:
   - 根据 datasetId 获取数据集的详细信息，包括表、字段、指标等
   - 构建表、字段、指标和连接的映射表，方便后续查找

2. **构建表映射**:
   - 根据 tableId 找到对应的表名
   - 确保表存在，否则抛出错误

3. **构建维度**:
   - 遍历 dimensions 数组
   - 对于每个维度，根据 fieldId 找到对应的字段名和所属表
   - 构建维度对象，包含字段名和别名

4. **构建指标**:
   - 遍历 metrics 数组
   - 对于每个指标，根据 id 找到对应的指标定义
   - 根据指标类型（聚合、行级、后聚合、算术运算）构建不同的指标对象
   - 处理指标的各种配置，如聚合函数、表达式等

5. **构建筛选条件**:
   - 遍历 filters 数组
   - 对于每个筛选条件，根据 fieldId 找到对应的字段名和所属表
   - 构建筛选条件对象，包含字段名、操作符和值

6. **构建连接**:
   - 遍历 joins 数组
   - 对于每个连接，根据 id 找到对应的连接定义
   - 构建连接对象，包含表名、连接类型和连接条件

7. **生成 DSL**:
   - 构建符合 metric-engine 要求的 DSL 对象
   - 包含表名、维度、指标、筛选条件和连接

8. **生成 MetricQuery**:
   - 使用 parseMinimalDslToQuery 方法生成 MetricQuery
   - 返回生成的 MetricQuery

### 数据结构映射

| QueryDSL 字段 | dataset 服务返回字段 | metric-engine DSL 字段 |
|--------------|---------------------|-----------------------|
| datasetId    | id                  | N/A                   |
| tableId      | tables[].id         | table                 |
| dimensions[].fieldId | fields[].id     | dimensions[].field    |
| metrics[].id | metrics[].id        | metrics[]             |
| filters[].fieldId | fields[].id     | filters[].field       |
| joins[].id   | joins[].id          | joins[]               |

### 注意事项

- 确保处理好各种边界情况，如字段或指标不存在的情况
- 确保生成的 DSL 符合 metric-engine 的要求
- 确保转换逻辑清晰，易于理解和维护
- 考虑到 dataset 服务返回的数据格式，确保映射逻辑正确
- 测试时需要模拟不同的 dataset 数据，测试各种场景
