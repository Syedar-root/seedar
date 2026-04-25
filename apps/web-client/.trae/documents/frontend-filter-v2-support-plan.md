# 前端筛选器 V2 新特性支持计划

## 目标
修改前端筛选器组件，支持 V2 新增的筛选表达式类型：
- IN / NOT IN 列表匹配（数组输入）
- BETWEEN / NOT BETWEEN 范围匹配（范围输入）
- LIKE / NOT LIKE 模糊匹配（已有，需补充 not_like）

## 现状分析

### 当前代码位置
`d:\Program\projects\seedar\apps\web-client\src\modules\panel\components\queryZone\`

### 已有支持
`types.ts` 中已定义部分操作符：
- STRING 类型支持：`=`, `!=`, `like`, `in`, `not_in`, `is_null`, `is_not_null`
- NUMBER/DECIMAL 类型支持：比较运算符 + `is_null`, `is_not_null`

### 问题
1. 缺少 `between`, `not_between`, `not_like` 操作符
2. `filterItem.tsx` 只处理单值输入，不支持：
   - `in` / `not_in` 的数组值输入
   - `between` / `not_between` 的范围值输入

## 任务拆分与依赖关系

```
┌─────────────────────────────────────────────────────────────────┐
│                        Phase 1: 类型定义扩展                     │
│  [T1] 扩展 types.ts 操作符定义                                   │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Phase 2: 组件扩展                         │
│  [T2] 添加数组值输入组件（IN/NOT IN）                            │
│  [T3] 添加范围值输入组件（BETWEEN/NOT BETWEEN）                  │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Phase 3: 样式添加                         │
│  [T4] 添加新组件样式                                             │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Phase 4: 验证与修复                       │
│  [T5] 运行 lint 和 typecheck 检查                               │
│  [T6] 修复所有错误                                               │
└─────────────────────────────────────────────────────────────────┘
```

## 详细任务说明

### Phase 1: 类型定义扩展

#### [T1] 扩展 types.ts 操作符定义
**文件**: `apps/web-client/src/modules/panel/components/queryZone/types.ts`

**修改内容**:
```typescript
// 添加新的操作符常量
export const ARRAY_VALUE_OPERATORS = ["in", "not_in"];
export const RANGE_VALUE_OPERATORS = ["between", "not_between"];

// 扩展 OPERATORS_BY_TYPE
[FieldType.STRING]: [
  // ... 现有
  { value: "not_like", label: "不包含" },
  { value: "between", label: "介于" },
  { value: "not_between", label: "不介于" },
],
[FieldType.NUMBER]: [
  // ... 现有
  { value: "between", label: "介于" },
  { value: "not_between", label: "不介于" },
],
// DECIMAL 同 NUMBER
```

**依赖**: 无
**并行**: 否（基础任务）

---

### Phase 2: 组件扩展

#### [T2] 添加数组值输入组件
**文件**: `apps/web-client/src/modules/panel/components/queryZone/filterItem.tsx`

**修改内容**:
1. 添加 `ARRAY_VALUE_OPERATORS` 判断
2. 创建 `renderArrayInput` 函数处理 IN/NOT IN
3. 使用 Tag 输入或逗号分隔输入

```tsx
const renderArrayInput = () => {
  if (!ARRAY_VALUE_OPERATORS.includes(filter.op)) return null;
  
  const values = Array.isArray(filter.value) ? filter.value : [];
  
  return (
    <div className={styles.arrayInput}>
      {values.map((v, idx) => (
        <span key={idx} className={styles.tag}>
          {v}
          <X size={10} onClick={() => removeValue(idx)} />
        </span>
      ))}
      <Input
        placeholder="输入后回车"
        onKeyDown={handleAddValue}
      />
    </div>
  );
};
```

**依赖**: T1
**并行**: 可与 T3 并行

#### [T3] 添加范围值输入组件
**文件**: `apps/web-client/src/modules/panel/components/queryZone/filterItem.tsx`

**修改内容**:
1. 添加 `RANGE_VALUE_OPERATORS` 判断
2. 创建 `renderRangeInput` 函数处理 BETWEEN/NOT BETWEEN

```tsx
const renderRangeInput = () => {
  if (!RANGE_VALUE_OPERATORS.includes(filter.op)) return null;
  
  const rangeValue = filter.value || { low: undefined, high: undefined };
  
  return (
    <div className={styles.rangeInput}>
      <Input
        type="number"
        value={rangeValue.low ?? ""}
        onChange={(e) => updateRange("low", e.target.value)}
        placeholder="最小值"
      />
      <span>至</span>
      <Input
        type="number"
        value={rangeValue.high ?? ""}
        onChange={(e) => updateRange("high", e.target.value)}
        placeholder="最大值"
      />
    </div>
  );
};
```

**依赖**: T1
**并行**: 可与 T2 并行

---

### Phase 3: 样式添加

#### [T4] 添加新组件样式
**文件**: `apps/web-client/src/modules/panel/components/queryZone/filterItem.module.scss`

**修改内容**:
```scss
.arrayInput {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
  
  .tag {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    padding: 2px 6px;
    background: #e8e8e8;
    border-radius: 4px;
    font-size: 12px;
  }
}

.rangeInput {
  display: flex;
  align-items: center;
  gap: 4px;
  
  span {
    color: #666;
    font-size: 12px;
  }
}
```

**依赖**: T2, T3
**并行**: 否

---

### Phase 4: 验证与修复

#### [T5] 运行 lint 和 typecheck 检查
**命令**: 
- `pnpm --filter web-client lint`
- `pnpm --filter web-client type-check`

**依赖**: T4
**并行**: 可并行执行

#### [T6] 修复所有错误
**内容**: 修复 T5 发现的所有问题

**依赖**: T5
**并行**: 否

---

## 文件修改清单

| 文件 | 修改类型 | 任务 |
|------|---------|------|
| `types.ts` | 修改 | T1 |
| `filterItem.tsx` | 修改 | T2, T3 |
| `filterItem.module.scss` | 修改 | T4 |

---

## 预期产出

完成后前端筛选器支持：

### STRING 类型
- 等于 / 不等于
- 包含 / 不包含（LIKE）
- 属于 / 不属于（IN）
- 介于 / 不介于（BETWEEN）
- 为空 / 不为空

### NUMBER/DECIMAL 类型
- 比较运算符
- 介于 / 不介于（BETWEEN）
- 为空 / 不为空

### 交互示例
```
IN 列表输入：
┌─────────────────────────────┐
│ [paid ×] [shipped ×] [输入] │
└─────────────────────────────┘

BETWEEN 范围输入：
┌──────────┐  至  ┌──────────┐
│   100    │     │   1000   │
└──────────┘     └──────────┘
```
