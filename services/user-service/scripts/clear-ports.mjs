import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const serviceRoot = resolve(__dirname, "..");
const backendEnvPath = resolve(serviceRoot, "../../.env");

function loadEnvFromFile() {
  if (!existsSync(backendEnvPath)) {
    return {};
  }

  return parse(readFileSync(backendEnvPath));
}

function toValidPort(value, fallback) {
  const parsed = Number(value ?? fallback);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
    return null;
  }

  return parsed;
}

function run(command, args) {
  return spawnSync(command, args, {
    encoding: "utf8",
  });
}

function getPidsForPortWindows(port) {
  const script =
    `$conns = Get-NetTCPConnection -LocalPort ${port} -State Listen -ErrorAction SilentlyContinue; ` +
    `if ($conns) { $conns | Select-Object -ExpandProperty OwningProcess -Unique }`;

  const result = run("powershell", [
    "-NoProfile",
    "-NonInteractive",
    "-Command",
    script,
  ]);

  if (result.error) {
    return [];
  }

  const output = `${result.stdout ?? ""}`.trim();
  if (!output) {
    return [];
  }

  return [...new Set(output.split(/\s+/).filter((x) => /^\d+$/.test(x)).map(Number))];
}

function getPidsForPortUnix(port) {
  const result = run("lsof", ["-ti", `tcp:${port}`]);

  if (result.error) {
    return [];
  }

  const output = `${result.stdout ?? ""}`.trim();
  if (!output) {
    return [];
  }

  return [...new Set(output.split(/\s+/).filter((x) => /^\d+$/.test(x)).map(Number))];
}

function getPidsForPort(port) {
  if (process.platform === "win32") {
    return getPidsForPortWindows(port);
  }

  return getPidsForPortUnix(port);
}

function killPid(pid) {
  if (process.platform === "win32") {
    const result = run("taskkill", ["/PID", String(pid), "/F", "/T"]);
    return result.status === 0;
  }

  const result = run("kill", ["-9", String(pid)]);
  return result.status === 0;
}

function clearPort(port) {
  const pids = getPidsForPort(port).filter((pid) => pid !== process.pid);

  if (pids.length === 0) {
    console.log(`[ports] ${port} is free`);
    return;
  }

  for (const pid of pids) {
    const ok = killPid(pid);
    if (ok) {
      console.log(`[ports] killed pid ${pid} on port ${port}`);
      continue;
    }

    console.warn(`[ports] failed to kill pid ${pid} on port ${port}`);
  }

  const stillUsed = getPidsForPort(port).length > 0;
  if (stillUsed) {
    console.error(`[ports] port ${port} is still busy after cleanup`);
    process.exit(1);
  }
}

const envFile = loadEnvFromFile();

const userHttpPort = toValidPort(
  process.env.USER_SERVICE_PORT ?? envFile.USER_SERVICE_PORT ?? process.env.PORT ?? envFile.PORT,
  3002,
);

const userTcpPort = toValidPort(
  process.env.TCP_PORT ?? envFile.TCP_PORT,
  4001,
);

const ports = [...new Set([userHttpPort, userTcpPort].filter((x) => x !== null))];

if (ports.length === 0) {
  console.log("[ports] no valid ports configured, skip cleanup");
  process.exit(0);
}

for (const port of ports) {
  clearPort(port);
}

console.log("[ports] cleanup completed");