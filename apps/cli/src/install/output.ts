import type { EnvConfig, RuntimeLayout } from "../shared/types.js";
import { renderInfo, renderStage, renderSuccess, renderWarn } from "../shared/ui.js";

export function printInstallSummary(layout: RuntimeLayout, env: EnvConfig): void {
  console.log("Seedar 安装完成。");
  console.log(`安装目录: ${layout.installRoot}`);
  console.log(`Web: http://localhost:${env.WEB_PORT}`);
  console.log(`Server: http://localhost:${env.SERVER_PORT}`);
  console.log(`MySQL: localhost:${env.MYSQL_PORT}`);
  console.log(`版本: ${env.SEEDAR_VERSION}`);
}

export function printInstallStage(title: string): void {
  console.log(renderStage(title));
}

export function printInstallDetail(message: string): void {
  console.log(renderInfo(message));
}

export function printInstallSuccess(message: string): void {
  console.log(renderSuccess(message));
}

export function printInstallWarn(message: string): void {
  console.log(renderWarn(message));
}
