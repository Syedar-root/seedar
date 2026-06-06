import { InternalServerErrorException } from '@nestjs/common';
import { ChatLlmService } from './chat-llm.service';

const mockOpenAI = jest.fn();
const mockAnthropic = jest.fn();
const mockDeepSeek = jest.fn();

jest.mock('@langchain/openai', () => ({
  ChatOpenAI: jest.fn().mockImplementation((model: string, config: unknown) => {
    mockOpenAI(model, config);
    return { provider: 'openai', model, config };
  }),
}));

jest.mock('@langchain/anthropic', () => ({
  ChatAnthropic: jest
    .fn()
    .mockImplementation((model: string, config: unknown) => {
      mockAnthropic(model, config);
      return { provider: 'anthropic', model, config };
    }),
}));

jest.mock('@langchain/deepseek', () => ({
  ChatDeepSeek: jest
    .fn()
    .mockImplementation((model: string, config: unknown) => {
      mockDeepSeek(model, config);
      return { provider: 'deepseek', model, config };
    }),
}));

describe('聊天模型服务', () => {
  const service = new ChatLlmService();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('异常与正常：校验 LLM 配置并返回默认模型', () => {
    expect(() =>
      service.getLLMConfig({ config: {} } as any),
    ).toThrow(InternalServerErrorException);
    expect(() =>
      service.getLLMConfig({ config: { llm: {} } } as any),
    ).toThrow('LLM 配置中缺少 apiKey');
    expect(() =>
      service.getLLMConfig({ name: '' , config: { llm: { apiKey: 'k' } } } as any),
    ).toThrow('LLM 配置中缺少 model 或 name');
    expect(
      service.getLLMConfig({
        name: 'demo',
        config: { llm: { apiKey: 'k', type: 'openai' } },
      } as any),
    ).toMatchObject({
      type: 'openai',
      apiKey: 'k',
      model: 'demo',
    });
  });

  it('正常流程：创建不同厂商的模型客户端', () => {
    expect(
      service.createLLM({
        type: 'openai',
        apiKey: 'k',
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 100,
      } as any),
    ).toMatchObject({ provider: 'openai', model: 'gpt-4' });
    expect(
      service.createLLM({
        type: 'anthropic',
        apiKey: 'k',
        model: 'claude-3',
        baseUrl: 'https://api.example.com',
      } as any),
    ).toMatchObject({ provider: 'anthropic', model: 'claude-3' });
    expect(
      service.createLLM({
        type: 'deepseek',
        apiKey: 'k',
        model: 'deepseek-chat',
      } as any),
    ).toMatchObject({ provider: 'deepseek', model: 'deepseek-chat' });
    expect(mockOpenAI).toHaveBeenCalled();
    expect(mockAnthropic).toHaveBeenCalled();
    expect(mockDeepSeek).toHaveBeenCalled();
  });
});
