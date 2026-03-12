import { ApiConfig } from '@seedar/types';

/**
 * 默认 API 配置
 */
export const defaultApiConfig: ApiConfig = {
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  autoParseResponse: true,
  globalOnError: undefined,
};

/**
 * 重新导出 ApiConfig 类型
 */
export type { ApiConfig };
