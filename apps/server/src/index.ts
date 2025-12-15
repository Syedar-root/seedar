import fs from "node:fs";
import express from "express";

// #region agent log helper
const logDebug = (hypothesisId: string, location: string, message: string, data: Record<string, unknown>) => {
  const payload = {
    sessionId: "debug-session",
    runId: "pre-fix2",
    hypothesisId,
    location,
    message,
    data,
    timestamp: Date.now()
  };
  fetch("http://127.0.0.1:7242/ingest/495e0556-5e46-4e41-a5a9-3ec163344688", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  }).catch(() => {});
  try {
    fs.appendFileSync("d:\\Program\\projects\\seedar\\.cursor\\debug.log", JSON.stringify(payload) + "\n");
  } catch {
    // ignore append errors
  }
};
// #endregion

const app = express();
const port = process.env.PORT || 3000;

// #region agent log
logDebug("H1", "apps/server/src/index.ts:startup", "server_start", { port });
// #endregion

app.get("/", (_req, res) => {
  // #region agent log
  logDebug("H2", "apps/server/src/index.ts:handler", "root_handler_invoked", {});
  // #endregion

  res.json({ message: "Hello from Express + TypeScript" });
});

app
  .listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
    // #region agent log
    logDebug("H1", "apps/server/src/index.ts:listen", "server_listening", { port });
    // #endregion
  })
  .on("error", (err) => {
    // #region agent log
    logDebug("H2", "apps/server/src/index.ts:error", "server_error", { message: (err as Error).message });
    // #endregion
  });

