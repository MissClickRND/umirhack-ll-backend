const { execSync } = require('node:child_process');

function parsePort(raw) {
  const parsed = Number(raw ?? '3000');
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
    throw new Error(`Invalid port: ${raw}`);
  }

  return parsed;
}

function uniqueNumbers(values) {
  return [...new Set(values.filter((value) => Number.isInteger(value) && value > 0))];
}

function getPidsOnWindows(port) {
  const output = execSync(`netstat -ano -p tcp | findstr :${port}`, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  const pids = output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split(/\s+/))
    .filter((parts) => parts.length >= 5)
    .filter((parts) => parts[1].endsWith(`:${port}`))
    .map((parts) => Number(parts[4]));

  return uniqueNumbers(pids);
}

function getPidsOnPosix(port) {
  const output = execSync(`lsof -ti tcp:${port}`, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  const pids = output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((value) => Number(value));

  return uniqueNumbers(pids);
}

function getPidsByPort(port) {
  try {
    if (process.platform === 'win32') {
      return getPidsOnWindows(port);
    }

    return getPidsOnPosix(port);
  } catch {
    return [];
  }
}

function killPid(pid) {
  if (process.platform === 'win32') {
    execSync(`taskkill /F /PID ${pid}`, { stdio: ['ignore', 'pipe', 'pipe'] });
    return;
  }

  process.kill(pid, 'SIGKILL');
}

function main() {
  const port = parsePort(process.argv[2] ?? process.env.PORT ?? '3000');
  const pids = getPidsByPort(port);

  if (pids.length === 0) {
    console.log(`Port ${port} is free`);
    return;
  }

  for (const pid of pids) {
    if (pid === process.pid) {
      continue;
    }

    try {
      killPid(pid);
      console.log(`Killed PID ${pid} on port ${port}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`Failed to kill PID ${pid}: ${message}`);
    }
  }
}

main();