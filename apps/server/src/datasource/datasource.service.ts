import { Injectable } from '@nestjs/common';
import { CreateDatasourceRequest } from './dto/create-datasource.request';
import { UpdateDatasourceRequest } from './dto/update-datasource.request';
import { DatasourceResponse } from './dto/datasource.response';

@Injectable()
export class DatasourceService {
  create(
    createDatasourceRequest: CreateDatasourceRequest,
  ): Promise<DatasourceResponse> {
    // TODO: 实现数据源创建逻辑
    throw new Error('Method not implemented');
  }

  findAll(): Promise<DatasourceResponse[]> {
    // TODO: 实现获取所有数据源逻辑
    throw new Error('Method not implemented');
  }

  findOne(id: number): Promise<DatasourceResponse> {
    // TODO: 实现获取单个数据源逻辑
    throw new Error('Method not implemented');
  }

  update(
    id: number,
    updateDatasourceRequest: UpdateDatasourceRequest,
  ): Promise<DatasourceResponse> {
    // TODO: 实现数据源更新逻辑
    throw new Error('Method not implemented');
  }

  remove(id: number): Promise<void> {
    // TODO: 实现数据源删除逻辑
    throw new Error('Method not implemented');
  }
}
