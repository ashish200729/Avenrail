# Monocode upstream integration: 2026-10-02

Status: source integration prepared on `sync/monocode-2026-10-02`; validation and Git finalization remain incomplete. Do not treat this branch as a release-qualified build.

## Compared revisions

- Avenrail starting revision: `f70f2152107b70728adf309fb817ea552570169a`.
- Common ancestor: `f17db972f4cdde9f2da5cbac89974d8853b4e0e9`.
- Fetched Monocode revision: [`d7d7d9157f6fbc3a8decc6b1b5ed16e31c180f43`](https://github.com/hardbeat920/monocode/commit/d7d7d9157f6fbc3a8decc6b1b5ed16e31c180f43), “Cap the inbox media cache by size (#638)”.
- Divergence before integration: 3 Avenrail commits and 578 upstream commits.
- Upstream's source version is `0.6.0`; package, lockfile, Cargo, and Tauri versions now agree on that version. This does not publish an Avenrail release.

The initial working tree was clean. `main` remains at its starting revision. Upstream was fetched without tags. `origin` remains Avenrail, and `upstream` points to Monocode with its push URL set to `DISABLED`.

## Review and integration

The upstream comparison covers a substantial application migration: 1,171 changed paths from the common ancestor, including a frontend restructure and a new headless host. The sync uses the current upstream structure instead of retaining duplicate old `src/App.tsx`, `src/chrome`, and `src/lib` application trees.

The imported code includes the new providers; remote-host and SSH workflows; Windows support and expanded Linux/macOS packaging; orchestration, automations, reminders, MCP and provider-account settings; additional inbox integrations; expanded worktree, Git review, editor, and transcript behavior; and recent process teardown, stream ownership, and bounded-cache fixes.

Avenrail-specific integration work includes:

- Display names, package and executable names, native menus, repository links, release artifacts, and icons retain Avenrail. Both HTML entry points are branded. The new Windows configuration uses Avenrail and does not load the upstream installer artwork.
- `com.monocode.desktop`, `monocode.db`, preference/event namespaces, and the old interrupted-turn recovery marker remain compatible. No existing application database was opened or migrated during this work.
- The separate workspace panel is ported onto the current file editor, Git review, file tree, terminal, and workspace models. It retains its saved width/open state, name filtering, file actions, tool tabs, responsive overlay, and accessible resizing. New upstream surfaces use the current tab-presentation helpers.
- The composer retains controls below its message field, a paperclip attachment trigger, and checkout/branch controls beside Send. The removed usage footer and empty-session arcade remain disabled. The default transcript layout remains full width, and explicit saved layout choices remain available.
- The terminal bridge waits for listeners before spawning, cleans up failed listener installation, and supports cancellation during setup. The current upstream terminal lifecycle retains the stable process identity and teardown-before-respawn behavior. Embedded terminals retain compact tabs and a scrollbar only when normal-buffer scrollback exists.
- NVM fallback resolution, the sibling Node runtime search path, stale-process exit protection, Codex startup deadlines/stderr reporting, and JSON-RPC exit diagnostics are retained or adapted. The current upstream session write queue and deletion guards supersede the earlier fork's persistence implementation.
- Upstream release workflows are retained with Avenrail artifact names and the legacy macOS download aliases. SSH host downloads point at Avenrail's release repository; host protocol/archive/service identifiers remain compatible. Publication is still required before automatic host installation can work.
- The brand check now covers Windows, both HTML entry points, lockfile dependencies, Rust crate references, the old icon catalog, aliases, and the intentionally disabled footer/arcade. The upstream sync procedure is documented in `CONTRIBUTING.md`.

The latest sidebar and provider controls follow the upstream implementation. This is an adaptation of Avenrail's workspace behavior, not a claim of pixel-identical preservation of the old UI. The committed workspace screenshot predates this sync. Live visual verification remains pending.

## Validation evidence

Local checks used a provisional dependency tree assembled from the existing npm cache and the installed Lori dependency tree. The committed dependency versions were not downgraded or changed to accommodate the sandbox. These results do not substitute for a clean `npm ci` from the merged lockfile.

| Check | Result |
| --- | --- |
| `node scripts/check-brand.mjs` | Passed. |
| `cargo fmt --check` | Passed. |
| `git diff --check` | Passed; source conflict markers are absent. |
| Focused integration tests | 73 passed across 9 files: workspace projection/tool tabs, recovery compatibility, transcript preferences, link parsing, empty session, JSON-RPC diagnostics, PTY bridge setup/recovery/cancellation. |
| Host TypeScript check and `node host/build.mjs` | Passed with the provisional dependency tree. |
| Full frontend suite | Did not pass: the exploratory run had 260 passing files, 123 failing files, and 2 skipped files; 3,072 tests passed, 26 failed, and 13 were skipped. Most suite-load failures came from unavailable `cuelume`, CodeMirror merge/legacy modes, or newer Hugeicons exports. The cached Happy DOM version also lacks the animation API expected by the new tests. The two integration expectation failures found in that run were corrected and their focused tests pass. |
| Full frontend TypeScript check/build | Blocked by missing packages and the cached Hugeicons version. After correcting integration diagnostics, the remaining errors originate from those dependencies and their missing types. A full successful check is still required. |
| Host network suite | Did not pass: 14 files passed, 5 failed, and 1 was skipped; 73 tests passed, 20 failed, and 5 were skipped. Loopback server tests fail with `listen EPERM` under the current sandbox. |
| Clean `npm ci` | Blocked: registry DNS/network access is unavailable; the offline cache does not contain all merged lockfile packages. |
| Rust check/clippy/tests | Blocked: the crates cache lacks `tauri-plugin-global-shortcut`; network access is unavailable. |
| Host runtime packaging, desktop packaging, existing-data migration, live providers, UI, hosted CI | Not qualified in this session. |

No GitHub push, tag, release, or deployment was performed. Existing upstream typography, semantic colors, and motion were retained; narrow file/value design-detector exceptions record those intentional upstream choices in `.impeccable/config.json`.

## Remaining work before merging into main

The environment changed to a managed sandbox after the merge began. Git metadata is currently read-only, registry network access is restricted, and loopback listeners are denied. The source conflicts have been resolved, but the Git index still lists `src-tauri/src/checkpoint.rs`, `src-tauri/src/harness.rs`, and `src-tauri/src/pty.rs` as unmerged until they can be staged. The merge commit has not been created.

In a workspace permitting Git writes, dependency downloads, and local listeners:

1. Recheck the branch and working tree; preserve any subsequent user edits.
2. Run a clean `npm ci`, `npm run check`, `npm run build`, and `npm run host:package`; resolve any failures against the exact dependency versions.
3. Verify the desktop in both themes and narrow panes, provider startup/turns, terminal input/scrollback/teardown, session persistence, and a copy of an existing installation's data.
4. Review the final diff against both parents and stage the intended source/docs/assets, including the new workspace components/tests and design-detector configuration. Do not stage generated dependency/build trees.
5. Create the merge commit, then fast-forward local `main` to the sync branch after validation. Publishing and release qualification remain separate actions.

The base branch has been preserved so this incomplete integration cannot silently replace the current Avenrail build.

## Startup repair follow-up

The user's startup command is `npm run tauri dev`. The source fixes now retain that command and add `npm run dev:desktop` as a stable launch option.

- Replaced untyped Hugeicons deep imports with the library's documented typed static exports. Five unavailable glyphs use local SVG strokes, preserving the actions they represent. The production bundler can tree-shake the static catalog imports.
- Added an installation check before both Vite launch modes. It reports missing or incompatible direct dependencies against the version ranges in `package.json`. Compatible installed versions are accepted even when they differ from the lockfile. `npm ci` remains the reproducible installation path, and `npm run check:install` exposes the launch check independently.
- Added a recovery screen for rejected boot promises and React render errors, with Reload and Copy error actions. An unsuccessful boot no longer leaves the splash covering the error.
- Cleaned only this workspace's generated Rust target after a build exhausted disk space. Development/test profiles now omit debug information and incremental artifacts by default. Cargo profile environment variables remain available for native debugging.
- Updated the command-palette and checkout-trigger regression expectations to match Avenrail's rebrand and retained git-fork icon.

Current evidence: `cargo check --locked --offline`, Clippy across all targets with warnings denied, Rust formatting, branding, and diff checks pass. The focused startup/navigation/icon run passes 50 tests, and the installation-check test passes. The full Rust library run passes 529 tests, fails 8 tests that require denied local sockets or native pasteboard access, and ignores 1 test.

The exploratory frontend run now loads 334 passing files; it still cannot pass with the incomplete dependency tree. Missing CodeMirror merge/legacy modes and `cuelume`, plus the cached Happy DOM animation API, account for the unresolved environment failures. The command-palette and checkout expectations discovered in that run were corrected and their focused tests pass.

The app is **not running or launch-qualified in this session**. Npm registry access still fails with `ENOTFOUND`, and a Vite listener at `127.0.0.1:1420` fails with `EPERM`. The original installation check reported 22 exact-version mismatches; it was corrected to check declared compatibility rather than exact lockfile equality. The current installation still has 11 missing/incompatible direct packages, including the missing CodeMirror merge/legacy modes and `cuelume`. A complete dependency installation is still required; no placeholders or feature removal were used to hide missing packages.

To test from an unrestricted terminal in this checkout:

```bash
npm ci
npm run tauri dev
```

Alternatively, use `npm run dev:desktop` after installation. A clean frontend build, actual desktop launch, visual verification, and Git merge finalization remain pending.

## Port collision and standalone preview

After the clean dependency install completed, `npm run build` and the installation/brand checks passed. Port 1420 was occupied by Lori's Vite process, confirmed by its working directory `/Users/ashish/code/lori/lori`. Avenrail now uses port 1430; its Tauri development URL, development CSP, and optional HMR port 1431 agree. Lori's process was preserved.

The automation sandbox still denies starting Avenrail's development listener (`listen EPERM ::1:1430`). A separate `build:preview:macos` command and `tauri.preview.conf.json` were added for a standalone debug app with updater artifacts disabled. The preview build passed and produced `target/debug/bundle/macos/Avenrail.app`; the default release updater settings were not changed.

A further macOS packaging bug was fixed: the development wrapper helper used to rewrite the plist/icons of an already packaged, signed debug app. That invalidated the bundle's resource seal. The helper now prepares a wrapper only for a raw development executable and leaves an existing app bundle intact. The rebuilt preview passed strict/deep code-signature verification, and its plist hash and signature remained valid after the attempted launch.

The preview is not running in this session. Computer Use rejected Avenrail app access as unapproved, and direct execution in the restricted runner aborted in macOS application registration before a window could be verified. App-access approval or opening the standalone preview from the user's desktop remains required for live UI verification. The build itself is complete and needs no localhost server.

## Unified project/session sidebar

Following the user's screenshot review, the duplicate middle Workspace column has been removed from the application layout. A single left project rail now contains expandable project sections and their conversations. The left-side Sessions/Explorer/Changes tab strip is absent in both expanded and compact modes. Files, Review, Terminal, and file-content search remain in the right workspace panel.

The existing session-list implementation is reused inside project sections so folders, filters, reminders, status indicators, multi-selection, rename/pin/archive/delete, linked work items, and drag placement retain their contracts. Project headers toggle expansion without replacing the current conversation, and each project's New session action explicitly targets that project. Open unsaved sessions are shown under their owning project. Navigating to an active session expands its project. The optional compact/hidden rail setting and one sidebar resize control remain available.

Project histories are loaded on expansion, cached independently of the focused project, and keyed with canonical comparison paths. Initial duplicate reads are coalesced; mutation-triggered refreshes wait for in-flight reads and then revalidate. Error/pending states stay scoped to the project. Session pagination and menu dismissal use the shared rail's actual scroll container, and multi-selection is cleared when interacting with a different project's list. Existing session-sidebar shortcuts now toggle the unified sidebar.

Validation: 120 focused navigation/history/appearance tests passed. The full frontend suite passed with 4,112 tests and 13 provider-dependent skips; TypeScript, the web build, brand/installation checks, and `git diff --check` passed. The settings search index was corrected to exclude the intentionally disabled arcade, and transcript bubble tests explicitly select chat layout while preserving Avenrail's configurable/full-width default.

No `.app` was built for this change. Live development verification remains pending because starting Vite at `127.0.0.1:1430` returns `EPERM`; browser-control inventory is empty, and the isolated-fixture browser daemon could not start in this environment. The user can test the current source with `npm run tauri dev` from an unrestricted terminal. These automated results do not claim live provider, native, cross-platform, or release qualification.
