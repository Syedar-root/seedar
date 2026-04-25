import { getAvailablePort } from "../docker/ports.js";
import type { EnvConfig } from "../shared/types.js";

export type PortEnvKey = "MYSQL_PORT" | "SERVER_PORT" | "WEB_PORT";

export const PORT_ENV_KEYS: PortEnvKey[] = ["MYSQL_PORT", "SERVER_PORT", "WEB_PORT"];

const COMPOSE_PORT_CONFLICT_REGEX = /Bind for (?:\[[^\]]+\]|[0-9.]+):(\d+) failed: port is already allocated/i;

export function parseComposePortConflict(error: unknown): number | null {
  const message = error instanceof Error ? error.message : String(error);
  const matched = COMPOSE_PORT_CONFLICT_REGEX.exec(message);
  if (!matched) {
    return null;
  }

  const port = Number(matched[1]);
  return Number.isInteger(port) ? port : null;
}

export function findPortKeyByPort(
  env: EnvConfig,
  port: number,
  candidateKeys: readonly PortEnvKey[] = PORT_ENV_KEYS,
): PortEnvKey | null {
  const targetPort = String(port);
  for (const key of candidateKeys) {
    if (env[key] === targetPort) {
      return key;
    }
  }
  return null;
}

export async function autoShiftConflictPort(
  env: EnvConfig,
  key: PortEnvKey,
  fromPort: number,
): Promise<number> {
  const occupiedByConfig = new Set<number>(
    PORT_ENV_KEYS.filter((candidateKey) => candidateKey !== key).map((candidateKey) =>
      Number(env[candidateKey]),
    ),
  );
  const nextPort = await getAvailablePort(fromPort + 1, occupiedByConfig);
  env[key] = String(nextPort);
  return nextPort;
}

export function getPortLabel(key: PortEnvKey): string {
  switch (key) {
    case "MYSQL_PORT":
      return "MySQL 端口";
    case "SERVER_PORT":
      return "Server 端口";
    case "WEB_PORT":
      return "Web 端口";
  }
}
