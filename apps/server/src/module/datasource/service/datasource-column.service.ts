import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DatasourceColumn } from '../entities/datasource-column.entity';

@Injectable()
export class DatasourceColumnService {
  @InjectRepository(DatasourceColumn)
  private readonly datasourceColumnRepository: Repository<DatasourceColumn>;

  async findByTableId(tableId: number): Promise<DatasourceColumn[]> {
    return this.datasourceColumnRepository.find({
      where: { tableId },
    });
  }

  async findOne(id: number): Promise<DatasourceColumn | null> {
    return this.datasourceColumnRepository.findOne({
      where: { id },
    });
  }

  async create(
    datasourceColumn: Partial<DatasourceColumn>,
  ): Promise<DatasourceColumn> {
    const entity = this.datasourceColumnRepository.create(datasourceColumn);
    return this.datasourceColumnRepository.save(entity);
  }

  async deleteByTableId(tableId: number): Promise<void> {
    await this.datasourceColumnRepository.delete({ tableId });
  }
}
