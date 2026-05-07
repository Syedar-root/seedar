import { DEFAULT_VERSION } from "../shared/constants.js";
import { waitForServiceHealthy } from "../docker/health.js";
import { ensurePrerequisites } from "../docker/prerequisites.js";
import { runDockerComposeOrThrow } from "../docker/process.js";
import { startPostgres, startRuntimeServices, stopRuntimeServices } from "../install/flow.js";
import { writeCliLog } from "../shared/logging.js";
import type { EnvConfig } from "../shared/types.js";
import {
  backupRuntime,
  getRuntimeLayout,
  readEnvConfig,
  readInstalledVersion,
  restoreRuntimeFromBackup,
  writeInstalledVersion,
  writeInstallState,
  writeRuntimeFiles,
} from "../runtime/index.js";
import { requireRuntimeConfig } from "../runtime/guards.js";

export async function startCommand(): Promise<void> {
  const layout = getRuntimeLayout();
  await ensurePrerequisites();
  await requireRuntimeConfig(layout);

  const env = await readEnvConfig(layout);
  await writeCliLog(layout, "manual start requested");
  await startRuntimeServices(layout, env);
}

export async function stopCommand(): Promise<void> {
  const layout = getRuntimeLayout();
  await requireRuntimeConfig(layout);
  await readEnvConfig(layout);

  await writeCliLog(layout, "manual stop requested");
  await stopRuntimeServices(layout);
}

export async function updateCommand(versionArg: string | undefined): Promise<void> {
  const layout = getRuntimeLayout();
  await ensurePrerequisites();
  await requireRuntimeConfig(layout);

  const currentEnv = await readEnvConfig(layout);
  const currentVersion = await readInstalledVersion(layout);
  const nextVersion = versionArg ?? DEFAULT_VERSION;
  const backupDir = await backupRuntime(layout);

  const nextEnv: EnvConfig = {
    ...currentEnv,
    SEEDAR_VERSION: nextVersion,
  };

  await writeRuntimeFiles(layout, nextEnv);

  try {
    await writeCliLog(
      layout,
      `开始升级，当前版本 ${currentVersion ?? "unknown"} -> ${nextVersion}`,
    );
    await runDockerComposeOrThrow(layout, ["pull", "mysql", "postgres", "server", "web"], {
      stdio: "inherit",
    });
    await runDockerComposeOrThrow(layout, ["up", "-d", "mysql"], {
      stdio: "inherit",
    });
    await waitForServiceHealthy(layout, "mysql");
    await startPostgres(layout);
    await runDockerComposeOrThrow(layout, ["run", "--rm", "migrate"], {
      stdio: "inherit",
    });
    await runDockerComposeOrThrow(layout, ["up", "-d", "server", "web"], {
      stdio: "inherit",
    });
    await writeInstalledVersion(layout, nextVersion);
    await writeInstallState(layout, "installed");
    await writeCliLog(layout, `升级完成，版本 ${nextVersion}`);
    console.log(`Seedar 已升级到 ${nextVersion}`);
    console.log(`备份目录: ${backupDir}`);
  } catch (error) {
    await restoreRuntimeFromBackup(layout, backupDir);
    await writeCliLog(layout, `升级失败，已恢复运行时配置。备份目录 ${backupDir}`);
    throw new Error(
      `升级失败，已恢复运行时配置。备份目录: ${backupDir}\n${
        error instanceof Error ? error.message : "未知错误"
      }`,
    );
  }
}
