import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDatasourceApi } from './useApi';
import type {
  DatasourceResponse,
  CreateDatasourceRequest,
  UpdateDatasourceRequest,
} from '@seedar/types';

/**
 * 查询键工厂
 * 用于生成和管理 React Query 的查询键
 */
const datasourceKeys = {
  all: ['datasources'] as const,
  lists: () => [...datasourceKeys.all, 'list'] as const,
  list: (filters?: Record<string, any>) => [...datasourceKeys.lists(), filters] as const,
  details: () => [...datasourceKeys.all, 'detail'] as const,
  detail: (id: number) => [...datasourceKeys.details(), id] as const,
};

/**
 * 获取数据源列表
 * @returns 包含数据源列表、加载状态和错误信息的查询结果
 */
export const useDatasources = () => {
  const datasourceApi = useDatasourceApi();

  return useQuery({
    queryKey: datasourceKeys.lists(),
    queryFn: () => datasourceApi.findAll(),
  });
};

/**
 * 获取单个数据源
 * @param id - 数据源 ID
 * @returns 包含数据源详情、加载状态和错误信息的查询结果
 */
export const useDatasource = (id: number) => {
  const datasourceApi = useDatasourceApi();

  return useQuery({
    queryKey: datasourceKeys.detail(id),
    queryFn: () => datasourceApi.findOne(id),
    enabled: !!id,
  });
};

/**
 * 创建数据源
 * @returns 包含创建数据源的 mutation 对象
 */
export const useCreateDatasource = () => {
  const queryClient = useQueryClient();
  const datasourceApi = useDatasourceApi();

  return useMutation({
    mutationFn: (data: CreateDatasourceRequest) => datasourceApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: datasourceKeys.lists() });
    },
  });
};

/**
 * 更新数据源
 * @returns 包含更新数据源的 mutation 对象
 */
export const useUpdateDatasource = () => {
  const queryClient = useQueryClient();
  const datasourceApi = useDatasourceApi();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateDatasourceRequest }) =>
      datasourceApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: datasourceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: datasourceKeys.detail(variables.id) });
    },
  });
};

/**
 * 删除数据源
 * @returns 包含删除数据源的 mutation 对象
 */
export const useDeleteDatasource = () => {
  const queryClient = useQueryClient();
  const datasourceApi = useDatasourceApi();

  return useMutation({
    mutationFn: (id: number) => datasourceApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: datasourceKeys.lists() });
    },
  });
};
