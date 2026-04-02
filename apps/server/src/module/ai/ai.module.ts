import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiController } from './ai.controller';
import { AiService } from './services/ai.service';
import { Ai } from './entities/ai.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Ai])],
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
