import { ensurePrerequisites } from "../docker/prerequisites.js";
import { prepareInstallConfig } from "../install/config.js";
import { runInstallFlowWithValidatedConfig } from "../install/flow.js";
import { printInstallDetail, printInstallStage, printInstallSummary } from "../install/output.js";
import { collectInstallConfig } from "../install/prompts.js";
import { writeCliLog } from "../shared/logging.js";
import type { CliFlags, EnvConfig } from "../shared/types.js";
import {
  getRuntimeLayout,
  hasRuntimeConfig,
  readEnvConfig,
  readInstallState,
  writeInstalledVersion,
  writeInstallState,
} from "../runtime/index.js";

export async function installCommand(versionArg: string | undefined, flags: CliFlags): Promise<void> {
  const layout = getRuntimeLayout();
  await ensurePrerequisites();

  const state = await readInstallState(layout);
  const hasConfig = await hasRuntimeConfig(layout);
  if (state === "installed" && hasConfig) {
    throw new Error(
      `检测到现有安装目录 ${layout.installRoot}。如需升级请使用 seedar update。`,
    );
  }

  let env: EnvConfig;
  if (state === "uninstalled" && hasConfig) {
    printInstallStage("复用已有配置");
    env = await readEnvConfig(layout);
    env.SEEDAR_VERSION = versionArg ?? env.SEEDAR_VERSION;
    printInstallDetail(`已复用配置文件：${layout.envPath}`);
    await writeCliLog(layout, `reuse existing config reinstall target=${env.SEEDAR_VERSION}`);
  } else {
    printInstallStage("填写配置");
    env = await collectInstallConfig(layout, versionArg, flags);
    printInstallDetail("配置填写完成");
  }

  env = await prepareInstallConfig(layout, env, flags);
  await runInstallFlowWithValidatedConfig(layout, env);

  await writeInstalledVersion(layout, env.SEEDAR_VERSION);
  await writeInstallState(layout, "installed");
  printInstallSummary(layout, env);
}
