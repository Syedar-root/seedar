import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDatasetApi } from './useApi';
import type {
  DatasetResponse,
  CreateDatasetRequest,
  UpdateDatasetRequest,
} from '#pkg/seedar/types';

/**
 * 查询键工厂
 * 用于生成和管理 React Query 的查询键
 */
const datasetKeys = {
  all: ['datasets'] as const,
  lists: () => [...datasetKeys.all, 'list'] as const,
  list: (filters?: Record<string, any>) =>
    [...datasetKeys.lists(), filters] as const,
  details: () => [...datasetKeys.all, 'detail'] as const,
  detail: (id: number) => [...datasetKeys.details(), id] as const,
};

/**
 * 获取数据集列表
 * @returns 包含数据集列表、加载状态和错误信息的查询结果
 */
export const useDatasets = () => {
  const datasetApi = useDatasetApi();

  return useQuery({
    queryKey: datasetKeys.lists(),
    queryFn: () => datasetApi.findAll(),
  });
};

/**
 * 获取单个数据集
 * @param id - 数据集 ID
 * @returns 包含数据集详情、加载状态和错误信息的查询结果
 */
export const useDataset = (id: number) => {
  const datasetApi = useDatasetApi();

  return useQuery({
    queryKey: datasetKeys.detail(id),
    queryFn: () => datasetApi.findOne(id),
    enabled: !!id,
  });
};

/**
 * 创建数据集
 * @returns 包含创建数据集的 mutation 对象
 */
export const useCreateDataset = () => {
  const queryClient = useQueryClient();
  const datasetApi = useDatasetApi();

  return useMutation({
    mutationFn: (data: CreateDatasetRequest) => datasetApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: datasetKeys.lists() });
    },
  });
};

/**
 * 更新数据集
 * @returns 包含更新数据集的 mutation 对象
 */
export const useUpdateDataset = () => {
  const queryClient = useQueryClient();
  const datasetApi = useDatasetApi();

  return useMutation({
    mutationFn: (data: UpdateDatasetRequest) => datasetApi.update(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: datasetKeys.lists() });
      if (variables.dataSetId) {
        queryClient.invalidateQueries({
          queryKey: datasetKeys.detail(variables.dataSetId),
        });
      }
    },
  });
};

/**
 * 删除数据集
 * @returns 包含删除数据集的 mutation 对象
 */
export const useDeleteDataset = () => {
  const queryClient = useQueryClient();
  const datasetApi = useDatasetApi();

  return useMutation({
    mutationFn: (id: number) => datasetApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: datasetKeys.lists() });
    },
  });
};
