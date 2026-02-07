import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { ApiResponse } from './global-exception.filter';
import { SUCCESS_MESSAGE_KEY } from './success-message.decorator';

@Injectable()
export class GlobalResponseInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T>
> {
  constructor(private reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    const message = this.reflector.get<string>(
      SUCCESS_MESSAGE_KEY,
      context.getHandler(),
    );
    return next.handle().pipe(
      map((data) => ({
        success: true,
        code: 'SUCCESS',
        message: message || 'Operation completed successfully',
        data,
      })),
    );
  }
}
