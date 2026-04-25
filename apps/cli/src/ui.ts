import chalk from "chalk";
import ora, { type Ora } from "ora";

const CLI_DIVIDER = chalk.dim("=".repeat(68));
const CLI_SUB_DIVIDER = chalk.dim("-".repeat(68));

export function renderStage(title: string): string {
  return ["", CLI_DIVIDER, chalk.bold.cyan(`[Seedar] ${title}`), CLI_SUB_DIVIDER].join("\n");
}

export function renderInfo(message: string): string {
  return `${chalk.cyan("[INFO]")} ${message}`;
}

export function renderSuccess(message: string): string {
  return `${chalk.green("[ OK ]")} ${message}`;
}

export function renderWarn(message: string): string {
  return `${chalk.yellow("[WARN]")} ${message}`;
}

export function createSpinner(text: string): Ora {
  return ora({
    text,
    color: "cyan",
    spinner: "dots",
    discardStdin: false,
  });
}
