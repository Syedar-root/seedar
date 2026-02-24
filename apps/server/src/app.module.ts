import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatasourceModule } from './module/datasource/datasource.module';
import { LoggerModule } from './logger/logger.module';
import { GlobalExceptionFilter } from './common/global-exception.filter';
import { GlobalResponseInterceptor } from './common/global-response.interceptor';
import { GlobalLoggingInterceptor } from './common/global-logging.interceptor';
import { databaseConfig } from './config/database.config';
import { DatasetModule } from './module/dataset/dataset.module';
import { QueryModule } from './module/query/query.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        `.env.${process.env.NODE_ENV || 'development'}`,
        '.env.local',
        '.env',
      ],
    }),
    LoggerModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: databaseConfig,
      inject: [ConfigService],
    }),
    DatasourceModule,
    DatasetModule,
    QueryModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: GlobalLoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: GlobalResponseInterceptor,
    },
  ],
})
export class AppModule {}
