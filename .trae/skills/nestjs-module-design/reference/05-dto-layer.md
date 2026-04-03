## DTO 层规范
## 核心职责
定义 DTO 的完整编写规范，明确 Request 与 Response DTO 的区分规则，覆盖参数验证、文档、复用等细节，保证请求参数的安全性与响应数据的规范性
## 边界范围
仅聚焦 dto 目录下的 DTO 文件，不涉及其他层的实现
## 强制规范
### 1. DTO 分类规则
- 所有 DTO 必须严格区分为 **Request DTO** 和 **Response DTO**，禁止混用两类 DTO，禁止同一个 DTO 同时处理请求与响应
- Request DTO：用于接收前端/外部的请求参数，包含验证规则，仅处理输入
- Response DTO：用于格式化返回给前端/外部的响应数据，仅处理输出，过滤敏感字段
### 2. Request DTO 规则
- 必须使用 `class-validator` 的验证装饰器，为所有参数添加验证规则，禁止无验证的参数接收
- 仅包含请求需要的参数，禁止包含冗余、内部的字段，禁止接收实体的内部字段（如 `passwordHash`）
- 嵌套对象必须使用独立的嵌套 DTO，禁止使用内联的类型定义，保证类型的可复用性
- 所有字段必须添加 `@ApiProperty()` Swagger 装饰器，完善接口文档，说明字段的含义、示例
### 3. Response DTO 规则
- 仅包含外部需要的响应字段，过滤内部敏感字段（如密码哈希、内部ID、软删除字段）
- 禁止直接返回 Entity，必须通过 `plainToInstance` 转换为 Response DTO，完成数据过滤与格式化
- 所有字段必须添加 `@ApiProperty()` Swagger 装饰器，完善接口文档
### 4. 通用DTO复用规范
- 所有分页查询必须使用统一的 `PageQueryRequestDto`，包含 `page`、`pageSize`、`sort`、`order` 通用分页参数，禁止自定义分页参数
- 所有分页响应必须使用统一的 `PageResponseDto`，包含 `total`、`list`、`page`、`pageSize` 通用分页结果，禁止自定义分页响应格式
- 复杂的过滤查询必须使用独立的过滤 DTO，禁止使用零散的查询参数，保证查询参数的一致性
### 5. 验证与分组规范
- 对于创建与更新场景的相似 DTO，必须使用分组验证（`groups`）复用字段，禁止重复编写相同的字段定义
- 可选参数必须明确标记 `@IsOptional()` 装饰器，禁止隐式的可选参数
### 6. 示例
```typescript
// 通用分页Request DTO
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class PageQueryRequestDto {
  @ApiProperty({ description: '页码，默认1', required: false, default: 1 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  page?: number = 1;

  @ApiProperty({ description: '每页条数，默认10', required: false, default: 10 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  pageSize?: number = 10;

  @ApiProperty({ description: '排序字段', required: false })
  @IsOptional()
  @IsString()
  sort?: string;

  @ApiProperty({ description: '排序方式，ASC/DESC', required: false, default: 'DESC' })
  @IsOptional()
  @IsString()
  order?: 'ASC' | 'DESC' = 'DESC';
}

// 用户创建Request DTO
import { IsString, IsEmail, MinLength, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../entities';

export class UserCreateRequestDto {
  @ApiProperty({ description: '用户名', example: 'zhangsan' })
  @IsString()
  @MinLength(3)
  username: string;

  @ApiProperty({ description: '邮箱', example: 'zhangsan@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: '密码', example: '12345678' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ description: '用户角色', enum: UserRole, required: false, default: UserRole.USER })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;
}

// 用户Response DTO
export class UserResponseDto {
  @ApiProperty({ description: '用户ID' })
  id: string;

  @ApiProperty({ description: '用户名' })
  username: string;

  @ApiProperty({ description: '邮箱' })
  email: string;

  @ApiProperty({ description: '用户角色' })
  role: UserRole;

  @ApiProperty({ description: '创建时间' })
  createdAt: Date;
}
```
### 7. 禁止行为
- 禁止混用 Request DTO 与 Response DTO，禁止同一个 DTO 同时处理请求和响应
- 禁止在 Request DTO 中包含非请求参数的字段，禁止在 Response DTO 中包含敏感字段
- 禁止 Request DTO 缺少验证装饰器，禁止无验证的参数接收
- 禁止直接返回 Entity，禁止跳过 Response DTO 直接返回原始数据
- 禁止自定义分页参数/响应格式，禁止重复实现通用的分页逻辑