import { collectProblemInstallConfig } from "./prompts.js";
import { printInstallDetail, printInstallStage, printInstallSuccess, printInstallWarn } from "./output.js";
import { PORT_ENV_KEYS, getPortLabel } from "./ports.js";
import { writeRuntimeFiles } from "../runtime/index.js";
import type { CliFlags, EnvConfig, InstallConfigField, InstallConfigIssue, RuntimeLayout } from "../shared/types.js";

function isBlank(value: string): boolean {
  return value.trim().length === 0;
}

export function collectIssueFields(issues: InstallConfigIssue[]): InstallConfigField[] {
  return [...new Set(issues.map((issue) => issue.field))];
}

export function formatConfigIssues(issues: InstallConfigIssue[]): string {
  return issues.map((issue) => `- ${issue.field}: ${issue.message}`).join("\n");
}

export async function collectInstallConfigIssues(env: EnvConfig): Promise<InstallConfigIssue[]> {
  const issues: InstallConfigIssue[] = [];

  if (isBlank(env.SEEDAR_VERSION)) {
    issues.push({ field: "SEEDAR_VERSION", message: "不能为空" });
  }

  if (isBlank(env.DB_HOST)) {
    issues.push({ field: "DB_HOST", message: "不能为空" });
  }

  const dbPort = Number(env.DB_PORT);
  if (!Number.isInteger(dbPort) || dbPort < 1 || dbPort > 65535) {
    issues.push({ field: "DB_PORT", message: "必须是 1-65535 之间的端口" });
  }

  const textChecks: Array<[InstallConfigField, string]> = [
    ["DB_DATABASE", env.DB_DATABASE],
    ["DB_USERNAME", env.DB_USERNAME],
    ["DB_PASSWORD", env.DB_PASSWORD],
    ["MYSQL_ROOT_PASSWORD", env.MYSQL_ROOT_PASSWORD],
    ["AI_CHECKPOINT_PG_PASSWORD", env.AI_CHECKPOINT_PG_PASSWORD],
    ["AES_SECRET", env.AES_SECRET],
  ];
  for (const [field, value] of textChecks) {
    if (isBlank(value)) {
      issues.push({ field, message: "不能为空" });
    }
  }

  for (const key of PORT_ENV_KEYS) {
    const port = Number(env[key]);
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      issues.push({
        field: key,
        message: `${getPortLabel(key)} 必须是 1-65535 之间的端口`,
      });
    }
  }

  return issues;
}

export async function runInstallConfigCheck(
  layout: RuntimeLayout,
  env: EnvConfig,
  label: string,
): Promise<InstallConfigIssue[]> {
  printInstallStage(label);
  printInstallDetail("开始检查配置项");
  await writeRuntimeFiles(layout, env);
  printInstallDetail("端口冲突将在启动阶段自动避让并持续重试");
  const issues = await collectInstallConfigIssues(env);
  if (issues.length > 0) {
    printInstallWarn("配置检查未通过：");
    console.warn(formatConfigIssues(issues));
  } else {
    printInstallSuccess("配置检查通过");
  }

  return issues;
}

export async function prepareInstallConfig(
  layout: RuntimeLayout,
  env: EnvConfig,
  flags: CliFlags,
): Promise<EnvConfig> {
  let issues = await runInstallConfigCheck(layout, env, "检查配置");
  if (issues.length === 0) {
    return env;
  }

  const canReprompt = process.stdin.isTTY && !flags.yes;
  if (!canReprompt) {
    throw new Error(
      `配置检查未通过，请修改 ${layout.envPath} 后重新执行安装。\n${formatConfigIssues(issues)}`,
    );
  }

  printInstallStage("补充有问题的配置项");
  env = await collectProblemInstallConfig(env, collectIssueFields(issues), flags);
  issues = await runInstallConfigCheck(layout, env, "重新检查配置");
  if (issues.length === 0) {
    return env;
  }

  throw new Error(
    `配置检查两次仍未通过，请直接修改 ${layout.envPath} 后重新执行安装。\n${formatConfigIssues(issues)}`,
  );
}
