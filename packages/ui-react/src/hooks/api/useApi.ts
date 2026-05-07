import { useCallback } from "react";
import {
  DatasourceApi,
  DatasetApi,
  QueryApi,
  DashboardApi,
  PanelApi,
  AiApi,
} from "#pkg/seedar/ui-core";
import type {
  DatasourceResponse,
  CreateDatasourceRequest,
  TestDatasourceConnectionRequest,
  UpdateDatasourceRequest,
  DatasetResponse,
  CreateDatasetRequest,
  UpdateDatasetRequest,
  QueryResponse,
  CreateQueryRequest,
  UpdateQueryRequest,
  ExecuteQueryResponse,
  QueryStatus,
  QueryDSL,
  DashboardResponse,
  CreateDashboardRequest,
  UpdateDashboardRequest,
  PanelResponse,
  CreatePanelRequest,
  UpdatePanelRequest,
  Layouts,
  RequestOptions,
  AiResponse,
  CreateAiRequest,
  UpdateAiRequest,
  AiSessionResponse,
  AiSessionStatus,
  AiSessionType,
  AiSessionMessageResponse,
  CursorPaginatedResponse,
  CreateAiSessionRequest,
  UpdateAiSessionRequest,
  AiChatRequestDto,
  AiAgentStreamChunk,
  AiContextStatusEvent,
  GenerateFieldBusinessNameRequest,
  GenerateFieldBusinessNameResponse,
} from "#pkg/seedar/types";

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
    [],
  );

  const testConnection = useCallback(
    (data: TestDatasourceConnectionRequest, options?: RequestOptions) => {
      return DatasourceApi.testConnection(data, options);
    },
    [],
  );

  const update = useCallback(
    (id: number, data: UpdateDatasourceRequest, options?: RequestOptions) => {
      return DatasourceApi.update(id, data, options);
    },
    [],
  );

  const remove = useCallback((id: number, options?: RequestOptions) => {
    return DatasourceApi.remove(id, options);
  }, []);

  return {
    findAll,
    findOne,
    create,
    testConnection,
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
    [],
  );

  const update = useCallback(
    (data: UpdateDatasetRequest, options?: RequestOptions) => {
      return DatasetApi.update(data, options);
    },
    [],
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
    [],
  );

  const findOne = useCallback((id: string, options?: RequestOptions) => {
    return QueryApi.findOne(id, options);
  }, []);

  const create = useCallback(
    (data: CreateQueryRequest, options?: RequestOptions) => {
      return QueryApi.create(data, options);
    },
    [],
  );

  const update = useCallback(
    (id: string, data: UpdateQueryRequest, options?: RequestOptions) => {
      return QueryApi.update(id, data, options);
    },
    [],
  );

  const remove = useCallback((id: string, options?: RequestOptions) => {
    return QueryApi.remove(id, options);
  }, []);

  const execute = useCallback((queryId: string, options?: RequestOptions) => {
    return QueryApi.execute(queryId, options);
  }, []);

  const executeTemp = useCallback((dsl: QueryDSL, options?: RequestOptions) => {
    return QueryApi.executeTemp(dsl, options);
  }, []);

  return {
    findAll,
    findOne,
    create,
    update,
    remove,
    execute,
    executeTemp,
  };
};

export const useDashboardApi = () => {
  const findAll = useCallback((options?: RequestOptions) => {
    return DashboardApi.findAll(options);
  }, []);

  const findOne = useCallback((id: string, options?: RequestOptions) => {
    return DashboardApi.findOne(id, options);
  }, []);

  const create = useCallback(
    (data: CreateDashboardRequest, options?: RequestOptions) => {
      return DashboardApi.create(data, options);
    },
    [],
  );

  const update = useCallback(
    (id: string, data: UpdateDashboardRequest, options?: RequestOptions) => {
      return DashboardApi.update(id, data, options);
    },
    [],
  );

  const remove = useCallback((id: string, options?: RequestOptions) => {
    return DashboardApi.remove(id, options);
  }, []);

  const updateLayout = useCallback(
    (id: string, layout: Layouts, options?: RequestOptions) => {
      return DashboardApi.updateLayout(id, layout, options);
    },
    [],
  );

  const addPanel = useCallback(
    (id: string, panelId: string, options?: RequestOptions) => {
      return DashboardApi.addPanel(id, panelId, options);
    },
    [],
  );

  const removePanel = useCallback(
    (id: string, panelId: string, options?: RequestOptions) => {
      return DashboardApi.removePanel(id, panelId, options);
    },
    [],
  );

  return {
    findAll,
    findOne,
    create,
    update,
    remove,
    updateLayout,
    addPanel,
    removePanel,
  };
};

export const usePanelApi = () => {
  const findAll = useCallback((options?: RequestOptions) => {
    return PanelApi.findAll(options);
  }, []);

  const findOne = useCallback((id: string, options?: RequestOptions) => {
    return PanelApi.findOne(id, options);
  }, []);

  const create = useCallback(
    (data: CreatePanelRequest, options?: RequestOptions) => {
      return PanelApi.create(data, options);
    },
    [],
  );

  const update = useCallback(
    (id: string, data: UpdatePanelRequest, options?: RequestOptions) => {
      return PanelApi.update(id, data, options);
    },
    [],
  );

  const remove = useCallback((id: string, options?: RequestOptions) => {
    return PanelApi.remove(id, options);
  }, []);

  return {
    findAll,
    findOne,
    create,
    update,
    remove,
  };
};

export const useAiApi = () => {
  const findAll = useCallback(
    (page?: number, pageSize?: number, options?: RequestOptions) => {
      return AiApi.findAll(page, pageSize, options);
    },
    [],
  );

  const findOne = useCallback((id: string, options?: RequestOptions) => {
    return AiApi.findOne(id, options);
  }, []);

  const create = useCallback(
    (data: CreateAiRequest, options?: RequestOptions) => {
      return AiApi.create(data, options);
    },
    [],
  );

  const update = useCallback(
    (data: UpdateAiRequest, options?: RequestOptions) => {
      return AiApi.update(data, options);
    },
    [],
  );

  const remove = useCallback((id: string, options?: RequestOptions) => {
    return AiApi.remove(id, options);
  }, []);

  const createSession = useCallback(
    (data: CreateAiSessionRequest, options?: RequestOptions) => {
      return AiApi.createSession(data, options);
    },
    [],
  );

  const findSessions = useCallback(
    (
      page?: number,
      pageSize?: number,
      status?: AiSessionStatus,
      type?: AiSessionType,
      options?: RequestOptions,
    ) => {
      return AiApi.findSessions(page, pageSize, status, type, options);
    },
    [],
  );

  const findSession = useCallback((id: string, options?: RequestOptions) => {
    return AiApi.findSession(id, options);
  }, []);

  const updateSession = useCallback(
    (data: UpdateAiSessionRequest, options?: RequestOptions) => {
      return AiApi.updateSession(data, options);
    },
    [],
  );

  const deleteSession = useCallback(
    (id: string, options?: RequestOptions) => {
      return AiApi.deleteSession(id, options);
    },
    [],
  );

  const listSessionMessages = useCallback(
    (
      id: string,
      cursor?: string,
      limit: number = 50,
      options?: RequestOptions,
    ) => {
      return AiApi.listSessionMessages(id, cursor, limit, options);
    },
    [],
  );

  const streamChat = (
    dto: AiChatRequestDto,
    callbacks: {
      onSession?: (data: { sessionId: string; timestamp: string }) => void;
      onMessage?: (chunk: AiAgentStreamChunk) => void;
      onContext?: (event: AiContextStatusEvent) => void;
      onDone?: (data: { sessionId: string }) => void;
      onError?: (error: string) => void;
      onPing?: () => void;
    },
  ) => {
    return AiApi.streamChat(dto, callbacks);
  };

  const generateFieldBusinessNames = useCallback(
    (data: GenerateFieldBusinessNameRequest, options?: RequestOptions) => {
      return AiApi.generateFieldBusinessNames(data, options);
    },
    [],
  );

  return {
    findAll,
    findOne,
    create,
    update,
    remove,
    createSession,
    findSessions,
    findSession,
    updateSession,
    deleteSession,
    listSessionMessages,
    streamChat,
    generateFieldBusinessNames,
  };
};
