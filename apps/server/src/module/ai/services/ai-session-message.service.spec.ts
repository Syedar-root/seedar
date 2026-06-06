import { createRepositoryMock } from '../../../../test/test-utils';
import { AiSessionMessageService } from './ai-session-message.service';

describe('AI会话消息服务', () => {
  const repository = createRepositoryMock();
  const service = new AiSessionMessageService(repository);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('正常流程：构建并持久化消息片段', async () => {
    const userSegment = service.createUserMessageSegment('s1', 't1', 'hello');
    const chunkSegment = service.createChunkSegment('s1', 't1', {
      sid: 'sid-1',
      type: 'text',
      role: 'assistant',
      content: 'world',
      meta: { index: 1 },
    });
    const appended = service.appendChunkToSegment(chunkSegment, {
      sid: 'sid-1',
      type: 'text',
      content: '!',
      meta: { index: 2 },
    });

    expect(userSegment).toMatchObject({
      sessionId: 's1',
      turnId: 't1',
      sid: 'user_t1',
      messageType: 'user',
      role: 'user',
      contentText: 'hello',
    });
    expect(chunkSegment).toMatchObject({
      sid: 'sid-1',
      messageType: 'text',
      role: 'assistant',
      contentText: 'world',
      metaJson: { index: 1 },
    });
    expect(appended).toMatchObject({
      contentText: 'world!',
      metaJson: { index: 2 },
    });

    repository.create.mockReturnValue({ id: 'm1' });
    repository.save.mockResolvedValue({ id: 'm1' });
    await expect(service.persistSegment(userSegment as any)).resolves.toBeUndefined();
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: 's1',
        turnId: 't1',
        sid: 'user_t1',
      }),
    );
  });

  it('正常流程：分页查询并安全回退历史记录', async () => {
    repository.find.mockResolvedValue([
      { id: '3', sessionId: 's1', messageType: 'text', role: 'act', contentText: 'c3', createdAt: new Date() },
      { id: '2', sessionId: 's1', messageType: 'text', role: 'act', contentText: 'c2', createdAt: new Date() },
      { id: '1', sessionId: 's1', messageType: 'text', role: 'act', contentText: 'c1', createdAt: new Date() },
    ]);

    await expect(service.listBySession('s1', undefined, 2)).resolves.toEqual({
      data: [
        expect.objectContaining({ id: '2', contentText: 'c2' }),
        expect.objectContaining({ id: '3', contentText: 'c3' }),
      ],
      nextCursor: '3',
    });

    repository.find.mockResolvedValue([]);
    await expect(service.listBySessionOrRecover('s1', undefined, 50, [])).resolves
      .toEqual({
        data: [
          expect.objectContaining({
            id: 'history-unavailable',
            sessionId: 's1',
          }),
        ],
      });
  });

  it('正常流程：应用中断恢复结果', async () => {
    const askUserRow = {
      id: '1',
      sessionId: 's1',
      messageType: 'interrupt',
      contentJson: { value: { kind: 'ask_user', answers: [] } },
      metaJson: {},
    } as any;
    const workflowRow = {
      id: '2',
      sessionId: 's1',
      messageType: 'interrupt',
      contentJson: { value: { kind: 'workflow_run', interruptId: 'wf-1' } },
      metaJson: {},
    } as any;

    repository.find
      .mockResolvedValueOnce([askUserRow])
      .mockResolvedValueOnce([workflowRow]);
    repository.save.mockResolvedValue({});

    await expect(
      service.applyInterruptResumeResult('s1', {
        kind: 'interrupt_result',
        interruptResult: { kind: 'ask_user_result', answers: ['a'] },
      } as any),
    ).resolves.toBeUndefined();
    await expect(
      service.applyInterruptResumeResult('s1', {
        kind: 'interrupt_result',
        interruptResult: { kind: 'workflow_result', interruptId: 'wf-1' },
      } as any),
    ).resolves.toBeUndefined();

    expect(repository.save).toHaveBeenCalledTimes(2);
    expect(askUserRow.metaJson).toMatchObject({
      interruptResolved: true,
      interruptResolvedKind: 'ask_user_result',
    });
    expect(workflowRow.metaJson).toMatchObject({
      interruptResolved: true,
      interruptResolvedKind: 'workflow_result',
    });
  });
});
