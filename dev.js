import { spawn } from "node:child_process";

const root = process.cwd();

const server = spawn("node", ["--watch", "server/index.js"], { cwd: root, stdio: "inherit", shell: true });
const client = spawn("npm", ["run", "dev"], { cwd: root, stdio: "inherit", shell: true });

function shutdown() {
  server.kill();
  client.kill();
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
