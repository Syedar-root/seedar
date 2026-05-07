import { randomBytes } from "node:crypto";
import { readFile } from "node:fs/promises";

import { input } from "@inquirer/prompts";

import {
  DEFAULT_DB_NAME,
  DEFAULT_DB_USER,
  DEFAULT_PORTS,
  DEFAULT_VERSION,
  buildCheckpointPgUrl,
  REQUIRED_ENV_KEYS,
} from "../shared/constants.js";
import { getAvailablePort } from "../docker/ports.js";
import {
  buildDefaultEnv,
  extractCheckpointPgPassword,
  parseEnvFile,
  pathExists,
} from "../runtime/index.js";
import type { CliFlags, EnvConfig, InstallConfigField, RuntimeLayout } from "../shared/types.js";

const PROMPTABLE_INSTALL_FIELDS = [
  "MYSQL_PORT",
  "SERVER_PORT",
  "WEB_PORT",
  "DB_DATABASE",
  "DB_USERNAME",
  "DB_PASSWORD",
  "MYSQL_ROOT_PASSWORD",
  "AI_CHECKPOINT_PG_PASSWORD",
  "AES_SECRET",
] as const;

type PromptableInstallField = (typeof PROMPTABLE_INSTALL_FIELDS)[number];

function createSecret(bytes = 24): string {
  return randomBytes(bytes).toString("hex");
}

function normalizeCheckpointRuntimeConfig(env: EnvConfig): EnvConfig {
  const checkpointPassword = env.AI_CHECKPOINT_PG_PASSWORD.trim();
  const checkpointUrl = env.AI_CHECKPOINT_PG_URL.trim();

  if (checkpointPassword) {
    return {
      ...env,
      AI_CHECKPOINT_PG_PASSWORD: checkpointPassword,
      AI_CHECKPOINT_PG_URL: buildCheckpointPgUrl(checkpointPassword),
    };
  }

  if (checkpointUrl) {
    const derivedPassword = extractCheckpointPgPassword(checkpointUrl);
    if (!derivedPassword) {
      throw new Error("AI_CHECKPOINT_PG_URL 无法解析密码");
    }

    return {
      ...env,
      AI_CHECKPOINT_PG_PASSWORD: derivedPassword,
      AI_CHECKPOINT_PG_URL: buildCheckpointPgUrl(derivedPassword),
    };
  }

  const generatedPassword = createSecret(16);
  return {
    ...env,
    AI_CHECKPOINT_PG_PASSWORD: generatedPassword,
    AI_CHECKPOINT_PG_URL: buildCheckpointPgUrl(generatedPassword),
  };
}

async function askInput(label: string, defaultValue: string): Promise<string> {
  const answer = (
    await input({
      message: label,
      default: defaultValue,
    })
  ).trim();
  return answer || defaultValue;
}

function assertPort(value: string, label: string): string {
  const numericPort = Number(value);
  if (!Number.isInteger(numericPort) || numericPort < 1 || numericPort > 65535) {
    throw new Error(`${label} 必须是 1-65535 之间的端口`);
  }

  return String(numericPort);
}

function assertAesSecret(value: string): string {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error("AES_SECRET 不能为空");
  }
  return normalized;
}

function toPromptableInstallFields(fields: InstallConfigField[]): PromptableInstallField[] {
  const requested = new Set(fields);
  return PROMPTABLE_INSTALL_FIELDS.filter((field) => requested.has(field));
}

async function loadExistingEnvOverrides(layout: RuntimeLayout): Promise<Partial<EnvConfig>> {
  if (!(await pathExists(layout.envPath))) {
    return {};
  }

  try {
    const content = await readFile(layout.envPath, "utf8");
    const parsed = parseEnvFile(content);
    const overrides: Partial<EnvConfig> = {};
    for (const key of REQUIRED_ENV_KEYS) {
      const value = parsed[key];
      if (value) {
        overrides[key] = value;
      }
    }
    return overrides;
  } catch {
    return {};
  }
}

async function promptInstallFields(
  env: EnvConfig,
  fields: readonly PromptableInstallField[],
): Promise<EnvConfig> {
  const nextEnv: EnvConfig = { ...env };

  for (const field of fields) {
    switch (field) {
      case "MYSQL_PORT":
        nextEnv.MYSQL_PORT = assertPort(await askInput("MySQL 端口", nextEnv.MYSQL_PORT), "MySQL 端口");
        break;
      case "SERVER_PORT":
        nextEnv.SERVER_PORT = assertPort(
          await askInput("Server 端口", nextEnv.SERVER_PORT),
          "Server 端口",
        );
        break;
      case "WEB_PORT":
        nextEnv.WEB_PORT = assertPort(await askInput("Web 端口", nextEnv.WEB_PORT), "Web 端口");
        break;
      case "DB_DATABASE":
        nextEnv.DB_DATABASE = await askInput("数据库名称", nextEnv.DB_DATABASE);
        nextEnv.MYSQL_DATABASE = nextEnv.DB_DATABASE;
        break;
      case "DB_USERNAME":
        nextEnv.DB_USERNAME = await askInput("数据库用户名", nextEnv.DB_USERNAME);
        nextEnv.MYSQL_USER = nextEnv.DB_USERNAME;
        break;
      case "DB_PASSWORD":
        nextEnv.DB_PASSWORD = await askInput("数据库密码", nextEnv.DB_PASSWORD);
        nextEnv.MYSQL_PASSWORD = nextEnv.DB_PASSWORD;
        break;
      case "MYSQL_ROOT_PASSWORD":
        nextEnv.MYSQL_ROOT_PASSWORD = await askInput(
          "MySQL Root 密码",
          nextEnv.MYSQL_ROOT_PASSWORD,
        );
        break;
      case "AI_CHECKPOINT_PG_PASSWORD": {
        const checkpointPassword = await askInput(
          "Checkpoint PG 密码",
          nextEnv.AI_CHECKPOINT_PG_PASSWORD,
        );
        nextEnv.AI_CHECKPOINT_PG_PASSWORD = checkpointPassword;
        nextEnv.AI_CHECKPOINT_PG_URL = buildCheckpointPgUrl(checkpointPassword);
        break;
      }
      case "AES_SECRET":
        nextEnv.AES_SECRET = assertAesSecret(await askInput("AES_SECRET", nextEnv.AES_SECRET));
        break;
    }
  }

  return nextEnv;
}

export async function collectInstallConfig(
  layout: RuntimeLayout,
  versionArg: string | undefined,
  flags: CliFlags,
): Promise<EnvConfig> {
  const version = versionArg ?? DEFAULT_VERSION;
  const defaultDbPassword = createSecret(16);
  const defaultRootPassword = createSecret(16);
  const defaultCheckpointPassword = createSecret(16);
  const defaultAesSecret = createSecret(24);
  const [mysqlPort, serverPort, webPort] = await Promise.all([
    getAvailablePort(DEFAULT_PORTS.mysql),
    getAvailablePort(DEFAULT_PORTS.server),
    getAvailablePort(DEFAULT_PORTS.web),
  ]);

  const generatedDefaults = buildDefaultEnv(layout, {
    SEEDAR_VERSION: version,
    MYSQL_PORT: String(mysqlPort),
    SERVER_PORT: String(serverPort),
    WEB_PORT: String(webPort),
    DB_HOST: "mysql",
    DB_PORT: "3306",
    DB_USERNAME: DEFAULT_DB_USER,
    DB_PASSWORD: defaultDbPassword,
    DB_DATABASE: DEFAULT_DB_NAME,
    MYSQL_ROOT_PASSWORD: defaultRootPassword,
    MYSQL_DATABASE: DEFAULT_DB_NAME,
    MYSQL_USER: DEFAULT_DB_USER,
    MYSQL_PASSWORD: defaultDbPassword,
    AI_CHECKPOINT_PG_PASSWORD: defaultCheckpointPassword,
    AI_CHECKPOINT_PG_URL: buildCheckpointPgUrl(defaultCheckpointPassword),
    AES_SECRET: defaultAesSecret,
  });
  const existingOverrides = await loadExistingEnvOverrides(layout);
  const existingCheckpointPassword = existingOverrides.AI_CHECKPOINT_PG_PASSWORD?.trim();
  const existingCheckpointUrl = existingOverrides.AI_CHECKPOINT_PG_URL?.trim();
  const derivedCheckpointPassword = existingCheckpointUrl
    ? extractCheckpointPgPassword(existingCheckpointUrl)
    : null;
  if (existingCheckpointUrl && !existingCheckpointPassword && !derivedCheckpointPassword) {
    throw new Error("AI_CHECKPOINT_PG_URL 无法解析密码");
  }

  const checkpointPassword =
    existingCheckpointPassword ?? derivedCheckpointPassword ?? defaultCheckpointPassword;
  const defaults = normalizeCheckpointRuntimeConfig({
    ...generatedDefaults,
    ...existingOverrides,
    AI_CHECKPOINT_PG_PASSWORD: checkpointPassword,
    AI_CHECKPOINT_PG_URL: buildCheckpointPgUrl(checkpointPassword),
    SEEDAR_VERSION:
      versionArg ?? existingOverrides.SEEDAR_VERSION ?? generatedDefaults.SEEDAR_VERSION,
    SEEDAR_INSTALL_ROOT: generatedDefaults.SEEDAR_INSTALL_ROOT,
    SEEDAR_INSTANCE_ID: generatedDefaults.SEEDAR_INSTANCE_ID,
    SEEDAR_PROJECT_NAME: generatedDefaults.SEEDAR_PROJECT_NAME,
  });

  if (!process.stdin.isTTY || flags.yes) {
    console.log("使用默认安装参数初始化 Seedar。");
    return defaults;
  }

  if (Object.keys(existingOverrides).length > 0) {
    console.log("检测到已有配置，直接回车即可保留当前值。");
  }

  return promptInstallFields(defaults, PROMPTABLE_INSTALL_FIELDS);
}

export async function collectProblemInstallConfig(
  env: EnvConfig,
  fields: InstallConfigField[],
  flags: CliFlags,
): Promise<EnvConfig> {
  if (!process.stdin.isTTY || flags.yes) {
    return env;
  }

  const promptFields = toPromptableInstallFields(fields);
  if (promptFields.length === 0) {
    return env;
  }

  console.log("配置检查未通过，请仅修改有问题的配置项。");
  return promptInstallFields(env, promptFields);
}
