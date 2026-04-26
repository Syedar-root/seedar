import { Module } from '@nestjs/common';
import { DatasetService } from './services/dataset.service';
import { DatasetController } from './dataset.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Dataset } from './entities/dataset.entity';
import { DatasetTable } from './entities/dataset-table.entity';
import { DatasourceModule } from '../datasource/datasource.module';
import { DatasetJoin } from './entities/dataset-join.entity';
import { DatasetField } from './entities/dataset-field.entity';
import { DatasetMetric } from './entities/dataset-metric.entity';
import { Query } from '../query/entities/query.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Dataset,
      DatasetTable,
      DatasetJoin,
      DatasetField,
      DatasetMetric,
      Query,
    ]),
    DatasourceModule,
  ],
  controllers: [DatasetController],
  providers: [DatasetService],
  exports: [DatasetService],
})
export class DatasetModule {}
