import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatasourceService } from './service/datasource.service';
import { DatasourceController } from './datasource.controller';
import { Datasource } from './entities/datasource.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Datasource])],
  controllers: [DatasourceController],
  providers: [DatasourceService],
})
export class DatasourceModule {}
