import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

export function inspectInstall(root) {
  const manifest = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  const { satisfies } = require("semver");
  const problems = [];
  for (const [name, expected] of Object.entries({
    ...manifest.dependencies,
    ...manifest.devDependencies,
  })) {
    let installed;
    try {
      installed = JSON.parse(
        readFileSync(join(root, "node_modules", name, "package.json"), "utf8"),
      ).version;
    } catch {
      problems.push({ name, expected, installed: null });
      continue;
    }
    if (!satisfies(installed, expected))
      problems.push({ name, expected, installed });
  }
  return problems;
}

export function checkInstall(root) {
  let problems;
  try {
    problems = inspectInstall(root);
  } catch (error) {
    console.error(`Cannot check Avenrail's installation: ${error.message}`);
    console.error("Run npm ci in this folder, then npm run tauri dev.");
    return false;
  }
  if (!problems.length) return true;
  console.error(
    "Avenrail needs missing or incompatible dependencies before starting.",
  );
  for (const { name, expected, installed } of problems.slice(0, 12)) {
    console.error(
      `  ${name}: ${installed ?? "missing"}; package.json requires ${expected}`,
    );
  }
  if (problems.length > 12)
    console.error(`  ...and ${problems.length - 12} more packages.`);
  console.error("\nRun npm ci in this folder, then npm run tauri dev.");
  return false;
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const root = join(dirname(fileURLToPath(import.meta.url)), "..");
  try {
    if (!checkInstall(root)) process.exitCode = 1;
  } catch (error) {
    console.error(`Cannot check Avenrail's installation: ${error.message}`);
    process.exitCode = 1;
  }
}
