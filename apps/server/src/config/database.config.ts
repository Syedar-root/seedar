import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { join } from 'path';

export const databaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'mysql',
  host: configService.get<string>('DB_HOST', 'localhost'),
  port: configService.get<number>('DB_PORT', 3306),
  username: configService.get<string>('DB_USERNAME', 'root'),
  password: configService.get<string>('DB_PASSWORD', '2586603nnj'),
  database: configService.get<string>('DB_DATABASE', 'seedar_db'),
  entities: [
    join(
      __dirname,
      '..', // 关键！跳出 config 文件夹，扫描整个项目
      '**',
      `*.entity.js`,
    ),
  ],
  synchronize: configService.get<string>('NODE_ENV') !== 'production', // 生产环境请设为false，使用migration
  logging:
    configService.get<string>('NODE_ENV') === 'development'
      ? ['error', 'warn', 'log', 'info', 'schema', 'migration']
      : ['error', 'warn'],
  charset: 'utf8mb4',
});
