# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

React and TypeScript interface in a Tauri desktop shell. The repository supports macOS and Linux; signed release automation currently targets macOS Apple Silicon.

## Users and purpose

A desktop workspace for developers using installed coding-agent CLIs. Projects contain sessions; the conversation, file editor, review tools, and terminal share one workspace. It uses existing provider installations and authentication rather than selling model tokens.

## Capabilities and constraints

Supports Claude Code, Codex, Cursor, OpenCode, Pi, omp, and fx. The codebase includes saved sessions, project navigation, file editing, Git review, terminals, notes, and updates. Keep those behaviors intact during the rebrand. Preserve existing saved sessions, settings, credentials, and desktop application identity.

The user removed the bottom usage/status bar to give the workspace more room. Do not reserve a footer row or run its usage polling. Provider APIs and usage parsing remain available independently of that removed UI.

File explorer actions share the Files header: New contains file/folder creation, and the options menu contains Search file contents and Collapse folders. Keep name filtering distinct from content search. Preserve context-menu operations, keyboard shortcuts, and the tree state while filtering; clear the filter when creating or collapsing so the result is visible.

Terminals use compact shell tabs and a slim scrollbar, without another permanent header or status bar. Show the scrollbar only when the normal terminal buffer has scrollback; fresh terminals and full-screen apps must not show an unnecessary indicator. Do not add a three-dot actions button or custom terminal context menu. Working-directory metadata must never restart a live shell, and failed launches must not retry on every render. Preserve shell input, keyboard copy/paste, tab reordering, and running-process close confirmations.

The left sidebar starts with New session and a compact Search button in one row, followed by Notes and Inbox side by side. If Notes is disabled, Inbox spans that row. Preserve global shortcuts, active states, and the Inbox unread indicator; do not add section dividers or change project/session navigation.

## Brand commitments

The user delegated the replacement name and rebranding decisions. The chosen name is Avenrail. Deck is the only supported workspace layout; do not expose a workspace-layout selector. Preserve transcript layout choices and the recently approved Codex-inspired workspace arrangement, detailed session cards, collapsible projects, and single sidebar options menu. No animated game background. The new-session screen shows only the project question and composer, without an app logo, name, or tagline. In project grouping mode, clicking the full project heading toggles the group without changing the active conversation. Keep every composer control below the message field, with no internal divider or added decoration. Show a compact project/context row only when it has content. In the bottom action row, keep Attach, Model, and settings on the left, with the compact branch selector beside Send/Stop on the right. Use paperclip, settings, git-fork, and shield-based access icons without changing their actions. Keep secondary controls quiet and distinguish the model and primary action. Combine multiple model settings into one compact dropdown that displays their current values; keep a single setting directly accessible. Keep Access separate when space permits, and group all secondary controls into the existing options menu only when needed for narrow panes. Preserve model, attachment, and send/stop access. Use compact styled choice menus for both inline and grouped controls. No redundant hide button in the terminal tab strip. No new provider capabilities, commercial claims, or unverified download endpoints.

## Evidence and open decisions

Reply footers place the local timestamp and elapsed duration on the left, with Copy, Second opinion, and Save to Notes grouped on the right. Use clipboard, conversation, and notebook icons, retain copied/saved feedback and action availability, and allow wrapping without adding dividers.

Product behavior is grounded in README.md, package.json, the Tauri manifests, and src/. Existing repository and release infrastructure remain in place. New release publication, domain registration, and formal trademark clearance are outside the local implementation and have not been performed.
