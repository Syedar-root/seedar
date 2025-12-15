import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Root element #root not found");
}

// #region agent log
fetch("http://127.0.0.1:7242/ingest/495e0556-5e46-4e41-a5a9-3ec163344688", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    sessionId: "debug-session",
    runId: "pre-fix2",
    hypothesisId: "H3",
    location: "apps/web-client/src/main.tsx:bootstrap",
    message: "bootstrap_root_found",
    data: { hasRoot: !!root },
    timestamp: Date.now()
  })
}).catch(() => {});
// #endregion

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

