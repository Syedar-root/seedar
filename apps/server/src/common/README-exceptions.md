# 异常处理机制

本项目提供了统一的异常处理机制，包括自定义异常类和便捷的异常抛出方法。

## 核心组件

### 1. ExceptionType 枚举
定义了所有业务异常类型：

```typescript
export enum ExceptionType {
  BAD_REQUEST = 'BAD_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  // 业务特定异常
  DATASOURCE_CONFIG_INVALID = 'DATASOURCE_CONFIG_INVALID',
  DATASOURCE_NOT_FOUND = 'DATASOURCE_NOT_FOUND',
  DATASOURCE_ALREADY_EXISTS = 'DATASOURCE_ALREADY_EXISTS',
  METHOD_NOT_IMPLEMENTED = 'METHOD_NOT_IMPLEMENTED',
}
```

### 2. BusinessException 类
基于 NestJS HttpException 的业务异常类：

```typescript
export class BusinessException extends HttpException {
  constructor(
    public readonly type: ExceptionType,
    message: string,
    status: HttpStatus = HttpStatus.BAD_REQUEST,
    details?: any,
  ) {
    // ...
  }
}
```

### 3. ExceptionFactory 工厂类
提供便捷的异常抛出方法：

```typescript
export class ExceptionFactory {
  // 通用异常
  static badRequest(message: string, details?: any): never
  static unauthorized(message?: string): never
  static forbidden(message?: string): never
  static notFound(message: string, details?: any): never
  static conflict(message: string, details?: any): never
  static validationError(message: string, details?: any): never
  static internalError(message?: string, details?: any): never

  // 业务特定异常
  static datasourceConfigInvalid(type: string, details?: any): never
  static datasourceNotFound(id: number): never
  static datasourceAlreadyExists(name: string): never
  static methodNotImplemented(methodName?: string): never
}
```

## 使用方式

### 基本使用

```typescript
import { ExceptionFactory } from '../common/exceptions';

// 抛出通用异常
ExceptionFactory.badRequest('参数错误');
ExceptionFactory.notFound('用户不存在');
ExceptionFactory.internalError('系统内部错误');

// 抛出业务特定异常
ExceptionFactory.datasourceNotFound(123);
ExceptionFactory.datasourceConfigInvalid('mysql');
```

### 在服务中使用

```typescript
@Injectable()
export class UserService {
  async findUserById(id: number) {
    const user = await this.userRepository.findOne(id);
    if (!user) {
      ExceptionFactory.notFound(`User with id ${id} not found`);
    }
    return user;
  }

  async createUser(userData: CreateUserDto) {
    // 验证逻辑
    if (!this.isValidEmail(userData.email)) {
      ExceptionFactory.validationError('邮箱格式不正确');
    }

    const existingUser = await this.userRepository.findByEmail(userData.email);
    if (existingUser) {
      ExceptionFactory.conflict('邮箱已被注册');
    }

    // 创建用户逻辑...
  }
}
```

### 异常响应格式

所有异常都会被全局异常拦截器处理，返回统一的响应格式：

```json
{
  "success": false,
  "code": "DATASOURCE_NOT_FOUND",
  "message": "Datasource with id 123 not found",
  "data": null
}
```

## 优势

1. **类型安全**: 使用枚举确保异常类型的一致性
2. **统一格式**: 所有异常都有统一的响应格式
3. **便捷使用**: 工厂方法提供直观的异常抛出方式
4. **易维护**: 集中管理所有异常类型和消息
5. **可扩展**: 容易添加新的业务异常类型

## 注意事项

- 所有 `ExceptionFactory` 方法都会抛出异常（返回类型为 `never`）
- 异常信息会自动集成到全局异常拦截器中
- 生产环境会隐藏详细的错误信息
