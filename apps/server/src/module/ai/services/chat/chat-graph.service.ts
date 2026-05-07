import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { BusinessException, ExceptionType } from '@/common/exceptions';
import { LoggerService } from '@/logger/logger.service';
import {
  HumanMessage,
  ToolMessage,
  type BaseMessage,
} from '@langchain/core/messages';
import { PromptTemplate } from '@langchain/core/prompts';
import {
  Command,
  END,
  GraphInterrupt,
  type GraphNode,
  MessagesValue,
  ReducedValue,
  START,
  StateGraph,
  StateSchema,
} from '@langchain/langgraph';
import { createDeepAgent, FilesystemBackend } from 'deepagents';
import { createMiddleware, type Tool } from 'langchain';
import path from 'path';
import { existsSync } from 'fs';
import { randomUUID } from 'crypto';
import * as z from 'zod/v4';
import {
  type AiAgentStreamChunk,
  type AiChatMode,
  type AiChatResumeDto,
  type AiChatScene,
  type AiInterruptPayload,
  type AiStreamOutputChunk,
  type InterruptContent,
  type YieldType,
} from '../../ai.types';
import { AiService } from '../ai.service';
import { AiSessionService } from '../ai-session.service';
import { AiSessionMessageService } from '../ai-session-message.service';
import { ChatCheckpointService } from './chat-checkpoint.service';
import { ChatContextService } from './chat-context.service';
import { ChatLlmService } from './chat-llm.service';
import { ChatPromptService } from './chat-prompt.service';
import { ToolService } from '../tool.service';
import {
  CHAT_BLACKLIST_TOOL_NAMES,
  CHAT_CORE_TOOL_NAMES,
  CHAT_DEMAND_SKILL_MAP,
  CHAT_DEMAND_TOOL_MAP,
  CHAT_WORKFLOW_TOOL_NAMES,
} from './chat.constants';

@Injectable()
export class ChatGraphService {
  // Graph 状态只保留对“本轮决策”有价值的信息，避免把业务持久化职责塞进状态机。
  private readonly state = new StateSchema({
    messages: MessagesValue,
    allowTools: new ReducedValue(z.array(z.string()).default([]), {
      reducer: (_current, nextStep) => nextStep,
    }),
    allowSkills: new ReducedValue(z.array(z.string()).default([]), {
      reducer: (_current, nextStep) => nextStep,
    }),
    isClarify: z.boolean().default(false),
  });

  constructor(
    private readonly aiService: AiService,
    private readonly toolService: ToolService,
    private readonly aiSessionService: AiSessionService,
    private readonly aiSessionMessageService: AiSessionMessageService,
    private readonly chatCheckpointService: ChatCheckpointService,
    private readonly chatContextService: ChatContextService,
    private readonly chatLlmService: ChatLlmService,
    private readonly chatPromptService: ChatPromptService,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Run the end-to-end streaming chat flow (graph, SSE chunks, sid persistence, error handling).
   */
  async *streamChat(
    aiId: string,
    message: string | undefined,
    sessionId: string,
    mode: AiChatMode = 'chat',
    scenes?: AiChatScene[],
    isResume: boolean = false,
    resumePayload?: AiChatResumeDto,
    signal?: AbortSignal,
  ): AsyncGenerator<AiStreamOutputChunk, void, unknown> {
    // 这两个闭包会在后续初始化；先给默认空实现，确保异常分支也可安全调用。
    let flushPendingSegment: () => Promise<void> = async () => {};
    let persistErrorSegment: (
      errorMessage: string,
    ) => Promise<void> = async () => {};

    try {
      const session = await this.aiSessionService.findOne(sessionId);
      const ai = await this.aiService.findOne(aiId);
      const llmConfig = this.chatLlmService.getLLMConfig(ai);
      const turnId = randomUUID();

      const agent = await this.createGraph(aiId, mode, scenes);

      if (!isResume && !message) {
        throw new InternalServerErrorException('初始化对话缺少 message');
      }

      if (message) {
        await this.aiSessionMessageService.persistSegment(
          this.aiSessionMessageService.createUserMessageSegment(
            session.id,
            turnId,
            message,
          ),
        );
      }

      if (isResume && resumePayload?.kind === 'interrupt_result') {
        await this.aiSessionMessageService.applyInterruptResumeResult(
          session.id,
          resumePayload,
        );
      }

      const contextResult =
        await this.chatContextService.manageContextBeforeStream({
          agent: agent as unknown as {
            getState: (config: {
              configurable: { thread_id: string };
            }) => Promise<{
              values?: Record<string, unknown>;
            }>;
            updateState: (
              config: { configurable: { thread_id: string } },
              values: Record<string, unknown>,
            ) => Promise<unknown>;
          },
          ai,
          llmConfig,
          threadId: session.id,
          sessionId: session.id,
        });

      for (const event of contextResult.events) {
        // 上下文治理状态只走 SSE，不写消息流渲染链。
        yield {
          type: 'context',
          data: event,
          done: false,
        };
      }

      const stream = await agent.stream(
        !isResume
          ? {
              messages: [new HumanMessage({ content: message })],
            }
          : new Command({
              resume:
                resumePayload ||
                (message
                  ? { kind: 'user_message', message }
                  : { kind: 'user_message' }),
            }),
        {
          streamMode: ['messages', 'values'],
          configurable: {
            thread_id: session.id,
          },
          signal,
        },
      );

      const blacklistToolCallIds: string[] = [];

      let currentSid = '';
      let lastType: YieldType | undefined;
      let pendingSegment: {
        sessionId: string;
        turnId: string;
        sid: string;
        messageType: YieldType | 'user';
        role?: string;
        contentText: string;
        contentJson?: Record<string, unknown>;
        metaJson?: Record<string, unknown>;
      } | null = null;

      flushPendingSegment = async () => {
        if (!pendingSegment) {
          return;
        }
        const hasText = !!pendingSegment.contentText?.trim();
        const hasJson = !!pendingSegment.contentJson;
        if (hasText || hasJson) {
          await this.aiSessionMessageService.persistSegment(pendingSegment);
        }
        pendingSegment = null;
      };

      const persistChunk = async (chunk: AiAgentStreamChunk) => {
        if (!chunk.type) {
          return;
        }

        if (!pendingSegment) {
          pendingSegment = this.aiSessionMessageService.createChunkSegment(
            session.id,
            turnId,
            chunk,
          );
          return;
        }

        if (
          pendingSegment.sid === chunk.sid &&
          pendingSegment.messageType === chunk.type
        ) {
          // 同 sid + 同类型持续聚合，保证“按段落库”而不是“按 token 落库”。
          pendingSegment = this.aiSessionMessageService.appendChunkToSegment(
            pendingSegment,
            chunk,
          );
          return;
        }

        await flushPendingSegment();
        pendingSegment = this.aiSessionMessageService.createChunkSegment(
          session.id,
          turnId,
          chunk,
        );
      };

      persistErrorSegment = async (errorMessage: string) => {
        await this.aiSessionMessageService.persistSegment({
          sessionId: session.id,
          turnId,
          sid: randomUUID(),
          messageType: 'error',
          role: 'act',
          contentText: errorMessage,
        });
      };

      for await (const [streamMode, chunk] of stream) {
        if (streamMode === 'values') {
          const interruptData = this.extractInterrupt(chunk);
          if (interruptData && interruptData?.[0]?.value) {
            currentSid = randomUUID();
            lastType = 'interrupt';
            const interruptChunk: AiAgentStreamChunk = {
              sid: currentSid,
              content: interruptData[0] as InterruptContent<AiInterruptPayload>,
              type: 'interrupt',
              done: false,
            };
            await persistChunk(interruptChunk);
            yield interruptChunk;
          }
          continue;
        }

        const token = chunk[0];
        const metadata = chunk[1];
        const { content, type } =
          this.getContentAndTypeWithStreamMessage(token);

        if (
          type === 'tool_call' &&
          CHAT_BLACKLIST_TOOL_NAMES.some((name) =>
            name.test(token.contentBlocks[0].name as string),
          )
        ) {
          // 黑名单工具调用不对前端回显，后续对应 tool_result 也一并忽略。
          blacklistToolCallIds.push(token.contentBlocks[0].id as string);
          continue;
        }

        if (content && type) {
          const messageType = token.type === 'tool' ? 'tool_result' : type;
          if (
            messageType === 'tool_result' &&
            blacklistToolCallIds.includes((token as ToolMessage).tool_call_id)
          ) {
            continue;
          }

          if (messageType !== lastType) {
            // 类型切换意味着开启新段，先落前一段再继续累积。
            await flushPendingSegment();
            currentSid = randomUUID();
            lastType = messageType as YieldType;
          }

          const meta = {
            tool_call:
              type === 'tool_call'
                ? {
                    id: token.contentBlocks[0].id as string,
                    name: token.contentBlocks[0].name as string,
                  }
                : undefined,
            tool_result:
              messageType === 'tool_result'
                ? { tool_call_id: (token as ToolMessage).tool_call_id }
                : undefined,
            role: metadata.lc_agent_name,
          };

          const messageChunk: AiAgentStreamChunk = {
            sid: currentSid,
            content,
            type: messageType as YieldType,
            done: false,
            role: metadata.lc_agent_name,
            meta,
          };

          await persistChunk(messageChunk);
          yield messageChunk;
        }
      }

      await flushPendingSegment();
      yield { sid: currentSid, content: '', done: true };
    } catch (error) {
      await flushPendingSegment();

      if (signal?.aborted || this.isAbortLikeError(error)) {
        return;
      }

      const errorMessage = error instanceof Error ? error.message : '未知错误';
      this.logger.error(
        'streamChat error',
        error instanceof Error ? error.stack : String(error),
      );
      await persistErrorSegment(errorMessage);

      yield {
        sid: randomUUID(),
        content: errorMessage,
        type: 'error',
        done: true,
        role: '',
      };

      throw new InternalServerErrorException(`流式对话失败: ${errorMessage}`);
    }
  }

  /**
   * Build and compile LangGraph with checkpoint support for resumable sessions.
   */
  private async createGraph(
    aiId: string,
    mode: AiChatMode,
    scenes?: AiChatScene[],
  ) {
    const ai = await this.aiService.findOne(aiId);
    const llmConfig = this.chatLlmService.getLLMConfig(ai);
    const graphBuilder = new StateGraph(this.state);

    graphBuilder
      // clarify 先做意图与工具范围收敛，再进入 act 执行。
      .addNode('clarify', this.createClarifyNode())
      .addNode('act', this.createActNode(llmConfig, mode, scenes))
      .addEdge(START, 'clarify')
      .addEdge('clarify', 'act')
      .addEdge('act', END);

    const checkpointer = await this.chatCheckpointService.getCheckpointer();
    return graphBuilder.compile({ checkpointer });
  }

  /**
   * Clarify node: infer user intent and narrow allowed tools/skills for this turn.
   */
  private createClarifyNode(): GraphNode<typeof this.state> {
    return async (state) => {
      const lastHumanMsg = state.messages
        .filter((msg) => msg instanceof HumanMessage)
        .at(-1);

      const maybeUserDemands: string[] = [];
      const content = (lastHumanMsg?.content as string) || '';
      const lowerContent = content.toLowerCase();

      const keywordMap: Record<string, string[]> = {
        'data-query': [
          '数据',
          '查询',
          '温度',
          '信息',
          'data',
          'query',
          'temperature',
          'info',
        ],
        'chart-recommend': [
          '图表',
          '画图',
          '推荐',
          'chart',
          'recommend',
          '图形',
        ],
      };

      for (const [demand, keywords] of Object.entries(keywordMap)) {
        if (keywords.some((keyword) => lowerContent.includes(keyword))) {
          maybeUserDemands.push(demand);
        }
      }

      if (!maybeUserDemands.length) {
        // 默认兜底到 convert-to-backend，保证 agent 至少有可执行路径。
        maybeUserDemands.push('convert-to-backend');
      }

      return {
        allowTools: Array.from(
          new Set([
            ...state.allowTools,
            ...maybeUserDemands
              .map((demand) => CHAT_DEMAND_TOOL_MAP[demand] || [])
              .flat(),
          ]),
        ),
        allowSkills: Array.from(
          new Set([
            ...state.allowSkills,
            ...maybeUserDemands.flatMap(
              (demand) => CHAT_DEMAND_SKILL_MAP[demand] || [demand],
            ),
          ]),
        ),
      };
    };
  }

  /**
   * Act node: execute with selected tools/skills and return generated messages.
   */
  private createActNode(
    llmConfig: ReturnType<ChatLlmService['getLLMConfig']>,
    mode: AiChatMode,
    scenes?: AiChatScene[],
  ): GraphNode<typeof this.state> {
    return async (state) => {
      const llm = this.chatLlmService.createLLM(llmConfig);

      const essentialTools = this.getEssentialToolNames(mode);
      // 非 agent 模式下先过滤 workflow 工具，再回补核心工具白名单。
      state.allowTools = this.sanitizeAllowedTools(state.allowTools, mode);
      essentialTools.forEach((tool) => {
        if (!state.allowTools.includes(tool)) {
          state.allowTools.push(tool);
        }
      });

      let tools: Tool[] = [];
      if (state.allowSkills?.includes('convert-to-backend')) {
        tools = this.toolService.getTools(essentialTools);
      } else {
        tools = this.toolService
          .getTools()
          .filter((tool) => state.allowTools?.includes(tool.name));
      }

      const prompt = await this.chatPromptService.loadActPrompt(mode);
      const promptTemplate = PromptTemplate.fromTemplate(prompt);
      const systemPrompt = await promptTemplate.format({
        recommendSkills:
          state.allowSkills
            ?.filter((skill) => skill !== 'convert-to-backend')
            .join(', ') || '',
        scenesContext: this.formatScenesContext(scenes),
      });

      const skillsRoot = path.join(__dirname, '../backend');

      if (!existsSync(skillsRoot)) {
        throw new InternalServerErrorException(`技能目录不存在: ${skillsRoot}`);
      }

      const backend = new FilesystemBackend({
        rootDir: skillsRoot,
        virtualMode: true,
      });

      const agent = createDeepAgent({
        model: llm,
        tools,
        systemPrompt,
        name: 'act',
        backend,
        middleware: [this.createCatchToolExceptionMiddleware()],
        skills: ['/skills/'],
      });

      const response = await agent.invoke({ messages: state.messages });
      return { messages: response.messages };
    };
  }

  /**
   * Wrap tool-call exceptions and convert recoverable errors to ToolMessage.
   */
  private createCatchToolExceptionMiddleware() {
    return createMiddleware({
      name: 'catchToolException',
      wrapToolCall: async (request, handler) => {
        try {
          return await handler(request);
        } catch (error) {
          if (this.isGraphInterruptLike(error)) {
            throw error;
          }

          const toolInvocationError = this.getToolInvocationError(error);
          if (error instanceof BusinessException) {
            this.logger.warn(error);
            return new ToolMessage({
              content: this.getRecoverableToolErrorMessage(error),
              tool_call_id: request.toolCall.id || '',
            });
          }

          if (toolInvocationError) {
            this.logger.warn(toolInvocationError);
            return new ToolMessage({
              content: `工具参数校验失败，请修正后重试。错误信息：${toolInvocationError.message}`,
              tool_call_id: request.toolCall.id || '',
            });
          }

          this.logger.error(error);
          return new ToolMessage({
            content: this.getRecoverableToolErrorMessage(error),
            tool_call_id: request.toolCall.id || '',
          });
        }
      },
    });
  }

  /**
   * Convert domain/tool exceptions into user-actionable error messages.
   */
  private getRecoverableToolErrorMessage(error: unknown): string {
    const toolInvocationError = this.getToolInvocationError(error);
    if (toolInvocationError) {
      return `工具参数校验失败，请修正后重试。错误信息：${toolInvocationError.message}`;
    }

    if (error instanceof BusinessException) {
      const response = error.getResponse();
      if (
        response &&
        typeof response === 'object' &&
        'message' in response &&
        typeof response.message === 'string'
      ) {
        return `工具执行失败，请根据错误信息调整后重试。错误信息：${response.message}`;
      }

      return `工具执行失败，请根据错误信息调整后重试。错误信息：${error.message}`;
    }

    if (error instanceof Error) {
      return `工具执行失败，请根据错误信息调整后重试。错误信息：${error.message}`;
    }

    return '工具执行失败，请调整参数或调用方式后重试。';
  }

  /**
   * Extract ToolInvocationError from error/cause chain for targeted handling.
   */
  private getToolInvocationError(error: unknown): Error | null {
    if (!(error instanceof Error)) {
      return null;
    }

    if (error.name === 'ToolInvocationError') {
      return error;
    }

    const cause = (error as Error & { cause?: unknown }).cause;
    if (cause instanceof Error && cause.name === 'ToolInvocationError') {
      return cause;
    }

    return null;
  }

  /**
   * Detect graph interrupt-like errors so they are bubbled up instead of swallowed.
   */
  private isGraphInterruptLike(error: unknown): boolean {
    if (error instanceof GraphInterrupt) {
      return true;
    }

    if (!(error instanceof Error)) {
      return false;
    }

    return (
      error.name === 'GraphInterrupt' ||
      error.name === 'GraphBubbleUp' ||
      error.name === 'NodeInterrupt'
    );
  }

  /**
   * Return mode-specific essential tools that must be available.
   */
  private getEssentialToolNames(mode: AiChatMode): string[] {
    if (mode === 'agent') {
      return [...CHAT_CORE_TOOL_NAMES, ...CHAT_WORKFLOW_TOOL_NAMES];
    }

    return [...CHAT_CORE_TOOL_NAMES];
  }

  /**
   * Sanitize allowed tools by mode (e.g. hide workflow tools in chat mode).
   */
  private sanitizeAllowedTools(
    toolNames: string[] | undefined,
    mode: AiChatMode,
  ): string[] {
    const tools = toolNames ?? [];
    if (mode === 'agent') {
      return tools;
    }

    return tools.filter(
      (toolName) => !CHAT_WORKFLOW_TOOL_NAMES.includes(toolName as never),
    );
  }

  /**
   * Serialize scene inputs into prompt-friendly context text.
   */
  private formatScenesContext(scenes: AiChatScene[] | undefined): string {
    if (!scenes || scenes.length === 0) {
      return '[]';
    }

    return JSON.stringify(scenes, null, 2);
  }

  /**
   * Extract LangGraph interrupt payload from values stream chunk.
   */
  private extractInterrupt(chunk: unknown): any | null {
    if (
      typeof chunk === 'object' &&
      chunk !== null &&
      '__interrupt__' in chunk
    ) {
      return (chunk as { __interrupt__: any }).__interrupt__;
    }
    return null;
  }

  /**
   * Normalize LangChain stream token into protocol-level type/content.
   */
  private getContentAndTypeWithStreamMessage(token: BaseMessage): {
    content: string;
    type?: string;
  } {
    const contentBlock = token.contentBlocks[0];
    switch (contentBlock?.type) {
      case 'text':
        return {
          content: contentBlock.text,
          type: 'text',
        };
      case 'tool_call':
        return {
          content: contentBlock.name,
          type: 'tool_call',
        };
      case 'reasoning':
        return {
          content: contentBlock.reasoning,
          type: 'reasoning',
        };
      default:
        return {
          content:
            (contentBlock?.[contentBlock?.type || 'text'] as string) || '',
          type: contentBlock?.type || 'text',
        };
    }
  }

  /**
   * Detect client-abort-like errors and avoid treating them as business failures.
   */
  private isAbortLikeError(error: unknown): boolean {
    if (!(error instanceof Error)) {
      return false;
    }

    const message = error.message.toLowerCase();
    return (
      error.name === 'AbortError' ||
      message.includes('aborted') ||
      message.includes('abort')
    );
  }
}
