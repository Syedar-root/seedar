import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { LoggerService } from '../logger/logger.service';

export interface ApiResponse<T = null> {
  success: boolean;
  code: string;
  message: string;
  data: T;
}

export interface ErrorResponse extends ApiResponse<null> {
  success: false;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new LoggerService();

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errorCode = 'INTERNAL_ERROR';
    let details: any = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const responseObj = exceptionResponse as any;
        message = responseObj.message || exception.message;
        errorCode = responseObj.error || this.getErrorCodeFromStatus(status);
        details = responseObj.details;
      } else {
        message = exception.message;
        errorCode = this.getErrorCodeFromStatus(status);
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      details = exception.stack;
    } else {
      message = 'Unknown error occurred';
      details = String(exception);
    }

    // 记录错误日志
    this.logger.setContext('GlobalExceptionFilter');
    this.logger.error(
      `${request.method} ${request.url} - ${errorCode}: ${message}`,
      details,
      'ExceptionHandler',
    );

    // 构建统一的错误响应
    const errorResponse: ErrorResponse = {
      success: false,
      code: errorCode,
      message: this.isProduction() ? 'An error occurred' : message,
      data: null,
    };

    response.status(status).json(errorResponse);
  }

  private getErrorCodeFromStatus(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'BAD_REQUEST';
      case HttpStatus.UNAUTHORIZED:
        return 'UNAUTHORIZED';
      case HttpStatus.FORBIDDEN:
        return 'FORBIDDEN';
      case HttpStatus.NOT_FOUND:
        return 'NOT_FOUND';
      case HttpStatus.CONFLICT:
        return 'CONFLICT';
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return 'VALIDATION_ERROR';
      case HttpStatus.TOO_MANY_REQUESTS:
        return 'RATE_LIMIT_EXCEEDED';
      default:
        return 'INTERNAL_ERROR';
    }
  }

  private isProduction(): boolean {
    return process.env.NODE_ENV === 'production';
  }
}
