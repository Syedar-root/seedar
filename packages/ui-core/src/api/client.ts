import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import {
  ApiConfig,
  ApiResponse,
  ApiError,
  RequestOptions,
} from '#pkg/seedar/types';
import { DatasourceApi } from './datasource.js';
import { DatasetApi } from './dataset.js';
import { QueryApi } from './query.js';

/**
 * API 客户端类
 * 提供统一的 HTTP 请求接口，支持自动解析响应和错误处理
 */
export class ApiClient {
  /** Axios 实例 */
  private static instance: AxiosInstance | null = null;

  /** API 配置 */
  private static config: ApiConfig | null = null;

  /**
   * 初始化 API 客户端
   * @param config - API 配置
   */
  static init(config: ApiConfig): void {
    this.config = config;
    this.instance = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 30000,
      headers: config.headers || {},
    });
  }

  /**
   * 获取 Axios 实例
   * @returns Axios 实例
   * @throws 如果未初始化则抛出错误
   */
  private static getInstance(): AxiosInstance {
    if (!this.instance) {
      throw new Error('ApiClient 未初始化，请先调用 ApiClient.init() 方法');
    }
    return this.instance;
  }

  /**
   * 获取 API 配置
   * @returns API 配置
   * @throws 如果未初始化则抛出错误
   */
  private static getConfig(): ApiConfig {
    if (!this.config) {
      throw new Error('ApiClient 未初始化，请先调用 ApiClient.init() 方法');
    }
    return this.config;
  }

  /**
   * 解析响应数据
   * 根据 autoParseResponse 配置决定是否自动解析响应
   * @param response - Axios 响应对象
   * @returns 解析后的数据
   */
  private static parseResponse<T>(response: AxiosResponse): T {
    const config = this.getConfig();

    if (config.autoParseResponse) {
      const apiResponse = response.data as ApiResponse<T>;

      if (apiResponse.success) {
        return apiResponse.data;
      } else {
        const error: ApiError = {
          message: apiResponse.message,
          code: apiResponse.code,
          details: apiResponse.data,
        };
        throw error;
      }
    }

    return response.data as T;
  }

  /**
   * 处理错误
   * 优先使用单个请求的错误处理，其次使用全局错误处理
   * @param error - 错误对象
   * @param options - 请求选项
   */
  private static handleError(error: any, options?: RequestOptions): void {
    const config = this.getConfig();
    const apiError: ApiError = {
      message: error.message || '请求失败',
      code: error.code,
      details: error.response?.data || error.details,
    };

    if (options?.onError) {
      options.onError(apiError, config.globalOnError);
    } else if (config.globalOnError) {
      config.globalOnError(apiError);
    }
  }

  /**
   * 构建请求配置
   * @param options - 请求选项
   * @returns Axios 请求配置
   */
  private static buildRequestConfig(
    options?: RequestOptions
  ): AxiosRequestConfig {
    const config: AxiosRequestConfig = {};

    if (options?.params) {
      config.params = options.params;
    }

    if (options?.headers) {
      config.headers = options.headers;
    }

    return config;
  }

  /**
   * 发送 GET 请求
   * @param url - 请求 URL
   * @param options - 请求选项
   * @returns 响应数据
   */
  static async get<T = any>(url: string, options?: RequestOptions): Promise<T> {
    try {
      const instance = this.getInstance();
      const config = this.buildRequestConfig(options);
      const response = await instance.get(url, config);
      return this.parseResponse<T>(response);
    } catch (error) {
      this.handleError(error, options);
      throw error;
    }
  }

  /**
   * 发送 POST 请求
   * @param url - 请求 URL
   * @param data - 请求数据
   * @param options - 请求选项
   * @returns 响应数据
   */
  static async post<T = any>(
    url: string,
    data?: any,
    options?: RequestOptions
  ): Promise<T> {
    try {
      const instance = this.getInstance();
      const config = this.buildRequestConfig(options);
      const response = await instance.post(url, data, config);
      return this.parseResponse<T>(response);
    } catch (error) {
      this.handleError(error, options);
      throw error;
    }
  }

  /**
   * 发送 PUT 请求
   * @param url - 请求 URL
   * @param data - 请求数据
   * @param options - 请求选项
   * @returns 响应数据
   */
  static async put<T = any>(
    url: string,
    data?: any,
    options?: RequestOptions
  ): Promise<T> {
    try {
      const instance = this.getInstance();
      const config = this.buildRequestConfig(options);
      const response = await instance.put(url, data, config);
      return this.parseResponse<T>(response);
    } catch (error) {
      this.handleError(error, options);
      throw error;
    }
  }

  /**
   * 发送 PATCH 请求
   * @param url - 请求 URL
   * @param data - 请求数据
   * @param options - 请求选项
   * @returns 响应数据
   */
  static async patch<T = any>(
    url: string,
    data?: any,
    options?: RequestOptions
  ): Promise<T> {
    try {
      const instance = this.getInstance();
      const config = this.buildRequestConfig(options);
      const response = await instance.patch(url, data, config);
      return this.parseResponse<T>(response);
    } catch (error) {
      this.handleError(error, options);
      throw error;
    }
  }

  /**
   * 发送 DELETE 请求
   * @param url - 请求 URL
   * @param options - 请求选项
   * @returns 响应数据
   */
  static async delete<T = any>(
    url: string,
    options?: RequestOptions
  ): Promise<T> {
    try {
      const instance = this.getInstance();
      const config = this.buildRequestConfig(options);
      const response = await instance.delete(url, config);
      return this.parseResponse<T>(response);
    } catch (error) {
      this.handleError(error, options);
      throw error;
    }
  }
}

/**
 * 数据源 API 实例
 * 提供数据源的增删改查操作
 */
export const datasourceApi = new DatasourceApi();

/**
 * 数据集 API 实例
 * 提供数据集相关的所有 HTTP 请求方法
 */
export const datasetApi = new DatasetApi();

/**
 * 查询 API 实例
 * 提供查询相关的 API 接口
 */
export const queryApi = new QueryApi();
