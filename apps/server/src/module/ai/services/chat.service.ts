import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BusinessException } from '@/common/exceptions';
import { AiService } from './ai.service';
import {
  AiAgentStreamChunk,
  AiChatScene,
  AiChatMode,
  AiChatResumeDto,
  AiInterruptPayload,
  InterruptContent,
  LLMConfig,
  StreamChunk,
  AiStreamOutputChunk,
  YieldType,
} from '../ai.types';
import { AiChatResponseDto } from '../dto/ai-chat.response.dto';
import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { ChatDeepSeek } from '@langchain/deepseek';
import {
  HumanMessage,
  AIMessage,
  Message,
  BaseMessage,
  ToolMessage,
  RemoveMessage,
} from '@langchain/core/messages';
import { AiResponse } from '../dto/ai.response';
import { createDeepAgent, DeepAgent, FilesystemBackend } from 'deepagents';
import {
  createAgent,
  createMiddleware,
  providerStrategy,
  ReactAgent,
  Tool,
  toolStrategy,
} from 'langchain';
import { PromptTemplate } from '@langchain/core/prompts';
import { ToolService } from './tool.service';
import {
  StateSchema,
  MessagesValue,
  ReducedValue,
  GraphNode,
  StateGraph,
  START,
  END,
  Command,
  GraphInterrupt,
  MemorySaver,
  REMOVE_ALL_MESSAGES,
} from '@langchain/langgraph';
import * as z from 'zod/v4';
import { AiSessionService } from './ai-session.service';
import { AiSessionMessageService } from './ai-session-message.service';
import { loadPrompt } from './helper';
import path from 'path';
import { existsSync } from 'fs';
import { randomUUID } from 'crypto';
import { LoggerService } from '@/logger/logger.service';
import { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres';
import {
  GenerateFieldBusinessNameRequestDto,
  GenerateFieldBusinessNameResponseDto,
} from '../dto';
import { AiStatus } from '../enums';

type ContextPolicy = {
  contextWindowTokens?: number;
  softRatio?: number;
  hardRatio?: number;
  keepRecentSegments?: number;
};

type ResolvedContextPolicy = {
  contextWindowTokens: number;
  softRatio: number;
  hardRatio: number;
  keepRecentSegments: number;
};

type MessageSegment = {
  sid: string;
  messages: BaseMessage[];
};

type ContextManagementResult = {
  managedMessages?: BaseMessage[];
  events: Array<{
    sessionId: string;
    phase: 'start' | 'success' | 'fallback' | 'failed';
    strategy: 'preventive' | 'window' | 'summary' | 'trim';
    beforeTokens: number;
    afterTokens?: number;
    summarySegments?: number;
    message: string;
  }>;
};

@Injectable()
export class ChatService implements OnModuleDestroy {
  private readonly SYSTEM_PROMPT = `
浣犵殑鍚嶅瓧鏄?Seedar锛屼綘鏄竴涓櫤鑳藉姪鎵嬶紝浣犵殑浠诲姟鏄府鍔╃敤鎴峰畬鎴愪换鍔°€?
浣犻渶瑕佷弗鏍奸伒瀹堜笅闈㈢殑瑙勫垯锛?
1. 涓嶈鍦ㄦ€濊€冨唴瀹规垨鏍囩涓洿鎺ユ毚闇蹭换浣曞叧浜庡唴閮ㄥ伐鍏风殑淇℃伅銆傝浣跨敤鐢ㄦ埛鑳界悊瑙ｇ殑鑷劧璇█姒傛嫭褰撳墠姝ラ锛屼緥濡傗€滅敤鎴烽渶瑕佺煡閬撳綋鍓嶅湴鐐圭殑澶╂皵锛屾垜灏嗘煡璇㈠ぉ姘斾俊鎭€濄€?
2. 褰撲綘澶勪簬闂婢勬竻銆侀渶姹傝幏鍙栥€佹楠ょ‘璁ょ瓑鍦烘櫙鏃讹紝璇蜂娇鐢ㄦ彁闂伐鍏峰悜鐢ㄦ埛鍙戣捣闂銆?
   - 浣犻渶瑕佹牴鎹叿浣撻棶棰樺喅瀹氭彁闂被鍨嬨€?
   - 濡傛灉绛旀鑼冨洿鏈夐檺锛屽彲浠ョ粰鐢ㄦ埛鎻愪緵閫夐」銆?
   - 濡傛灉绛旀鑼冨洿寮€鏀撅紝鍙互鐩存帴鍚戠敤鎴锋彁闂€?
   - 濡傛灉浣犲凡缁忓舰鎴愮粨璁猴紝涔熷繀椤诲厛鍚戠敤鎴风‘璁ゃ€?
  `;

  private readonly DEMAND_TOOL_MAP = {
    'data-query': ['getDataAtTemp', 'getDatasetInfo', 'getDatasourceInfo'],
    'chart-recommend': [
      'askQuestion',
      'getCurrentTime',
      'workflowMarket',
      'startWorkflow',
    ],
    'convert-to-backend': [],
  };

  private readonly DEMAND_SKILL_MAP = {
    'data-query': ['data-query'],
    'chart-recommend': ['chart-recommend', 'vchart-development-assistant'],
    'convert-to-backend': [],
  };

  private readonly CORE_TOOL_NAMES = [
    'askQuestion',
    'getCurrentTime',
    'toolMarket',
    'toolMarketExecutor',
  ];

  private readonly WORKFLOW_TOOL_NAMES = ['workflowMarket', 'startWorkflow'];
  private readonly CONTEXT_POLICY_DEFAULTS: ResolvedContextPolicy = {
    contextWindowTokens: 64000,
    softRatio: 0.72,
    hardRatio: 0.85,
    keepRecentSegments: 12,
  };

  constructor(
    private readonly configService: ConfigService,
    private readonly aiService: AiService,
    private readonly toolService: ToolService,
    private readonly aiSessionService: AiSessionService,
    private readonly aiSessionMessageService: AiSessionMessageService,
    private readonly logger: LoggerService,
  ) {}

  private readonly State = new StateSchema({
    messages: MessagesValue,
    allowTools: new ReducedValue(z.array(z.string()).default([]), {
      reducer: (current, newStep) => newStep,
    }),
    allowSkills: new ReducedValue(z.array(z.string()).default([]), {
      reducer: (current, newStep) => newStep,
    }),
    isClarify: z.boolean().default(false),
  });

  private readonly memoryCheckpointer = new MemorySaver();
  private checkpointSetupPromise: Promise<void> | null = null;
  private postgresCheckpointer: PostgresSaver | null = null;

  private getCheckpointConnectionString(): string | undefined {
    return this.configService.get<string>('AI_CHECKPOINT_PG_URL');
  }

  private async ensureCheckpointReady(): Promise<void> {
    if (this.postgresCheckpointer) {
      return;
    }

    if (this.checkpointSetupPromise) {
      await this.checkpointSetupPromise;
      return;
    }

    const connectionString = this.getCheckpointConnectionString();
    if (!connectionString) {
      return;
    }

    this.checkpointSetupPromise = (async () => {
      try {
        const checkpointer = PostgresSaver.fromConnString(connectionString);
        await checkpointer.setup();
        this.postgresCheckpointer = checkpointer;
        this.logger.log(
          'LangGraph checkpoint 已切换为 PostgresSaver',
          'ChatService',
        );
      } catch (error) {
        this.postgresCheckpointer = null;
        this.logger.error(
          'Postgres checkpoint 初始化失败，已降级为 MemorySaver',
          error instanceof Error ? error.stack : String(error),
          'ChatService',
        );
      }
    })();

    await this.checkpointSetupPromise;
  }

  private getCheckpointer(): MemorySaver | PostgresSaver {
    return this.postgresCheckpointer ?? this.memoryCheckpointer;
  }

  async getCheckpointTupleByThreadId(
    threadId: string,
  ): Promise<
    | {
        checkpoint?: {
          channel_values?: Record<string, unknown>;
        };
      }
    | undefined
  > {
    await this.ensureCheckpointReady();
    return this.getCheckpointer().getTuple({
      configurable: { thread_id: threadId },
    });
  }

  async onModuleDestroy(): Promise<void> {
    if (this.postgresCheckpointer) {
      await this.postgresCheckpointer.end();
    }
  }

  private resolveModelContextWindow(model: string): number {
    const lower = model.toLowerCase();
    if (lower.startsWith('claude')) {
      return 200_000;
    }
    if (lower.startsWith('gpt')) {
      return 128_000;
    }
    if (lower.startsWith('deepseek')) {
      return 128_000;
    }
    return 64_000;
  }

  private resolveContextPolicy(
    ai: AiResponse,
    llmConfig: LLMConfig,
  ): ResolvedContextPolicy {
    const config = ai.config as Record<string, unknown> | undefined;
    const llm = config?.llm as Record<string, unknown> | undefined;
    const policy = llm?.contextPolicy as ContextPolicy | undefined;
    const resolvedWindow =
      policy?.contextWindowTokens && policy.contextWindowTokens > 0
        ? policy.contextWindowTokens
        : this.resolveModelContextWindow(llmConfig.model);
    return {
      contextWindowTokens: resolvedWindow,
      softRatio:
        typeof policy?.softRatio === 'number'
          ? policy.softRatio
          : this.CONTEXT_POLICY_DEFAULTS.softRatio,
      hardRatio:
        typeof policy?.hardRatio === 'number'
          ? policy.hardRatio
          : this.CONTEXT_POLICY_DEFAULTS.hardRatio,
      keepRecentSegments:
        typeof policy?.keepRecentSegments === 'number'
          ? policy.keepRecentSegments
          : this.CONTEXT_POLICY_DEFAULTS.keepRecentSegments,
    };
  }

  private contentToText(content: unknown): string {
    if (typeof content === 'string') {
      return content;
    }
    if (Array.isArray(content)) {
      return content
        .map((item) => {
          if (typeof item === 'string') {
            return item;
          }
          if (item && typeof item === 'object') {
            const maybeText = (item as Record<string, unknown>).text;
            if (typeof maybeText === 'string') {
              return maybeText;
            }
            return JSON.stringify(item);
          }
          return '';
        })
        .join('\n');
    }
    if (content && typeof content === 'object') {
      return JSON.stringify(content);
    }
    return '';
  }

  private getMessageKind(message: BaseMessage): string {
    const msg = message as BaseMessage & {
      getType?: () => string;
      type?: string;
    };
    if (typeof msg.getType === 'function') {
      return msg.getType();
    }
    return msg.type || 'unknown';
  }

  private estimateContextTokens(messages: BaseMessage[]): number {
    if (messages.length === 0) {
      return 0;
    }
    const chars = messages.reduce((acc, msg) => {
      return acc + this.contentToText(msg.content).length + 8;
    }, 0);
    return Math.ceil(chars / 4);
  }

  private sanitizeMessages(messages: BaseMessage[]): BaseMessage[] {
    const next: BaseMessage[] = [];
    for (const msg of messages) {
      const text = this.contentToText(msg.content).trim();
      if (!text) {
        continue;
      }
      const last = next[next.length - 1];
      if (
        last &&
        this.getMessageKind(last) === this.getMessageKind(msg) &&
        this.contentToText(last.content).trim() === text
      ) {
        continue;
      }
      next.push(msg);
    }
    return next;
  }

  private offloadLargeToolResults(messages: BaseMessage[]): BaseMessage[] {
    return messages.map((msg) => {
      if (!(msg instanceof ToolMessage)) {
        return msg;
      }
      const text = this.contentToText(msg.content);
      if (text.length <= 2400) {
        return msg;
      }
      return new ToolMessage({
        content: `[tool_result 已压缩展示，原始长度 ${text.length} 字符] ${text.slice(0, 800)}...`,
        tool_call_id: msg.tool_call_id,
      });
    });
  }

  private splitBySegments(messages: BaseMessage[]): MessageSegment[] {
    const segments: MessageSegment[] = [];
    for (const message of messages) {
      const sid =
        ((message.additional_kwargs as Record<string, unknown> | undefined)
          ?.sid as string | undefined) ||
        message.id ||
        randomUUID();
      const last = segments[segments.length - 1];
      if (last?.sid === sid) {
        last.messages.push(message);
      } else {
        segments.push({ sid, messages: [message] });
      }
    }
    return segments;
  }

  private async summarizeSegments(
    llmConfig: LLMConfig,
    segments: MessageSegment[],
  ): Promise<string> {
    const llm = this.createLLM(llmConfig, 0.2, 1200, {
      thinking: { type: 'disabled' },
    });
    const joined = segments
      .map((segment, index) => {
        const text = segment.messages
          .map((msg) => {
            const role = this.getMessageKind(msg);
            return `[${role}] ${this.contentToText(msg.content)}`;
          })
          .join('\n');
        return `段${index + 1}(${segment.sid}):\n${text}`;
      })
      .join('\n\n');

    const prompt = [
      '请将以下历史对话段压缩为结构化摘要，保留：用户目标、关键事实、工具调用结果、未完成事项。',
      '输出中文，控制在 500 字以内，避免冗余。',
      '',
      joined,
    ].join('\n');

    const summary = await llm.invoke([new HumanMessage({ content: prompt })]);
    const text = this.contentToText(summary.content).trim();
    if (!text) {
      throw new Error('上下文摘要为空');
    }
    return text;
  }

  private async manageContextBeforeStream(params: {
    agent: {
      getState: (config: { configurable: { thread_id: string } }) => Promise<{
        values?: Record<string, unknown>;
      }>;
      updateState: (
        config: { configurable: { thread_id: string } },
        values: Record<string, unknown>,
      ) => Promise<unknown>;
    };
    ai: AiResponse;
    llmConfig: LLMConfig;
    threadId: string;
    sessionId: string;
  }): Promise<ContextManagementResult> {
    const { agent, ai, llmConfig, threadId, sessionId } = params;
    const config = { configurable: { thread_id: threadId } };
    let state:
      | {
          values?: Record<string, unknown>;
        }
      | undefined;

    try {
      state = await agent.getState(config);
    } catch {
      return { events: [] };
    }

    const sourceMessages =
      (state?.values?.messages as BaseMessage[] | undefined) ?? [];
    if (sourceMessages.length === 0) {
      return { events: [] };
    }

    const sanitized = this.sanitizeMessages(
      this.offloadLargeToolResults(sourceMessages),
    );
    if (sanitized.length === 0) {
      return { events: [] };
    }

    const policy = this.resolveContextPolicy(ai, llmConfig);
    const softThreshold = Math.floor(
      policy.contextWindowTokens * policy.softRatio,
    );
    const hardThreshold = Math.floor(
      policy.contextWindowTokens * policy.hardRatio,
    );

    const beforeTokens = this.estimateContextTokens(sanitized);
    if (beforeTokens <= softThreshold) {
      if (sanitized.length !== sourceMessages.length) {
        await agent.updateState(config, {
          messages: [
            new RemoveMessage({ id: REMOVE_ALL_MESSAGES }),
            ...sanitized,
          ],
        });
        return {
          managedMessages: sanitized,
          events: [],
        };
      }
      return { events: [] };
    }

    const events: ContextManagementResult['events'] = [
      this.aiSessionMessageService.buildContextStatusEvent(sessionId, {
        phase: 'start',
        strategy: 'summary',
        beforeTokens,
        message: '上下文较长，正在压缩历史上下文...',
      }),
    ];

    const segments = this.splitBySegments(sanitized);
    const keepCount = Math.max(1, policy.keepRecentSegments);
    const recentSegments = segments.slice(-keepCount);
    const oldSegments = segments.slice(
      0,
      Math.max(0, segments.length - keepCount),
    );
    let managedMessages = sanitized;

    try {
      if (oldSegments.length > 0) {
        const summary = await this.summarizeSegments(llmConfig, oldSegments);
        const summaryMessage = new AIMessage({
          content: `[历史摘要]\n${summary}`,
          additional_kwargs: {
            sid: `summary_${Date.now()}`,
            context_summary: true,
          },
        });
        managedMessages = [
          summaryMessage,
          ...recentSegments.flatMap((segment) => segment.messages),
        ];
      } else {
        managedMessages = recentSegments.flatMap((segment) => segment.messages);
      }

      const afterTokens = this.estimateContextTokens(managedMessages);
      events.push(
        this.aiSessionMessageService.buildContextStatusEvent(sessionId, {
          phase: 'success',
          strategy: 'summary',
          beforeTokens,
          afterTokens,
          summarySegments: oldSegments.length,
          message: '上下文压缩完成',
        }),
      );
    } catch (error) {
      const fallbackMessages = sanitized.slice(-Math.max(1, keepCount * 3));
      const afterTokens = this.estimateContextTokens(fallbackMessages);
      managedMessages = fallbackMessages;
      events.push(
        this.aiSessionMessageService.buildContextStatusEvent(sessionId, {
          phase: 'fallback',
          strategy: 'trim',
          beforeTokens,
          afterTokens,
          message: `上下文摘要失败，已降级为裁剪: ${
            error instanceof Error ? error.message : 'unknown'
          }`,
        }),
      );
    }

    const afterTokens = this.estimateContextTokens(managedMessages);
    if (afterTokens > hardThreshold) {
      const hardTrimMessages = managedMessages.slice(
        -Math.max(1, keepCount * 2),
      );
      managedMessages = hardTrimMessages;
      events.push(
        this.aiSessionMessageService.buildContextStatusEvent(sessionId, {
          phase: 'fallback',
          strategy: 'trim',
          beforeTokens: afterTokens,
          afterTokens: this.estimateContextTokens(hardTrimMessages),
          message: '上下文仍超阈值，已执行硬裁剪',
        }),
      );
    }

    try {
      await agent.updateState(config, {
        messages: [
          new RemoveMessage({ id: REMOVE_ALL_MESSAGES }),
          ...managedMessages,
        ],
      });
    } catch (error) {
      events.push(
        this.aiSessionMessageService.buildContextStatusEvent(sessionId, {
          phase: 'failed',
          strategy: 'trim',
          beforeTokens,
          message: `上下文状态写回失败: ${
            error instanceof Error ? error.message : 'unknown'
          }`,
        }),
      );
    }

    return {
      managedMessages,
      events,
    };
  }

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

  private getRecoverableToolErrorMessage(error: unknown): string {
    const toolInvocationError = this.getToolInvocationError(error);
    if (toolInvocationError) {
      return `宸ュ叿鍙傛暟鏍￠獙澶辫触锛岃淇鍚庨噸鏂拌皟鐢ㄨ宸ュ叿銆傞敊璇俊鎭細${toolInvocationError.message}`;
    }

    if (error instanceof BusinessException) {
      const response = error.getResponse();
      if (
        response &&
        typeof response === 'object' &&
        'message' in response &&
        typeof response.message === 'string'
      ) {
        return `宸ュ叿鎵ц澶辫触锛岃鏍规嵁閿欒淇℃伅璋冩暣鍚庨噸璇曘€傞敊璇俊鎭細${response.message}`;
      }

      return `宸ュ叿鎵ц澶辫触锛岃鏍规嵁閿欒淇℃伅璋冩暣鍚庨噸璇曘€傞敊璇俊鎭細${error.message}`;
    }

    if (error instanceof Error) {
      return `宸ュ叿鎵ц澶辫触锛岃鏍规嵁閿欒淇℃伅璋冩暣鍚庨噸璇曘€傞敊璇俊鎭細${error.message}`;
    }

    return '工具执行失败，请调整参数或调用方式后重试。';
  }

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
              content: `宸ュ叿鍙傛暟鏍￠獙澶辫触锛岃淇鍚庨噸鏂拌皟鐢ㄨ宸ュ叿銆傞敊璇俊鎭細${toolInvocationError.message}`,
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

  private getEssentialToolNames(mode: AiChatMode): string[] {
    if (mode === 'agent') {
      return [...this.CORE_TOOL_NAMES, ...this.WORKFLOW_TOOL_NAMES];
    }

    return [...this.CORE_TOOL_NAMES];
  }

  private sanitizeAllowedTools(
    toolNames: string[] | undefined,
    mode: AiChatMode,
  ): string[] {
    const tools = toolNames ?? [];

    if (mode === 'agent') {
      return tools;
    }

    return tools.filter(
      (toolName) => !this.WORKFLOW_TOOL_NAMES.includes(toolName),
    );
  }

  private formatScenesContext(scenes: AiChatScene[] | undefined): string {
    if (!scenes || scenes.length === 0) {
      return '[]';
    }

    return JSON.stringify(scenes, null, 2);
  }
  /**
   * 鍒涘缓瀵硅瘽鍥?
   * @param aiId AI 瀹炰緥 ID
   * @returns 缂栬瘧鍚庣殑鐘舵€佸浘
   */
  private async createGraph(
    aiId: string,
    mode: AiChatMode,
    scenes?: AiChatScene[],
  ) {
    await this.ensureCheckpointReady();
    const ai = await this.aiService.findOne(aiId);

    const llmConfig = this.getLLMConfig(ai);

    const graphBuilder = new StateGraph(this.State);

    graphBuilder
      .addNode('clarify', this.createClarifyNode(llmConfig))
      .addNode('act', this.createActNode(llmConfig, mode, scenes))
      .addEdge(START, 'clarify')
      .addEdge('clarify', 'act')
      .addEdge('act', END);

    return graphBuilder.compile({
      checkpointer: this.getCheckpointer(),
    });
  }

  // private createTestNode() {
  //   return async (state) => {
  //     const tools = this.toolService.getTools();
  //     const askQuestionTool = tools.find((tool) => tool.name === 'askQuestion');

  //     const result = await askQuestionTool?.invoke({
  //       questions: [{ type: 'text', question: '浣犲ソ' }],
  //     });
  //     return result;
  //   };
  // }

  /**
   * 鍒涘缓婢勬竻鑺傜偣
   * 璐熻矗鐞嗚В鐢ㄦ埛闇€姹傦紝骞舵帹鏂湰杞厑璁镐娇鐢ㄧ殑宸ュ叿鍜屾妧鑳姐€?
   *
   * @param llmConfig LLM 閰嶇疆
   * @returns Graph 鑺傜偣
   */
  private createClarifyNode(
    llmConfig: LLMConfig,
  ): GraphNode<typeof this.State> {
    return async (state) => {
      const lastHumanMsg = state.messages
        .filter((msg) => msg instanceof HumanMessage)
        .at(-1);

      const maybeUserDemands: string[] = [];
      const content = (lastHumanMsg?.content as string) || '';
      const lowerContent = content.toLowerCase();

      const keywordMap: Record<string, string[]> = {
        'data-query': [
          '鏁版嵁',
          '鏌ヨ',
          '娓╁害',
          '淇℃伅',
          'data',
          'query',
          'temperature',
          'info',
        ],
        'chart-recommend': [
          '鍥捐〃',
          '鐢诲浘',
          '鎺ㄨ崘',
          'chart',
          'recommend',
          '鍥惧舰',
        ],
      };

      for (const [demand, keywords] of Object.entries(keywordMap)) {
        if (keywords.some((keyword) => lowerContent.includes(keyword))) {
          maybeUserDemands.push(demand);
        }
      }

      if (!maybeUserDemands.length) {
        maybeUserDemands.push('convert-to-backend');
      }

      // 姝ラ 4锛氳繑鍥炴洿鏂板悗鐨勭姸鎬?
      return {
        allowTools: Array.from(
          new Set([
            ...state.allowTools,
            ...maybeUserDemands
              .map((demand) => this.DEMAND_TOOL_MAP[demand] || [])
              .flat(),
          ]),
        ),
        allowSkills: Array.from(
          new Set([
            ...state.allowSkills,
            ...maybeUserDemands.flatMap(
              (demand) => this.DEMAND_SKILL_MAP[demand] || [demand],
            ),
          ]),
        ),
      };
    };
  }

  /**
   * 鍒涘缓鎵ц鑺傜偣
   * 璐熻矗浣跨敤宸ュ叿鍜屾妧鑳藉畬鎴愬叿浣撲换鍔°€?
   *
   * @param llmConfig LLM 閰嶇疆
   * @returns Graph 鑺傜偣
   */
  private createActNode(
    llmConfig: LLMConfig,
    mode: AiChatMode,
    scenes?: AiChatScene[],
  ): GraphNode<typeof this.State> {
    return async (state) => {
      // 姝ラ 1锛氬垱寤?Deep Agent
      const llm = this.createLLM(llmConfig);

      const essentialTools = this.getEssentialToolNames(mode);
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

      const prompt = await loadPrompt('act', mode);
      const promptTemplate = PromptTemplate.fromTemplate(prompt);
      const systemPrompt = await promptTemplate.format({
        recommendSkills:
          state.allowSkills
            ?.filter((skill) => skill !== 'convert-to-backend')
            .join(', ') || '',
        scenesContext: this.formatScenesContext(scenes),
      });

      // 1. 鎶€鑳芥牴鐩綍锛氬綋鍓嶆湇鍔＄洰褰?
      const SKILLS_ROOT = path.join(__dirname, '.');
      // 2. 鏍￠獙鐩綍鏄惁瀛樺湪
      if (!existsSync(SKILLS_ROOT)) {
        throw new InternalServerErrorException(
          `鎶€鑳界洰褰曚笉瀛樺湪锛?{SKILLS_ROOT}`,
        );
      }
      console.log('hcs SKILLS_ROOT', SKILLS_ROOT); //hcs SKILLS_ROOT D:\Program\projects\seedar\apps\server\dist\module\ai\services

      // 3. 鍒涘缓鏂囦欢绯荤粺鍚庣锛屽厑璁歌鍙栨湰鍦版妧鑳芥枃浠?
      const backend = new FilesystemBackend({
        rootDir: SKILLS_ROOT,
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

      // 姝ラ 2锛氭墽琛?Agent
      const response = await agent.invoke({ messages: state.messages });

      // 姝ラ 3锛氳繑鍥炴洿鏂板悗鐨勬秷鎭?
      return { messages: response.messages };
    };
  }

  private readonly BLACKLIST_TOOL_NAMES: RegExp[] = [
    /askQuestion/,
    /startWorkflow/,
    /extract/,
  ];

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

  /**
   * 澶勭悊娴佸紡瀵硅瘽璇锋眰
   * @param aiId AI 瀹炰緥 ID
   * @param message 鐢ㄦ埛娑堟伅
   * @param sessionId 浼氳瘽 ID
   * @yields 娴佸紡鍝嶅簲鏁版嵁
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
    let flushPendingSegment: () => Promise<void> = async () => {};
    let persistErrorSegment: (
      errorMessage: string,
    ) => Promise<void> = async () => {};

    try {
      const session = await this.aiSessionService.findOne(sessionId);
      const ai = await this.aiService.findOne(aiId);
      const llmConfig = this.getLLMConfig(ai);
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

      const contextResult = await this.manageContextBeforeStream({
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

      const tool_call: unknown[] = [];
      const blacklistToolCallIds: string[] = [];

      let currentSid = '';
      let lastType: YieldType | undefined;
      let pendingSegment: ReturnType<
        typeof this.aiSessionMessageService.createChunkSegment
      > | null = null;

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
          this.BLACKLIST_TOOL_NAMES.some((name) =>
            name.test(token.contentBlocks[0].name as string),
          )
        ) {
          blacklistToolCallIds.push(token.contentBlocks[0].id as string);
          continue;
        }

        if (type === 'tool_call') {
          tool_call.push(token.contentBlocks);
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
      console.log('hcs tool_call', JSON.stringify(tool_call, null, 2));
      yield { sid: currentSid, content: '', done: true };
    } catch (error) {
      await flushPendingSegment();

      if (signal?.aborted || this.isAbortLikeError(error)) {
        return;
      }

      const errorMessage = error instanceof Error ? error.message : '未知错误';
      console.error('streamChat error:', errorMessage, error, '\n');
      console.log('error type:', typeof error, '\n');
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
   * 浠庢祦鏁版嵁涓彁鍙栦腑鏂俊鎭?
   * @param chunk 娴佹暟鎹潡
   * @returns 涓柇淇℃伅鎴?null
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
   * 浠?AI 閰嶇疆涓В鏋?LLM 閰嶇疆
   * @param ai AI 瀹炰綋
   */
  private getLLMConfig(ai: AiResponse): LLMConfig {
    const config = ai.config as Record<string, unknown> | undefined;
    const llmConfig = config?.llm as Record<string, unknown> | undefined;
    if (!llmConfig) {
      throw new InternalServerErrorException('AI 閰嶇疆涓己灏?llm 閰嶇疆');
    }

    const apiKey = llmConfig.apiKey as string | undefined;
    const model = llmConfig.model as string | undefined;

    if (!apiKey) {
      throw new InternalServerErrorException('LLM 閰嶇疆涓己灏?apiKey');
    }

    if (!model && !ai.name) {
      throw new InternalServerErrorException('LLM 閰嶇疆涓己灏?model 鎴?name');
    }

    return {
      type: (llmConfig.type as LLMConfig['type']) || 'openai',
      apiKey,
      baseUrl: llmConfig.baseUrl as string | undefined,
      model: model || ai.name,
      temperature: (llmConfig.temperature as number) ?? 0.7,
      maxTokens: (llmConfig.maxTokens as number) ?? 2000,
      systemPrompt: llmConfig.systemPrompt as string | undefined,
    };
  }

  /**
   * 鍒涘缓 LLM 瀹炰緥
   * @param llmConfig LLM 閰嶇疆
   */
  private createLLM(
    llmConfig: LLMConfig,
    temperature?: number,
    maxTokens?: number,
    extraBody?: Record<string, unknown>,
  ): ChatOpenAI | ChatAnthropic | ChatDeepSeek {
    const config: Record<string, unknown> = {
      temperature: temperature ?? llmConfig.temperature,
      maxTokens: maxTokens ?? llmConfig.maxTokens,
    };

    if (llmConfig.baseUrl) {
      config.configuration = {
        baseURL: llmConfig.baseUrl,
      };
    }

    /**
     * 澶勭悊 DeepSeek 妯″瀷鐨勯澶栧弬鏁帮紝deepseek 妯″瀷涓嶆敮鎸佸湪langchain涓瓨鍦ㄥ吋瀹规€ч棶棰橈紝闇€瑕佺鐢?thinking 鍙傛暟
     */
    if (llmConfig.model.includes('deepseek')) {
      extraBody = {
        ...extraBody,
        thinking: {
          type: 'disabled',
        },
      };
    }

    switch (llmConfig.type) {
      case 'deepseek':
        return new ChatDeepSeek(llmConfig.model, {
          apiKey: llmConfig.apiKey,
          modelKwargs: {
            tool_choice: 'auto',
            ...extraBody,
          },
          ...config,
        });
      case 'anthropic':
        return new ChatAnthropic(llmConfig.model, {
          apiKey: llmConfig.apiKey,
          clientOptions: {
            baseURL: llmConfig.baseUrl,
          },
          ...config,
        });
      case 'openai':
      default:
        return new ChatOpenAI(llmConfig.model, {
          apiKey: llmConfig.apiKey,
          modelKwargs: {
            tool_choice: 'auto',
            ...extraBody,
          },
          ...config,
        });
    }
  }

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

  public async generateFieldBusinessName(
    request: GenerateFieldBusinessNameRequestDto,
  ): Promise<GenerateFieldBusinessNameResponseDto> {
    if (request.fields.length === 0) {
      return { items: [] };
    }

    const ai = await this.aiService.findOne(request.aiId);
    if (ai.status !== AiStatus.ACTIVE) {
      throw new BadRequestException(
        '褰撳墠妯″瀷涓嶅彲鐢紝璇峰厛鍚敤鍙敤妯″瀷',
      );
    }

    const llm = this.createLLM(this.getLLMConfig(ai), 0.3, undefined, {
      thinking: {
        type: 'disabled',
      },
    });

    const responseSchema = z.object({
      items: z.array(
        z.object({
          fieldId: z.string(),
          businessName: z.string().min(1),
        }),
      ),
    });

    const promptTemplate = PromptTemplate.fromTemplate(
      await loadPrompt('field-business-name'),
    );
    const prompt = await promptTemplate.format({
      requestPayload: JSON.stringify(request, null, 2),
    });

    const agent = createAgent({
      model: llm,
      tools: [],
      responseFormat: toolStrategy(responseSchema),
      systemPrompt: prompt,
    });

    const result = await agent.invoke({
      messages: [new HumanMessage('请为这些字段生成业务名称。')],
    });

    const structuredResponse = result.structuredResponse as
      | { items: Array<{ fieldId: string; businessName: string }> }
      | undefined;

    if (!structuredResponse?.items) {
      this.logger.error(
        '生成字段业务名称失败，返回结果格式错误',
        JSON.stringify(result, null, 2),
      );
      throw new InternalServerErrorException('生成字段业务名称失败');
    }

    console.log(JSON.stringify(result, null, 2));

    const generatedNameMap = new Map(
      structuredResponse.items.map((item) => [
        item.fieldId,
        item.businessName.trim(),
      ]),
    );

    return {
      items: request.fields.map((field) => ({
        fieldId: field.fieldId,
        businessName:
          generatedNameMap.get(field.fieldId) ||
          field.currentBusinessName?.trim() ||
          field.fieldName,
      })),
    };
  }
}
