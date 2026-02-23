import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QueryService } from './query.service';
import { QueryController } from './query.controller';
import { Query } from './entities/query.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Query])],
  controllers: [QueryController],
  providers: [QueryService],
  exports: [QueryService],
})
export class QueryModule {}
