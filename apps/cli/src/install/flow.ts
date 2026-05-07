import { writeCliLog } from "../shared/logging.js";
import type { EnvConfig, RuntimeLayout } from "../shared/types.js";
import { waitForServiceHealthy } from "../docker/health.js";
import { cleanupComposeServices, runComposeCommandWithCapturedOutput } from "../docker/compose.js";
import { runDockerCompose, runDockerComposeOrThrow } from "../docker/process.js";
import { writeRuntimeFiles } from "../runtime/index.js";
import { autoShiftConflictPort, findPortKeyByPort, getPortLabel, parseComposePortConflict } from "./ports.js";
import { printInstallDetail, printInstallStage, printInstallSuccess } from "./output.js";

export async function runInstallFlow(layout: RuntimeLayout, env: EnvConfig): Promise<void> {
  await startMysqlWithRetry(layout, env);
  await startPostgres(layout);

  printInstallStage("执行数据库迁移");
  await runDockerComposeOrThrow(layout, ["run", "--rm", "migrate"], {
    stdio: "inherit",
  });

  await startServerAndWebWithRetry(layout, env);
}

export async function pullInstallImages(layout: RuntimeLayout): Promise<void> {
  await runDockerComposeOrThrow(layout, ["pull", "mysql", "postgres", "server", "web"], {
    stdio: "inherit",
  });
}

export async function startMysqlWithRetry(layout: RuntimeLayout, env: EnvConfig): Promise<void> {
  while (true) {
    printInstallStage("启动 MySQL");
    try {
      await runComposeCommandWithCapturedOutput(
        layout,
        ["up", "-d", "mysql"],
        "docker compose up -d mysql 执行失败",
      );
      printInstallSuccess(`MySQL 容器已启动，等待健康检查，端口 ${env.MYSQL_PORT}`);
      await waitForServiceHealthy(layout, "mysql");
      return;
    } catch (error) {
      const composeConflictPort = parseComposePortConflict(error);
      if (!composeConflictPort) {
        throw error;
      }

      const conflictKey = findPortKeyByPort(env, composeConflictPort, ["MYSQL_PORT"]);
      if (!conflictKey) {
        throw error;
      }

      await cleanupComposeServices(layout, ["mysql"]);
      const shiftedTo = await autoShiftConflictPort(env, conflictKey, composeConflictPort);
      await writeRuntimeFiles(layout, env);
      printInstallDetail(
        `${getPortLabel(conflictKey)} ${composeConflictPort} 已冲突，自动避让到 ${shiftedTo}，继续重试`,
      );
      await writeCliLog(
        layout,
        `mysql startup port shifted ${conflictKey}: ${composeConflictPort} -> ${shiftedTo}`,
      );
    }
  }
}

export async function startPostgres(layout: RuntimeLayout): Promise<void> {
  printInstallStage("启动 PostgreSQL");
  await runComposeCommandWithCapturedOutput(
    layout,
    ["up", "-d", "postgres"],
    "docker compose up -d postgres 执行失败",
  );
  await waitForServiceHealthy(layout, "postgres");
  printInstallSuccess("PostgreSQL 容器已启动");
}

export async function startServerAndWebWithRetry(layout: RuntimeLayout, env: EnvConfig): Promise<void> {
  while (true) {
    printInstallStage("启动 Server 和 Web");
    try {
      await runComposeCommandWithCapturedOutput(
        layout,
        ["up", "-d", "server", "web"],
        "docker compose up -d server web 执行失败",
      );
      printInstallSuccess(`Server 端口 ${env.SERVER_PORT}，Web 端口 ${env.WEB_PORT}`);
      return;
    } catch (error) {
      const composeConflictPort = parseComposePortConflict(error);
      if (!composeConflictPort) {
        throw error;
      }

      const conflictKey =
        findPortKeyByPort(env, composeConflictPort, ["SERVER_PORT", "WEB_PORT"]) ??
        findPortKeyByPort(env, composeConflictPort);
      if (!conflictKey) {
        throw error;
      }

      await cleanupComposeServices(layout, ["server", "web"]);
      const shiftedTo = await autoShiftConflictPort(env, conflictKey, composeConflictPort);
      await writeRuntimeFiles(layout, env);
      printInstallDetail(
        `${getPortLabel(conflictKey)} ${composeConflictPort} 已冲突，自动避让到 ${shiftedTo}，继续重试`,
      );
      await writeCliLog(
        layout,
        `server/web startup port shifted ${conflictKey}: ${composeConflictPort} -> ${shiftedTo}`,
      );
    }
  }
}

export async function runInstallFlowWithValidatedConfig(
  layout: RuntimeLayout,
  env: EnvConfig,
): Promise<void> {
  await writeCliLog(layout, `start install target=${env.SEEDAR_VERSION}`);
  printInstallStage("拉取镜像前确认");
  printInstallDetail(`目标版本：${env.SEEDAR_VERSION}`);
  printInstallDetail(`安装目录：${layout.installRoot}`);

  printInstallStage("拉取镜像");
  printInstallDetail("开始拉取 mysql、postgres、server、web 镜像");
  await pullInstallImages(layout);
  printInstallSuccess("镜像拉取完成");
  await runInstallFlow(layout, env);
  await writeCliLog(layout, `install completed version=${env.SEEDAR_VERSION}`);
}

export async function startRuntimeServices(layout: RuntimeLayout, env: EnvConfig): Promise<void> {
  printInstallStage("启动服务");
  printInstallDetail(`目标版本：${env.SEEDAR_VERSION}`);
  await runInstallFlow(layout, env);
  printInstallSuccess("服务已启动");
}

export async function stopRuntimeServices(layout: RuntimeLayout): Promise<void> {
  printInstallStage("停止服务");
  const result = await runDockerCompose(layout, ["stop", "mysql", "postgres", "server", "web"]);
  const detail = [result.stdout.trim(), result.stderr.trim()].filter(Boolean).join("\n");
  if (detail) {
    console.log(detail);
  }
  if (result.code !== 0) {
    throw new Error(detail || "停止服务失败");
  }
  printInstallSuccess("mysql、postgres、server、web 已停止");
}
