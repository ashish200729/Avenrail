# Avenrail rebrand and compatibility

Avenrail replaces the MonoCode display identity. App titles, native menus, dialogs, provider client names, package and executable names, desktop icons, and new release artifacts use Avenrail. The workspace behavior and provider integrations are retained.

## One identifier that stays, and what is migrated

Avenrail is the name everywhere in the product, the code, the data files and the tooling. The single exception is the Tauri bundle identifier.

- **`com.monocode.desktop` remains the bundle identifier.** Changing it moves the application-data directory, the webview's storage, desktop permissions, notification settings, and the updater identity. It is an installation identifier, not displayed anywhere. Moving it later needs a data migration of its own.

Everything else was renamed, with these migrations and readers so existing data keeps working:

- **Preferences (`monocode.*` / `monocode:*` → `avenrail.*` / `avenrail:*`).** `public/legacy-storage.js` runs from `<head>` in both windows before any code reads storage. It copies each legacy key to its new name (never overwriting a value that already exists) and removes the old key.
- **Database (`monocode.db` → `avenrail.db`).** On startup, if `avenrail.db` is absent and `monocode.db` exists, the file and its SQLite sidecars (`-wal`, `-shm`, `-journal`) are renamed in the same directory, sidecars first. A failed move stops startup with an error instead of opening an empty database.
- **Saved turns.** The "Operator command used" marker is stored as `avenrail`; turns saved as `monocode` are still read and are rewritten under the new name. Prompt envelopes tagged `<monocode_assignment>` and `<monocode_proposal>` are still recognized, as are `/mono` and `/monocode` as legacy Operator commands and `Turn interrupted when MonoCode quit.` recovery markers.
- **Worktree branches.** New worktree branches use `av/…` (`av/orch-…` for orchestration). Existing `mc/…` and `monocode/…` branches stay managed: they can be renamed and orchestration branches cleaned up exactly as before.
- **App CLI.** The executable is `avenrail`; transcripts recognize app commands run through it and through the earlier `monocode` name. Agent processes receive `AVENRAIL_APP_*` and `AVENRAIL_CONTROL_*`.
- **Remote host.** The host tooling is `avenrail-host`, installed under `~/.avenrail-host` (`%USERPROFILE%\.avenrail-host` on Windows), configured with `AVENRAIL_HOST_*`, and downloaded as `avenrail-host-<target>` archives from Avenrail's own release repository. Those artifacts must be published before automatic remote setup can succeed. A host installed earlier under the old name is not adopted; install it again.
- **GitHub.** The primary Git origin, repository links, star prompt, and security-report destination are `ashish200729/Avenrail`. The original `hardbeat920/monocode` remains configured locally as `upstream` and in historical changelog links so old tags and releases resolve. GitHub CLI calls for a project are pinned to its own repository (`origin` when it is on GitHub, otherwise the only remote), because `gh` itself ranks an `upstream` remote first. An explicit `gh repo set-default` takes precedence.
- **Unchanged on purpose.** Actual project directory names and saved paths (a folder named `monocode` still appears under its real name), historical transcript content and changelog entries, the configured updater feed and signing credentials.

## Upstream integration

The frontend now follows upstream's `src/app`, `src/features`, `src/integrations`, `src/platform`, and `src/shared` structure. Avenrail's separate workspace panel lives in `src/features/workspace/ui/WorkspacePanel.tsx`; it uses the current upstream editors, Git review panels, file tree, and terminal lifecycle. The old `src/App.tsx`, `src/chrome`, and `src/lib` application copies are removed as part of this migration. Transcript layout remains configurable, with Avenrail's full-width default. The composer keeps its controls below the message field and the checkout/branch selectors beside Send.

The left navigation now uses a single project rail with conversations nested under expandable project headings. The separate Workspace column and its Sessions/Explorer/Changes selectors are removed from the application layout; file and Git tools remain in the right workspace panel. Project collapse preferences use the legacy `monocode.*` namespace. Existing session folders, history, reminders, and session actions retain their storage and backend contracts. The former session-sidebar shortcut toggles the unified left sidebar, and its old visibility preference is no longer used to create an extra column.

## Assets and packaging

`public/avenrail.svg` is the editable source of the app icon. Run `npm run icons` to regenerate PNG, ICO, and ICNS desktop assets with the installed Tauri CLI. The old compiled Apple asset catalog is removed so it cannot override the new icon. Both development and production bundles use the standard ICNS icon path. The development bundle version now comes from Cargo rather than a hard-coded version.

## Release checks

Run `npm run check:brand`, `npm run check:web`, and `npm run check:rust`, followed by the desktop packaging checks appropriate to the release platform. Verify a copy of an existing installation's data before distributing an update. Do not run old and new builds concurrently against the same data directory.

The rebrand does not publish a release, register a domain, or establish trademark clearance. Signing/notarization and publishing use the existing release workflow and its configured secrets. Historical changelog entries retain the name used at the time.
