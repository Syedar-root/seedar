import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiController } from './ai.controller';
import { AiService } from './services/ai.service';
import { AiSessionService } from './services/ai-session.service';
import { AiSessionMessageService } from './services/ai-session-message.service';
import { ChatCheckpointService } from './services/chat/chat-checkpoint.service';
import { ChatContextService } from './services/chat/chat-context.service';
import { ChatGraphService } from './services/chat/chat-graph.service';
import { ChatLlmService } from './services/chat/chat-llm.service';
import { ChatPromptService } from './services/chat/chat-prompt.service';
import { ChatService } from './services/chat/chat.service';
import { Ai } from './entities/ai.entity';
import { AiSession } from './entities/ai-session.entity';
import { AiSessionMessage } from './entities/ai-session-message.entity';
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
    ChatCheckpointService,
    ChatContextService,
    ChatGraphService,
    ChatLlmService,
    ChatPromptService,
    ChatService,
    ToolService,
  ],
  exports: [
    AiService,
    AiSessionService,
    AiSessionMessageService,
    ChatCheckpointService,
    ChatContextService,
    ChatGraphService,
    ChatLlmService,
    ChatPromptService,
    ChatService,
    ToolService,
  ],
})
export class AiModule {}

