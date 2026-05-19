const { spawn } = require("node:child_process");

const mode = process.argv[2] || "dev";

const commandSets = {
  dev: [
    {
      name: "BACKEND",
      color: "\x1b[34m",
      command:
        "cd backend && set \"PORT=3005\" && set \"API_URL=http://localhost:3005\" && npm run start:dev -- --port 3005",
    },
    {
      name: "FRONTEND",
      color: "\x1b[32m",
      command:
        "cd frontend && set \"NEXT_PUBLIC_API_URL=http://localhost:3005/api/v1\" && npm run dev",
    },
  ],
  start: [
    {
      name: "BACKEND",
      color: "\x1b[34m",
      command: "cd backend && npm run start:prod",
    },
    {
      name: "FRONTEND",
      color: "\x1b[32m",
      command: "cd frontend && npm run start",
    },
  ],
};

const commands = commandSets[mode];

if (!commands) {
  console.error(`Unknown mode: ${mode}`);
  process.exit(1);
}

const children = [];
let shuttingDown = false;

function shutdown(signal = "SIGTERM") {
  if (shuttingDown) return;
  shuttingDown = true;

  for (const child of children) {
    if (!child.killed) {
      child.kill(signal);
    }
  }
}

for (const { name, color, command } of commands) {
  process.stdout.write(`${color}[${name}]\x1b[0m ${command}\n`);

  const child = spawn("cmd.exe", ["/d", "/s", "/c", command], {
    cwd: process.cwd(),
    stdio: "inherit",
    windowsHide: false,
  });

  children.push(child);

  child.on("error", (error) => {
    process.stderr.write(
      `${color}[${name}]\x1b[0m failed to start: ${error.message}\n`,
    );
    process.exitCode = 1;
    shutdown();
  });

  child.on("exit", (code) => {
    if (!shuttingDown && code && code !== 0) {
      process.exitCode = code;
      shutdown();
    }
  });
}

process.on("SIGINT", () => {
  shutdown("SIGINT");
  process.exit(0);
});

process.on("SIGTERM", () => {
  shutdown("SIGTERM");
  process.exit(0);
});
