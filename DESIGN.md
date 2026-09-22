---
name: Avenrail
description: "Your agents. One workspace."
colors:
  background-base: "hsl(var(--theme-hue) var(--theme-saturation) var(--background-lightness))"
  content: "hsl(var(--theme-hue) var(--theme-saturation) var(--content-lightness))"
  accent: "hsl(211 92% 62%)"
  link: "#7dd3fc"
  content-faint: "color-mix(in srgb, var(--color-content) 35%, transparent)"
  content-muted: "color-mix(in srgb, var(--color-content) 45%, transparent)"
  content-soft: "color-mix(in srgb, var(--color-content) 65%, transparent)"
  content-strong-muted: "color-mix(in srgb, var(--color-content) 78%, transparent)"
  surface-subtle: "color-mix(in srgb, var(--color-content) 3%, transparent)"
  surface-hover: "color-mix(in srgb, var(--color-content) 4%, transparent)"
  surface-control: "color-mix(in srgb, var(--color-content) 5%, transparent)"
  surface-active: "color-mix(in srgb, var(--color-content) 9%, transparent)"
  surface-menu: "color-mix(in srgb, var(--color-content) 10%, transparent)"
  border-subtle: "color-mix(in srgb, var(--color-content) 10%, transparent)"
  skill: "#e8c547"
  mention: "#38bdf8"
  status-add: "#34d399"
  status-delete: "#f87171"
  status-approval: "#fbbf24"
  identity-plate: "#D9EDE5"
  identity-ink: "#183E36"
  identity-spark: "#527E70"
  inverse-surface: "#ffffff"
  inverse-content: "#000000"
typography:
  headline:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Oxygen, Ubuntu, Cantarell, \"Fira Sans\", \"Droid Sans\", \"Helvetica Neue\", sans-serif"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: 1.375
  title:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Oxygen, Ubuntu, Cantarell, \"Fira Sans\", \"Droid Sans\", \"Helvetica Neue\", sans-serif"
    fontSize: "20px"
    fontWeight: 600
    lineHeight: 1.25
  body:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Oxygen, Ubuntu, Cantarell, \"Fira Sans\", \"Droid Sans\", \"Helvetica Neue\", sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.625
  label:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Oxygen, Ubuntu, Cantarell, \"Fira Sans\", \"Droid Sans\", \"Helvetica Neue\", sans-serif"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: 1.5
  mono:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: 1.5
  identity-full:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Oxygen, Ubuntu, Cantarell, \"Fira Sans\", \"Droid Sans\", \"Helvetica Neue\", sans-serif"
    fontSize: "20px"
    fontWeight: 500
    lineHeight: 1.25
    letterSpacing: "-0.025em"
rounded:
  option: "5px"
  control: "6px"
  card: "8px"
  code: "10px"
  composer: "12px"
  pill: "9999px"
spacing:
  hairline: "2px"
  xs: "4px"
  sm: "6px"
  md: "8px"
  lg: "10px"
  xl: "12px"
  2xl: "16px"
  3xl: "24px"
  4xl: "32px"
  5xl: "48px"
components:
  identity-full:
    textColor: "{colors.content}"
    typography: "{typography.identity-full}"
    size: "64px"
    width: "64px"
    height: "64px"
  composer:
    backgroundColor: "{colors.surface-subtle}"
    textColor: "{colors.content}"
    rounded: "{rounded.composer}"
    padding: "10px 12px 8px"
  button-send:
    backgroundColor: "{colors.inverse-surface}"
    textColor: "{colors.inverse-content}"
    rounded: "{rounded.control}"
    size: "26px"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.content-soft}"
    rounded: "{rounded.control}"
    padding: "4px 10px"
  icon-button:
    backgroundColor: "transparent"
    textColor: "{colors.content-soft}"
    rounded: "{rounded.card}"
    size: "28px"
  segmented-selected:
    backgroundColor: "{colors.surface-active}"
    textColor: "{colors.content}"
    rounded: "{rounded.option}"
    padding: "4px 12px"
  toggle-on:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.inverse-surface}"
    rounded: "{rounded.pill}"
    size: "36px"
  input-field:
    backgroundColor: "transparent"
    textColor: "{colors.content}"
    rounded: "{rounded.control}"
    height: "28px"
  session-row-active:
    backgroundColor: "{colors.surface-active}"
    textColor: "{colors.content}"
    rounded: "{rounded.card}"
    padding: "8px 10px"
  options-menu:
    backgroundColor: "{colors.surface-menu}"
    textColor: "{colors.content}"
    rounded: "{rounded.card}"
    padding: "4px"
---

# Design System: Avenrail

## Overview

**Creative North Star: "The Maker's Stamp"**

Avenrail's built identity is a small, legible maker's mark: a forest-ink A on a pale-jade plate with a restrained jade spark. The mark appears at launch and About, while the working surfaces stay in the existing neutral dark/light chrome. System typography keeps the interface quiet, compact, and platform-aware.

Deck is the fixed workspace layout. Do not offer Classic or a workspace-layout choice in Settings; transcript layout remains configurable.

The workspace remains the organizing principle: a left project rail holds sessions grouped by project, detailed session rows carry provider, status, and diff signals, and the right workspace keeps the composer, transcript, files, review, and terminal surfaces bounded. Rebranding changes the name and identity placement without changing navigation or task behavior. There is no animated game background.

**Key Characteristics:**

- Neutral grayscale chrome with theme-driven dark/light lightness and a functional blue accent.
- Forest/jade identity colors reserved for the Avenrail mark.
- System UI type for interface text; ui-monospace for code paths and key values.
- Compact, bounded desktop geometry with a responsive overlay workspace at narrower widths.

## Colors

The palette is neutral first. Background and content lightness are theme variables, while blue carries interaction and focus and the jade/forest colors identify Avenrail.

### Primary

- **Signal Blue** (`colors.accent`): action, focus, and working-state emphasis.
- **Link Blue** (`colors.link`): links and inline path affordances.

### Tertiary

- **Pale Jade Plate** (`colors.identity-plate`): the rounded plate in the Avenrail mark.
- **Forest Ink** (`colors.identity-ink`): the A mark and primary identity stroke.
- **Jade Spark** (`colors.identity-spark`): the small secondary mark stroke.

### Neutral

- **Theme Background** (`colors.background-base`): the full-window surface; dark defaults to 9% lightness and light defaults to 97%.
- **Theme Content** (`colors.content`): primary interface text; dark defaults to 92% lightness and light defaults to 18%.
- **Tonal Surfaces** (`colors.surface-subtle`, `colors.surface-hover`, `colors.surface-active`, `colors.surface-menu`): translucent content mixes for composer, hover, active, and floating-menu states.
- **Quiet Borders** (`colors.border-subtle`): one-pixel separators and control strokes.
- **Semantic Signals** (`colors.skill`, `colors.mention`, `colors.status-add`, `colors.status-delete`, `colors.status-approval`): skill, mention, diff, and approval states.

### Named Rules

**The Functional Accent Rule.** Keep blue for interaction and state. Keep the jade/forest palette on the Avenrail identity asset instead of recoloring ordinary controls.

## Typography

**Display Font:** No separate display face; the interface uses the system UI stack.
**Body Font:** `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif`
**Label/Mono Font:** `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace` for code paths and key values.

**Character:** System UI keeps navigation and settings readable at compact sizes. The monospace stack is reserved for code paths, keybindings, and other technical values.

### Hierarchy

- **Headline** (400, 18px, 1.375): the empty-session welcome question.
- **Title** (600, 20px, 1.25): settings and About headings.
- **Body** (400, 13px, 1.625): settings descriptions and supporting copy.
- **Label** (500, 12px, 1.5): control labels, metadata, and compact actions.
- **Mono** (500, 12px, 1.5): code paths and keybinding values.
- **Identity** (500, 20px, tight tracking): Avenrail name beside the mark in About.

### Named Rules

**The System Type Rule.** Keep the system and monospace stacks already defined in `src/index.css`; do not add a display font for the rebrand.

## Layout

The app is a fixed full-window workspace with overflow contained inside its rails and surfaces. The project sidebar is bounded at `35vw`; the workspace panel leaves room for the rail with a maximum width of `calc(100% - 360px)`. The file rail uses `clamp(220px, 31cqw, 300px)` with a `45%` maximum, then contracts to `190px` with a `44%` maximum in a workspace container below `580px`.

At widths of `1100px` or less, the workspace panel becomes an absolute, full-width surface with a left ambient shadow so the composer remains usable. The empty-session content centers at `max-w-3xl`, with fluid `clamp(12px, 4%, 24px)` horizontal and `48px` vertical padding; the welcome question sits directly above the composer, with no logo, app name, or tagline. Settings uses a centered `max-w-5xl` content column with `32px` page padding and a `40px` breadcrumb bar.

Keep the approved organization visible: a project rail with collapsible projects, detailed session cards, and a single sidebar options menu, alongside the tabbed workspace for files, review, and terminal tools.

## Elevation & Depth

Regular chrome is flat and uses tonal layering plus one-pixel borders. The sidebar uses a darker translucent mix in dark mode and a restrained black mix in light mode; macOS can apply the stored sidebar opacity to the glass surface. Floating menus add backdrop blur and a panel shadow. The compact workspace overlay alone uses a directional shadow to separate it from the rail.

### Shadow Vocabulary

- **Workspace overlay:** `box-shadow: -12px 0 24px hsl(0 0% 0% / 0.12)` at compact desktop widths.
- **Floating options menu:** the existing `shadow-xl` treatment with `backdrop-blur-xl`.

### Named Rules

**The Flat-at-Rest Rule.** Use tonal surfaces and borders for ordinary chrome; reserve shadows for the responsive overlay and floating menus.

## Shapes

The form language is gently rounded and compact. Standard controls use `6px` corners; session rows, composer shells, settings menus, and larger containers use `8px`; segmented options use `5px`; code and table shells use `10px`. Toggles and sliders use a full pill silhouette. Borders are quiet content mixes, with a one-pixel dashed outline reserved for session approval state.

## Components

### Buttons

- **Shape:** Compact controls use `6px` corners; icon buttons use `28px` square hit areas and `8px` corners.
- **Primary:** The composer send/stop control is a `26px` square with a white surface, black icon, and a `6px` corner. Disabled send uses the same surface at reduced opacity.
- **Hover / Focus:** Secondary controls use a content wash on hover. Chrome icon buttons transition background and color in `120ms ease-out` and use a `2px` blue focus outline with `2px` offset; reduced motion removes that transition.
- **Secondary / Ghost / Tertiary:** Secondary buttons are transparent with a one-pixel quiet border, `10px` horizontal and `4px` vertical padding, and muted content that strengthens on hover.

### Chips

- **Style:** Composer tool buttons are `26px` square, `6px` rounded, and use a translucent content surface; their active state is a stronger content mix.
- **State:** Segmented controls use a `6px` bordered group with `2px` inner padding; selected options use a `5px` corner and active content wash. Provider, model, branch, and permission pickers remain available. All controls sit below the message field without an internal divider or added decoration. A compact project/context row appears only when it has content. The bottom action row contains Attach, Model, model settings, and Access on the left; the branch selector sits beside Send/Stop on the right. Cap long branch labels and preserve the full branch name in the tooltip. Use a paperclip for attachments, settings controls for model options, a git-fork for branches, and shields for access modes. When a model has multiple settings, combine them into one dropdown that summarizes the first two selected values; a single setting keeps its direct control. Access stays separate until narrow-pane overflow groups the secondary controls. Secondary buttons stay transparent at rest; the model keeps a subtle fill and Send/Stop retains primary emphasis. Secondary settings appear inline when their measured widths fit beside Attach, Model, Branch, and Send/Stop. Only when space is insufficient do the secondary controls move into Composer options; widening restores them inline. A 12px return margin avoids boundary flicker. The overflow trigger displays the current access mode (or Options for providers without access modes). Both inline pickers and overflow use the same compact styled menus with checked choices; overflow rows open a choice list inside the popup, with Back and Escape navigation. Do not use a large form, native sub-selects, or a Done button for these choices. Hidden measurement controls are clipped, inert, and excluded from assistive navigation. Textarea height and highlight width are remeasured when the pane width changes; the draft and caret are preserved.

### Cards / Containers

- **Corner Style:** Composer containers use `12px`; session containers use `8px`; code/table shells use `10px`.
- **Background:** Composer uses a subtle content mix; sidebar rows are transparent at rest, with hover and active tonal states.
- **Shadow Strategy:** Follow the Elevation & Depth section; ordinary cards stay flat.
- **Border:** Composer and menus use a one-pixel content mix; session approval uses a one-pixel dashed outline.
- **Internal Padding:** Composer controls use `10px` top and `12px` horizontal padding, then `8px` bottom controls. Compact session cards use `8px` vertical and `10px` horizontal padding.

### Inputs / Fields

- **Style:** Search and API-key fields are `28px` high, `6px` rounded, transparent, one-pixel bordered, and use `8px` horizontal padding with `12px` text.
- **Focus:** Focus-within strengthens the border from the quiet `10%` content mix to `20%`; the composer follows the same border shift and highlights file drag with blue.
- **Error / Disabled:** Disabled controls reduce opacity; connection errors use the existing red semantic signal.

### Navigation

The complete project heading (folder and title) expands or collapses its session group without changing the active conversation. Open a project through its options menu or select one of its sessions. Conversations, composer text fields, the empty-session scroller, and sidebar options share a subtle 6px scrollbar with a transparent track. Editors and terminals retain their native scrolling behavior.

The project rail uses glass or tonal neutral chrome with a right border, grouped projects, detailed session rows, and compact icon actions. Its top navigation uses two compact rows: a softly emphasized New session action beside an icon-only Search button, then Notes and Inbox side by side. Notes-disabled layouts give Inbox the full row. Search retains an accessible name and shortcut tooltip; Inbox retains its unread dot. Conversation, code-search, notebook, and task-list icons distinguish the four actions without extra dividers. The workspace keeps tabbed Files, Review, and Terminal tools in the existing arrangement. Terminal views omit the redundant breadcrumb/title row; the workspace tabs and per-shell tab strip retain new-shell and close-tab controls. Do not add a separate terminal hide button; the workspace close control and existing terminal shortcut remain available. Keep one options menu for sidebar organization and session filters; it is an `8px` rounded, bordered, blurred floating surface.

### Avenrail Identity

The identity is a signature component, not a navigation control. The boot splash centers the `72px` `/avenrail.svg` mark. Empty sessions intentionally omit the logo, name, and tagline. Settings > General places the full `64px` mark beside the name and product description in About. Keep identity placement to launch and About surfaces.

## Do's and Don'ts

### Do:

- **Do** preserve the approved project/session workspace arrangement, detailed session cards, collapsible projects, tabbed tools, and single sidebar options menu.
- **Do** use the functional blue accent for actions, focus, links, and working state, and retain the existing semantic status colors.
- **Do** support the existing dark/light theme variables, glass opacity behavior, responsive panel bounds, and `prefers-reduced-motion` behavior.
- **Do** keep the Avenrail mark sourced from `public/avenrail.svg` and place identity only at the boot splash and About.
- **Do** keep compatibility identifiers stable: `com.monocode.desktop`, `monocode.db`, `monocode.*` and `monocode:*` preference/local-event namespaces, and the `MonoCode.dmg` download alias. Keep `ashish200729/Avenrail` as the primary repository and `hardbeat920/monocode` as upstream.
- **Do** preserve existing project directory names and saved paths, historical transcripts, updater feed configuration, signing credentials, and provider integrations.

### Don't:

- **Don't** introduce new navigation, provider capabilities, commercial claims, unverified download endpoints, or a new interaction model as part of this rebrand.
- **Don't** add an animated game background or move the identity into working controls.
- **Don't** add a new display font, replace the system stacks, or recolor functional controls with the identity jade/forest palette.
- **Don't** rename the bundle identifier, database file, preference/event namespaces, or project folders to match the display name.
- **Don't** treat screenshots or this document as native runtime, signing, notarization, or release validation.
