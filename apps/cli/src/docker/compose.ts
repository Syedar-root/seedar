import type { RuntimeLayout } from "../shared/types.js";
import { runDockerCompose } from "./process.js";

export async function runComposeCommandWithCapturedOutput(
  layout: RuntimeLayout,
  args: string[],
  fallbackMessage: string,
): Promise<void> {
  const result = await runDockerCompose(layout, args);
  const stdout = result.stdout.trim();
  const stderr = result.stderr.trim();
  if (stdout) {
    console.log(stdout);
  }
  if (result.code !== 0) {
    const detail = [stdout, stderr].filter(Boolean).join("\n");
    throw new Error(detail || fallbackMessage);
  }
}

export async function cleanupComposeServices(
  layout: RuntimeLayout,
  services: string[],
): Promise<void> {
  if (services.length === 0) {
    return;
  }

  await runDockerCompose(layout, ["rm", "-sf", ...services]);
}

export async function parseComposePsOutput(layout: RuntimeLayout): Promise<Record<string, unknown>[]> {
  const result = await runDockerCompose(layout, ["ps", "--all", "--format", "json"]);
  const raw = result.stdout.trim();

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as Record<string, unknown>[]) : [];
  } catch {
    return raw
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => JSON.parse(line) as Record<string, unknown>);
  }
}

export function getPublishersFromServices(
  services: Record<string, unknown>[],
): Set<string> {
  const ports = new Set<string>();

  for (const service of services) {
    const publishers = service.Publishers;
    if (!Array.isArray(publishers)) {
      continue;
    }

    for (const publisher of publishers) {
      if (
        publisher &&
        typeof publisher === "object" &&
        "PublishedPort" in publisher &&
        typeof publisher.PublishedPort === "number"
      ) {
        ports.add(String(publisher.PublishedPort));
      }
    }
  }

  return ports;
}
