import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from './logger/logger.service';

@Injectable()
export class AppService {
  constructor(
    private configService: ConfigService,
    private logger: LoggerService,
  ) {
    this.logger.setContext('AppService');
  }

  getHello(): string {
    this.logger.log('处理getHello请求');
    this.logger.debug('返回欢迎消息');
    return 'Hello World!';
  }

  getConfigInfo() {
    this.logger.log('获取配置信息');
    const config = {
      nodeEnv: this.configService.get<string>('NODE_ENV'),
      port: this.configService.get<number>('PORT'),
      dbHost: this.configService.get<string>('DB_HOST'),
      dbDatabase: this.configService.get<string>('DB_DATABASE'),
      dbUsername: this.configService.get<string>('DB_USERNAME'),
    };
    this.logger.debug(`配置信息: ${JSON.stringify(config)}`);
    return config;
  }
}
