import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DatasourceTable } from '../entities/datasource-table.entity';

@Injectable()
export class DatasourceTableService {
  constructor(
    @InjectRepository(DatasourceTable)
    private readonly datasourceTableRepository: Repository<DatasourceTable>,
  ) {}

  async findByDataSourceId(dataSourceId: number): Promise<DatasourceTable[]> {
    return this.datasourceTableRepository.find({
      where: { dataSourceId },
    });
  }

  async findOne(id: number): Promise<DatasourceTable | null> {
    return this.datasourceTableRepository.findOne({
      where: { id },
    });
  }

  async create(datasourceTable: Partial<DatasourceTable>): Promise<DatasourceTable> {
    const entity = this.datasourceTableRepository.create(datasourceTable);
    return this.datasourceTableRepository.save(entity);
  }

  async deleteByDataSourceId(dataSourceId: number): Promise<void> {
    await this.datasourceTableRepository.delete({ dataSourceId });
  }

  /**
   * 更新表的主键字段 ID
   */
  async updatePrimaryFieldId(tableId: number, primaryFieldId: number): Promise<void> {
    await this.datasourceTableRepository.update(tableId, { primaryFieldId });
  }
}
