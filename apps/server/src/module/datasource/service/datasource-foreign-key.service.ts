import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DatasourceForeignKey } from '../entities/datasource-foreign-key.entity';

@Injectable()
export class DatasourceForeignKeyService {
  constructor(
    @InjectRepository(DatasourceForeignKey)
    private readonly foreignKeyRepository: Repository<DatasourceForeignKey>,
  ) {}

  /**
   * 根据数据源ID查询所有外键关系
   */
  async findByDataSourceId(
    dataSourceId: number,
  ): Promise<DatasourceForeignKey[]> {
    return this.foreignKeyRepository.find({
      where: { dataSourceId },
    });
  }

  /**
   * 创建外键关系
   */
  async create(
    foreignKey: Partial<DatasourceForeignKey>,
  ): Promise<DatasourceForeignKey> {
    const entity = this.foreignKeyRepository.create(foreignKey);
    return this.foreignKeyRepository.save(entity);
  }

  /**
   * 批量创建外键关系
   */
  async createMany(
    foreignKeys: Partial<DatasourceForeignKey>[],
  ): Promise<DatasourceForeignKey[]> {
    const entities = foreignKeys.map((fk) =>
      this.foreignKeyRepository.create(fk),
    );
    return this.foreignKeyRepository.save(entities);
  }

  /**
   * 根据数据源ID删除所有外键关系
   */
  async deleteByDataSourceId(dataSourceId: number): Promise<void> {
    await this.foreignKeyRepository.delete({ dataSourceId });
  }
}
