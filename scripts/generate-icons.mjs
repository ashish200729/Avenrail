import { cpSync, mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const output = mkdtempSync(join(tmpdir(), "avenrail-icons-"));
try {
  execFileSync(
    process.execPath,
    [
      join(root, "node_modules/@tauri-apps/cli/tauri.js"),
      "icon",
      join(root, "public/avenrail.svg"),
      "--output",
      output,
    ],
    { cwd: root, stdio: "inherit" },
  );
  // Only desktop icons are shipped; no unused mobile asset trees.
  for (const entry of readdirSync(output, { withFileTypes: true })) {
    if (entry.isFile())
      cpSync(
        join(output, entry.name),
        join(root, "src-tauri/icons", entry.name),
      );
  }
} finally {
  rmSync(output, { recursive: true, force: true });
}
