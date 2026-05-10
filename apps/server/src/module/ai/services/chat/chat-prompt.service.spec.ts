import { ChatPromptService } from './chat-prompt.service';

const mockLoadPrompt = jest.fn();

jest.mock('../helper', () => ({
  loadPrompt: (...args: unknown[]) => mockLoadPrompt(...args),
}));

describe('聊天提示词服务', () => {
  const service = new ChatPromptService();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('正常流程：按约定委托加载提示词', async () => {
    mockLoadPrompt.mockImplementation(async (name: string, mode?: string) =>
      mode ? `${name}:${mode}` : name,
    );

    await expect(service.loadActPrompt('chat')).resolves.toBe('act:chat');
    await expect(service.loadFieldBusinessNamePrompt()).resolves.toBe(
      'field-business-name',
    );
    await expect(service.loadSessionTitlePrompt()).resolves.toBe('session-title');
    expect(mockLoadPrompt).toHaveBeenCalledWith('act', 'chat');
    expect(mockLoadPrompt).toHaveBeenCalledWith('field-business-name');
    expect(mockLoadPrompt).toHaveBeenCalledWith('session-title');
  });
});
