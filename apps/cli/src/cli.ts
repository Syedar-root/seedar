import { access, appendFile, mkdir, rm } from "node:fs/promises";
import net from "node:net";
import path from "node:path";

import {
  DEFAULT_SERVER_IMAGE,
  DEFAULT_VERSION,
  DEFAULT_WEB_IMAGE,
  MIN_NODE_MAJOR,
  REQUIRED_ENV_KEYS,
  VALID_SERVICES,
} from "./constants.js";
import { runCommand, runCommandOrThrow, runDockerCompose, runDockerComposeOrThrow } from "./process.js";
import { collectInstallConfig, ensurePortsAvailable } from "./prompts.js";
import {
  backupRuntime,
  getRuntimeLayout,
  hasRuntimeConfig,
  pathExists,
  readEnvConfig,
  readInstallState,
  readInstalledVersion,
  restoreRuntimeFromBackup,
  writeInstalledVersion,
  writeInstallState,
  writeRuntimeFiles,
} from "./runtime.js";
import type { CliFlags, DoctorCheck, EnvConfig, InstallState, RuntimeLayout } from "./types.js";

interface ParsedCommand {
  command: string;
  positional: string[];
  flags: CliFlags;
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

function parseArgs(rawArgs: string[]): ParsedCommand {
  const flags: CliFlags = {
    yes: false,
    force: false,
    follow: false,
    removeData: false,
  };
  const positional: string[] = [];

  for (const arg of rawArgs) {
    if (arg === "--yes" || arg === "-y") {
      flags.yes = true;
      continue;
    }
    if (arg === "--force") {
      flags.force = true;
      continue;
    }
    if (arg === "--follow" || arg === "-f") {
      flags.follow = true;
      continue;
    }
    if (arg === "--remove-data") {
      flags.removeData = true;
      continue;
    }

    positional.push(arg);
  }

  const [command = "help", ...rest] = positional;
  return {
    command,
    positional: rest,
    flags,
  };
}

async function writeCliLog(layout: RuntimeLayout, message: string): Promise<void> {
  const line = `[${new Date().toISOString()}] ${message}\n`;
  await mkdir(layout.logsDir, { recursive: true });
  await appendFile(path.join(layout.logsDir, "cli.log"), line, "utf8");
}

async function requireRuntimeConfig(layout: RuntimeLayout): Promise<void> {
  if (!(await hasRuntimeConfig(layout))) {
    throw new Error(`未检测到运行时配置，请先执行 seedar install。安装目录: ${layout.installRoot}`);
  }
}

async function ensurePrerequisites(): Promise<void> {
  const major = Number(process.versions.node.split(".")[0]);
  if (major < MIN_NODE_MAJOR) {
    throw new Error(`Node.js 版本过低，当前 ${process.version}，需要 >= ${MIN_NODE_MAJOR}`);
  }

  await runCommandOrThrow("docker", ["--version"]);
  await runCommandOrThrow("docker", ["compose", "version"]);
  await runCommandOrThrow("docker", ["info"]);
}

async function wait(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function getServiceContainerId(
  layout: RuntimeLayout,
  service: string,
): Promise<string | null> {
  const result = await runDockerCompose(layout, ["ps", "-q", service]);
  const id = result.stdout.trim();
  return id || null;
}

async function waitForServiceHealthy(
  layout: RuntimeLayout,
  service: string,
  timeoutMs = 120_000,
): Promise<void> {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const containerId = await getServiceContainerId(layout, service);
    if (!containerId) {
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
      return;
    }

    if (state === "unhealthy" || state === "exited") {
      throw new Error(`${service} 服务状态异常: ${state}`);
    }

    await wait(3_000);
  }

  throw new Error(`等待 ${service} 服务健康检查超时`);
}

function printInstallSummary(layout: RuntimeLayout, env: EnvConfig): void {
  console.log("Seedar 安装完成。");
  console.log(`安装目录: ${layout.installRoot}`);
  console.log(`Web: http://localhost:${env.WEB_PORT}`);
  console.log(`Server: http://localhost:${env.SERVER_PORT}`);
  console.log(`MySQL: localhost:${env.MYSQL_PORT}`);
  console.log(`版本: ${env.SEEDAR_VERSION}`);
}

async function runInstallFlow(layout: RuntimeLayout, env: EnvConfig): Promise<void> {
  await writeCliLog(layout, `开始安装，目标版本 ${env.SEEDAR_VERSION}`);
  await runDockerComposeOrThrow(layout, ["pull", "mysql", "server", "web"], {
    stdio: "inherit",
  });
  await runDockerComposeOrThrow(layout, ["up", "-d", "mysql"], {
    stdio: "inherit",
  });
  await waitForServiceHealthy(layout, "mysql");
  await runDockerComposeOrThrow(layout, ["run", "--rm", "migrate"], {
    stdio: "inherit",
  });
  await runDockerComposeOrThrow(layout, ["up", "-d", "server", "web"], {
    stdio: "inherit",
  });
  await writeCliLog(layout, `安装完成，版本 ${env.SEEDAR_VERSION}`);
}

async function parseComposePsOutput(layout: RuntimeLayout): Promise<Record<string, unknown>[]> {
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

function getPublishersFromServices(
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

async function getDiskFreeBytes(targetPath: string): Promise<number | null> {
  if (process.platform === "win32") {
    const root = path.parse(path.resolve(targetPath)).root.replace(/\\$/, "");
    const result = await runCommand(
      "powershell",
      [
        "-NoProfile",
        "-Command",
        `(Get-CimInstance Win32_LogicalDisk -Filter "DeviceID='${root}'").FreeSpace`,
      ],
      { shell: false },
    );
    const value = Number(result.stdout.trim());
    return Number.isFinite(value) ? value : null;
  }

  const result = await runCommand("df", ["-Pk", targetPath]);
  const lines = result.stdout.trim().split(/\r?\n/);
  if (lines.length < 2) {
    return null;
  }

  const parts = lines[1].trim().split(/\s+/);
  const availableKb = Number(parts[3]);
  if (!Number.isFinite(availableKb)) {
    return null;
  }

  return availableKb * 1024;
}

async function collectDoctorChecks(layout: RuntimeLayout): Promise<DoctorCheck[]> {
  const checks: DoctorCheck[] = [];
  const nodeMajor = Number(process.versions.node.split(".")[0]);
  checks.push({
    code: "D001",
    status: nodeMajor >= MIN_NODE_MAJOR ? "ok" : "fail",
    title: "Node.js 版本",
    detail:
      nodeMajor >= MIN_NODE_MAJOR
        ? `当前 ${process.version}`
        : `当前 ${process.version}，需要 >= ${MIN_NODE_MAJOR}`,
  });

  const dockerVersion = await runCommand("docker", ["--version"]);
  checks.push({
    code: "D002",
    status: dockerVersion.code === 0 ? "ok" : "fail",
    title: "Docker CLI",
    detail:
      dockerVersion.code === 0
        ? dockerVersion.stdout.trim()
        : dockerVersion.stderr.trim() || "无法执行 docker --version",
  });

  const dockerInfo = await runCommand("docker", ["info"]);
  checks.push({
    code: "D003",
    status: dockerInfo.code === 0 ? "ok" : "fail",
    title: "Docker Daemon",
    detail:
      dockerInfo.code === 0
        ? "Docker daemon 可用"
        : dockerInfo.stderr.trim() || "无法连接 Docker daemon",
  });

  const composeVersion = await runCommand("docker", ["compose", "version"]);
  checks.push({
    code: "D004",
    status: composeVersion.code === 0 ? "ok" : "fail",
    title: "Docker Compose",
    detail:
      composeVersion.code === 0
        ? composeVersion.stdout.trim()
        : composeVersion.stderr.trim() || "无法执行 docker compose version",
  });

  const installRootParent = path.dirname(layout.installRoot);
  try {
    await access(installRootParent);
    checks.push({
      code: "D005",
      status: "ok",
      title: "安装目录访问",
      detail: `可访问 ${installRootParent}`,
    });
  } catch (error) {
    checks.push({
      code: "D005",
      status: "fail",
      title: "安装目录访问",
      detail: error instanceof Error ? error.message : "无法访问安装目录父级路径",
    });
  }

  const diskFree = await getDiskFreeBytes(layout.installRoot);
  if (diskFree === null) {
    checks.push({
      code: "D006",
      status: "warn",
      title: "磁盘剩余空间",
      detail: "无法识别磁盘剩余空间",
    });
  } else {
    const diskFreeGb = (diskFree / 1024 / 1024 / 1024).toFixed(2);
    checks.push({
      code: "D006",
      status: diskFree >= 2 * 1024 * 1024 * 1024 ? "ok" : "warn",
      title: "磁盘剩余空间",
      detail: `${diskFreeGb} GB`,
    });
  }

  const hasConfig = await hasRuntimeConfig(layout);
  if (!hasConfig) {
    const defaultPorts: Array<[string, string]> = [
      ["D009", "3306"],
      ["D010", "8090"],
      ["D011", "8080"],
    ];
    for (const [code, port] of defaultPorts) {
      const available = await isPortAvailable(Number(port));
      checks.push({
        code,
        status: available ? "ok" : "warn",
        title: `默认端口 ${port}`,
        detail: available ? "端口当前可用" : "端口已被占用，安装时需要改配",
      });
    }

    return checks;
  }

  let envConfig: EnvConfig | null = null;
  try {
    envConfig = await readEnvConfig(layout);
    checks.push({
      code: "D007",
      status: "ok",
      title: "运行时配置",
      detail: `已检测到 ${REQUIRED_ENV_KEYS.length} 个必填字段`,
    });
  } catch (error) {
    checks.push({
      code: "D007",
      status: "fail",
      title: "运行时配置",
      detail: error instanceof Error ? error.message : "运行时配置损坏",
    });
  }

  if (!envConfig) {
    return checks;
  }

  const composeConfig = await runDockerCompose(layout, ["config", "-q"]);
  checks.push({
    code: "D008",
    status: composeConfig.code === 0 ? "ok" : "fail",
    title: "Compose 配置",
    detail:
      composeConfig.code === 0
        ? "docker compose config 校验通过"
        : composeConfig.stderr.trim() || "docker compose config 校验失败",
  });

  const services = await parseComposePsOutput(layout);
  const publishedPorts = getPublishersFromServices(services);
  const envPorts = [envConfig.MYSQL_PORT, envConfig.SERVER_PORT, envConfig.WEB_PORT];
  for (const [index, port] of envPorts.entries()) {
    const inUseByCurrentProject = publishedPorts.has(port);
    const available = await isPortAvailable(Number(port));
    const status =
      inUseByCurrentProject || available ? "ok" : "warn";
    checks.push({
      code: `D01${index}`,
      status,
      title: `端口 ${port}`,
      detail:
        inUseByCurrentProject
          ? "端口已由当前 Seedar 安装占用"
          : available
            ? "端口配置可用"
            : "端口已被其他进程占用",
    });
  }

  const serverImage = `${DEFAULT_SERVER_IMAGE}:${envConfig.SEEDAR_VERSION}`;
  const webImage = `${DEFAULT_WEB_IMAGE}:${envConfig.SEEDAR_VERSION}`;
  for (const [index, image] of [serverImage, webImage].entries()) {
    const manifest = await runCommand("docker", ["manifest", "inspect", image]);
    checks.push({
      code: `D02${index}`,
      status: manifest.code === 0 ? "ok" : "fail",
      title: `镜像可访问性 ${image}`,
      detail:
        manifest.code === 0
          ? "镜像清单可访问"
          : manifest.stderr.trim() || "无法访问镜像清单，请检查 DockerHub 凭证或镜像发布状态",
    });
  }

  return checks;
}

async function installCommand(versionArg: string | undefined, flags: CliFlags): Promise<void> {
  const layout = getRuntimeLayout();
  await ensurePrerequisites();

  const state = await readInstallState(layout);
  const hasConfig = await hasRuntimeConfig(layout);
  if (state === "installed" && hasConfig) {
    throw new Error(`检测到现有安装目录 ${layout.installRoot}。如需升级请使用 seedar update。`);
  }

  let env: EnvConfig;
  if (state === "uninstalled" && hasConfig) {
    env = await readEnvConfig(layout);
    env.SEEDAR_VERSION = versionArg ?? env.SEEDAR_VERSION;
    await ensurePortsAvailable(env);
    await writeCliLog(layout, `复用已有配置重新安装，目标版本 ${env.SEEDAR_VERSION}`);
  } else {
    env = await collectInstallConfig(layout, versionArg, flags);
    await ensurePortsAvailable(env);
  }

  await writeRuntimeFiles(layout, env);
  await runInstallFlow(layout, env);
  await writeInstalledVersion(layout, env.SEEDAR_VERSION);
  await writeInstallState(layout, "installed");
  printInstallSummary(layout, env);
}

async function updateCommand(versionArg: string | undefined): Promise<void> {
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
    await runDockerComposeOrThrow(layout, ["pull", "mysql", "server", "web"], {
      stdio: "inherit",
    });
    await runDockerComposeOrThrow(layout, ["up", "-d", "mysql"], {
      stdio: "inherit",
    });
    await waitForServiceHealthy(layout, "mysql");
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

async function uninstallCommand(flags: CliFlags): Promise<void> {
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

async function statusCommand(): Promise<void> {
  const layout = getRuntimeLayout();
  const hasConfig = await hasRuntimeConfig(layout);
  if (!hasConfig) {
    console.log(`未检测到 Seedar 安装。预期目录: ${layout.installRoot}`);
    return;
  }

  const env = await readEnvConfig(layout);
  const state = await readInstallState(layout);
  const version = await readInstalledVersion(layout);
  const services = await parseComposePsOutput(layout);

  console.log(`安装目录: ${layout.installRoot}`);
  console.log(`状态: ${state}`);
  console.log(`目标版本: ${version ?? env.SEEDAR_VERSION}`);
  console.log(`Web: http://localhost:${env.WEB_PORT}`);
  console.log(`Server: http://localhost:${env.SERVER_PORT}`);
  console.log(`MySQL: localhost:${env.MYSQL_PORT}`);

  if (services.length === 0) {
    console.log("当前没有运行中的容器。");
    return;
  }

  console.log("");
  console.log("容器状态:");
  for (const service of services) {
    const serviceName = String(service.Service ?? service.Name ?? "unknown");
    const status = String(service.State ?? "unknown");
    const health = service.Health ? `, health=${String(service.Health)}` : "";
    const publishers = Array.isArray(service.Publishers)
      ? service.Publishers.map((item) => {
          if (
            item &&
            typeof item === "object" &&
            "PublishedPort" in item &&
            "TargetPort" in item
          ) {
            return `${String(item.PublishedPort)}->${String(item.TargetPort)}`;
          }
          return null;
        })
          .filter(Boolean)
          .join(", ")
      : "";
    const ports = publishers ? `, ports=${publishers}` : "";
    console.log(`- ${serviceName}: ${status}${health}${ports}`);
  }
}

async function logsCommand(serviceArg: string | undefined, flags: CliFlags): Promise<void> {
  const layout = getRuntimeLayout();
  await requireRuntimeConfig(layout);

  if (serviceArg && !VALID_SERVICES.includes(serviceArg as (typeof VALID_SERVICES)[number])) {
    throw new Error(`未知服务 ${serviceArg}，可选值: ${VALID_SERVICES.join(", ")}`);
  }

  const args = ["logs", "--tail", "200"];
  if (flags.follow) {
    args.push("--follow");
  }
  if (serviceArg) {
    args.push(serviceArg);
  }

  await runDockerComposeOrThrow(layout, args, { stdio: "inherit" });
}

async function doctorCommand(): Promise<void> {
  const layout = getRuntimeLayout();
  const checks = await collectDoctorChecks(layout);
  let failed = false;

  for (const check of checks) {
    const prefix =
      check.status === "ok" ? "OK" : check.status === "warn" ? "WARN" : "FAIL";
    console.log(`[${prefix} ${check.code}] ${check.title}: ${check.detail}`);
    if (check.status === "fail") {
      failed = true;
    }
  }

  if (failed) {
    process.exitCode = 1;
  }
}

function printHelp(): void {
  console.log(`Seedar CLI

用法:
  seedar install [version]
  seedar update [version]
  seedar uninstall [--remove-data] [--force]
  seedar status
  seedar logs [mysql|server|web|migrate] [--follow]
  seedar doctor
`);
}

export async function main(rawArgs: string[]): Promise<void> {
  const parsed = parseArgs(rawArgs);

  switch (parsed.command) {
    case "install":
      await installCommand(parsed.positional[0], parsed.flags);
      return;
    case "update":
      await updateCommand(parsed.positional[0]);
      return;
    case "uninstall":
      await uninstallCommand(parsed.flags);
      return;
    case "status":
      await statusCommand();
      return;
    case "logs":
      await logsCommand(parsed.positional[0], parsed.flags);
      return;
    case "doctor":
      await doctorCommand();
      return;
    case "help":
    case "--help":
    case "-h":
      printHelp();
      return;
    default:
      throw new Error(`未知命令 ${parsed.command}。使用 seedar help 查看帮助。`);
  }
}
