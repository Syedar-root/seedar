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

@Module({
  imports: [
    TypeOrmModule.forFeature([Dataset, DatasetTable, DatasetJoin, DatasetField, DatasetMetric]),
    DatasourceModule,
  ],
  controllers: [DatasetController],
  providers: [DatasetService],
})
export class DatasetModule {}
