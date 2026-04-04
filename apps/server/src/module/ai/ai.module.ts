import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiController } from './ai.controller';
import { AiService } from './services/ai.service';
import { AiSessionService } from './services/ai-session.service';
import { ChatService } from './services/chat.service';
import { Ai } from './entities/ai.entity';
import { AiSession } from './entities/ai-session.entity';
import { DatasetService } from '../dataset/services/dataset.service';
import { ToolService } from './services/tool.service';
import { DatasetModule } from '../dataset/dataset.module';
import { QueryModule } from '../query/query.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Ai, AiSession]),
    DatasetModule,
    QueryModule,
  ],
  controllers: [AiController],
  providers: [AiService, AiSessionService, ChatService, ToolService],
  exports: [AiService, AiSessionService, ChatService, ToolService],
})
export class AiModule {}
