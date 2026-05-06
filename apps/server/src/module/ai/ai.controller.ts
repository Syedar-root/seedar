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
  Req,
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
  streamChat(
    @Body() dto: AiChatRequestDto,
    @Req()
    req: {
      on: (event: string, cb: () => void) => void;
      once?: (event: string, cb: () => void) => void;
      socket?: {
        on?: (event: string, cb: () => void) => void;
        once?: (event: string, cb: () => void) => void;
      };
    },
  ): Observable<MessageEvent> {
    const timestamp = new Date().toISOString();
    const sessionId = dto.sessionId;

    return new Observable((subscriber) => {
      const abortController = new AbortController();
      const abortStream = () => {
        if (!abortController.signal.aborted) {
          abortController.abort();
        }
      };

      const bindOnce = (
        target:
          | {
              on?: (event: string, cb: () => void) => void;
              once?: (event: string, cb: () => void) => void;
            }
          | undefined,
        event: string,
      ) => {
        if (!target) {
          return;
        }

        if (typeof target.once === 'function') {
          target.once(event, abortStream);
          return;
        }

        if (typeof target.on === 'function') {
          target.on(event, abortStream);
        }
      };

      // req.close alone is not always reliable for SSE disconnects.
      bindOnce(req, 'aborted');
      bindOnce(req, 'close');
      bindOnce(req.socket, 'close');

      const stream = this.chatService.streamChat(
        dto.aiId,
        dto.message,
        sessionId,
        dto.mode,
        dto.scenes as AiChatScene[] | undefined,
        dto.isResume,
        dto.resumePayload as AiChatResumeDto | undefined,
        abortController.signal,
      );

      const ping = setInterval(() => {
        if (abortController.signal.aborted || subscriber.closed) {
          return;
        }
        subscriber.next({ type: 'ping', data: '{}' } as MessageEvent);
      }, 3000);

      (async () => {
        try {
          if (abortController.signal.aborted || subscriber.closed) {
            return;
          }

          subscriber.next({
            type: 'session',
            data: JSON.stringify({ sessionId, timestamp }),
          } as MessageEvent);

          for await (const chunk of stream) {
            if (abortController.signal.aborted || subscriber.closed) {
              break;
            }

            if (chunk.type === 'error') {
              subscriber.next({
                type: 'error',
                data: chunk,
              } as MessageEvent);
              break;
            }

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
          if (abortController.signal.aborted || subscriber.closed) {
            return;
          }

          subscriber.next({
            type: 'error',
            data: JSON.stringify(
              error instanceof Error ? error.message : 'Unknown error',
            ),
          } as MessageEvent);
        } finally {
          clearInterval(ping);
          if (!subscriber.closed) {
            subscriber.complete();
          }
        }
      })();

      return () => {
        abortStream();
        clearInterval(ping);
      };
    });
  }
}
