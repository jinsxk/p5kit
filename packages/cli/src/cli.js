const childProcess = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const PACKAGE_ROOT = path.resolve(__dirname, "..");
const PACKAGE_JSON = require(path.join(PACKAGE_ROOT, "package.json"));

async function main(argv) {
  const [command = "help", ...rest] = argv;

  switch (command) {
    case "-h":
    case "--help":
    case "help":
      printHelp();
      return;
    case "-v":
    case "--version":
    case "version":
      console.log(PACKAGE_JSON.version);
      return;
    case "dev":
      await runVite(rest);
      return;
    case "build":
      await build(rest);
      return;
    case "run":
      await run(rest);
      return;
    default:
      throw new Error(`Unknown p5kit command: ${command}\n\nRun "p5kit help" for available commands.`);
  }
}

async function build(args) {
  const target = readTarget(args, "web");

  if (target.name === "web") {
    await runVite(["build", ...target.rest]);
    return;
  }

  if (target.name === "ios") {
    await runVite(["build", ...target.rest]);
    prepareNativeBundle("ios");
    console.log("Prepared iOS web bundle in .p5kit/ios/Web.");
    console.log("The native iOS shell resources are bundled with @p5kit/cli.");
    return;
  }

  if (target.name === "android") {
    await runVite(["build", ...target.rest]);
    prepareNativeBundle("android");
    console.log("Prepared Android web bundle in .p5kit/android/Web.");
    console.log("Android shell generation is not implemented yet.");
    return;
  }

  throw new Error(`Unsupported build target: ${target.name}`);
}

async function run(args) {
  const target = readTarget(args, "web");

  if (target.name === "web") {
    await runVite(target.rest);
    return;
  }

  if (target.name === "ios") {
    await build(["ios", ...target.rest]);
    console.log("iOS app launching is not implemented yet.");
    return;
  }

  if (target.name === "android") {
    await build(["android", ...target.rest]);
    console.log("Android runtime launching is not implemented yet.");
    return;
  }

  throw new Error(`Unsupported run target: ${target.name}`);
}

function readTarget(args, fallback) {
  const rest = [...args];
  const first = rest[0];

  if (first && !first.startsWith("-")) {
    return {
      name: rest.shift(),
      rest,
    };
  }

  return {
    name: fallback,
    rest,
  };
}

function runVite(args) {
  return runLocalBin("vite", args, {
    missingMessage:
      "Vite is required for this command. Run npm install in your p5kit project, then try again.",
  });
}

function runLocalBin(command, args, options = {}) {
  const bin = localBinPath(command);
  const executable = fs.existsSync(bin) ? bin : command;

  return new Promise((resolve, reject) => {
    const child = childProcess.spawn(executable, args, {
      cwd: process.cwd(),
      env: process.env,
      stdio: "inherit",
      shell: process.platform === "win32" && executable === command,
    });

    child.on("error", (error) => {
      if (error.code === "ENOENT" && options.missingMessage) {
        reject(new Error(options.missingMessage));
        return;
      }

      reject(error);
    });

    child.on("exit", (code, signal) => {
      if (signal) {
        reject(new Error(`${command} exited from signal ${signal}`));
        return;
      }

      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} exited with code ${code}`));
    });
  });
}

function localBinPath(command) {
  const suffix = process.platform === "win32" ? ".cmd" : "";
  return path.join(process.cwd(), "node_modules", ".bin", `${command}${suffix}`);
}

function prepareNativeBundle(platform) {
  const distDir = path.resolve(process.cwd(), "dist");

  if (!fs.existsSync(distDir)) {
    throw new Error("Expected Vite to create dist before preparing a native bundle.");
  }

  const outputDir = path.resolve(process.cwd(), ".p5kit", platform, "Web");
  fs.rmSync(outputDir, { recursive: true, force: true });
  copyDirectory(distDir, outputDir);

  const readmePath = path.resolve(process.cwd(), ".p5kit", platform, "README.md");
  fs.writeFileSync(
    readmePath,
    [
      `# p5kit ${platform} bundle`,
      "",
      "This directory contains the web assets produced by `p5kit build`.",
      "Embed the `Web` directory in the native shell and load `index.html` from it.",
      "",
    ].join("\n")
  );
}

function copyDirectory(source, destination) {
  fs.mkdirSync(destination, { recursive: true });

  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const sourcePath = path.join(source, entry.name);
    const destinationPath = path.join(destination, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(sourcePath, destinationPath);
      continue;
    }

    if (entry.isSymbolicLink()) {
      const link = fs.readlinkSync(sourcePath);
      fs.symlinkSync(link, destinationPath);
      continue;
    }

    fs.copyFileSync(sourcePath, destinationPath);
  }
}

function printHelp() {
  console.log(`p5kit ${PACKAGE_JSON.version}

Usage:
  p5kit dev [vite options]
  p5kit run [web|ios|android] [options]
  p5kit build [web|ios|android] [options]

Examples:
  p5kit dev --host 0.0.0.0
  p5kit build web
  p5kit build ios
`);
}

module.exports = {
  main,
};
