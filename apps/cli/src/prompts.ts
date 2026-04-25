import { randomBytes } from "node:crypto";
import { readFile } from "node:fs/promises";
import { input } from "@inquirer/prompts";

import {
  DEFAULT_DB_NAME,
  DEFAULT_DB_USER,
  DEFAULT_PORTS,
  DEFAULT_VERSION,
  REQUIRED_ENV_KEYS,
} from "./constants.js";
import { getAvailablePort, isPortAvailable } from "./ports.js";
import { buildDefaultEnv, parseEnvFile, pathExists } from "./runtime.js";
import type { CliFlags, EnvConfig, RuntimeLayout } from "./types.js";

type PortEnvKey = "MYSQL_PORT" | "SERVER_PORT" | "WEB_PORT";

function createSecret(bytes = 24): string {
  return randomBytes(bytes).toString("hex");
}

async function askInput(
  label: string,
  defaultValue: string,
): Promise<string> {
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

async function resolvePortSelection(
  portInputs: Array<{ key: PortEnvKey; label: string; value: string }>,
): Promise<Record<PortEnvKey, string>> {
  const chosenPorts = new Set<number>();
  const notices: string[] = [];
  const resolved = {} as Record<PortEnvKey, string>;

  for (const item of portInputs) {
    const preferred = Number(item.value);
    const isDuplicated = chosenPorts.has(preferred);
    const isOccupied = !isDuplicated && !(await isPortAvailable(preferred));
    let finalPort = preferred;

    if (isDuplicated || isOccupied) {
      finalPort = await getAvailablePort(preferred, chosenPorts);
      const reason = isDuplicated ? "与其他服务端口重复" : "已被占用";
      notices.push(`${item.label} ${preferred} ${reason}，自动调整为 ${finalPort}`);
    }

    chosenPorts.add(finalPort);
    resolved[item.key] = String(finalPort);
  }

  if (notices.length > 0) {
    console.log("检测到端口冲突，已自动避让:");
    for (const notice of notices) {
      console.log(`- ${notice}`);
    }
  }

  return resolved;
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

export async function collectInstallConfig(
  layout: RuntimeLayout,
  versionArg: string | undefined,
  flags: CliFlags,
): Promise<EnvConfig> {
  const version = versionArg ?? DEFAULT_VERSION;
  const defaultDbPassword = createSecret(16);
  const defaultRootPassword = createSecret(16);
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
    AES_SECRET: defaultAesSecret,
  });
  const existingOverrides = await loadExistingEnvOverrides(layout);
  const defaults: EnvConfig = {
    ...generatedDefaults,
    ...existingOverrides,
    SEEDAR_VERSION:
      versionArg ?? existingOverrides.SEEDAR_VERSION ?? generatedDefaults.SEEDAR_VERSION,
    SEEDAR_INSTALL_ROOT: generatedDefaults.SEEDAR_INSTALL_ROOT,
    SEEDAR_INSTANCE_ID: generatedDefaults.SEEDAR_INSTANCE_ID,
    SEEDAR_PROJECT_NAME: generatedDefaults.SEEDAR_PROJECT_NAME,
  };

  if (!process.stdin.isTTY || flags.yes) {
    console.log("使用默认安装参数初始化 Seedar。");
    return defaults;
  }

  if (Object.keys(existingOverrides).length > 0) {
    console.log("检测到已有配置，默认会复用原有参数（直接回车保持）。");
  }

  const requestedPorts = [
    {
      key: "MYSQL_PORT" as const,
      label: "MySQL 端口",
      value: assertPort(
        await askInput("MySQL 端口", defaults.MYSQL_PORT),
        "MySQL 端口",
      ),
    },
    {
      key: "SERVER_PORT" as const,
      label: "Server 端口",
      value: assertPort(
        await askInput("Server 端口", defaults.SERVER_PORT),
        "Server 端口",
      ),
    },
    {
      key: "WEB_PORT" as const,
      label: "Web 端口",
      value: assertPort(
        await askInput("Web 端口", defaults.WEB_PORT),
        "Web 端口",
      ),
    },
  ];
  const resolvedPorts = await resolvePortSelection(requestedPorts);

  const DB_DATABASE = await askInput("数据库名称", defaults.DB_DATABASE);
  const DB_USERNAME = await askInput("数据库用户名", defaults.DB_USERNAME);
  const DB_PASSWORD = await askInput("数据库密码", defaults.DB_PASSWORD);
  const MYSQL_ROOT_PASSWORD = await askInput(
    "MySQL Root 密码",
    defaults.MYSQL_ROOT_PASSWORD,
  );
  const AES_SECRET = assertAesSecret(
    await askInput("AES_SECRET", defaults.AES_SECRET),
  );

  return {
    ...defaults,
    MYSQL_PORT: resolvedPorts.MYSQL_PORT,
    SERVER_PORT: resolvedPorts.SERVER_PORT,
    WEB_PORT: resolvedPorts.WEB_PORT,
    DB_DATABASE,
    DB_USERNAME,
    DB_PASSWORD,
    MYSQL_ROOT_PASSWORD,
    MYSQL_DATABASE: DB_DATABASE,
    MYSQL_USER: DB_USERNAME,
    MYSQL_PASSWORD: DB_PASSWORD,
    AES_SECRET,
  };
}

export async function ensurePortsAvailable(env: EnvConfig): Promise<void> {
  const checks: Array<[string, string]> = [
    ["MYSQL_PORT", env.MYSQL_PORT],
    ["SERVER_PORT", env.SERVER_PORT],
    ["WEB_PORT", env.WEB_PORT],
  ];

  const uniquePorts = new Set(checks.map(([, value]) => value));
  if (uniquePorts.size !== checks.length) {
    throw new Error("MySQL、Server、Web 端口不能重复");
  }

  const reservedByConfig = new Set<number>(checks.map(([, value]) => Number(value)));
  for (const [label, value] of checks) {
    const port = Number(value);
    if (!(await isPortAvailable(port))) {
      const suggestion = await getAvailablePort(port, reservedByConfig);
      throw new Error(`${label}=${port} 已被占用，建议调整为 ${suggestion}`);
    }
  }
}
