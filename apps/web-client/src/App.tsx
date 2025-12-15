function App() {
  // #region agent log
  fetch("http://127.0.0.1:7242/ingest/495e0556-5e46-4e41-a5a9-3ec163344688", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId: "debug-session",
      runId: "pre-fix2",
      hypothesisId: "H4",
      location: "apps/web-client/src/App.tsx:render",
      message: "app_render",
      data: {},
      timestamp: Date.now()
    })
  }).catch(() => {});
  // #endregion

  return (
    <main style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>React + TypeScript</h1>
      <p>Monorepo web client is running.</p>
    </main>
  );
}

export default App;

