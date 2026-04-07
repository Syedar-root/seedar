/**
 * API 响应通用类型
 * @template T - 响应数据的类型
 */
export interface ApiResponse<T = any> {
  /** 请求是否成功 */
  success: boolean;
  /** 响应状态码 */
  code: string;
  /** 响应消息 */
  message: string;
  /** 响应数据 */
  data: T;
}

/**
 * API 错误信息接口
 */
export interface ApiError {
  /** 错误消息 */
  message: string;
  /** 错误码 */
  code?: string;
  /** 错误详细信息 */
  details?: any;
}

/**
 * API 配置接口
 */
export interface ApiConfig {
  /** API 基础 URL */
  baseURL: string;
  /** 请求超时时间（毫秒） */
  timeout?: number;
  /** 默认请求头 */
  headers?: Record<string, string>;
  /** 是否自动解析响应 */
  autoParseResponse?: boolean;
  /** 全局错误处理函数 */
  globalOnError?: (error: ApiError) => void;
}

/**
 * 请求选项接口
 */
export interface RequestOptions {
  /** 请求参数 */
  params?: Record<string, any>;
  /** 请求头 */
  headers?: Record<string, string>;
  /** 错误处理函数 */
  onError?: (error: ApiError, globalOnError?: (error: ApiError) => void) => void;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
