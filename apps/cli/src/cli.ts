import { parseArgs } from "./shared/args.js";
import { doctorCommand } from "./commands/doctor.js";
import { printHelp } from "./commands/help.js";
import { installCommand } from "./commands/install.js";
import { startCommand, stopCommand, updateCommand } from "./commands/lifecycle.js";
import { logsCommand } from "./commands/logs.js";
import { purgeCommand, removeAllCommand, uninstallCommand } from "./commands/uninstall.js";
import { statusCommand } from "./commands/status.js";

export async function main(rawArgs: string[]): Promise<void> {
  const parsed = parseArgs(rawArgs);

  switch (parsed.command) {
    case "install":
      await installCommand(parsed.positional[0], parsed.flags);
      return;
    case "start":
      await startCommand();
      return;
    case "stop":
      await stopCommand();
      return;
    case "update":
      await updateCommand(parsed.positional[0]);
      return;
    case "uninstall":
      await uninstallCommand(parsed.flags);
      return;
    case "remove":
      await removeAllCommand(parsed.flags);
      return;
    case "purge":
      await purgeCommand(parsed.flags);
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
