import net from "node:net";

export async function isPortAvailable(port: number): Promise<boolean> {
  return await new Promise<boolean>((resolve) => {
    const server = net.createServer();
    server.unref();
    server.on("error", () => resolve(false));
    server.listen(port, "0.0.0.0", () => {
      server.close(() => resolve(true));
    });
  });
}

export async function getAvailablePort(
  preferredPort: number,
  excludedPorts: Iterable<number> = [],
): Promise<number> {
  const excluded = new Set(excludedPorts);
  const startPort = Number.isInteger(preferredPort)
    ? Math.min(65535, Math.max(1, preferredPort))
    : 1;

  for (let currentPort = startPort; currentPort <= 65535; currentPort += 1) {
    if (excluded.has(currentPort)) {
      continue;
    }
    if (await isPortAvailable(currentPort)) {
      return currentPort;
    }
  }

  throw new Error(`从端口 ${startPort} 开始未找到可用端口`);
}
