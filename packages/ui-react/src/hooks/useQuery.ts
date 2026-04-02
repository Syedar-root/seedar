import {
  useQuery as useReactQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { useQueryApi } from './useApi';
import type {
  QueryResponse,
  CreateQueryRequest,
  UpdateQueryRequest,
  ExecuteQueryResponse,
  QueryStatus,
  QueryDSL,
} from '#pkg/seedar/types';

/**
 * 查询键工厂
 * 用于生成和管理 React Query 的查询键
 */
const queryKeys = {
  all: ['queries'] as const,
  lists: () => [...queryKeys.all, 'list'] as const,
  list: (status?: QueryStatus) => [...queryKeys.lists(), status] as const,
  details: () => [...queryKeys.all, 'detail'] as const,
  detail: (id: string) => [...queryKeys.details(), id] as const,
  execution: (id: string) => [...queryKeys.all, 'execution', id] as const,
};

/**
 * 获取查询列表
 * @param status - 查询状态（可选）
 * @returns 包含查询列表、加载状态和错误信息的查询结果
 */
export const useQueries = (status?: QueryStatus) => {
  const queryApi = useQueryApi();

  return useReactQuery({
    queryKey: queryKeys.list(status),
    queryFn: () => queryApi.findAll(status),
  });
};

/**
 * 获取单个查询
 * @param id - 查询 ID
 * @returns 包含查询详情、加载状态和错误信息的查询结果
 */
export const useQuery = (id: string) => {
  const queryApi = useQueryApi();

  return useReactQuery({
    queryKey: queryKeys.detail(id),
    queryFn: () => queryApi.findOne(id),
    enabled: !!id,
  });
};

/**
 * 创建查询
 * @returns 包含创建查询的 mutation 对象
 */
export const useCreateQuery = () => {
  const queryClient = useQueryClient();
  const queryApi = useQueryApi();

  return useMutation({
    mutationFn: (data: CreateQueryRequest) => queryApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lists() });
    },
  });
};

/**
 * 更新查询
 * @returns 包含更新查询的 mutation 对象
 */
export const useUpdateQuery = () => {
  const queryClient = useQueryClient();
  const queryApi = useQueryApi();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateQueryRequest }) =>
      queryApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.detail(variables.id),
      });
    },
  });
};

/**
 * 删除查询
 * @returns 包含删除查询的 mutation 对象
 */
export const useDeleteQuery = () => {
  const queryClient = useQueryClient();
  const queryApi = useQueryApi();

  return useMutation({
    mutationFn: (id: string) => queryApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lists() });
    },
  });
};

/**
 * 执行查询
 * @returns 包含执行查询的 mutation 对象
 */
export const useExecuteQuery = () => {
  const queryApi = useQueryApi();

  return useMutation({
    mutationFn: (queryId: string) => queryApi.execute(queryId),
  });
};

/**
 * 执行临时查询
 * @returns 包含执行临时查询的 mutation 对象
 */
export const useExecuteTempQuery = () => {
  const queryApi = useQueryApi();

  return useMutation({
    mutationFn: (dsl: QueryDSL) => queryApi.executeTemp(dsl),
  });
};
