import { createSpinner } from "../shared/ui.js";
import type { RuntimeLayout } from "../shared/types.js";
import { wait } from "../shared/time.js";
import { runCommand, runDockerCompose } from "./process.js";

async function getServiceContainerId(
  layout: RuntimeLayout,
  service: string,
): Promise<string | null> {
  const result = await runDockerCompose(layout, ["ps", "-q", service]);
  const id = result.stdout.trim();
  return id || null;
}

export async function waitForServiceHealthy(
  layout: RuntimeLayout,
  service: string,
  timeoutMs = 120_000,
): Promise<void> {
  const startedAt = Date.now();
  const spinner = createSpinner(`等待 ${service} 健康检查`).start();

  while (Date.now() - startedAt < timeoutMs) {
    const containerId = await getServiceContainerId(layout, service);
    if (!containerId) {
      spinner.text = `等待 ${service} 容器启动`;
      await wait(2_000);
      continue;
    }

    const inspectResult = await runCommand("docker", [
      "inspect",
      "--format",
      "{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}",
      containerId,
    ]);

    const state = inspectResult.stdout.trim();
    if (state === "healthy" || state === "running") {
      spinner.succeed(`${service} 已就绪`);
      return;
    }

    if (state === "unhealthy" || state === "exited") {
      throw new Error(`${service} 服务状态异常: ${state}`);
    }

    spinner.text = `等待 ${service} 健康检查，当前状态: ${state || "unknown"}`;
    await wait(3_000);
  }

  throw new Error(`等待 ${service} 服务健康检查超时`);
}
