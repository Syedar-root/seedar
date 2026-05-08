import { collectDoctorChecks } from "./status.js";
import { getRuntimeLayout } from "../runtime/index.js";

export async function doctorCommand(): Promise<void> {
  const layout = getRuntimeLayout();
  const checks = await collectDoctorChecks(layout);
  let failed = false;

  for (const check of checks) {
    const prefix =
      check.status === "ok" ? "OK" : check.status === "warn" ? "WARN" : "FAIL";
    console.log(`[${prefix} ${check.code}] ${check.title}: ${check.detail}`);
    if (check.status === "fail") {
      failed = true;
    }
  }

  if (failed) {
    process.exitCode = 1;
  }
}
