import { ChatCheckpointService } from './chat-checkpoint.service';

const mockMemoryGetTuple = jest.fn();
const mockPostgresGetTuple = jest.fn();
const mockPostgresSetup = jest.fn();
const mockPostgresEnd = jest.fn();
const mockFromConnString = jest.fn();

jest.mock('@langchain/langgraph', () => {
  const actual = jest.requireActual('@langchain/langgraph');
  return {
    ...actual,
    MemorySaver: jest.fn().mockImplementation(() => ({
      getTuple: mockMemoryGetTuple,
    })),
  };
});

jest.mock('@langchain/langgraph-checkpoint-postgres', () => ({
  PostgresSaver: {
    fromConnString: (...args: unknown[]) => mockFromConnString(...args),
  },
}));

describe('聊天检查点服务', () => {
  const configService = {
    get: jest.fn(),
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFromConnString.mockReturnValue({
      setup: mockPostgresSetup.mockResolvedValue(undefined),
      end: mockPostgresEnd.mockResolvedValue(undefined),
      getTuple: mockPostgresGetTuple.mockResolvedValue({ checkpoint: {} }),
    });
  });

  it('正常流程：缺少连接串时回退到内存检查点', async () => {
    configService.get.mockReturnValue(undefined);
    const service = new ChatCheckpointService(configService);

    const checkpointer = await service.getCheckpointer();
    expect(checkpointer).toEqual({ getTuple: mockMemoryGetTuple });
    await service.getCheckpointTupleByThreadId('thread-1');
    expect(mockMemoryGetTuple).toHaveBeenCalledWith({
      configurable: { thread_id: 'thread-1' },
    });
  });

  it('正常流程：初始化 Postgres 检查点并在销毁时关闭', async () => {
    configService.get.mockReturnValue('postgres://db');
    const service = new ChatCheckpointService(configService);

    const checkpointer = await service.getCheckpointer();
    expect(checkpointer).toMatchObject({ getTuple: mockPostgresGetTuple });
    expect(mockFromConnString).toHaveBeenCalledWith('postgres://db');
    expect(mockPostgresSetup).toHaveBeenCalled();

    await service.getCheckpointTupleByThreadId('thread-2');
    expect(mockPostgresGetTuple).toHaveBeenCalledWith({
      configurable: { thread_id: 'thread-2' },
    });

    await service.onModuleDestroy();
    expect(mockPostgresEnd).toHaveBeenCalled();
  });
});
