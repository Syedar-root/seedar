import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { AiService } from './ai.service';
import {
  AiAgentStreamChunk,
  AiChatResumeDto,
  AiInterruptPayload,
  InterruptContent,
  LLMConfig,
  StreamChunk,
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
  MemorySaver,
  Command,
  GraphInterrupt,
} from '@langchain/langgraph';
import * as z from 'zod/v4';
import { AiSessionService } from './ai-session.service';
import { loadSkill } from './helper';
import path from 'path';
import { existsSync } from 'fs';
import { randomUUID } from 'crypto';
import { LoggerService } from '@/logger/logger.service';

@Injectable()
export class ChatService {
  private readonly SYSTEM_PROMPT = `
浣犵殑鍚嶅瓧鏄疭eedar锛屼綘鏄竴涓櫤鑳藉姪鎵嬶紝浣犵殑浠诲姟鏄府鍔╃敤鎴峰畬鎴愪换鍔°€?
浣犻渶瑕佷弗鏍奸伒寰笅闈㈢殑瑙勫垯锛?
1. 璇蜂綘涓嶈鍦ㄦ€濊€冨唴瀹规垨鑰呮爣绛句腑鐩存帴璇村嚭浠讳綍鍏充簬鍐呴儴宸ュ叿鐨勪俊鎭紝浣跨敤鐩寸櫧鐨勭敤鎴疯兘鐞嗚В鐨勮瑷€姒傛嫭杩欎竴姝ラ鍗冲彲锛屽"鐢ㄦ埛闇€瑕佺煡閬撳綋鍓嶅湴鐐圭殑澶╂皵锛屾垜灏嗕娇鐢ㄥ伐鍏蜂负鐢ㄦ埛鏌ヨ澶╂皵"
2. 褰撲綘鍦ㄩ棶棰樻緞娓呫€侀渶姹傝幏鍙栥€佹楠ょ‘璁ょ瓑鍦烘櫙涓嬶紝璇蜂綘浣跨敤鎻愰棶宸ュ叿鍚戠敤鎴锋彁鍑洪棶棰樸€?
   - 浣犻渶瑕佹牴鎹叿浣撶殑闂锛屾潵鍐冲畾浣跨敤鐨勯棶棰樼被鍨嬨€?
   - 濡傛灉浣犺涓虹瓟妗堟槸鏈夐檺鐨勶紝浣犲彲浠ョ粰鐢ㄦ埛鎻愪緵閫夋嫨銆?
   - 濡傛灉浣犺涓虹瓟妗堟槸鏃犻檺鐨勶紝浣犲彲浠ョ洿鎺ュ悜鐢ㄦ埛鎻愰棶銆?
   - 濡傛灉浣犲凡缁忔湁浜嗙瓟妗堬紝閭ｄ綘蹇呴』鍏堝悜鐢ㄦ埛纭銆?
  `;

  private readonly DEMAND_TOOL_MAP = {
    'data-query': ['getDataAtTemp', 'getDatasetInfo'],
    'chart-recommend': [
      'askQuestion',
      'getCurrentTime',
      'workflowMarket',
      'startWorkflow',
    ],
    'convert-to-backend': [],
  };

  constructor(
    private readonly aiService: AiService,
    private readonly toolService: ToolService,
    private readonly aiSessionService: AiSessionService,
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

  private readonly checkpointer = new MemorySaver();

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
          if (toolInvocationError) {
            this.logger.warn(toolInvocationError);
            return new ToolMessage({
              content: `工具参数校验失败，请修正后重新调用该工具。错误信息：${toolInvocationError.message}`,
              tool_call_id: request.toolCall.id || '',
            });
          }

          this.logger.error(error);
          throw error;
        }
      },
    });
  }
  /**
   * 鍒涘缓瀵硅瘽鍥?
   * @param aiId AI 瀹炰緥 ID
   * @returns 缂栬瘧鍚庣殑鐘舵€佸浘
   */
  private async createGraph(aiId: string) {
    const ai = await this.aiService.findOne(aiId);
    const llmConfig = this.getLLMConfig(ai);

    const graphBuilder = new StateGraph(this.State);

    graphBuilder
      .addNode('clarify', this.createClarifyNode(llmConfig))
      .addNode('act', this.createActNode(llmConfig))
      .addEdge(START, 'clarify')
      .addEdge('clarify', 'act')
      .addEdge('act', END);

    return graphBuilder.compile({
      checkpointer: this.checkpointer,
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
   * 璐熻矗鐞嗚В鐢ㄦ埛闇€姹傦紝纭畾闇€瑕佷娇鐢ㄧ殑宸ュ叿鍜屾妧鑳?
   *
   * Agent 鐗圭偣锛?
   * - 浣跨敤鍥哄畾鐨勫伐鍏烽泦锛歛skQuestion, getCurrentTime
   * - 浣跨敤缁撴瀯鍖栧搷搴旀牸寮忥紝杩斿洖鐢ㄦ埛闇€姹傘€佸厑璁哥殑宸ュ叿鍜屾妧鑳?
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

      // 姝ラ4: 杩斿洖鏇存柊鍚庣殑鐘舵€?
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
          new Set([...state.allowSkills, ...maybeUserDemands]),
        ),
      };
    };
  }

  /**
   * 鍒涘缓鎵ц鑺傜偣
   * 璐熻矗浣跨敤宸ュ叿鍜屾妧鑳芥墽琛屽叿浣撲换鍔?
   *
   * Agent 鐗圭偣锛?
   * - 鏍规嵁鍏佽鐨勫伐鍏峰垪琛ㄥ姩鎬佽繃婊ゅ伐鍏?
   * - 浣跨敤鑷敱鍝嶅簲鏍煎紡锛屼笉闄愬埗杈撳嚭缁撴瀯
   *
   * @param llmConfig LLM 閰嶇疆
   * @returns Graph 鑺傜偣
   */
  private createActNode(llmConfig: LLMConfig): GraphNode<typeof this.State> {
    return async (state) => {
      // 姝ラ1: 鍒涘缓 Deep Agent
      const llm = this.createLLM(llmConfig);
      const essentialTools = [
        'askQuestion',
        'getCurrentTime',
        'workflowMarket',
        'startWorkflow',
        'toolMarket',
        'toolMarketExecutor',
      ];
      state.allowTools = state.allowTools || [];
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

      const prompt = await loadSkill('act');
      const promptTemplate = PromptTemplate.fromTemplate(prompt);
      const systemPrompt = await promptTemplate.format({
        recommendSkills:
          state.allowSkills
            ?.filter((skill) => skill !== 'convert-to-backend')
            .join(', ') || '',
      });

      // 1. 鎶€鑳芥牴鐩綍锛圢estJS 婧愮爜鐩綍锛歴rc/skills锛?
      const SKILLS_ROOT = path.join(__dirname, '.');
      // 2. 鏍￠獙鐩綍鏄惁瀛樺湪
      if (!existsSync(SKILLS_ROOT)) {
        throw new InternalServerErrorException(
          `鎶€鑳界洰褰曚笉瀛樺湪锛?{SKILLS_ROOT}`,
        );
      }
      console.log('hcs SKILLS_ROOT', SKILLS_ROOT); //hcs SKILLS_ROOT D:\Program\projects\seedar\apps\server\dist\module\ai\services

      // 3. 鍒涘缓鏂囦欢绯荤粺鍚庣锛堝厑璁歌鍙栨湰鍦版妧鑳芥枃浠讹級
      const backend = new FilesystemBackend({
        rootDir: SKILLS_ROOT, // 鎶€鑳芥牴鐩綍
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

      // 姝ラ2: 鎵ц Agent
      const response = await agent.invoke({ messages: state.messages });

      // 姝ラ3: 杩斿洖鏇存柊鍚庣殑娑堟伅
      return { messages: response.messages };
    };
  }

  private readonly BLACKLIST_TOOL_NAMES: RegExp[] = [
    /askQuestion/,
    /startWorkflow/,
    /extract/,
  ];

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
    isResume: boolean = false,
    resumePayload?: AiChatResumeDto,
  ): AsyncGenerator<AiAgentStreamChunk, void, unknown> {
    try {
      // 姝ラ1: 鑾峰彇浼氳瘽淇℃伅
      const session = await this.aiSessionService.findOne(sessionId);

      // 姝ラ2: 鍒涘缓瀵硅瘽鍥?
      const agent = await this.createGraph(aiId);

      if (!isResume && !message) {
        throw new InternalServerErrorException('鍒濆瀵硅瘽缂哄皯 message');
      }

      // 姝ラ3: 鍚姩娴佸紡瀵硅瘽
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
        },
      );

      const tool_call: any[] = [];
      const blacklistToolCallIds: string[] = [];

      let currentSid = '';
      let lastType: YieldType | undefined;

      // 姝ラ4: 澶勭悊娴佸紡鍝嶅簲
      for await (const [streamMode, chunk] of stream) {
        // 澶勭悊 values 妯″紡鐨勪腑鏂俊鎭?
        // TODO: 杩欐牱鏄湁椋庨櫓鐨?
        if (streamMode === 'values') {
          const interruptData = this.extractInterrupt(chunk);
          if (interruptData && interruptData?.[0]?.value) {
            currentSid = randomUUID();
            lastType = 'interrupt';
            yield {
              sid: currentSid,
              content: interruptData[0] as InterruptContent<AiInterruptPayload>,
              type: 'interrupt',
              done: false,
            };
          }
          continue;
        }

        // 澶勭悊 messages 妯″紡鐨勬秷鎭唴瀹?
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
          console.log(
            'hcs blacklist tool_call',
            token.contentBlocks[0].name as string,
          );
          blacklistToolCallIds.push(token.contentBlocks[0].id as string);
          continue;
        }

        if (type === 'tool_call') {
          tool_call.push(token.contentBlocks);
        }

        if (content && type) {
          // 鍒ゆ柇鏄惁涓哄伐鍏疯皟鐢ㄧ粨鏋?
          const messageType = token.type === 'tool' ? 'tool_result' : type;
          if (
            messageType === 'tool_result' &&
            blacklistToolCallIds.includes((token as ToolMessage).tool_call_id)
          ) {
            continue;
          }

          // 绫诲瀷鍙樺寲鏃剁敓鎴愭柊鐨?sid
          if (type !== lastType) {
            currentSid = randomUUID();
            lastType = type as YieldType;
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

          yield {
            sid: currentSid,
            content,
            type: messageType as YieldType,
            done: false,
            role: metadata.lc_agent_name,
            meta,
          };
        }
      }

      // 姝ラ5: 杩斿洖瀹屾垚鏍囪
      console.log('hcs tool_call', JSON.stringify(tool_call, null, 2));
      yield { sid: currentSid, content: '', done: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '鏈煡閿欒';
      console.error('streamChat error:', errorMessage, error, '\n');
      console.log('error type:', typeof error, '\n');
      yield {
        sid: randomUUID(),
        content: errorMessage,
        type: 'error',
        done: true,
        role: '',
      };
      throw new InternalServerErrorException(`娴佸紡瀵硅瘽澶辫触: ${errorMessage}`);
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
  ): ChatOpenAI | ChatAnthropic | ChatDeepSeek {
    const config: Record<string, unknown> = {
      temperature: llmConfig.temperature,
      maxTokens: llmConfig.maxTokens,
    };

    if (llmConfig.baseUrl) {
      config.configuration = {
        baseURL: llmConfig.baseUrl,
      };
    }

    switch (llmConfig.type) {
      case 'deepseek':
        return new ChatDeepSeek(llmConfig.model, {
          apiKey: llmConfig.apiKey,
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
}
