import { spawn } from "node:child_process";

import type { RunResult, RuntimeLayout } from "./types.js";

interface RunCommandOptions {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  stdio?: "inherit" | "pipe";
  shell?: boolean;
}

export function spawnDetached(
  command: string,
  args: string[],
  options: Omit<RunCommandOptions, "stdio"> = {},
): void {
  const child = spawn(command, args, {
    cwd: options.cwd,
    env: options.env ?? process.env,
    stdio: "ignore",
    shell: options.shell ?? false,
    detached: true,
    windowsHide: true,
  });
  child.unref();
}

export async function runCommand(
  command: string,
  args: string[],
  options: RunCommandOptions = {},
): Promise<RunResult> {
  return await new Promise<RunResult>((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: options.env ?? process.env,
      stdio: options.stdio === "inherit" ? "inherit" : "pipe",
      shell: options.shell ?? false,
    });

    let stdout = "";
    let stderr = "";

    if (child.stdout) {
      child.stdout.on("data", (chunk: Buffer | string) => {
        stdout += chunk.toString();
      });
    }

    if (child.stderr) {
      child.stderr.on("data", (chunk: Buffer | string) => {
        stderr += chunk.toString();
      });
    }

    child.on("error", reject);
    child.on("close", (code) => {
      resolve({
        code: code ?? 1,
        stdout,
        stderr,
      });
    });
  });
}

export async function runCommandOrThrow(
  command: string,
  args: string[],
  options: RunCommandOptions = {},
): Promise<RunResult> {
  const result = await runCommand(command, args, options);
  if (result.code !== 0) {
    const detail = [result.stdout.trim(), result.stderr.trim()]
      .filter(Boolean)
      .join("\n");
    throw new Error(detail || `${command} ${args.join(" ")} 执行失败`);
  }

  return result;
}

export async function runDockerCompose(
  layout: RuntimeLayout,
  args: string[],
  options: RunCommandOptions = {},
): Promise<RunResult> {
  return await runCommand(
    "docker",
    ["compose", "--env-file", layout.envPath, "-f", layout.composePath, ...args],
    {
      cwd: layout.runtimeDir,
      ...options,
    },
  );
}

export async function runDockerComposeOrThrow(
  layout: RuntimeLayout,
  args: string[],
  options: RunCommandOptions = {},
): Promise<RunResult> {
  const result = await runDockerCompose(layout, args, options);
  if (result.code !== 0) {
    const detail = [result.stdout.trim(), result.stderr.trim()]
      .filter(Boolean)
      .join("\n");
    throw new Error(detail || `docker compose ${args.join(" ")} 执行失败`);
  }

  return result;
}
