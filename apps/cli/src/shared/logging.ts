import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";

import type { RuntimeLayout } from "./types.js";

export async function writeCliLog(layout: RuntimeLayout, message: string): Promise<void> {
  const line = `[${new Date().toISOString()}] ${message}\n`;
  await mkdir(layout.logsDir, { recursive: true });
  await appendFile(path.join(layout.logsDir, "cli.log"), line, "utf8");
}
