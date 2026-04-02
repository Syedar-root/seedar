import { ApiClient } from './client.js';
import { RequestOptions } from '#pkg/seedar/types';
import { QueryResponse, QueryStatus } from '#pkg/seedar/types';
import {
  CreateQueryRequest,
  UpdateQueryRequest,
  ExecuteQueryResponse,
  QueryDSL,
} from '#pkg/seedar/types';

/**
 * Query API 类
 * 提供查询相关的 API 接口
 */
export class QueryApi {
  /**
   * 获取所有查询
   * @param status - 查询状态（可选）
   * @param options - 请求选项
   * @returns 查询列表
   */
  static async findAll(
    status?: QueryStatus,
    options?: RequestOptions
  ): Promise<QueryResponse[]> {
    const params: Record<string, any> = {};
    if (status) {
      params.status = status;
    }
    return ApiClient.get<QueryResponse[]>('/query', { ...options, params });
  }

  /**
   * 根据 ID 获取单个查询
   * @param id - 查询 ID
   * @param options - 请求选项
   * @returns 查询详情
   */
  static async findOne(
    id: string,
    options?: RequestOptions
  ): Promise<QueryResponse> {
    return ApiClient.get<QueryResponse>(`/query/${id}`, options);
  }

  /**
   * 创建新查询
   * @param data - 创建查询请求数据
   * @param options - 请求选项
   * @returns 创建的查询
   */
  static async create(
    data: CreateQueryRequest,
    options?: RequestOptions
  ): Promise<QueryResponse> {
    return ApiClient.post<QueryResponse>('/query', data, options);
  }

  /**
   * 更新查询
   * @param id - 查询 ID
   * @param data - 更新查询请求数据
   * @param options - 请求选项
   * @returns 更新后的查询
   */
  static async update(
    id: string,
    data: UpdateQueryRequest,
    options?: RequestOptions
  ): Promise<QueryResponse> {
    return ApiClient.patch<QueryResponse>(`/query/${id}`, data, options);
  }

  /**
   * 删除查询
   * @param id - 查询 ID
   * @param options - 请求选项
   * @returns 删除结果
   */
  static async remove(id: string, options?: RequestOptions): Promise<void> {
    return ApiClient.delete<void>(`/query/${id}`, options);
  }

  /**
   * 执行查询
   * @param queryId - 查询 ID
   * @param options - 请求选项
   * @returns 执行结果
   */
  static async execute(
    queryId: string,
    options?: RequestOptions
  ): Promise<ExecuteQueryResponse> {
    return ApiClient.post<ExecuteQueryResponse>(
      '/query/execute',
      { queryId },
      options
    );
  }

  /**
   * 执行临时查询
   * @param dsl - 查询 DSL
   * @param options - 请求选项
   * @returns 执行结果
   */
  static async executeTemp(
    dsl: QueryDSL,
    options?: RequestOptions
  ): Promise<ExecuteQueryResponse> {
    return ApiClient.post<ExecuteQueryResponse>(
      '/query/temp',
      { dsl },
      options
    );
  }
}
