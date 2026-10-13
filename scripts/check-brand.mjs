import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFileSync(join(root, path), "utf8");
const json = (path) => JSON.parse(read(path));
const brand = json("brand.json");
const pkg = json("package.json");
const lock = json("package-lock.json");
const config = json("src-tauri/tauri.conf.json");
assert.equal(config.productName, brand.name);
assert.equal(config.app.windows[0].title, brand.name);
assert.equal(
  json("src-tauri/tauri.linux.conf.json").app.windows[0].title,
  brand.name,
);
assert.equal(
  json("src-tauri/tauri.windows.conf.json").app.windows[0].title,
  brand.name,
);
assert.equal(pkg.name, `${brand.slug}-desktop`);
assert.equal(lock.name, pkg.name);
assert.equal(lock.packages[""].name, pkg.name);
assert.equal(lock.version, pkg.version);
assert.equal(lock.packages[""].version, pkg.version);
assert.deepEqual(lock.packages[""].dependencies, pkg.dependencies);
assert.deepEqual(lock.packages[""].devDependencies, pkg.devDependencies);
assert.equal(config.version, pkg.version);
assert.match(
  read("src-tauri/Cargo.toml"),
  new RegExp(`name = "${brand.slug}"`),
);
assert.match(
  read("src-tauri/Cargo.toml"),
  new RegExp(`name = "${brand.slug}_lib"`),
);
assert.match(
  read("Cargo.lock"),
  new RegExp(
    `name = "${brand.slug}"\\nversion = "${pkg.version.replaceAll(".", "\\.")}"`,
  ),
);
assert.match(read("index.html"), new RegExp(`<title>${brand.name}</title>`));
assert.match(
  read("quick-composer.html"),
  new RegExp(`<title>${brand.name}</title>`),
);
assert.ok(!read("src-tauri/src/main.rs").includes("monocode_lib"));
assert.ok(read("index.html").includes(brand.icon));
assert.ok(read("public/avenrail.svg").includes(`<title>${brand.name}</title>`));

// Protect installed data and updater identity, not just the visible name.
assert.equal(config.identifier, "com.monocode.desktop");
assert.equal(config.identifier, brand.legacyBundleIdentifier);
const sessionStore = read("src-tauri/src/session_store.rs");
assert.ok(sessionStore.includes('const DATABASE_FILE: &str = "avenrail.db";'));
assert.ok(
  sessionStore.includes('const LEGACY_DATABASE_FILE: &str = "monocode.db";'),
);
assert.ok(read("index.html").includes("/legacy-storage.js"));
assert.ok(read("quick-composer.html").includes("/legacy-storage.js"));
assert.ok(
  read("src-tauri/src/macos.rs").includes(
    `<string>${config.identifier}</string>`,
  ),
);
assert.ok(
  !read("src-tauri/src/macos.rs").includes(
    'include_bytes!("../macos/Assets.car")',
  ),
);
assert.ok(!existsSync(join(root, "src-tauri/macos/Assets.car")));
assert.ok(!read("src-tauri/Info.plist").includes("CFBundleIconName"));
assert.ok(!config.bundle.resources?.["macos/Assets.car"]);
assert.ok(!read("src/app/App.tsx").includes("<UsageFooter"));
assert.ok(
  !read("src/features/sessions/ui/EmptySession.tsx").includes(
    "TerminalGridBackground",
  ),
);
assert.ok(
  read("src-tauri/Cargo.toml").includes(
    "https://github.com/ashish200729/Avenrail",
  ),
);
assert.ok(
  read(".github/ISSUE_TEMPLATE/config.yml").includes(
    "https://github.com/ashish200729/Avenrail/security/advisories/new",
  ),
);
for (const asset of config.bundle.icon)
  assert.ok(
    existsSync(join(root, "src-tauri", asset)),
    `Missing icon ${asset}`,
  );
for (const [file, size] of [
  ["32x32.png", 32],
  ["128x128.png", 128],
  ["128x128@2x.png", 256],
  ["icon.png", 512],
]) {
  const png = readFileSync(join(root, "src-tauri/icons", file));
  assert.equal(png.readUInt32BE(16), size, `${file} width`);
  assert.equal(png.readUInt32BE(20), size, `${file} height`);
}

function walk(dir) {
  return readdirSync(join(root, dir), { withFileTypes: true }).flatMap(
    (item) =>
      item.isDirectory()
        ? walk(`${dir}/${item.name}`)
        : [`${dir}/${item.name}`],
  );
}

// The old name may remain only where it is read for compatibility: the bundle
// identifier, the legacy database/branch/command/tag names, and upstream links.
const LEGACY_NAME = /mono ?code/i;
const ALLOWED = [
  /hardbeat920\/monocode/i,
  /EricRasputin\/monocode/,
  /com\.monocode\.desktop/,
  /monocode\.db/,
  /monocode\//,
  /["'` ]\/monocode\b/i,
  /monocode: true/,
  /legacy/i,
  /MonoCode quit/,
  /monocode\?: boolean/,
  /\.monocode\b/,
  /\(\?:[^)]*monocode/,
  /"monocode"/,
  /monocode_(assignment|proposal)/,
];
const scanned = [
  ...["src", "src-tauri/src", "host", "scripts", "public"].flatMap(walk),
  "index.html",
  "quick-composer.html",
  "package.json",
].filter(
  (file) =>
    /\.(tsx?|mjs|rs|py|sh|ps1|css|js|html|json|svg)$/.test(file) &&
    // These files exist to read or migrate the old name.
    ![
      "scripts/check-brand.mjs",
      "public/legacy-storage.js",
      "src/shared/lib/legacyStorage.test.ts",
    ].includes(file),
);
const leftovers = [];
for (const file of scanned) {
  read(file)
    .split("\n")
    .forEach((line, index) => {
      if (LEGACY_NAME.test(line) && !ALLOWED.some((rule) => rule.test(line)))
        leftovers.push(`${file}:${index + 1}: ${line.trim().slice(0, 100)}`);
    });
}
assert.deepEqual(
  leftovers,
  [],
  `Old product name in:\n${leftovers.join("\n")}`,
);
console.log(
  `${brand.name}: display identity, package versions, desktop icons, repository links, legacy data readers, and the absence of the old name verified.`,
);
