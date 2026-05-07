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
import { ChatService } from './services/chat/chat.service';
import { CreateAiRequest } from './dto/create-ai.request';
import { UpdateAiRequest } from './dto/update-ai.request';
import { AiResponse } from './dto/ai.response';
import {
  AiChatRequestDto,
  AiChatResponseDto,
  QueryAiSessionRequest,
  AiSessionResponse,
  AiSessionMessageResponse,
  CursorPaginatedResponse,
  CreateAiSessionRequest,
  PaginatedAiSessionResponse,
  GenerateFieldBusinessNameRequestDto,
  GenerateFieldBusinessNameResponseDto,
} from './dto';
import { AiChatResumeDto, AiChatScene, PaginatedResult } from './ai.types';
import { Observable } from 'rxjs';
import { AiSessionMessageService, AiSessionService } from './services';
import type { AiAgentStreamChunk } from '@seedar/types/ai';

@Controller('v1/ai')
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly chatService: ChatService,
    private readonly aiSessionService: AiSessionService,
    private readonly aiSessionMessageService: AiSessionMessageService,
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

  @Get('session')
  findAllSessions(
    @Query() query: QueryAiSessionRequest,
  ): Promise<PaginatedAiSessionResponse<AiSessionResponse>> {
    return this.aiSessionService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<AiResponse> {
    return this.aiService.findOne(id);
  }

  @Get('session/:id/messages')
  async listSessionMessages(
    @Param('id') id: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit: number = 50,
  ): Promise<CursorPaginatedResponse<AiSessionMessageResponse>> {
    const checkpointTuple = await this.chatService.getCheckpointTupleByThreadId(
      id,
    );
    const checkpointMessages =
      checkpointTuple?.checkpoint?.channel_values?.messages;
    return this.aiSessionMessageService.listBySessionOrRecover(
      id,
      cursor,
      limit,
      checkpointMessages,
    );
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

  @Delete('session/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeSession(@Param('id') id: string): Promise<void> {
    return this.aiSessionService.remove(id);
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
      const assistantTextParts: string[] = [];
      let firstAssistantTextSid: string | undefined;
      let streamDone = false;

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

            if (chunk.type === 'context') {
              subscriber.next({
                type: 'context',
                data: chunk.data,
              } as MessageEvent);
              continue;
            }

            if (chunk.type === 'error') {
              subscriber.next({
                type: 'error',
                data: chunk,
              } as MessageEvent);
              break;
            }

            if (chunk.done) {
              streamDone = true;
              subscriber.next({
                type: 'done',
                data: JSON.stringify({ sessionId, isOver: false }),
              } as MessageEvent);
              break;
            }

            if (
              (chunk as AiAgentStreamChunk).type === 'text' &&
              typeof (chunk as AiAgentStreamChunk).content === 'string'
            ) {
              const textChunk = chunk as AiAgentStreamChunk;
              if (!firstAssistantTextSid) {
                firstAssistantTextSid = textChunk.sid;
              }
              if (textChunk.sid === firstAssistantTextSid) {
                assistantTextParts.push(textChunk.content as string);
              }
            }

            subscriber.next({
              type: 'message',
              data: { ...chunk, sessionId },
            } as MessageEvent);
          }

          if (
            streamDone &&
            !abortController.signal.aborted &&
            !subscriber.closed &&
            sessionId &&
            dto.message
          ) {
            try {
              const title = await this.chatService.generateSessionTitleIfMissing({
                sessionId,
                aiId: dto.aiId,
                userMessage: dto.message,
                assistantMessage: assistantTextParts.join('').trim(),
              });

              if (title) {
                subscriber.next({
                  type: 'session_title',
                  data: JSON.stringify({ sessionId, title }),
                } as MessageEvent);
              }
            } catch {
              // Title generation failure should not affect chat stream lifecycle.
            }

            subscriber.next({
              type: 'done',
              data: JSON.stringify({ sessionId, isOver: true }),
            } as MessageEvent);
          } else if (
            streamDone &&
            !abortController.signal.aborted &&
            !subscriber.closed
          ) {
            subscriber.next({
              type: 'done',
              data: JSON.stringify({ sessionId, isOver: true }),
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

