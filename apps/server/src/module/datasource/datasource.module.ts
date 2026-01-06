import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatasourceService } from './service/datasource.service';
import { DatasourceController } from './datasource.controller';
import { Datasource } from './entities/datasource.entity';
import { KnexConnectionFactory } from './knex-connection.factory';

@Module({
  imports: [TypeOrmModule.forFeature([Datasource])],
  controllers: [DatasourceController],
  providers: [DatasourceService, KnexConnectionFactory],
  exports: [KnexConnectionFactory],
})
export class DatasourceModule {}
