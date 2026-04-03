## 实体层规范
## 核心职责
定义数据实体的完整编写规范，明确 TypeORM Entity 的使用约束、数据模型的一致性规则，覆盖基础定义、字段、关联、索引等全维度细节，保证数据库层的可维护性与性能
## 边界范围
仅聚焦 entities 目录下的实体文件，不涉及其他层的实现
## 强制规范
### 1. 基础实体规范
- 所有数据实体必须使用 TypeORM 的 `@Entity()` 装饰器定义，禁止使用无装饰器的 POJO 类作为数据模型
- 所有实体必须继承公共的 `BaseEntity`，统一包含审计字段：`createdAt`、`updatedAt`、`deletedAt`，实现软删除与操作时间追踪，禁止每个实体重复定义
- 禁止在实体中编写任何业务逻辑方法，实体仅做数据结构与数据库表的映射
### 2. 字段定义规则
- 所有字段必须明确定义类型，禁止使用 `any`、`unknown` 等模糊类型，禁止隐式类型转换
- 非空字段必须添加 `nullable: false` 约束，可选字段必须明确标记，禁止无标记的可选字段
- 敏感字段（如密码哈希、密钥、内部标记）必须添加 `select: false`，默认查询不返回该字段，避免敏感数据泄露
- 非空可选字段必须设置合理的默认值，如 `isActive` 默认 `true`，避免数据库 null 值混乱
- 枚举字段必须使用字符串枚举，禁止使用数字枚举，提升数据库存储的可读性，避免数字值含义模糊
### 3. 索引与性能规范
- 所有高频查询的字段（如 `email`、`username`、`mobile`）必须添加唯一索引或普通索引，使用 `@Index()` 装饰器声明
- 联合查询的多字段必须添加联合索引，避免慢查询
- 禁止无索引的全表扫描字段，所有查询条件的字段必须有索引支持
### 4. 关联定义规则
- 实体关联必须使用 TypeORM 的关联装饰器（`@OneToOne`、`@OneToMany`、`@ManyToOne` 等），禁止手动维护关联字段
- 所有关联字段默认设置 `eager: false`，禁止默认急加载，避免隐式的关联查询导致 N+1 问题
- 需要关联查询时，必须在 Repository 中手动调用 `leftJoinAndSelect` 加载关联数据，明确加载的字段
### 5. 软删除规范
- 所有实体默认启用软删除，通过 `@DeleteDateColumn()` 声明 `deletedAt` 字段，禁止物理删除数据，保证数据可追溯
- 默认查询自动过滤已软删除的数据，需要查询已删除数据时必须手动添加 `withDeleted()` 条件，禁止默认查询已删除数据
### 6. 示例
```typescript
// 正确示例
import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

@Entity('users')
@Index(['email'], { unique: true }) // 邮箱唯一索引
export class User extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 50 })
  username: string;

  @Column({ length: 100 })
  email: string;

  @Column({ select: false, length: 100 }) // 密码字段默认不查询
  passwordHash: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @Column({ default: true })
  isActive: boolean;
}

// 错误示例
// 禁止使用POJO
export class UserPOJO {
  id: string;
  username: string;
}
// 禁止数字枚举
export enum UserRoleNum {
  USER = 1,
  ADMIN = 2,
}
}
```
### 7. 禁止行为
- 禁止使用 POJO、普通类作为数据实体，禁止无装饰器的实体定义
- 禁止在实体中编写业务逻辑、工具方法，禁止实体承担非数据映射的职责
- 禁止默认急加载关联字段，禁止隐式的关联查询，避免 N+1 性能问题
- 禁止物理删除数据，禁止跳过软删除直接删除数据库记录
- 禁止直接将实体暴露给外部接口，必须通过 Response DTO 做数据转换与过滤