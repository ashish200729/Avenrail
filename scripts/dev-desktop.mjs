import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { checkInstall } from "./check-install.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
if (!checkInstall(root)) process.exit(1);
if (!process.env.npm_execpath) {
  console.error("Start the desktop with npm run dev:desktop.");
  process.exit(1);
}

const child = spawn(
  process.execPath,
  [process.env.npm_execpath, "run", "tauri:stable"],
  {
    cwd: root,
    stdio: "inherit",
    env: {
      ...process.env,
      // Avoid multi-gigabyte debug/incremental artifacts during local testing.
      CARGO_PROFILE_DEV_DEBUG: process.env.CARGO_PROFILE_DEV_DEBUG ?? "0",
      CARGO_INCREMENTAL: process.env.CARGO_INCREMENTAL ?? "0",
    },
  },
);
child.on("error", (error) => {
  console.error(`Could not start Avenrail: ${error.message}`);
  process.exitCode = 1;
});
child.on("exit", (code, signal) => {
  process.exitCode = code ?? (signal ? 1 : 0);
});
