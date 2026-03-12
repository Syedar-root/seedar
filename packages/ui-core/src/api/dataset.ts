import { ApiClient } from './client.js';
import {
  DatasetResponse,
  CreateDatasetRequest,
  UpdateDatasetRequest,
  RequestOptions,
} from '@seedar/types';

/**
 * 数据集 API 类
 * 提供数据集相关的所有 HTTP 请求方法
 */
export class DatasetApi {
  /**
   * 获取所有数据集
   * @param options - 请求选项，包含查询参数和错误处理回调
   * @returns 数据集列表
   */
  static async findAll(options?: RequestOptions): Promise<DatasetResponse[]> {
    return ApiClient.get<DatasetResponse[]>('/dataset', options);
  }

  /**
   * 根据 ID 获取单个数据集
   * @param id - 数据集 ID
   * @param options - 请求选项，包含查询参数和错误处理回调
   * @returns 数据集详情
   */
  static async findOne(id: number, options?: RequestOptions): Promise<DatasetResponse> {
    return ApiClient.get<DatasetResponse>(`/dataset/${id}`, options);
  }

  /**
   * 创建新数据集
   * @param data - 创建数据集的请求数据
   * @param options - 请求选项，包含查询参数和错误处理回调
   * @returns 创建的数据集
   */
  static async create(
    data: CreateDatasetRequest,
    options?: RequestOptions
  ): Promise<DatasetResponse> {
    return ApiClient.post<DatasetResponse>('/dataset', data, options);
  }

  /**
   * 更新数据集
   * @param data - 更新数据集的请求数据
   * @param options - 请求选项，包含查询参数和错误处理回调
   * @returns 更新后的数据集
   */
  static async update(
    data: UpdateDatasetRequest,
    options?: RequestOptions
  ): Promise<DatasetResponse> {
    return ApiClient.patch<DatasetResponse>('/dataset', data, options);
  }

  /**
   * 删除数据集
   * @param id - 数据集 ID
   * @param options - 请求选项，包含查询参数和错误处理回调
   * @returns 删除结果
   */
  static async remove(id: number, options?: RequestOptions): Promise<void> {
    return ApiClient.delete<void>(`/dataset/${id}`, options);
  }
}
