import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { CommanderError } from "commander";

import { createProgram, main } from "../dist/cli.js";
import { readEnvConfig } from "../dist/runtime/index.js";

function createSilentProgram(overrides = {}) {
  const program = createProgram(overrides);
  program.configureOutput({
    writeOut() {},
    writeErr() {},
  });
  return program;
}

test("route: install maps version and -y", async () => {
  let called = null;
  const program = createSilentProgram({
    install: async (version, flags) => {
      called = { version, flags };
    },
  });

  await program.parseAsync(["node", "seedar", "install", "1.2.3", "-y"]);

  assert.deepEqual(called, {
    version: "1.2.3",
    flags: {
      yes: true,
      force: false,
      follow: false,
      removeData: false,
      all: false,
    },
  });
});

test("route: lifecycle/status/doctor commands are dispatched", async () => {
  const calls = [];
  const program = createSilentProgram({
    start: async () => calls.push("start"),
    stop: async () => calls.push("stop"),
    update: async (version) => calls.push(`update:${version ?? ""}`),
    status: async () => calls.push("status"),
    doctor: async () => calls.push("doctor"),
  });

  await program.parseAsync(["node", "seedar", "start"]);
  await program.parseAsync(["node", "seedar", "stop"]);
  await program.parseAsync(["node", "seedar", "update", "latest"]);
  await program.parseAsync(["node", "seedar", "status"]);
  await program.parseAsync(["node", "seedar", "doctor"]);

  assert.deepEqual(calls, ["start", "stop", "update:latest", "status", "doctor"]);
});

test("route: uninstall/remove/purge flag mapping", async () => {
  const calls = [];
  const program = createSilentProgram({
    uninstall: async (flags) => calls.push(["uninstall", flags]),
    removeAll: async (flags) => calls.push(["remove", flags]),
    purge: async (flags) => calls.push(["purge", flags]),
  });

  await program.parseAsync([
    "node",
    "seedar",
    "uninstall",
    "--remove-data",
    "--all",
    "--force",
  ]);
  await program.parseAsync(["node", "seedar", "remove", "--force"]);
  await program.parseAsync(["node", "seedar", "purge", "--force"]);

  assert.deepEqual(calls, [
    [
      "uninstall",
      {
        yes: false,
        force: true,
        follow: false,
        removeData: true,
        all: true,
      },
    ],
    [
      "remove",
      {
        yes: false,
        force: true,
        follow: false,
        removeData: false,
        all: false,
      },
    ],
    [
      "purge",
      {
        yes: false,
        force: true,
        follow: false,
        removeData: false,
        all: false,
      },
    ],
  ]);
});

test("route: logs maps service and --follow", async () => {
  let called = null;
  const program = createSilentProgram({
    logs: async (service, flags) => {
      called = { service, flags };
    },
  });

  await program.parseAsync(["node", "seedar", "logs", "postgres", "--follow"]);

  assert.deepEqual(called, {
    service: "postgres",
    flags: {
      yes: false,
      force: false,
      follow: true,
      removeData: false,
      all: false,
    },
  });
});

test("route: global flags can appear before commands", async () => {
  const calls = [];
  const program = createSilentProgram({
    install: async (version, flags) => calls.push(["install", version, flags]),
    purge: async (flags) => calls.push(["purge", flags]),
    logs: async (service, flags) => calls.push(["logs", service, flags]),
  });

  await program.parseAsync(["node", "seedar", "-y", "install", "2.0.0"]);
  await program.parseAsync(["node", "seedar", "--force", "purge"]);
  await program.parseAsync(["node", "seedar", "-f", "logs", "server"]);

  assert.deepEqual(calls, [
    [
      "install",
      "2.0.0",
      {
        yes: true,
        force: false,
        follow: false,
        removeData: false,
        all: false,
      },
    ],
    [
      "purge",
      {
        yes: false,
        force: true,
        follow: false,
        removeData: false,
        all: false,
      },
    ],
    [
      "logs",
      "server",
      {
        yes: false,
        force: false,
        follow: true,
        removeData: false,
        all: false,
      },
    ],
  ]);
});

test("help: seedar --help and seedar help are supported", async () => {
  const program = createSilentProgram();

  await assert.rejects(program.parseAsync(["node", "seedar", "--help"]), (error) => {
    return error instanceof CommanderError;
  });

  await assert.rejects(program.parseAsync(["node", "seedar", "help"]), (error) => {
    return error instanceof CommanderError;
  });
});

test("error path: unknown command sets non-zero exit code", async () => {
  const previousExitCode = process.exitCode;
  try {
    process.exitCode = 0;
    await main(["node", "seedar", "unknown-command"]);
    assert.equal(process.exitCode, 1);
  } finally {
    process.exitCode = previousExitCode;
  }
});

test("error path: commander parse error sets non-zero exit code", async () => {
  const previousExitCode = process.exitCode;
  try {
    process.exitCode = 0;
    await main(["node", "seedar", "logs", "--bad-option"]);
    assert.equal(process.exitCode, 1);
  } finally {
    process.exitCode = previousExitCode;
  }
});

test("error path: invalid logs service sets non-zero exit code", async () => {
  const previousExitCode = process.exitCode;
  try {
    process.exitCode = 0;
    await main(["node", "seedar", "logs", "invalid-service"]);
    assert.equal(process.exitCode, 1);
  } finally {
    process.exitCode = previousExitCode;
  }
});

test("runtime: readEnvConfig backfills checkpoint password from url", async () => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "seedar-cli-test-"));
  const layout = {
    installRoot: tempRoot,
    runtimeDir: path.join(tempRoot, "runtime"),
    dataDir: path.join(tempRoot, "data"),
    mysqlDataDir: path.join(tempRoot, "data", "mysql"),
    postgresDataDir: path.join(tempRoot, "data", "postgres"),
    logsDir: path.join(tempRoot, "logs"),
    backupsDir: path.join(tempRoot, "backups"),
    composePath: path.join(tempRoot, "runtime", "docker-compose.yml"),
    envPath: path.join(tempRoot, "runtime", ".env"),
    versionPath: path.join(tempRoot, "runtime", ".installed-version"),
    statePath: path.join(tempRoot, "runtime", ".install-state"),
  };

  try {
    await mkdir(layout.runtimeDir, { recursive: true });
    await writeFile(
      layout.envPath,
      [
        "SEEDAR_VERSION=latest",
        `SEEDAR_INSTALL_ROOT=${tempRoot.replace(/\\/g, "/")}`,
        "SEEDAR_INSTANCE_ID=1234abcd",
        "SEEDAR_PROJECT_NAME=seedar-1234abcd",
        "MYSQL_PORT=3306",
        "SERVER_PORT=8090",
        "WEB_PORT=8080",
        "DB_HOST=mysql",
        "DB_PORT=3306",
        "DB_USERNAME=seedar",
        "DB_PASSWORD=change_me_db_password",
        "DB_DATABASE=seedar_prod",
        "MYSQL_ROOT_PASSWORD=change_me_root_password",
        "MYSQL_DATABASE=seedar_prod",
        "MYSQL_USER=seedar",
        "MYSQL_PASSWORD=change_me_db_password",
        "AI_CHECKPOINT_PG_URL=postgresql://postgres:change_me_pg_password@postgres:5432/postgres",
        "AES_SECRET=change_me_to_a_long_random_secret",
        "",
      ].join("\n"),
      "utf8",
    );

    const env = await readEnvConfig(layout);
    assert.equal(env.AI_CHECKPOINT_PG_PASSWORD, "change_me_pg_password");
    assert.equal(env.AI_CHECKPOINT_PG_URL, "postgresql://postgres:change_me_pg_password@postgres:5432/postgres");

    const written = await readFile(layout.envPath, "utf8");
    assert.match(written, /AI_CHECKPOINT_PG_PASSWORD=change_me_pg_password/);
    assert.match(
      written,
      /AI_CHECKPOINT_PG_URL=postgresql:\/\/postgres:change_me_pg_password@postgres:5432\/postgres/,
    );
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});
