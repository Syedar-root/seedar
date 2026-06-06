import { NotFoundException } from '@nestjs/common';
import { createRepositoryMock } from '../../../../test/test-utils';
import { AiService } from './ai.service';

describe('AI配置服务', () => {
  const aiRepository = createRepositoryMock();
  const service = new AiService(aiRepository);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('正常流程：创建并分页查询 AI 配置', async () => {
    aiRepository.create.mockReturnValue({ id: 'ai-1', name: 'demo' });
    aiRepository.save.mockResolvedValue({
      id: 'ai-1',
      name: 'demo',
      status: 'active',
    });
    aiRepository.findAndCount.mockResolvedValue([
      [{ id: 'ai-1', name: 'demo', status: 'active' }],
      1,
    ]);

    await expect(service.create({ name: 'demo' } as any)).resolves.toEqual({
      id: 'ai-1',
      name: 'demo',
      status: 'active',
    });
    await expect(service.findAll(2, 200)).resolves.toEqual({
      data: [{ id: 'ai-1', name: 'demo', status: 'active' }],
      total: 1,
      page: 2,
      pageSize: 100,
    });
    expect(aiRepository.findAndCount).toHaveBeenCalledWith({
      where: {},
      order: { createdAt: 'DESC' },
      skip: 100,
      take: 100,
    });
  });

  it('正常与异常：查询更新删除 AI 配置并处理不存在场景', async () => {
    aiRepository.findOne.mockResolvedValue({
      id: 'ai-1',
      name: 'demo',
      status: 'active',
    });
    aiRepository.save.mockResolvedValue({
      id: 'ai-1',
      name: 'updated',
      status: 'active',
    });
    aiRepository.softRemove.mockResolvedValue(undefined);

    await expect(service.findOne('ai-1')).resolves.toMatchObject({ id: 'ai-1' });
    await expect(
      service.update({ id: 'ai-1', name: 'updated' } as any),
    ).resolves.toMatchObject({ name: 'updated' });
    await expect(service.remove('ai-1')).resolves.toBeUndefined();

    aiRepository.findOne.mockResolvedValue(null);
    await expect(service.findOne('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(service.update({ id: 'missing' } as any)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(service.remove('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
