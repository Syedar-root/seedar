import { readFileSync } from "node:fs";

import { Command, CommanderError } from "commander";

import { doctorCommand } from "./commands/doctor.js";
import { installCommand } from "./commands/install.js";
import { logsCommand } from "./commands/logs.js";
import { purgeCommand, removeAllCommand, uninstallCommand } from "./commands/uninstall.js";
import { startCommand, stopCommand, updateCommand } from "./commands/lifecycle.js";
import { statusCommand } from "./commands/status.js";
import type { CliFlags } from "./shared/types.js";

interface InstallOptions {
  yes?: boolean;
}

interface LogsOptions {
  follow?: boolean;
}

interface UninstallOptions {
  removeData?: boolean;
  all?: boolean;
  force?: boolean;
}

interface ForceOptions {
  force?: boolean;
}

export interface CliHandlers {
  install: typeof installCommand;
  start: typeof startCommand;
  stop: typeof stopCommand;
  update: typeof updateCommand;
  uninstall: typeof uninstallCommand;
  removeAll: typeof removeAllCommand;
  purge: typeof purgeCommand;
  status: typeof statusCommand;
  logs: typeof logsCommand;
  doctor: typeof doctorCommand;
}

function readPackageVersion(): string {
  const packageJsonUrl = new URL("../package.json", import.meta.url);
  const packageJson = JSON.parse(readFileSync(packageJsonUrl, "utf8")) as { version?: string };
  return packageJson.version ?? "0.0.0";
}

function createDefaultHandlers(): CliHandlers {
  return {
    install: installCommand,
    start: startCommand,
    stop: stopCommand,
    update: updateCommand,
    uninstall: uninstallCommand,
    removeAll: removeAllCommand,
    purge: purgeCommand,
    status: statusCommand,
    logs: logsCommand,
    doctor: doctorCommand,
  };
}

function toCliFlags(options: Partial<CliFlags>): CliFlags {
  return {
    yes: Boolean(options.yes),
    force: Boolean(options.force),
    follow: Boolean(options.follow),
    removeData: Boolean(options.removeData),
    all: Boolean(options.all),
  };
}

function registerCommands(program: Command, handlers: CliHandlers): Command {
  program
    .command("install [version]")
    .description("Install Seedar")
    .action(async function (this: Command, version?: string) {
      await handlers.install(version, toCliFlags(this.optsWithGlobals<InstallOptions>()));
    });

  program.command("start").description("Start Seedar services").action(async () => {
    await handlers.start();
  });

  program.command("stop").description("Stop Seedar services").action(async () => {
    await handlers.stop();
  });

  program
    .command("update [version]")
    .description("Update Seedar to a target version")
    .action(async function (this: Command, version?: string) {
      await handlers.update(version);
    });

  program
    .command("uninstall")
    .description("Uninstall the current Seedar installation")
    .action(async function (this: Command) {
      await handlers.uninstall(toCliFlags(this.optsWithGlobals<UninstallOptions>()));
    });

  program
    .command("remove")
    .description("Remove the installation and self-uninstall the CLI")
    .action(async function (this: Command) {
      await handlers.removeAll(toCliFlags(this.optsWithGlobals<ForceOptions>()));
    });

  program
    .command("purge")
    .description("Purge the installation directory and all data")
    .action(async function (this: Command) {
      await handlers.purge(toCliFlags(this.optsWithGlobals<ForceOptions>()));
    });

  program.command("status").description("Show the current installation status").action(async () => {
    await handlers.status();
  });

  program
    .command("logs [service]")
    .description("Show service logs")
    .action(async function (this: Command, service?: string) {
      await handlers.logs(service, toCliFlags(this.optsWithGlobals<LogsOptions>()));
    });

  program.command("doctor").description("Run environment health checks").action(async () => {
    await handlers.doctor();
  });

  return program;
}

export function createProgram(overrides: Partial<CliHandlers> = {}): Command {
  const handlers: CliHandlers = {
    ...createDefaultHandlers(),
    ...overrides,
  };

  const program = new Command();
  program
    .name("seedar")
    .description("Seedar deployment CLI")
    .option("-y, --yes", "Use default answers without prompting")
    .option("-f, --follow", "Follow log output")
    .option("--force", "Skip confirmation prompts")
    .option("--remove-data", "Remove local data directory")
    .option("--all", "Remove the installation and self-uninstall the CLI")
    .version(readPackageVersion())
    .addHelpCommand(true)
    .showHelpAfterError("(use --help for usage)")
    .exitOverride();

  program.addHelpText(
    "afterAll",
    `
Examples:
  seedar install
  seedar install 1.2.3 -y
  seedar logs server --follow
  seedar logs postgres --follow
  seedar uninstall --remove-data --force
`,
  );

  return registerCommands(program, handlers);
}

export async function main(rawArgs: string[] = process.argv): Promise<void> {
  const program = createProgram();

  try {
    await program.parseAsync(rawArgs);
  } catch (error) {
    if (error instanceof CommanderError) {
      if (error.code !== "commander.helpDisplayed" && error.code !== "commander.version") {
        process.exitCode = 1;
      }
      return;
    }

    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exitCode = 1;
  }
}
