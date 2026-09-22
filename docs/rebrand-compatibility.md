# Avenrail rebrand and compatibility

Avenrail replaces the MonoCode display identity. App titles, native menus, dialogs, provider client names, package and executable names, desktop icons, and new release artifacts use Avenrail. The workspace behavior and provider integrations are retained.

## Deliberately stable identifiers

- **`com.monocode.desktop`** remains the Tauri bundle identifier. Changing it would change application-data paths, desktop permissions, and update identity. It is an installation identifier, not the displayed brand.
- **`monocode.db`** remains the database filename in that app-data directory. Existing conversations, notes, and related records open in place. Credential and project-logo storage paths do not move.
- **`monocode.*` / `monocode:*` preference and local-event namespaces** stay stable. Existing themes, provider defaults, transcript layout, project ordering, collapsed groups, filters, and other preferences remain intact. Workspace layout is now fixed to Deck: old `monocode.sidebarLayout` values are normalized to `deck`, including former Classic selections.
- Existing saved transcripts with `Turn interrupted when MonoCode quit.` remain resumable; newly written interruption messages use Avenrail. Historical user content is never rewritten.
- Actual project directory names and saved project paths are not renamed; a project folder named `monocode` still appears under its real name.
- The primary Git origin, current repository links, security-report destination, and unreleased changelog comparison point to `ashish200729/Avenrail`. The original `hardbeat920/monocode` repository remains configured locally as `upstream`; historical changelog links continue to point there so old tags and releases remain resolvable.
- Release automation uploads the new Avenrail-named artifacts and retains the previous `MonoCode.dmg` download alias. The configured updater feed and signing credentials are unchanged. The default development updater configuration remains unconfigured.

## Assets and packaging

`public/avenrail.svg` is the editable source of the app icon. Run `npm run icons` to regenerate PNG, ICO, and ICNS desktop assets with the installed Tauri CLI. The old compiled Apple asset catalog is removed so it cannot override the new icon. Both development and production bundles use the standard ICNS icon path. The development bundle version now comes from Cargo rather than a hard-coded version.

## Release checks

Run `npm run check:brand`, `npm run check:web`, and `npm run check:rust`, followed by the desktop packaging checks appropriate to the release platform. Verify a copy of an existing installation's data before distributing an update. Do not run old and new builds concurrently against the same data directory.

The local rebrand does not publish a release, register a domain, or establish trademark clearance. Signing/notarization and publishing use the existing release workflow and its configured secrets. Historical changelog entries retain the name used at the time.
