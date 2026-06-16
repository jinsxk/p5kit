import childProcess from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const tmpRoot = path.join(root, ".tmp");
const appDir = path.join(tmpRoot, "smoke-app");

run();

function run() {
  fs.rmSync(appDir, { recursive: true, force: true });
  fs.mkdirSync(tmpRoot, { recursive: true });

  exec(process.execPath, [path.join(root, "packages/create-p5kit/bin/create-p5kit.js"), appDir], root);
  exec("npm", ["install"], appDir);
  exec("npm", ["run", "build"], appDir);
  exec("npm", ["run", "build:ios"], appDir);

  assertFile(path.join(appDir, "dist", "index.html"));
  assertFile(path.join(appDir, ".p5kit", "ios", "Web", "index.html"));

  console.log("Smoke test passed.");
}

function exec(command, args, cwd) {
  const result = childProcess.spawnSync(command, args, {
    cwd,
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed with status ${result.status}`);
  }
}

function assertFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Expected file to exist: ${filePath}`);
  }
}
