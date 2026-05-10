import { NotFoundException } from '@nestjs/common';
import { createRepositoryMock } from '../../../../test/test-utils';
import { AiSessionService } from './ai-session.service';

describe('AI会话服务', () => {
  const aiSessionRepository = createRepositoryMock();
  const aiSessionMessageRepository = createRepositoryMock();
  const service = new AiSessionService(
    aiSessionRepository,
    aiSessionMessageRepository,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('正常流程：创建并分页查询会话', async () => {
    aiSessionRepository.create.mockReturnValue({
      id: 's1',
      title: 'demo',
      status: 'active',
    });
    aiSessionRepository.save.mockResolvedValue({
      id: 's1',
      title: 'demo',
      status: 'active',
    });
    aiSessionRepository.findAndCount.mockResolvedValue([
      [{ id: 's1', title: 'demo', status: 'active' }],
      1,
    ]);

    await expect(service.create({ title: 'demo' } as any)).resolves.toEqual({
      id: 's1',
      title: 'demo',
      status: 'active',
    });
    await expect(service.findAll({} as any)).resolves.toEqual({
      data: [{ id: 's1', title: 'demo', status: 'active' }],
      total: 1,
      page: 1,
      pageSize: 20,
    });
    expect(aiSessionRepository.findAndCount).toHaveBeenCalledWith({
      where: { status: 'active' },
      order: { createdAt: 'DESC' },
      skip: 0,
      take: 20,
    });
  });

  it('正常与异常：更新查询删除会话并处理不存在场景', async () => {
    aiSessionRepository.findOne.mockResolvedValue({
      id: 's1',
      title: 'demo',
      status: 'active',
    });
    aiSessionRepository.save.mockResolvedValue({
      id: 's1',
      title: 'updated',
      status: 'disabled',
    });

    const sessionRepository = {
      findOne: jest.fn().mockResolvedValue({ id: 's1', title: 'demo' }),
      softRemove: jest.fn(),
      delete: jest.fn(),
    };
    const messageRepository = {
      delete: jest.fn(),
    };
    aiSessionRepository.manager.transaction.mockImplementation(async (cb: any) =>
      cb({
        getRepository: (entity: any) =>
          entity?.name === 'AiSessionMessage'
            ? messageRepository
            : sessionRepository,
      }),
    );

    await expect(service.findOne('s1')).resolves.toMatchObject({ id: 's1' });
    await expect(
      service.update({ id: 's1', title: 'updated', status: 'disabled' } as any),
    ).resolves.toMatchObject({ title: 'updated', status: 'disabled' });
    await expect(service.remove('s1')).resolves.toBeUndefined();

    aiSessionRepository.findOne.mockResolvedValue(null);
    await expect(service.findOne('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(service.update({ id: 'missing' } as any)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
