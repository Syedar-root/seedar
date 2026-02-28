# 时间处理说明

## UTC时间存储策略

项目采用UTC时间存储策略，所有时间字段在数据库中存储为UTC格式，在应用层读取时自动转换为Date对象。

## Transformer使用方法

### 1. 自动时间字段（推荐）

```typescript
@CreateDateColumn()  // 自动UTC存储
createdAt: Date;

@UpdateDateColumn()  // 自动UTC存储
updatedAt: Date;
```

### 2. 自定义时间字段

```typescript
import { utcTimeTransformer, optionalUtcTimeTransformer } from '../transformers/utc-time.transformer';

// 必填时间字段
@Column({
  type: 'datetime',
  transformer: utcTimeTransformer
})
refreshedAt: Date;

// 可选时间字段
@Column({
  type: 'datetime',
  nullable: true,
  transformer: optionalUtcTimeTransformer
})
lastValidateAt?: Date;
```

## Transformer实现原理

### utcTimeTransformer

- **存储时 (to)**: `Date` → `UTC ISO字符串`
- **读取时 (from)**: `UTC字符串` → `Date对象`

### optionalUtcTimeTransformer

- 处理可空字段的UTC转换
- 支持 `null` 和 `undefined` 值

## 数据库表现

```sql
-- 存储格式（UTC）
created_at: '2024-01-04T09:53:20.000Z'
updated_at: '2024-01-04T09:53:20.000Z'
refreshed_at: '2024-01-04T09:53:20.000Z'

-- 应用层读取（自动转换）
entity.createdAt: Date对象 (本地时区)
entity.updatedAt: Date对象 (本地时区)
entity.refreshedAt: Date对象 (本地时区)
```

## 使用示例

```typescript
// 创建记录 - 自动转换为UTC存储
const entity = await repository.save({
  refreshedAt: new Date(), // 存储时自动转为UTC字符串
});

// 查询记录 - 自动转换为Date对象
const result = await repository.findOne({ where: { id: 1 } });
console.log(result.refreshedAt); // Date对象，可直接使用
console.log(result.refreshedAt.toISOString()); // UTC字符串
```

## 注意事项

1. **时区一致性**: 所有时间字段统一使用UTC存储
2. **前端显示**: 前端接收Date对象后，可根据用户时区格式化显示
3. **数据库查询**: 数据库中时间为UTC格式，确保跨时区查询正确
4. **迁移数据**: 现有数据需要确保格式一致

## 扩展使用

如果需要支持特定时区，可以创建自定义transformer：

```typescript
const chinaTimezoneTransformer = {
  from: (value: string) => new Date(value), // UTC字符串转Date
  to: (value: Date) => {
    // 转换为中国时区字符串
    return new Date(value.getTime() + 8 * 60 * 60 * 1000).toISOString();
  },
};
```
