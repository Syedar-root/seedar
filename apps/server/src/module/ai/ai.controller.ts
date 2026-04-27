import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  Header,
  Sse,
  RequestMethod,
} from '@nestjs/common';
import { AiService } from './services/ai.service';
import { ChatService } from './services/chat.service';
import { CreateAiRequest } from './dto/create-ai.request';
import { UpdateAiRequest } from './dto/update-ai.request';
import { AiResponse } from './dto/ai.response';
import {
  AiChatRequestDto,
  AiChatResponseDto,
  AiSessionResponse,
  CreateAiSessionRequest,
  GenerateFieldBusinessNameRequestDto,
  GenerateFieldBusinessNameResponseDto,
} from './dto';
import { AiChatResumeDto, AiChatScene, PaginatedResult } from './ai.types';
import { Observable } from 'rxjs';
import { AiSessionService } from './services';

@Controller('v1/ai')
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly chatService: ChatService,
    private readonly aiSessionService: AiSessionService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createAiDto: CreateAiRequest): Promise<AiResponse> {
    return this.aiService.create(createAiDto);
  }

  @Post('session')
  createSession(
    @Body() createSessionDto: CreateAiSessionRequest,
  ): Promise<AiSessionResponse> {
    return this.aiSessionService.create(createSessionDto);
  }

  @Get()
  findAll(
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ): Promise<PaginatedResult<AiResponse>> {
    return this.aiService.findAll(page, pageSize);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<AiResponse> {
    return this.aiService.findOne(id);
  }

  @Patch()
  update(@Body() updateAiDto: UpdateAiRequest): Promise<AiResponse> {
    return this.aiService.update(updateAiDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string): Promise<void> {
    return this.aiService.remove(id);
  }

  @Post('field-business-name')
  generateFieldBusinessName(
    @Body() dto: GenerateFieldBusinessNameRequestDto,
  ): Promise<GenerateFieldBusinessNameResponseDto> {
    return this.chatService.generateFieldBusinessName(dto);
  }

  @Sse('chat/stream', {
    method: RequestMethod.POST,
  })
  streamChat(@Body() dto: AiChatRequestDto): Observable<MessageEvent> {
    const timestamp = new Date().toISOString();
    const sessionId = dto.sessionId;
    const stream = this.chatService.streamChat(
      dto.aiId,
      dto.message,
      sessionId,
      dto.mode,
      dto.scenes as AiChatScene[] | undefined,
      dto.isResume,
      dto.resumePayload as AiChatResumeDto | undefined,
    );

    // 🔥 仅包装成 @Sse 要求的 Observable，内部逻辑完全是你的
    return new Observable((subscriber) => {
      // 心跳包（防Apifox断开，不影响你的逻辑）
      const ping = setInterval(() => {
        subscriber.next({ type: 'ping', data: '{}' } as MessageEvent);
      }, 3000);

      (async () => {
        try {
          // ✅ 你的 session 事件，完全原样保留
          subscriber.next({
            type: 'session',
            data: JSON.stringify({ sessionId, timestamp }),
          } as MessageEvent);

          // ✅ 你的流循环，100% 原代码！
          for await (const chunk of stream) {
            if (chunk.done) {
              subscriber.next({
                type: 'done',
                data: JSON.stringify({ sessionId }),
              } as MessageEvent);
              break;
            }
            subscriber.next({
              type: 'message',
              data: { ...chunk, sessionId },
            } as MessageEvent);
          }
        } catch (error) {
          // ✅ 你的错误处理，完全原样保留
          subscriber.next({
            type: 'error',
            data: JSON.stringify({
              error: error instanceof Error ? error.message : 'Unknown error',
            }),
          } as MessageEvent);
        } finally {
          clearInterval(ping);
          subscriber.complete();
        }
      })();

      // 断开清理
      return () => clearInterval(ping);
    });
  }
}
