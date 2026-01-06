import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class GlobalLoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, query, params, user } = request;
    const userAgent = request.get('User-Agent') || '';
    const ip = request.ip || request.connection.remoteAddress || '';

    // 记录请求开始
    this.logger.setContext('API');
    const startTime = Date.now();
    this.logger.log(
      `Request: ${method} ${url} - IP: ${ip} - User-Agent: ${userAgent}`,
      'RequestStart',
    );

    // 记录请求参数（敏感信息过滤）
    if (body && Object.keys(body).length > 0) {
      const safeBody = this.filterSensitiveData(body);

      console.log('safeBody', safeBody);

      this.logger.debug(
        `Request Body: ${JSON.stringify(safeBody)}`,
        'RequestBody',
      );
    }

    if (Object.keys(query).length > 0) {
      this.logger.debug(
        `Query Params: ${JSON.stringify(query)}`,
        'QueryParams',
      );
    }

    if (Object.keys(params).length > 0) {
      this.logger.debug(
        `Route Params: ${JSON.stringify(params)}`,
        'RouteParams',
      );
    }

    if (user) {
      this.logger.debug(
        `User: ${user.id || user.username || 'unknown'}`,
        'UserInfo',
      );
    }

    return next.handle().pipe(
      tap({
        next: (data) => {
          const duration = Date.now() - startTime;
          this.logger.log(
            `Response: ${method} ${url} - Success - Duration: ${duration}ms`,
            'ResponseSuccess',
          );

          // 记录响应数据大小（可选）
          if (data && typeof data === 'object') {
            const responseSize = JSON.stringify(data).length;
            this.logger.debug(
              `Response Size: ${responseSize} bytes`,
              'ResponseSize',
            );
          }
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          this.logger.warn(
            `Response: ${method} ${url} - Error: ${error.message || 'Unknown error'} - Duration: ${duration}ms`,
            'ResponseError',
          );
        },
      }),
    );
  }

  private filterSensitiveData(data: any): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const sensitiveFields = [
      'password',
      'token',
      'secret',
      'key',
      'authorization',
      'api_key',
      'access_token',
      'refresh_token',
    ];

    const filtered = { ...data };

    for (const field of sensitiveFields) {
      if (filtered[field]) {
        filtered[field] = '[FILTERED]';
      }
    }

    return filtered;
  }
}
