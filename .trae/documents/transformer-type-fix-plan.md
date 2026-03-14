# Transformer 类型错误修复计划

## 问题分析

### 错误分类

| 错误类型 | 行号 | 原因 |
|---------|------|------|
| 计算属性名类型错误 | 68-69, 104-105, 137 | `categoryField`/`valueField` 可能是 `undefined`，计算属性名必须是 `string \| number \| symbol` |
| 属性不存在错误 | 76-77, 99 | `IRadarChartSpec` 没有 `xField`/`yField`；`IScatterChartSpec` 没有 `colorField` |
| 策略类型不兼容 | 141-150 | `TransformStrategy<ISpec>` 不能接受更具体的泛型类型（逆变问题） |

### 根本原因

1. **Radar 图表字段差异**：Radar 使用 `categoryField`/`valueField`，而非 `xField`/`yField`
2. **Scatter 图表字段差异**：Scatter 没有 `colorField`，颜色通过 `seriesField` 区分
3. **TypeScript 泛型逆变**：`TransformStrategy<T>` 中 `T` 在参数位置是逆变的，不能用子类型赋值

---

## 修复方案

### 1. 统一使用 `ISpec` 类型

放弃精确类型标注，统一使用 `ISpec`，在函数内部进行类型收窄：

```typescript
type TransformStrategy = (data: Record<string, any>[], spec: ISpec) => Record<string, any>[];
```

### 2. 修复计算属性名类型

确保字段名变量是 `string` 类型，使用 `??` 提供默认值：

```typescript
const categoryField = spec.categoryField ?? 'category';  // 类型收窄为 string
return data.map((item) => ({
  [categoryField]: item[categoryField],  // 现在是 string，不会报错
}));
```

### 3. 分离 Radar 图表处理

Radar 图表使用不同的字段映射，需要单独处理：

```typescript
const transformForRadar: TransformStrategy = (data, spec) => {
  const categoryField = spec.categoryField ?? 'category';
  const valueField = spec.valueField ?? 'value';
  // ...
};
```

### 4. 修复 Scatter 图表

移除不存在的 `colorField`，只使用 `xField`/`yField`/`sizeField`/`seriesField`

### 5. 使用类型断言解决策略映射

```typescript
const transformStrategies: Record<ChartType, TransformStrategy> = {
  pie: transformForPie as TransformStrategy,
  // ...
};
```

---

## 实施步骤

1. **修改类型定义**
   - 移除 `TransformStrategy` 的泛型参数
   - 统一使用 `ISpec` 类型

2. **修复 transformForCartesian**
   - 分离 Radar 处理逻辑
   - 使用类型守卫判断图表类型

3. **修复 transformForScatter**
   - 移除 `colorField` 相关代码
   - 只保留 `xField`/`yField`/`sizeField`/`seriesField`

4. **添加 transformForRadar**
   - 使用 `categoryField`/`valueField` 字段

5. **修复策略映射**
   - 添加类型断言

---

## 最终代码结构

```typescript
type TransformStrategy = (data: Record<string, any>[], spec: ISpec) => Record<string, any>[];

const transformForPie: TransformStrategy = (data, spec) => { /* ... */ };
const transformForCartesian: TransformStrategy = (data, spec) => { /* ... */ };  // bar, line, area
const transformForRadar: TransformStrategy = (data, spec) => { /* ... */ };
const transformForScatter: TransformStrategy = (data, spec) => { /* ... */ };
const transformForFunnel: TransformStrategy = (data, spec) => { /* ... */ };
const transformForGauge: TransformStrategy = (data, spec) => { /* ... */ };

const transformStrategies: Record<ChartType, TransformStrategy> = {
  pie: transformForPie,
  rose: transformForPie,
  bar: transformForCartesian,
  line: transformForCartesian,
  area: transformForCartesian,
  radar: transformForRadar,      // 单独处理
  scatter: transformForScatter,
  funnel: transformForFunnel,
  gauge: transformForGauge,
};
```
