import { MIN_NODE_MAJOR } from "../shared/constants.js";
import { runCommandOrThrow } from "./process.js";

export async function ensurePrerequisites(): Promise<void> {
  const major = Number(process.versions.node.split(".")[0]);
  if (major < MIN_NODE_MAJOR) {
    throw new Error(`Node.js 版本过低，当前 ${process.version}，需要 >= ${MIN_NODE_MAJOR}`);
  }

  await runCommandOrThrow("docker", ["--version"]);
  await runCommandOrThrow("docker", ["compose", "version"]);
  await runCommandOrThrow("docker", ["info"]);
}
