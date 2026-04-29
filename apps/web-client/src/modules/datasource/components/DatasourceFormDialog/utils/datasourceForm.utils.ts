import type {
  CreateDatasourceRequest,
  DatasourceResponse,
  TestDatasourceConnectionRequest,
  UpdateDatasourceRequest,
} from "#pkg/seedar/types";
import { DataSourceType } from "#pkg/seedar/types";
import type { ConnectionConfig } from "../../ConnectionForm/ConnectionForm";
import type { DatasourceType } from "../../DatasourceTypeSelector/DatasourceTypeSelector";
import type {
  BuildPayloadOptions,
  DatabaseConnectionPayload,
  DatasourceFormInitialState,
  DatasourceTypeOption,
  ValidationOptions,
  ValidationResult,
} from "../types";

const DATASOURCE_TYPE_OPTIONS: DatasourceTypeOption[] = [
  { value: "mysql", apiValue: DataSourceType.MYSQL, defaultPort: "3306" },
  { value: "postgres", apiValue: DataSourceType.POSTGRES, defaultPort: "5432" },
  {
    value: "clickhouse",
    apiValue: DataSourceType.CLICKHOUSE,
    defaultPort: "8123",
  },
];

const SUPPORTED_DATASOURCE_TYPES = new Set<DatasourceType>(
  DATASOURCE_TYPE_OPTIONS.map((option) => option.value),
);

export const isSupportedDatasourceType = (
  type: string,
): type is DatasourceType => SUPPORTED_DATASOURCE_TYPES.has(type as DatasourceType);

export const getDatasourceDefaultPort = (type: DatasourceType): string => {
  return (
    DATASOURCE_TYPE_OPTIONS.find((option) => option.value === type)?.defaultPort ||
    "3306"
  );
};

export const getDatasourceApiType = (type: DatasourceType): DataSourceType => {
  return (
    DATASOURCE_TYPE_OPTIONS.find((option) => option.value === type)?.apiValue ||
    DataSourceType.MYSQL
  );
};

export const buildConnectionPayload = (
  config: ConnectionConfig,
  type: DatasourceType,
): DatabaseConnectionPayload | null => {
  const port = config.port?.trim() || getDatasourceDefaultPort(type);

  if (type === "mysql" || type === "postgres" || type === "clickhouse") {
    return {
      host: config.host?.trim() || "",
      port,
      database: config.database?.trim() || "",
      username: config.username?.trim() || "",
      password: config.password || "",
    };
  }

  return null;
};

export const validateDatasourceForm = (
  config: ConnectionConfig,
  options: ValidationOptions,
): ValidationResult => {
  if (!config.name.trim()) {
    return { success: false, message: "请输入数据源名称" };
  }

  if (!options.datasourceType) {
    return { success: false, message: "请选择数据源类型" };
  }

  if (!config.host?.trim()) {
    return { success: false, message: "请输入主机地址" };
  }

  if (!config.port?.trim()) {
    return { success: false, message: "请输入端口" };
  }

  if (!config.database?.trim()) {
    return { success: false, message: "请输入数据库名称" };
  }

  if (!config.username?.trim()) {
    return { success: false, message: "请输入用户名" };
  }

  if (options.mode === "create" && !config.password?.trim()) {
    return { success: false, message: "请输入密码" };
  }

  return { success: true };
};

export const buildCreateDatasourcePayload = (
  connectionConfig: ConnectionConfig,
  datasourceType: DatasourceType,
): CreateDatasourceRequest | null => {
  const config = buildConnectionPayload(connectionConfig, datasourceType);
  if (!config) {
    return null;
  }

  return {
    name: connectionConfig.name.trim(),
    type: getDatasourceApiType(datasourceType),
    config,
  };
};

export const buildUpdateDatasourcePayload = (
  connectionConfig: ConnectionConfig,
  datasourceType: DatasourceType,
): UpdateDatasourceRequest | null => {
  const config = buildConnectionPayload(connectionConfig, datasourceType);
  if (!config) {
    return null;
  }

  return {
    name: connectionConfig.name.trim(),
    type: getDatasourceApiType(datasourceType),
    config,
  };
};

export const buildTestConnectionPayload = (
  config: ConnectionConfig,
): TestDatasourceConnectionRequest | null => {
  const payload = buildConnectionPayload(config, config.type);
  if (!payload) {
    return null;
  }

  return {
    type: getDatasourceApiType(config.type),
    config: payload,
  };
};

export const getDatasourceFormInitialState = (
  datasource?: DatasourceResponse,
): DatasourceFormInitialState => {
  if (!datasource) {
    return {
      datasourceType: "mysql",
      connectionConfig: {
        type: "mysql",
        name: "",
        port: getDatasourceDefaultPort("mysql"),
      },
      isSupported: true,
    };
  }

  const datasourceType = isSupportedDatasourceType(datasource.type)
    ? datasource.type
    : "mysql";
  const defaultPort = getDatasourceDefaultPort(datasourceType);

  return {
    datasourceType,
    connectionConfig: {
      type: datasourceType,
      name: datasource.name || "",
      host: datasource.config?.host || "",
      port: datasource.config?.port || defaultPort,
      database: datasource.config?.database || "",
      username: datasource.config?.username || "",
      password: "",
    },
    isSupported: isSupportedDatasourceType(datasource.type),
  };
};
