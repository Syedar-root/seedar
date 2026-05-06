import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiController } from './ai.controller';
import { AiService } from './services/ai.service';
import { AiSessionService } from './services/ai-session.service';
import { AiSessionMessageService } from './services/ai-session-message.service';
import { ChatService } from './services/chat.service';
import { Ai } from './entities/ai.entity';
import { AiSession } from './entities/ai-session.entity';
import { AiSessionMessage } from './entities/ai-session-message.entity';
import { DatasetService } from '../dataset/services/dataset.service';
import { ToolService } from './services/tool.service';
import { DatasetModule } from '../dataset/dataset.module';
import { DatasourceModule } from '../datasource/datasource.module';
import { QueryModule } from '../query/query.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Ai, AiSession, AiSessionMessage]),
    DatasetModule,
    DatasourceModule,
    QueryModule,
  ],
  controllers: [AiController],
  providers: [
    AiService,
    AiSessionService,
    AiSessionMessageService,
    ChatService,
    ToolService,
  ],
  exports: [
    AiService,
    AiSessionService,
    AiSessionMessageService,
    ChatService,
    ToolService,
  ],
})
export class AiModule {}
