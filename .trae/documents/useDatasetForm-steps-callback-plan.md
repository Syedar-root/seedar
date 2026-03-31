# useDatasetForm 步骤切换回调计划

## 需求
在 `goToNextStep` 中添加单一的 `onBeforeNext` 回调 map，key 为当前 step，验证失败时用 sonner toast 提示并返回 false 阻止继续。

## 实现步骤

### 1. 添加 sonner import
确保文件顶部有：
```typescript
import { toast } from "sonner";
```

### 2. 定义 `onBeforeNext` 配置
```typescript
const onBeforeNext: Partial<Record<EditorSteps, () => boolean>> = {
  dataSource: () => {
    const validTableIds = new Set(formData.tables.map((t) => t.tableId));
    const validJoins = formData.joins.filter(
      (join) =>
        validTableIds.has(join.leftTable) && validTableIds.has(join.rightTable),
    );
    if (validJoins.length !== formData.joins.length) {
      updateFormData({ joins: validJoins });
    }
    return true;
  },
  joinConfig: () => {
    if (formData.tables.length <= 1) return true;
    const pairCount: Record<string, number> = {};
    const tableIds = formData.tables.map((t) => t.tableId).sort();
    for (let i = 0; i < tableIds.length; i++) {
      for (let j = i + 1; j < tableIds.length; j++) {
        pairCount[`${tableIds[i]}-${tableIds[j]}`] = 0;
      }
    }
    formData.joins.forEach((join) => {
      const sortedPair = [join.leftTable, join.rightTable].sort().join("-");
      if (pairCount[sortedPair] !== undefined) {
        pairCount[sortedPair]++;
      }
    });
    const incompletePairs = Object.entries(pairCount).filter(([, count]) => count !== 1);
    if (incompletePairs.length > 0) {
      const tableNames = incompletePairs.map(([pair]) => pair).join(", ");
      toast.error(`表 ${tableNames} 之间需要且仅需一条关联关系`);
      return false;
    }
    return true;
  },
};
```

### 3. 修改 `goToNextStep`
```typescript
const goToNextStep = useCallback(() => {
  if (isLastStep) return;
  if (onBeforeNext[currentStep]?.() === false) return;
  if (canGoNext()) {
    setCurrentStep(STEPS[currentStepIndex + 1]);
  }
}, [currentStepIndex, isLastStep, currentStep, onBeforeNext, canGoNext]);
```
