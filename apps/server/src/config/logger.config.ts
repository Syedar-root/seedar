import * as winston from 'winston';
import chalk from 'chalk';
import * as path from 'path';

// 自定义颜色格式
const customFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss',
  }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ level, message, timestamp, stack, context }) => {
    let coloredLevel: string;
    let coloredMessage: string;

    switch (level.toLowerCase()) {
      case 'error':
        coloredLevel = chalk.red(`[${level.toUpperCase()}]`);
        coloredMessage = chalk.red(message as string);
        break;
      case 'warn':
        coloredLevel = chalk.yellow(`[${level.toUpperCase()}]`);
        coloredMessage = chalk.yellow(message as string);
        break;
      case 'info':
        coloredLevel = chalk.blue(`[${level.toUpperCase()}]`);
        coloredMessage = chalk.blue(message as string);
        break;
      case 'debug':
        coloredLevel = chalk.gray(`[${level.toUpperCase()}]`);
        coloredMessage = chalk.gray(message as string);
        break;
      case 'verbose':
        coloredLevel = chalk.cyan(`[${level.toUpperCase()}]`);
        coloredMessage = chalk.cyan(message as string);
        break;
      default:
        coloredLevel = `[${level.toUpperCase()}]`;
        coloredMessage = message as string;
    }

    const contextStr = context ? ` ${chalk.magenta(`[${context}]`)}` : '';
    const stackStr = stack ? `\n${chalk.gray(stack)}` : '';

    return `${chalk.gray(timestamp)} ${coloredLevel}${contextStr} ${coloredMessage}${stackStr}`;
  }),
);

// 文件格式（不带颜色，用于文件写入）
const fileFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss',
  }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ level, message, timestamp, stack, context }) => {
    const contextStr = context ? ` [${context}]` : '';
    const stackStr = stack ? `\n${stack}` : '';
    return `${timestamp} [${level.toUpperCase()}]${contextStr} ${message}${stackStr}`;
  }),
);

// JSON 格式
const jsonFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss.SSS',
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

export const winstonConfig = (configService?: any) => ({
  level: configService?.get('LOG_LEVEL') || 'debug',
  format: customFormat,
  transports: [
    // 控制台输出（带颜色）
    new winston.transports.Console({
      format: customFormat,
      handleExceptions: true,
      handleRejections: true,
    }),

    // 所有日志写入文件
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'app.log'),
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true,
    }),

    // 错误日志单独写入文件
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'error.log'),
      level: 'error',
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true,
    }),

    // JSON 格式日志文件
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'app.json.log'),
      format: jsonFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true,
    }),
  ],
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'exceptions.log'),
      format: fileFormat,
    }),
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'rejections.log'),
      format: fileFormat,
    }),
  ],
});
