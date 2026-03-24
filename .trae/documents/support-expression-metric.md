# 支持表达式指标实现计划

## 目标
在指标系统中添加统一的 `expression` 表达式字段，支持前端直接输入公式（如 `SUM(#10) * #100`），后端自动解析转换。

## 核心思路
- 保留现有指标类型机制不变，新增 `expression` 字段作为扩展
- 前端使用 `#ID` 格式引用字段和指标（如 `#10` 表示字段ID 10）
- 后端预处理时将 `#ID` 替换为实际名称，再交给 V2 引擎解析

## 实现步骤

### 步骤1: 扩展 DatasetMetric 实体
**文件**: `apps/server/src/module/dataset/entities/dataset-metric.entity.ts`
- 添加 `expression` 字段（varchar, nullable）

### 步骤2: 扩展 DTO 类型定义
**文件**: `apps/server/src/module/dataset/dto/update-dataset.req.ts`
- 在 `AddMetric` 和 `UpdateMetric` 类型中添加 `expression` 字段

### 步骤3: 扩展 metricManager.add() 验证逻辑
**文件**: `apps/server/src/module/dataset/services/helper/dataset.helper.ts`
- 添加 `parseExpressionIds()` 函数，解析 expression 中的 #ID
- 在 add 验证逻辑中处理 expression 的 ID 验证

### 步骤4: 扩展 DatasetMetricResponse 类型
**文件**: `apps/server/src/module/dataset/dataset.types.ts`
- 在 `DatasetMetricResponse` 接口中添加 `expression` 字段

### 步骤5: 更新 transformMetric 方法
**文件**: `apps/server/src/module/dataset/services/dataset.service.ts`
- 在 transformMetric 返回值中添加 expression 字段

### 步骤6: 更新 DSLTransformerV2 支持 expression
**文件**: `apps/server/src/module/query/dsl-transformer/dsl-transformer.v2.ts`
- 添加 `preprocessExpression()` 辅助函数，将 #ID 替换为实际名称
- 在 resolveMetric 中支持 expression 类型的指标

## 文件修改清单

| 文件 | 修改内容 |
|------|---------|
| `dataset-metric.entity.ts` | 添加 expression 字段 |
| `update-dataset.req.ts` | AddMetric/UpdateMetric 添加 expression |
| `dataset.types.ts` | DatasetMetricResponse 添加 expression |
| `dataset.service.ts` | transformMetric 返回 expression |
| `dataset.helper.ts` | 添加 parseExpressionIds 验证逻辑 |
| `dsl-transformer.v2.ts` | 添加 preprocessExpression 支持 expression 类型 |

## 预期结果

### 前端输入
```json
{
  "name": "折扣金额",
  "expression": "SUM(#10) * #100",
  "businessName": "折扣金额"
}
```

### 后端验证
- 解析 `#10` → 验证字段存在
- 解析 `#100` → 验证指标存在

### DSL转换
```
SUM(#10) * #100
    ↓ preprocessExpression
SUM(orders.amount) * total_revenue
    ↓ V2 ExprParser
生成 SQL
```

## 注意事项
- 不修改 metric_engine 包，保持其独立性
- 保持向后兼容，现有指标类型仍可用
- expression 字段优先级高于现有类型字段（如果同时存在，expression 优先）
