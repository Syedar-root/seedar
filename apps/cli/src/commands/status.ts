import { access } from "node:fs/promises";
import path from "node:path";

import {
  DEFAULT_PORTS,
  DEFAULT_SERVER_IMAGE,
  DEFAULT_WEB_IMAGE,
  MIN_NODE_MAJOR,
  REQUIRED_ENV_KEYS,
} from "../shared/constants.js";
import { getPublishersFromServices, parseComposePsOutput } from "../docker/compose.js";
import { isPortAvailable } from "../docker/ports.js";
import { runCommand, runDockerCompose } from "../docker/process.js";
import type { DoctorCheck, EnvConfig, RuntimeLayout } from "../shared/types.js";
import {
  getRuntimeLayout,
  hasRuntimeConfig,
  readEnvConfig,
  readInstalledVersion,
  readInstallState,
} from "../runtime/index.js";

function formatCheckpointTarget(connectionString: string): string {
  try {
    const url = new URL(connectionString);
    const host = url.hostname || "postgres";
    const port = url.port || "5432";
    const database = url.pathname.replace(/^\/+/, "") || "postgres";
    return `${host}:${port}/${database}`;
  } catch {
    return "unknown";
  }
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

export async function collectDoctorChecks(layout: RuntimeLayout): Promise<DoctorCheck[]> {
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
      ["D009", String(DEFAULT_PORTS.mysql)],
      ["D010", String(DEFAULT_PORTS.server)],
      ["D011", String(DEFAULT_PORTS.web)],
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

export async function statusCommand(): Promise<void> {
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
  console.log(`Checkpoint PG: ${formatCheckpointTarget(env.AI_CHECKPOINT_PG_URL)}`);

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
