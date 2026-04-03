## 接口层规范
## 核心职责
定义接口层的完整编写规范，明确 Controller 的职责边界，覆盖接口定义、权限、版本、文档、错误处理等细节，保证接口的一致性、可维护性
## 边界范围
仅聚焦 controllers 目录下的 Controller 文件，不涉及其他层的实现
## 强制规范
### 1. 接口基础规范
- 所有接口必须使用 NestJS 的装饰器定义路由、请求方法、参数，严格遵循 REST 规范
- HTTP 方法规范：`GET` 用于查询数据，`POST` 用于创建数据，`PUT` 用于全量更新，`PATCH` 用于部分更新，`DELETE` 用于删除数据，禁止混用 HTTP 方法
- 接口路径必须使用 kebab-case，语义化命名，如 `/users/:id`，禁止使用驼峰、下划线的路径
- 所有接口必须添加版本前缀，如 `/api/v1/users`，支持接口版本迭代，兼容旧版本接口
### 2. 参数与权限规范
- 所有请求参数必须通过 Request DTO 接收，禁止直接使用 `req.body`、`req.query` 接收无类型的参数
- 路径参数、查询参数必须添加验证规则，禁止无验证的参数
- 所有接口必须添加权限注解，如 `@Roles('admin', 'user')`，明确接口的访问权限，禁止无权限的公开接口（除非是公开接口）
### 3. 响应与错误处理规范
- 所有响应数据必须通过 Response DTO 格式化，禁止直接返回 Entity 或内部数据
- 所有接口的响应必须使用统一的响应格式，包含 `code`、`data`、`message`，统一响应结构
- 所有异常必须统一转换为错误响应，包含错误码、错误信息，禁止返回原始的错误栈、数据库异常，避免暴露内部信息
### 4. 文档规范
- 所有接口必须添加 Swagger 装饰器：`@ApiOperation` 说明接口的作用，`@ApiResponse` 说明响应的状态码与类型，`@ApiParam` 说明路径参数
- 所有 DTO 的字段必须添加 `@ApiProperty` 装饰器，完善接口文档，让接口文档可以自动生成，清晰易懂
### 5. 特殊接口规范
- 文件上传接口必须使用统一的 `FileUploadDto`，限制文件的大小、类型，禁止无限制的文件上传
- 分页查询接口必须使用统一的分页 DTO，返回统一的分页响应，禁止自定义分页格式
### 6. 示例
```typescript
import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from '@common/decorators/roles.decorator';
import { UserService } from '../services';
import { 
  UserCreateRequestDto, 
  UserResponseDto, 
  PageQueryRequestDto, 
  PageResponseDto 
} from '../dto';

@ApiTags('用户管理')
@Controller('api/v1/users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: '创建用户' })
  @ApiResponse({ status: 201, type: UserResponseDto })
  async createUser(
    @Body() dto: UserCreateRequestDto,
  ): Promise<UserResponseDto> {
    return this.userService.createUser(dto);
  }

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: '分页查询用户列表' })
  @ApiResponse({ status: 200, type: PageResponseDto<UserResponseDto> })
  async getUserList(
    @Query() query: PageQueryRequestDto,
  ): Promise<PageResponseDto<UserResponseDto>> {
    return this.userService.getUserList(query);
  }
}
```
### 7. 禁止行为
- 禁止在 Controller 中处理业务逻辑、数据操作，Controller 仅做请求接收与响应转发
- 禁止直接返回 Entity 或内部数据，禁止无 DTO 的响应
- 禁止无验证的参数接收，禁止直接操作请求/响应对象
- 禁止混用 HTTP 方法，禁止不符合 REST 规范的接口设计
- 禁止无 Swagger 文档的接口，禁止接口文档缺失
- 禁止无权限的接口，禁止未授权的公开接口