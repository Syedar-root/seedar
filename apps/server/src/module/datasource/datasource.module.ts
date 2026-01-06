import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatasourceService } from './service/datasource.service';
import { DatasourceTableService } from './service/datasource-table.service';
import { DatasourceColumnService } from './service/datasource-column.service';
import { DatasourceController } from './datasource.controller';
import { Datasource } from './entities/datasource.entity';
import { DatasourceTable } from './entities/datasource-table.entity';
import { DatasourceColumn } from './entities/datasource-column.entity';
import { KnexConnectionFactory } from './knex-connection.factory';

@Module({
  imports: [TypeOrmModule.forFeature([Datasource, DatasourceTable, DatasourceColumn])],
  controllers: [DatasourceController],
  providers: [
    DatasourceService,
    DatasourceTableService,
    DatasourceColumnService,
    KnexConnectionFactory,
  ],
  exports: [KnexConnectionFactory],
})
export class DatasourceModule {}
