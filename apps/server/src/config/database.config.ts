import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { join } from 'path';

// import {
//   Datasource,
//   DatasourceTable,
//   DatasourceColumn,
//   DatasourceForeignKey,
//   DataSourceMetaVersion,
// } from '@/module/datasource/entities';
// import { Query } from '@/module/query/entities';
// import {
//   Dataset,
//   DatasetTable,
//   DatasetField,
//   DatasetJoin,
//   DatasetMetric,
//   WideTableConfig,
// } from '@/module/dataset/entities';
// import { Dashboard, Panel } from '@/module/dashboard/entities';

export const databaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'mysql',
  host: configService.get<string>('DB_HOST', 'localhost'),
  port: configService.get<number>('DB_PORT', 3305),
  username: configService.get<string>('DB_USERNAME', 'root'),
  password: configService.get<string>('DB_PASSWORD', '2586603nnj'),
  database: configService.get<string>('DB_DATABASE', 'seedar_db'),
  entities: [join(__dirname, '../module/**/*.entity{.ts,.js}')],
  synchronize: configService.get<string>('NODE_ENV') !== 'production', // 生产环境请设为false，使用migration
  logging:
    configService.get<string>('NODE_ENV') === 'development'
      ? ['error', 'warn', 'log', 'info', 'schema', 'migration']
      : ['error', 'warn'],
  charset: 'utf8mb4',
  timezone: 'Z',
});
