# UserPage.tsx VChart 类型错误修复计划

## 问题诊断

### 错误信息
```
属性"axes"的类型不兼容。
不能将类型"{ orient: string; title: { visible: boolean; text: string; }; }[]"分配给类型"ICommonAxisSpec[]"。
```

### 根本原因
在 VChart 的柱状图配置中，`axes` 数组中的每个轴对象必须包含 `type` 属性，用于指定轴的类型（如 `'band'`、`'linear'` 等）。

当前代码中 `axes` 配置缺少 `type` 属性：
```javascript
axes: [
  {
    orient: 'left',
    title: { visible: true, text: '用户数量' },
  },
  {
    orient: 'bottom',
    title: { visible: true, text: '月份' },
  },
]
```

## 修复方案

### 步骤 1：为 X 轴添加 `type: 'band'`
- X 轴（底部）用于显示类目数据（月份），应使用 `'band'` 类型
- `band` 类型适用于离散的类目数据，如柱状图的 X 轴

### 步骤 2：为 Y 轴添加 `type: 'linear'`
- Y 轴（左侧）用于显示数值数据（用户数量），应使用 `'linear'` 类型
- `linear` 类型适用于连续的数值数据

### 步骤 3：验证修复
- 确保所有 TypeScript 类型错误消失
- 确认图表能够正常渲染

## 具体修改内容

### 修改位置
文件：`d:\projects\seedar\apps\web-client\src\modules\user\pages\UserPage.tsx`
行数：第 42-51 行

### 修改前
```javascript
axes: [
  {
    orient: 'left',
    title: { visible: true, text: '用户数量' },
  },
  {
    orient: 'bottom',
    title: { visible: true, text: '月份' },
  },
]
```

### 修改后
```javascript
axes: [
  {
    orient: 'left',
    type: 'linear',
    title: { visible: true, text: '用户数量' },
  },
  {
    orient: 'bottom',
    type: 'band',
    title: { visible: true, text: '月份' },
  },
]
```

## 验证步骤

1. 应用修改后，检查 IDE 中的 TypeScript 错误是否消失
2. 运行项目，确认图表能够正常显示
3. 验证坐标轴标题和标签显示正确

## 相关知识

### VChart 坐标轴类型说明

| 类型 | 说明 | 适用场景 |
|------|------|---------|
| `'band'` | 类目轴 | 离散数据（柱状图 X 轴） |
| `'linear'` | 线性轴 | 连续数值（柱状图 Y 轴） |
| `'time'` | 时间轴 | 时间序列数据 |
| `'log'` | 对数轴 | 跨度大的数值 |

### VChart 柱状图配置要点

1. **type**: 图表类型，设置为 `'bar'`
2. **xField**: 分类字段，映射图元的 x 坐标
3. **yField**: 数值字段，映射图元的高度
4. **axes**: 坐标轴配置，必须包含 `orient` 和 `type` 属性
