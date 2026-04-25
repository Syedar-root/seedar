import { randomBytes } from "node:crypto";
import net from "node:net";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

import {
  DEFAULT_DB_NAME,
  DEFAULT_DB_USER,
  DEFAULT_PORTS,
  DEFAULT_VERSION,
} from "./constants.js";
import { buildDefaultEnv } from "./runtime.js";
import type { CliFlags, EnvConfig, RuntimeLayout } from "./types.js";

function createSecret(bytes = 24): string {
  return randomBytes(bytes).toString("hex");
}

async function isPortAvailable(port: number): Promise<boolean> {
  return await new Promise<boolean>((resolve) => {
    const server = net.createServer();
    server.unref();
    server.on("error", () => resolve(false));
    server.listen(port, "0.0.0.0", () => {
      server.close(() => resolve(true));
    });
  });
}

async function getAvailablePort(preferredPort: number): Promise<number> {
  let currentPort = preferredPort;
  while (!(await isPortAvailable(currentPort))) {
    currentPort += 1;
  }

  return currentPort;
}

async function ask(
  rl: readline.Interface,
  label: string,
  defaultValue: string,
): Promise<string> {
  const suffix = defaultValue ? ` [${defaultValue}]` : "";
  const answer = (await rl.question(`${label}${suffix}: `)).trim();
  return answer || defaultValue;
}

function assertPort(value: string, label: string): string {
  const numericPort = Number(value);
  if (!Number.isInteger(numericPort) || numericPort < 1 || numericPort > 65535) {
    throw new Error(`${label} 必须是 1-65535 之间的端口`);
  }

  return String(numericPort);
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

  const defaults = buildDefaultEnv(layout, {
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

  if (!process.stdin.isTTY || flags.yes) {
    console.log("使用默认安装参数初始化 Seedar。");
    return defaults;
  }

  const rl = readline.createInterface({ input, output });
  try {
    const MYSQL_PORT = assertPort(
      await ask(rl, "MySQL 端口", defaults.MYSQL_PORT),
      "MySQL 端口",
    );
    const SERVER_PORT = assertPort(
      await ask(rl, "Server 端口", defaults.SERVER_PORT),
      "Server 端口",
    );
    const WEB_PORT = assertPort(
      await ask(rl, "Web 端口", defaults.WEB_PORT),
      "Web 端口",
    );
    const DB_DATABASE = await ask(rl, "数据库名称", defaults.DB_DATABASE);
    const DB_USERNAME = await ask(rl, "数据库用户名", defaults.DB_USERNAME);
    const DB_PASSWORD = await ask(rl, "数据库密码", defaults.DB_PASSWORD);
    const MYSQL_ROOT_PASSWORD = await ask(
      rl,
      "MySQL Root 密码",
      defaults.MYSQL_ROOT_PASSWORD,
    );
    const AES_SECRET = await ask(rl, "AES_SECRET", defaults.AES_SECRET);

    const uniquePorts = new Set([MYSQL_PORT, SERVER_PORT, WEB_PORT]);
    if (uniquePorts.size !== 3) {
      throw new Error("MySQL、Server、Web 端口不能重复");
    }

    return {
      ...defaults,
      MYSQL_PORT,
      SERVER_PORT,
      WEB_PORT,
      DB_DATABASE,
      DB_USERNAME,
      DB_PASSWORD,
      MYSQL_ROOT_PASSWORD,
      MYSQL_DATABASE: DB_DATABASE,
      MYSQL_USER: DB_USERNAME,
      MYSQL_PASSWORD: DB_PASSWORD,
      AES_SECRET,
    };
  } finally {
    rl.close();
  }
}

export async function ensurePortsAvailable(env: EnvConfig): Promise<void> {
  const checks: Array<[string, string]> = [
    ["MYSQL_PORT", env.MYSQL_PORT],
    ["SERVER_PORT", env.SERVER_PORT],
    ["WEB_PORT", env.WEB_PORT],
  ];

  for (const [label, value] of checks) {
    const port = Number(value);
    if (!(await isPortAvailable(port))) {
      throw new Error(`${label}=${port} 已被占用，请调整后重试`);
    }
  }
}
