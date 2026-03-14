import { useCallback } from 'react';
import { DatasourceApi, DatasetApi, QueryApi } from '#pkg/seedar/ui-core';
import type {
  DatasourceResponse,
  CreateDatasourceRequest,
  UpdateDatasourceRequest,
  DatasetResponse,
  CreateDatasetRequest,
  UpdateDatasetRequest,
  QueryResponse,
  CreateQueryRequest,
  UpdateQueryRequest,
  ExecuteQueryResponse,
  QueryStatus,
  RequestOptions,
} from '#pkg/seedar/types';

/**
 * 使用数据源 API 的 Hook
 * 提供数据源相关的所有 API 方法
 */
export const useDatasourceApi = () => {
  const findAll = useCallback((options?: RequestOptions) => {
    return DatasourceApi.findAll(options);
  }, []);

  const findOne = useCallback((id: number, options?: RequestOptions) => {
    return DatasourceApi.findOne(id, options);
  }, []);

  const create = useCallback(
    (data: CreateDatasourceRequest, options?: RequestOptions) => {
      return DatasourceApi.create(data, options);
    },
    []
  );

  const update = useCallback(
    (id: number, data: UpdateDatasourceRequest, options?: RequestOptions) => {
      return DatasourceApi.update(id, data, options);
    },
    []
  );

  const remove = useCallback((id: number, options?: RequestOptions) => {
    return DatasourceApi.remove(id, options);
  }, []);

  return {
    findAll,
    findOne,
    create,
    update,
    remove,
  };
};

/**
 * 使用数据集 API 的 Hook
 * 提供数据集相关的所有 API 方法
 */
export const useDatasetApi = () => {
  const findAll = useCallback((options?: RequestOptions) => {
    return DatasetApi.findAll(options);
  }, []);

  const findOne = useCallback((id: number, options?: RequestOptions) => {
    return DatasetApi.findOne(id, options);
  }, []);

  const create = useCallback(
    (data: CreateDatasetRequest, options?: RequestOptions) => {
      return DatasetApi.create(data, options);
    },
    []
  );

  const update = useCallback(
    (data: UpdateDatasetRequest, options?: RequestOptions) => {
      return DatasetApi.update(data, options);
    },
    []
  );

  const remove = useCallback((id: number, options?: RequestOptions) => {
    return DatasetApi.remove(id, options);
  }, []);

  return {
    findAll,
    findOne,
    create,
    update,
    remove,
  };
};

/**
 * 使用查询 API 的 Hook
 * 提供查询相关的所有 API 方法
 */
export const useQueryApi = () => {
  const findAll = useCallback(
    (status?: QueryStatus, options?: RequestOptions) => {
      return QueryApi.findAll(status, options);
    },
    []
  );

  const findOne = useCallback((id: string, options?: RequestOptions) => {
    return QueryApi.findOne(id, options);
  }, []);

  const create = useCallback(
    (data: CreateQueryRequest, options?: RequestOptions) => {
      return QueryApi.create(data, options);
    },
    []
  );

  const update = useCallback(
    (id: string, data: UpdateQueryRequest, options?: RequestOptions) => {
      return QueryApi.update(id, data, options);
    },
    []
  );

  const remove = useCallback((id: string, options?: RequestOptions) => {
    return QueryApi.remove(id, options);
  }, []);

  const execute = useCallback((queryId: string, options?: RequestOptions) => {
    return QueryApi.execute(queryId, options);
  }, []);

  return {
    findAll,
    findOne,
    create,
    update,
    remove,
    execute,
  };
};
