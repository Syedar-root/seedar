import type {
  DataSourceType,
  DatasourceResponse,
  TestDatasourceConnectionRequest,
} from "#pkg/seedar/types";
import type { ConnectionConfig } from "../ConnectionForm/ConnectionForm";
import type { DatasourceType } from "../DatasourceTypeSelector/DatasourceTypeSelector";

export type DatasourceFormMode = "create" | "edit";

export interface DatasourceFormDialogProps {
  open: boolean;
  mode: DatasourceFormMode;
  datasource?: DatasourceResponse;
  onClose: () => void;
  onSuccess: (datasourceId: number) => void;
}

export type DatabaseConnectionPayload = NonNullable<
  TestDatasourceConnectionRequest["config"]
>;

export interface ValidationOptions {
  mode: DatasourceFormMode;
  datasourceType: DatasourceType;
}

export interface ValidationResult {
  success: boolean;
  message?: string;
}

export interface DatasourceTypeOption {
  value: DatasourceType;
  apiValue: DataSourceType;
  defaultPort: string;
}

export interface BuildPayloadOptions {
  mode: DatasourceFormMode;
  type: DatasourceType;
}

export interface DatasourceFormInitialState {
  datasourceType: DatasourceType;
  connectionConfig: ConnectionConfig;
  isSupported: boolean;
}
