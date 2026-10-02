import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { inspectInstall } from "./check-install.mjs";

test("accepts declared-compatible versions and detects missing or incompatible packages without rewriting files", () => {
  const root = mkdtempSync(join(tmpdir(), "avenrail-install-"));
  try {
    const manifest = JSON.stringify({
      dependencies: { "@example/editor": "^2", sound: "^1" },
      devDependencies: { compiler: "^3" },
    });
    writeFileSync(join(root, "package.json"), manifest);
    writeFileSync(
      join(root, "package-lock.json"),
      JSON.stringify({
        packages: {
          "node_modules/@example/editor": { version: "2.1.0" },
          "node_modules/sound": { version: "1.2.0" },
          "node_modules/compiler": { version: "3.1.0" },
        },
      }),
    );
    mkdirSync(join(root, "node_modules/@example/editor"), { recursive: true });
    mkdirSync(join(root, "node_modules/compiler"), { recursive: true });
    writeFileSync(
      join(root, "node_modules/@example/editor/package.json"),
      JSON.stringify({ version: "2.0.0" }),
    );
    writeFileSync(
      join(root, "node_modules/compiler/package.json"),
      JSON.stringify({ version: "3.1.0" }),
    );
    assert.deepEqual(inspectInstall(root), [
      { name: "sound", expected: "^1", installed: null },
    ]);
    assert.equal(readFileSync(join(root, "package.json"), "utf8"), manifest);
    mkdirSync(join(root, "node_modules/sound"), { recursive: true });
    writeFileSync(
      join(root, "node_modules/sound/package.json"),
      JSON.stringify({ version: "1.2.0" }),
    );
    writeFileSync(
      join(root, "node_modules/@example/editor/package.json"),
      JSON.stringify({ version: "3.0.0" }),
    );
    assert.deepEqual(inspectInstall(root), [
      { name: "@example/editor", expected: "^2", installed: "3.0.0" },
    ]);
    writeFileSync(
      join(root, "node_modules/@example/editor/package.json"),
      JSON.stringify({ version: "2.2.0" }),
    );
    assert.deepEqual(inspectInstall(root), []);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
