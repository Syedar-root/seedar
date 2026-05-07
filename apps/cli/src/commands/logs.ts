import { runDockerComposeOrThrow } from "../docker/process.js";
import { VALID_SERVICES } from "../shared/constants.js";
import type { CliFlags } from "../shared/types.js";
import { getRuntimeLayout } from "../runtime/index.js";
import { requireRuntimeConfig } from "../runtime/guards.js";

export function assertValidLogService(serviceArg: string | undefined): void {
  if (serviceArg && !VALID_SERVICES.includes(serviceArg as (typeof VALID_SERVICES)[number])) {
    throw new Error(`未知服务 ${serviceArg}，可选值: ${VALID_SERVICES.join(", ")}`);
  }
}

export async function logsCommand(serviceArg: string | undefined, flags: CliFlags): Promise<void> {
  const layout = getRuntimeLayout();
  assertValidLogService(serviceArg);
  await requireRuntimeConfig(layout);

  const args = ["logs", "--tail", "200"];
  if (flags.follow) {
    args.push("--follow");
  }
  if (serviceArg) {
    args.push(serviceArg);
  }

  await runDockerComposeOrThrow(layout, args, { stdio: "inherit" });
}
