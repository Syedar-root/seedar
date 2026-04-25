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

export type InstallState = "installed" | "uninstalled" | "unknown";

export interface CliFlags {
  yes: boolean;
  force: boolean;
  follow: boolean;
  removeData: boolean;
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
