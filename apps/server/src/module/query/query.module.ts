import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QueryService } from './query.service';
import { QueryController } from './query.controller';
import { Query } from './entities/query.entity';
import { DatasetModule } from '../dataset/dataset.module';
import { DatasourceModule } from '../datasource/datasource.module';

@Module({
  imports: [TypeOrmModule.forFeature([Query]), DatasetModule, DatasourceModule],
  controllers: [QueryController],
  providers: [QueryService],
  exports: [QueryService],
})
export class QueryModule {}
