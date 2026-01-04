import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Datasource } from '../entities/datasource.entity';
import { CreateDatasourceRequest } from '../dto/create-datasource.request';
import { validateDataSourceConfig } from '../datasource.validation';
import { UpdateDatasourceRequest } from '../dto/update-datasource.request';
import { DatasourceResponse } from '../dto/datasource.response';
import { ExceptionFactory } from '../../common/exceptions';

@Injectable()
export class DatasourceService {
  @InjectRepository(Datasource)
  private readonly datasourceRepository!: Repository<Datasource>;

  /**
   * 创建数据源
   * @param createDatasourceRequest 创建数据源请求
   * @returns 创建数据源响应
   */
  create(
    createDatasourceRequest: CreateDatasourceRequest,
  ): Promise<DatasourceResponse> {
    // 运行时验证配置
    try {
      validateDataSourceConfig(
        createDatasourceRequest.type,
        createDatasourceRequest.config,
      );
    } catch (error) {
      ExceptionFactory.datasourceConfigInvalid(createDatasourceRequest.type, error.message);
    }

    // TODO: 使用this.datasourceRepository实现数据源创建逻辑
    ExceptionFactory.methodNotImplemented('create');
  }

  findAll(): Promise<DatasourceResponse[]> {
    // TODO: 使用this.datasourceRepository实现获取所有数据源逻辑
    ExceptionFactory.methodNotImplemented('findAll');
  }

  findOne(id: number): Promise<DatasourceResponse> {
    // TODO: 使用this.datasourceRepository实现获取单个数据源逻辑
    ExceptionFactory.methodNotImplemented('findOne');
  }

  update(
    id: number,
    updateDatasourceRequest: UpdateDatasourceRequest,
  ): Promise<DatasourceResponse> {
    // 如果提供了配置，验证配置
    if (updateDatasourceRequest.config && updateDatasourceRequest.type) {
      try {
        validateDataSourceConfig(
          updateDatasourceRequest.type,
          updateDatasourceRequest.config,
        );
      } catch (error) {
        ExceptionFactory.datasourceConfigInvalid(updateDatasourceRequest.type, error.message);
      }
    }

    // TODO: 使用this.datasourceRepository实现数据源更新逻辑
    ExceptionFactory.methodNotImplemented('update');
  }

  remove(id: number): Promise<void> {
    // TODO: 使用this.datasourceRepository实现数据源删除逻辑
    ExceptionFactory.methodNotImplemented('remove');
  }
}
