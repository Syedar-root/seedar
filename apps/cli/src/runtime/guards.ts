import { hasRuntimeConfig } from "./index.js";
import type { RuntimeLayout } from "../shared/types.js";

export async function requireRuntimeConfig(layout: RuntimeLayout): Promise<void> {
  if (!(await hasRuntimeConfig(layout))) {
    throw new Error(`未检测到运行时配置，请先执行 seedar install。安装目录: ${layout.installRoot}`);
  }
}
