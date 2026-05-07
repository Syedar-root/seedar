import assert from "node:assert/strict";
import test from "node:test";

import { CommanderError } from "commander";

import { createProgram, main } from "../dist/cli.js";

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

  await program.parseAsync(["node", "seedar", "logs", "server", "--follow"]);

  assert.deepEqual(called, {
    service: "server",
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
