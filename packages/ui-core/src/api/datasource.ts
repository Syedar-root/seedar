import { ApiClient } from './client.js';
import {
  CreateDatasourceRequest,
  UpdateDatasourceRequest,
  DatasourceResponse,
} from '#pkg/seedar/types';
import { RequestOptions } from '#pkg/seedar/types';

/**
 * 数据源 API 类
 * 提供数据源的增删改查操作
 */
export class DatasourceApi {
  /**
   * 获取所有数据源
   * @param options - 请求选项
   * @returns 数据源列表
   */
  static async findAll(
    options?: RequestOptions
  ): Promise<DatasourceResponse[]> {
    return ApiClient.get<DatasourceResponse[]>('/datasource', options);
  }

  /**
   * 根据 ID 获取单个数据源
   * @param id - 数据源 ID
   * @param options - 请求选项
   * @returns 数据源详情
   */
  static async findOne(
    id: number,
    options?: RequestOptions
  ): Promise<DatasourceResponse> {
    return ApiClient.get<DatasourceResponse>(`/datasource/${id}`, options);
  }

  /**
   * 创建新数据源
   * @param data - 创建数据源请求
   * @param options - 请求选项
   * @returns 创建的数据源
   */
  static async create(
    data: CreateDatasourceRequest,
    options?: RequestOptions
  ): Promise<DatasourceResponse> {
    return ApiClient.post<DatasourceResponse>('/datasource', data, options);
  }

  /**
   * 更新数据源
   * @param id - 数据源 ID
   * @param data - 更新数据源请求
   * @param options - 请求选项
   * @returns 更新后的数据源
   */
  static async update(
    id: number,
    data: UpdateDatasourceRequest,
    options?: RequestOptions
  ): Promise<DatasourceResponse> {
    return ApiClient.patch<DatasourceResponse>(
      `/datasource/${id}`,
      data,
      options
    );
  }

  /**
   * 删除数据源
   * @param id - 数据源 ID
   * @param options - 请求选项
   * @returns 删除结果
   */
  static async remove(id: number, options?: RequestOptions): Promise<void> {
    return ApiClient.delete<void>(`/datasource/${id}`, options);
  }
}
