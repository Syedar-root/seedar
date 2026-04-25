import type { CliFlags } from "./types.js";

export interface ParsedCommand {
  command: string;
  positional: string[];
  flags: CliFlags;
}

export function parseArgs(rawArgs: string[]): ParsedCommand {
  const flags: CliFlags = {
    yes: false,
    force: false,
    follow: false,
    removeData: false,
    all: false,
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
    if (arg === "--all") {
      flags.all = true;
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
