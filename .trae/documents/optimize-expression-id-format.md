# 优化表达式ID引用格式计划

## 背景
当前使用 `#ID` 格式需要假设ID范围来区分字段和指标（ID >= 100000为指标），不够明确。

## 新设计
使用 `#F` 和 `#M` 前缀明确区分：
- `#F10,20,30` → 字段ID列表
- `#M100,200` → 指标ID列表

### 示例
```
原始公式: SUM(price * quantity) - SUM(cost) * 0.8
优化后:   SUM(#F10) * #F20 - SUM(#M100) * 0.8

解析:
- #F10 = price (字段ID 10)
- #F20 = quantity (字段ID 20)
- #M100 = cost (指标ID 100)
```

## 实现步骤

### 步骤1: 更新 dataset.helper.ts 中的 parseExpressionIds 函数
**文件**: `apps/server/src/module/dataset/services/helper/dataset.helper.ts`
- 修改正则匹配 `#F` 和 `#M` 前缀
- 移除ID范围假设

### 步骤2: 更新 dsl-transformer.v2.ts 中的 preprocessExpression 函数
**文件**: `apps/server/src/module/query/dsl-transformer/dsl-transformer.v2.ts`
- 修改替换逻辑，支持 #F 和 #M 前缀

## 修改详情

### parseExpressionIds 新逻辑
```typescript
// 匹配 #F10,20,30 或 #M100,200 格式
function parseExpressionIds(expression: string): {
  fieldIds: number[];
  metricIds: number[];
} {
  const fieldIds: number[] = [];
  const metricIds: number[] = [];

  // 匹配字段: #F10,20,30 或 #F10
  const fieldPattern = /#F([\d,]+)/g;
  let match;
  while ((match = fieldPattern.exec(expression)) !== null) {
    const ids = match[1].split(',').map(id => parseInt(id, 10));
    fieldIds.push(...ids);
  }

  // 匹配指标: #M100,200 或 #M100
  const metricPattern = /#M([\d,]+)/g;
  while ((match = metricPattern.exec(expression)) !== null) {
    const ids = match[1].split(',').map(id => parseInt(id, 10));
    metricIds.push(...ids);
  }

  return { fieldIds, metricIds };
}
```

### preprocessExpression 新逻辑
```typescript
const preprocessExpression = (expression: string): string => {
  let result = expression;

  // 替换 #M 指标引用
  result = result.replace(/#M([\d,]+)/g, (match, ids) => {
    const idList = ids.split(',').map(id => parseInt(id, 10));
    return idList.map(id => {
      const metricInfo = metricMap.get(id);
      if (!metricInfo) throw new Error(`找不到指标: ${id}`);
      return metricInfo.name;
    }).join(', ');
  });

  // 替换 #F 字段引用
  result = result.replace(/#F([\d,]+)/g, (match, ids) => {
    const idList = ids.split(',').map(id => parseInt(id, 10));
    return idList.map(id => {
      const fieldInfo = Array.from(fieldMap.values()).find(f => f.id === id);
      if (!fieldInfo) throw new Error(`找不到字段: ${id}`);
      return fieldInfo.name;
    }).join(', ');
  });

  return result;
};
```

## 文件修改清单

| 文件 | 修改内容 |
|------|---------|
| `dataset.helper.ts` | 更新 parseExpressionIds 函数 |
| `dsl-transformer.v2.ts` | 更新 preprocessExpression 函数 |

## 前端使用示例

```
用户输入: SUM(#F10) * #F20 - #M100 * 0.8

后端解析:
- #F10 → price
- #F20 → quantity  
- #M100 → cost

预处理后: SUM(price * quantity) - cost * 0.8

V2解析生成SQL
```
