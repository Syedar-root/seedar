import {
  Injectable,
  LoggerService as NestLoggerService,
  Logger,
} from '@nestjs/common';
import * as winston from 'winston';
import { winstonConfig } from '../config/logger.config';

@Injectable()
export class LoggerService implements NestLoggerService {
  private winstonLogger: winston.Logger;
  private context?: string;

  constructor() {
    this.winstonLogger = winston.createLogger(winstonConfig);
  }

  setContext(context: string) {
    this.context = context;
  }

  log(message: any, context?: string) {
    const ctx = context || this.context;
    this.winstonLogger.info(message, { context: ctx });
  }

  error(message: any, stack?: string, context?: string) {
    const ctx = context || this.context;
    this.winstonLogger.error(message, { context: ctx, stack });
  }

  warn(message: any, context?: string) {
    const ctx = context || this.context;
    this.winstonLogger.warn(message, { context: ctx });
  }

  debug(message: any, context?: string) {
    const ctx = context || this.context;
    this.winstonLogger.debug(message, { context: ctx });
  }

  verbose(message: any, context?: string) {
    const ctx = context || this.context;
    this.winstonLogger.verbose(message, { context: ctx });
  }

  // 兼容NestJS Logger的静态方法
  static log(message: any, context?: string) {
    const logger = new LoggerService();
    logger.log(message, context);
  }

  static error(message: any, stack?: string, context?: string) {
    const logger = new LoggerService();
    logger.error(message, stack, context);
  }

  static warn(message: any, context?: string) {
    const logger = new LoggerService();
    logger.warn(message, context);
  }

  static debug(message: any, context?: string) {
    const logger = new LoggerService();
    logger.debug(message, context);
  }

  static verbose(message: any, context?: string) {
    const logger = new LoggerService();
    logger.verbose(message, context);
  }
}
