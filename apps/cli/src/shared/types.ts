export interface RuntimeLayout {
  installRoot: string;
  runtimeDir: string;
  dataDir: string;
  mysqlDataDir: string;
  logsDir: string;
  backupsDir: string;
  composePath: string;
  envPath: string;
  versionPath: string;
  statePath: string;
  instanceId: string;
  projectName: string;
}

export interface EnvConfig {
  SEEDAR_VERSION: string;
  SEEDAR_INSTALL_ROOT: string;
  SEEDAR_INSTANCE_ID: string;
  SEEDAR_PROJECT_NAME: string;
  MYSQL_PORT: string;
  SERVER_PORT: string;
  WEB_PORT: string;
  DB_HOST: string;
  DB_PORT: string;
  DB_USERNAME: string;
  DB_PASSWORD: string;
  DB_DATABASE: string;
  MYSQL_ROOT_PASSWORD: string;
  MYSQL_DATABASE: string;
  MYSQL_USER: string;
  MYSQL_PASSWORD: string;
  AES_SECRET: string;
}

export type InstallConfigField =
  | "SEEDAR_VERSION"
  | "MYSQL_PORT"
  | "SERVER_PORT"
  | "WEB_PORT"
  | "DB_HOST"
  | "DB_PORT"
  | "DB_USERNAME"
  | "DB_PASSWORD"
  | "DB_DATABASE"
  | "MYSQL_ROOT_PASSWORD"
  | "MYSQL_DATABASE"
  | "MYSQL_USER"
  | "MYSQL_PASSWORD"
  | "AES_SECRET";

export interface InstallConfigIssue {
  field: InstallConfigField;
  message: string;
}

export type InstallState = "installed" | "uninstalled" | "unknown";

export interface CliFlags {
  yes: boolean;
  force: boolean;
  follow: boolean;
  removeData: boolean;
  all: boolean;
}

export interface RunResult {
  code: number;
  stdout: string;
  stderr: string;
}

export interface DoctorCheck {
  code: string;
  status: "ok" | "warn" | "fail";
  title: string;
  detail: string;
}
