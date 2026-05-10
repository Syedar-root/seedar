import { AIMessage, HumanMessage, ToolMessage } from '@langchain/core/messages';
import { ChatContextService } from './chat-context.service';

describe('聊天上下文服务', () => {
  const aiSessionMessageService = {
    buildContextStatusEvent: jest.fn((sessionId: string, payload: any) => ({
      sessionId,
      ...payload,
    })),
  } as any;
  const chatLlmService = {
    createLLM: jest.fn(),
  } as any;
  const service = new ChatContextService(
    aiSessionMessageService,
    chatLlmService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('正常流程：处理上下文辅助函数', () => {
    expect(service.resolveModelContextWindow('claude-3')).toBe(200000);
    expect(service.resolveModelContextWindow('gpt-4')).toBe(128000);
    expect(service.contentToText(['a', { text: 'b' }, { x: 1 }])).toBe(
      'a\nb\n{"x":1}',
    );

    const messages = [
      new HumanMessage('hello'),
      new HumanMessage('hello'),
      new ToolMessage({ content: 'x'.repeat(3001), tool_call_id: 't1' }),
    ];

    expect(service.estimateContextTokens(messages)).toBeGreaterThan(0);
    expect(service.sanitizeMessages(messages).length).toBe(2);
    expect(service.offloadLargeToolResults(messages)[2]).toBeInstanceOf(
      ToolMessage,
    );
    expect(service.splitBySegments(messages).length).toBe(3);
    expect(
      service.resolveContextPolicy(
        {
          config: {
            llm: {
              contextPolicy: {
                contextWindowTokens: 100,
                softRatio: 0.5,
                hardRatio: 0.8,
                keepRecentSegments: 1,
              },
            },
          },
        } as any,
        { model: 'gpt-4' } as any,
      ),
    ).toMatchObject({
      contextWindowTokens: 100,
      softRatio: 0.5,
      hardRatio: 0.8,
      keepRecentSegments: 1,
    });
  });

  it('正常流程：流式前对超大上下文做摘要', async () => {
    const agent = {
      getState: jest.fn().mockResolvedValue({
        values: {
          messages: [
            new HumanMessage({
              content: 'a'.repeat(200),
              additional_kwargs: { sid: 'old-1' },
            }),
            new HumanMessage({
              content: 'b'.repeat(200),
              additional_kwargs: { sid: 'new-1' },
            }),
          ],
        },
      }),
      updateState: jest.fn().mockResolvedValue(undefined),
    };
    chatLlmService.createLLM.mockReturnValue({
      invoke: jest.fn().mockResolvedValue({ content: '摘要内容' }),
    });

    const result = await service.manageContextBeforeStream({
      agent: agent as any,
      ai: {
        config: {
          llm: {
            contextPolicy: {
              contextWindowTokens: 100,
              softRatio: 0.3,
              hardRatio: 0.6,
              keepRecentSegments: 1,
            },
          },
        },
      } as any,
      llmConfig: { model: 'gpt-4' } as any,
      threadId: 'thread-1',
      sessionId: 's1',
    });

    expect(result.events[0]).toMatchObject({
      phase: 'start',
      strategy: 'summary',
    });
    expect(result.events.some((event) => event.phase === 'success')).toBe(true);
    expect(agent.updateState).toHaveBeenCalledWith(
      { configurable: { thread_id: 'thread-1' } },
      expect.objectContaining({
        messages: expect.any(Array),
      }),
    );
  });
});
