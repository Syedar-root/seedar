import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DatasourceTable } from '../entities/datasource-table.entity';
import { Datasource } from '../entities/datasource.entity';

@Injectable()
export class DatasourceTableService {
  @InjectRepository(DatasourceTable)
  private readonly datasourceTableRepository!: Repository<DatasourceTable>;

  async create(datasource: Datasource): Promise<DatasourceTable> {
    const datasourceTable = new DatasourceTable();
    datasourceTable.dataSource = datasource;
    return this.datasourceTableRepository.save(datasourceTable);
  }
}
