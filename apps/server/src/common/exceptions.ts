import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * 业务异常类型枚举
 */
export enum ExceptionType {
  // 通用异常
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

/**
 * 业务异常类
 */
export class BusinessException extends HttpException {
  constructor(
    public readonly type: ExceptionType,
    message: string,
    status: HttpStatus = HttpStatus.BAD_REQUEST,
    details?: any,
  ) {
    super(
      {
        success: false,
        code: type,
        message,
        details,
      },
      status,
    );
  }
}

/**
 * 异常工厂函数 - 提供便捷的异常抛出方法
 */
export class ExceptionFactory {
  /**
   * 抛出Bad Request异常
   */
  static badRequest(message: string, details?: any): never {
    throw new BusinessException(
      ExceptionType.BAD_REQUEST,
      message,
      HttpStatus.BAD_REQUEST,
      details,
    );
  }

  /**
   * 抛出未授权异常
   */
  static unauthorized(message: string = 'Unauthorized'): never {
    throw new BusinessException(
      ExceptionType.UNAUTHORIZED,
      message,
      HttpStatus.UNAUTHORIZED,
    );
  }

  /**
   * 抛出禁止访问异常
   */
  static forbidden(message: string = 'Forbidden'): never {
    throw new BusinessException(
      ExceptionType.FORBIDDEN,
      message,
      HttpStatus.FORBIDDEN,
    );
  }

  /**
   * 抛出未找到异常
   */
  static notFound(message: string, details?: any): never {
    throw new BusinessException(
      ExceptionType.NOT_FOUND,
      message,
      HttpStatus.NOT_FOUND,
      details,
    );
  }

  /**
   * 抛出冲突异常
   */
  static conflict(message: string, details?: any): never {
    throw new BusinessException(
      ExceptionType.CONFLICT,
      message,
      HttpStatus.CONFLICT,
      details,
    );
  }

  /**
   * 抛出验证错误异常
   */
  static validationError(message: string, details?: any): never {
    throw new BusinessException(
      ExceptionType.VALIDATION_ERROR,
      message,
      HttpStatus.UNPROCESSABLE_ENTITY,
      details,
    );
  }

  /**
   * 抛出内部错误异常
   */
  static internalError(
    message: string = 'Internal server error',
    details?: any,
  ): never {
    throw new BusinessException(
      ExceptionType.INTERNAL_ERROR,
      message,
      HttpStatus.INTERNAL_SERVER_ERROR,
      details,
    );
  }

  /**
   * 抛出数据源配置无效异常
   */
  static datasourceConfigInvalid(type: string, details?: any): never {
    throw new BusinessException(
      ExceptionType.DATASOURCE_CONFIG_INVALID,
      `Invalid configuration for datasource type: ${type}`,
      HttpStatus.BAD_REQUEST,
      details,
    );
  }

  /**
   * 抛出数据源未找到异常
   */
  static datasourceNotFound(id: number): never {
    throw new BusinessException(
      ExceptionType.DATASOURCE_NOT_FOUND,
      `Datasource with id ${id} not found`,
      HttpStatus.NOT_FOUND,
    );
  }

  /**
   * 抛出数据源已存在异常
   */
  static datasourceAlreadyExists(name: string): never {
    throw new BusinessException(
      ExceptionType.DATASOURCE_ALREADY_EXISTS,
      `Datasource with name '${name}' already exists`,
      HttpStatus.CONFLICT,
    );
  }

  /**
   * 抛出方法未实现异常
   */
  static methodNotImplemented(methodName?: string): never {
    const message = methodName
      ? `Method ${methodName} not implemented`
      : 'Method not implemented';
    throw new BusinessException(
      ExceptionType.METHOD_NOT_IMPLEMENTED,
      message,
      HttpStatus.NOT_IMPLEMENTED,
    );
  }
}
