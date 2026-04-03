import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiController } from './ai.controller';
import { AiService } from './services/ai.service';
import { AiSessionService } from './services/ai-session.service';
import { ChatService } from './services/chat.service';
import { Ai } from './entities/ai.entity';
import { AiSession } from './entities/ai-session.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Ai, AiSession])],
  controllers: [AiController],
  providers: [AiService, AiSessionService, ChatService],
  exports: [AiService, AiSessionService, ChatService],
})
export class AiModule {}
