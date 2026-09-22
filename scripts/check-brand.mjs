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
assert.equal(pkg.name, `${brand.slug}-desktop`);
assert.equal(lock.name, pkg.name);
assert.equal(lock.packages[""].name, pkg.name);
assert.equal(lock.version, pkg.version);
assert.equal(lock.packages[""].version, pkg.version);
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
assert.ok(read("index.html").includes(brand.icon));
assert.ok(read("public/avenrail.svg").includes(`<title>${brand.name}</title>`));

// Protect installed data and updater identity, not just the visible name.
assert.equal(config.identifier, "com.monocode.desktop");
assert.equal(config.identifier, brand.legacyBundleIdentifier);
assert.ok(
  read("src-tauri/src/session_store.rs").includes(
    'data_dir.join("monocode.db")',
  ),
);
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
assert.ok(
  read(".github/workflows/release.yml").includes(`${brand.name}.app.tar.gz`),
);
assert.ok(read(".github/workflows/release.yml").includes(`${brand.name}.dmg`));
assert.ok(read(".github/workflows/release.yml").includes("/MonoCode.dmg"));
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
for (const file of [...walk("src"), ...walk("src-tauri/src")].filter(
  (file) => /\.(tsx?|rs)$/.test(file) && !file.endsWith(".test.ts"),
)) {
  const source = read(file).replace(
    '"Turn interrupted when MonoCode quit."',
    '"legacy recovery marker"',
  );
  assert.ok(!source.includes("MonoCode"), `Old display name in ${file}`);
}
console.log(
  `${brand.name}: display identity, package versions, desktop icons, release names, and legacy data identifiers verified.`,
);
