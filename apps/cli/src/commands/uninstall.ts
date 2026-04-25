import { rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { CLI_PACKAGE_NAME } from "../shared/package.js";
import { runCommand, runDockerCompose, runDockerComposeOrThrow, spawnDetached } from "../docker/process.js";
import { ensurePrerequisites } from "../docker/prerequisites.js";
import { printInstallDetail, printInstallStage, printInstallSuccess, printInstallWarn } from "../install/output.js";
import { writeCliLog } from "../shared/logging.js";
import type { CliFlags } from "../shared/types.js";
import { getRuntimeLayout, hasRuntimeConfig, writeInstallState } from "../runtime/index.js";
import { requireRuntimeConfig } from "../runtime/guards.js";

async function isGlobalNpmCliInstall(): Promise<boolean> {
  const entryPath = process.argv[1];
  if (!entryPath) {
    return false;
  }

  const npmRootResult = await runCommand("npm", ["root", "-g"]);
  if (npmRootResult.code !== 0) {
    return false;
  }

  const packageRoot = path.resolve(entryPath, "..", "..");
  const expectedRoot = path.resolve(npmRootResult.stdout.trim(), ...CLI_PACKAGE_NAME.split("/"));
  return normalizePathForCompare(packageRoot) === normalizePathForCompare(expectedRoot);
}

async function scheduleCliSelfUninstall(): Promise<boolean> {
  if (!(await isGlobalNpmCliInstall())) {
    return false;
  }

  if (process.platform === "win32") {
    spawnDetached(
      "powershell",
      [
        "-NoProfile",
        "-WindowStyle",
        "Hidden",
        "-Command",
        `Start-Sleep -Seconds 2; npm uninstall -g ${CLI_PACKAGE_NAME}`,
      ],
    );
    return true;
  }

  spawnDetached("sh", ["-lc", `sleep 2; npm uninstall -g ${CLI_PACKAGE_NAME} >/dev/null 2>&1`]);
  return true;
}

export async function uninstallCommand(flags: CliFlags): Promise<void> {
  if (flags.all) {
    await removeAllCommand(flags);
    return;
  }

  const layout = getRuntimeLayout();
  await ensurePrerequisites();
  await requireRuntimeConfig(layout);

  await writeCliLog(layout, "开始卸载");
  await runDockerComposeOrThrow(layout, ["down", "--remove-orphans"], {
    stdio: "inherit",
  });

  if (flags.removeData) {
    if (!flags.force && process.stdin.isTTY) {
      console.log("检测到 --remove-data，将删除本地数据目录。若需跳过确认，请附带 --force。");
      throw new Error("请确认后重新执行: seedar uninstall --remove-data --force");
    }

    const resolvedDataPath = path.resolve(layout.dataDir);
    const installRoot = path.resolve(layout.installRoot);
    if (!resolvedDataPath.startsWith(installRoot)) {
      throw new Error(`拒绝删除 installRoot 之外的路径: ${resolvedDataPath}`);
    }

    await rm(layout.dataDir, { recursive: true, force: true });
    await writeCliLog(layout, `已删除数据目录 ${layout.dataDir}`);
  }

  await writeInstallState(layout, "uninstalled");
  await writeCliLog(layout, "卸载完成");
  console.log("Seedar 已卸载。");
  console.log(`配置保留在: ${layout.runtimeDir}`);
  console.log(`备份保留在: ${layout.backupsDir}`);
  if (!flags.removeData) {
    console.log(`数据保留在: ${layout.dataDir}`);
  }
}

export async function removeAllCommand(flags: CliFlags): Promise<void> {
  const layout = getRuntimeLayout();
  const installRoot = path.resolve(layout.installRoot);

  if (!flags.force) {
    if (process.stdin.isTTY) {
      console.log("该操作会删除 Seedar 的容器、配置、数据、日志、备份，并尝试卸载全局 CLI。");
      throw new Error("请确认后重新执行: seedar uninstall --all --force");
    }
    throw new Error("非交互模式下执行 remove all 需要 --force");
  }

  printInstallStage("移除 Seedar");
  if (await hasRuntimeConfig(layout)) {
    printInstallDetail("开始停止并清理容器");
    const downResult = await runDockerCompose(layout, ["down", "--remove-orphans"]);
    const detail = [downResult.stdout.trim(), downResult.stderr.trim()].filter(Boolean).join("\n");
    if (detail) {
      console.log(detail);
    }
    if (downResult.code !== 0) {
      printInstallWarn("停止容器失败，继续删除本地文件");
    }
  } else {
    printInstallDetail("未检测到运行时配置，跳过容器清理");
  }

  const dangerReason = getDangerousDeleteReason(installRoot);
  if (dangerReason) {
    throw new Error(`拒绝删除危险路径: ${installRoot}（${dangerReason}）`);
  }

  await rm(installRoot, { recursive: true, force: true });
  printInstallSuccess(`已删除安装目录：${installRoot}`);

  const cliUninstallScheduled = await scheduleCliSelfUninstall();
  if (cliUninstallScheduled) {
    printInstallSuccess(`已安排卸载全局 CLI：${CLI_PACKAGE_NAME}`);
  } else {
    printInstallWarn("未检测到 npm 全局安装的 CLI，跳过 CLI 自卸载");
  }
}

function normalizePathForCompare(targetPath: string): string {
  return path.resolve(targetPath).replace(/[\\/]+$/, "").toLowerCase();
}

function getDangerousDeleteReason(targetPath: string): string | null {
  const resolved = path.resolve(targetPath);
  const parsed = path.parse(resolved);
  const normalizedTarget = normalizePathForCompare(resolved);
  const normalizedRoot = normalizePathForCompare(parsed.root);
  const normalizedHome = normalizePathForCompare(os.homedir());

  if (normalizedTarget === normalizedRoot) {
    return "目标路径是磁盘根目录";
  }
  if (normalizedTarget === normalizedHome) {
    return "目标路径是用户主目录";
  }

  return null;
}

export async function purgeCommand(flags: CliFlags): Promise<void> {
  await removeAllCommand(flags);
  return;

  const layout = getRuntimeLayout();
  const installRoot = path.resolve(layout.installRoot);

  if (!flags.force) {
    if (process.stdin.isTTY) {
      console.log("该操作会彻底删除 Seedar 安装目录（含配置、数据、日志与备份）。");
      throw new Error("请确认后重新执行: seedar purge --force");
    }
    throw new Error("非交互模式下执行 purge 需要 --force");
  }

  const dangerReason = getDangerousDeleteReason(installRoot);
  if (dangerReason) {
    throw new Error(`拒绝删除危险路径: ${installRoot}（${dangerReason}）`);
  }

  await writeCliLog(layout, "开始彻底删除安装目录");

  if (await hasRuntimeConfig(layout)) {
    const downResult = await runDockerCompose(layout, ["down", "--remove-orphans"]);
    if (downResult.code !== 0) {
      const detail = [downResult.stdout.trim(), downResult.stderr.trim()]
        .filter(Boolean)
        .join("\n");
      console.warn(
        detail
          ? `停止容器失败，继续删除本地目录:\n${detail}`
          : "停止容器失败，继续删除本地目录。",
      );
    }
  }

  await rm(installRoot, { recursive: true, force: true });
  console.log("Seedar 已彻底删除。");
  console.log(`已删除目录: ${installRoot}`);
}
