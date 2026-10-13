import {
  ChevronLeft,
  ChevronRight,
  Triage,
  PanelLeft,
  PanelRight,
  Plus,
  Search,
  Settings,
} from "../../shared/ui/icons";
import { memo, useEffect, useMemo, type ReactNode } from "react";
import { basename } from "../../platform/tauri/fs";
import { looksLikeProject } from "../../features/projects/model/recents";
import type { HarnessId } from "../../features/sessions/model/session";
import { CwdPicker } from "../../features/projects/ui/CwdPicker";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { WindowControls } from "./WindowControls";
import { IS_MAC, MOD } from "../../platform/tauri/platform";
import type { RecentProject } from "../../features/projects/model/recents";

export type Tab = {
  id: string;
  /** Project folder name, e.g. `agent-terminal`. */
  project: string;
  /** Focused conversation title; empty for a fresh session. */
  title: string;
  /** Other conversation titles in this tab, focused session omitted. */
  more: string[];
  sessionCount: number;
  harnesses: HarnessId[];
  /** Harnesses with an in-flight turn in this tab. */
  busyHarnesses: HarnessId[];
  /** Harnesses with a finished response that has not been focused yet. */
  doneHarnesses?: HarnessId[];
  /** Open file basenames, active files first. */
  files: string[];
  /** Split layout with more than one pane in this tab. */
  multiPane?: boolean;
  /** Focus is on a file/terminal pane rather than a conversation pane. */
  fileFocused?: boolean;
  /** The sole pane is a fresh conversation with no user turn or open file. */
  blank?: boolean;
  /** Explicit tab group; absent means ungrouped. */
  groupId?: string;
  dirty?: boolean;
  terminal?: boolean;
  /** File id when the whole tab is one preview file; double-click pins it. */
  previewFileId?: string;
};

type Props = {
  /** Open conversations; only the active one is named in the bar. */
  tabs: Tab[];
  activeId: string;
  cwd: string;
  projectRailOpen?: boolean;
  sessionSidebarOpen?: boolean;
  compactRail?: boolean;
  canGoBack?: boolean;
  canGoForward?: boolean;
  onGoBack?: () => void;
  onGoForward?: () => void;
  onToggleSidebar: () => void;
  onToggleSessionSidebar?: () => void;
  workspacePanelOpen?: boolean;
  /** The workspace panel spans the full height and hosts its own toggle. */
  workspacePanelAtTop?: boolean;
  onToggleWorkspacePanel?: () => void;
  onNew: () => void;
  onNewTerminal?: () => void;
  onOpenSettings?: () => void;
  onOpenInbox?: () => void;
  onGoToFile?: () => void;
  recents?: RecentProject[];
  onSelectProject?: (path: string) => void;
};

function sessionMeta(tab: Tab): string {
  if (tab.more.length === 1) return tab.more[0];
  if (tab.sessionCount > 1) return `${tab.sessionCount} sessions`;
  return "";
}

export function tabCopy(tab: Tab): {
  headline: string;
  meta: string;
  tooltip: string;
} {
  const project = tab.project.trim() || "~";
  const conversation = tab.title.trim();
  const file = tab.files[0] ?? "";
  const sessions = sessionMeta(tab);
  const untitled = "New session";

  let headline: string;
  const metaParts: string[] = [];

  if (tab.multiPane) {
    if (tab.fileFocused && file) {
      headline = file;
      if (conversation) metaParts.push(conversation);
      else if (sessions) metaParts.push(sessions);
    } else if (conversation) {
      headline = conversation;
      if (file) metaParts.push(file);
      else if (sessions) metaParts.push(sessions);
    } else if (file) {
      headline = file;
      if (sessions) metaParts.push(sessions);
    } else {
      headline = untitled;
      if (sessions) metaParts.push(sessions);
    }
  } else {
    headline = conversation || file || untitled;
    if (sessions) metaParts.push(sessions);
  }

  const meta = metaParts.join(" · ");

  const tooltipParts = [project];
  if (conversation) tooltipParts.push(conversation);
  tooltipParts.push(...tab.more);
  if (tab.files.length > 0) tooltipParts.push(tab.files.join(", "));
  if (tab.dirty) tooltipParts.push("Unsaved changes");

  return { headline, meta, tooltip: tooltipParts.join(" · ") };
}

export function IconButton({
  label,
  active,
  accent,
  disabled,
  onClick,
  onOpenContextMenu,
  children,
}: {
  label: string;
  active?: boolean;
  accent?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  onOpenContextMenu?: (x: number, y: number) => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active || accent}
      aria-disabled={disabled}
      data-tauri-drag-region="false"
      onClick={() => {
        if (disabled) return;
        onClick?.();
      }}
      onContextMenu={
        onOpenContextMenu
          ? (event) => {
              event.preventDefault();
              event.stopPropagation();
              if (disabled) return;
              event.currentTarget.focus();
              onOpenContextMenu(event.clientX, event.clientY);
            }
          : undefined
      }
      onKeyDown={
        onOpenContextMenu
          ? (event) => {
              if (
                event.key !== "ContextMenu" &&
                !(event.shiftKey && event.key === "F10")
              )
                return;
              event.preventDefault();
              event.stopPropagation();
              if (disabled) return;
              event.currentTarget.focus();
              const rect = event.currentTarget.getBoundingClientRect();
              onOpenContextMenu(rect.left, rect.bottom);
            }
          : undefined
      }
      className={`grid size-6.5 place-items-center rounded-md ${
        disabled
          ? "text-content/25"
          : accent
            ? "text-accent hover:bg-content/10"
            : active
              ? "text-content hover:bg-content/10"
              : "text-content/50 hover:bg-content/10 hover:text-content"
      }`}
    >
      {children}
    </button>
  );
}

export function DevModeLabel() {
  if (!import.meta.env.DEV) return null;
  return (
    <span
      title="Development build"
      className="mr-1 min-w-0 truncate rounded-md bg-skill/15 px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-skill"
    >
      Development
    </span>
  );
}

/** Flex spacer that keeps the Development badge next to the visit arrows. */
export function DevModeSlot() {
  return (
    <div className="flex min-w-0 flex-1 items-center justify-end">
      <DevModeLabel />
    </div>
  );
}

export function TabVisitNav({
  canGoBack = false,
  canGoForward = false,
  onGoBack,
  onGoForward,
  onTogglePanel,
  panelActive = false,
  panelLabel = "Toggle Projects",
}: {
  canGoBack?: boolean;
  canGoForward?: boolean;
  onGoBack?: () => void;
  onGoForward?: () => void;
  onTogglePanel?: () => void;
  panelActive?: boolean;
  panelLabel?: string;
}) {
  return (
    <div className="flex shrink-0 items-center">
      <IconButton
        label={`Back (${MOD}[)`}
        disabled={!canGoBack}
        onClick={onGoBack}
      >
        <ChevronLeft className="size-3.5" strokeWidth={1.75} />
      </IconButton>
      <IconButton
        label={`Forward (${MOD}])`}
        disabled={!canGoForward}
        onClick={onGoForward}
      >
        <ChevronRight className="size-3.5" strokeWidth={1.75} />
      </IconButton>
      {onTogglePanel ? (
        <IconButton
          label={panelLabel}
          active={panelActive}
          onClick={onTogglePanel}
        >
          <PanelLeft className="size-3.5" strokeWidth={1.75} />
        </IconButton>
      ) : null}
    </div>
  );
}

/** Back + rail toggle for overlay surfaces when the project rail is closed. */
export function OverlayNav({
  onBack,
  onToggleSidebar,
}: {
  onBack?: () => void;
  onToggleSidebar?: () => void;
}) {
  if (!onBack && !onToggleSidebar) return null;
  return (
    <div className="flex shrink-0 items-center px-1.5">
      {onBack ? (
        <IconButton label={`Back (${MOD}[)`} onClick={onBack}>
          <ChevronLeft className="size-3.5" strokeWidth={1.75} />
        </IconButton>
      ) : null}
      {onToggleSidebar ? (
        <IconButton
          label={`Toggle Sidebar (${MOD}B)`}
          onClick={onToggleSidebar}
        >
          <PanelLeft className="size-3.5" strokeWidth={1.75} />
        </IconButton>
      ) : null}
    </div>
  );
}

function TitleBarComponent({
  tabs,
  activeId,
  cwd,
  projectRailOpen = true,
  sessionSidebarOpen = true,
  compactRail = false,
  canGoBack = false,
  canGoForward = false,
  onGoBack,
  onGoForward,
  onToggleSidebar,
  onToggleSessionSidebar,
  onNew,
  onNewTerminal,
  onOpenSettings,
  onOpenInbox,
  onGoToFile,
  recents = [],
  onSelectProject,
  workspacePanelOpen,
  workspacePanelAtTop = false,
  onToggleWorkspacePanel,
}: Props) {
  const activeTab = useMemo(
    () => tabs.find((t) => t.id === activeId),
    [activeId, tabs],
  );
  const activeCopy = useMemo(
    () => (activeTab ? tabCopy(activeTab) : null),
    [activeTab],
  );
  const systemTitle = useMemo(() => {
    const activeName = activeTab
      ? activeTab.files[0]
        ? basename(activeTab.files[0])
        : activeTab.project
      : "";
    const project = cwd ? basename(cwd) : "";
    if (activeName && project && activeName !== project) {
      return `${activeName} — ${project} — Avenrail`;
    }
    if (project) {
      return `${project} — Avenrail`;
    }
    return "Avenrail";
  }, [activeTab, cwd]);

  useEffect(() => {
    document.title = systemTitle;
    try {
      void getCurrentWindow().setTitle(systemTitle);
    } catch {}
  }, [systemTitle]);

  const railClosed = !projectRailOpen;
  const showCurrentProject = looksLikeProject(cwd);
  // Until a project is picked, the rail and the sidebar hide, so nothing
  // project-scoped is actionable and the window controls need room.
  const projectless = !showCurrentProject;
  // An open project is labeled in the sidebar, above Sessions / Explorer /
  // Changes. Without a project that sidebar is gone, so the picker stays here.
  const showProjectButton =
    railClosed && Boolean(onSelectProject) && !showCurrentProject;
  const showTrailingActions =
    (projectless && railClosed && Boolean(onOpenInbox || onOpenSettings)) ||
    (railClosed && !projectless);
  // When the workspace panel spans the full window height it owns the top-right
  // corner, so the panel toggle and the window controls live in its header.
  const showWindowControls = !IS_MAC && !workspacePanelAtTop;
  const showPanelToggle =
    Boolean(onToggleWorkspacePanel) && !workspacePanelAtTop;
  const trailingControls =
    showTrailingActions || showWindowControls ? (
      <div className="flex h-full shrink-0 items-stretch">
        {showTrailingActions ? (
          <div className="flex items-center gap-0.5 px-2">
            {projectless && railClosed && onOpenInbox ? (
              <IconButton label="PRs & issues" onClick={onOpenInbox}>
                <Triage className="size-3.5" strokeWidth={1.75} />
              </IconButton>
            ) : null}
            {railClosed && !projectless ? (
              <IconButton label={`Go to File (${MOD}P)`} onClick={onGoToFile}>
                <Search className="size-3.5" strokeWidth={1.75} />
              </IconButton>
            ) : null}
            {!projectRailOpen && !showCurrentProject && onOpenSettings ? (
              <IconButton label={`Settings (${MOD},)`} onClick={onOpenSettings}>
                <Settings className="size-3.5" strokeWidth={1.75} />
              </IconButton>
            ) : null}
          </div>
        ) : null}
        {showWindowControls ? <WindowControls /> : null}
      </div>
    ) : null;

  // "deep" drags from anywhere in the subtree. The bare attribute only drags
  // on a direct hit, which left every label and spacer dead. Tauri still
  // exempts buttons, links and inputs on its own.
  return (
    <header
      className={`flex h-10 shrink-0 select-none items-stretch border-b border-stroke${
        compactRail ? " body-glass" : ""
      }`}
      data-tauri-drag-region="deep"
    >
      {compactRail ? (
        <div
          data-compact-title-nav
          className="flex shrink-0 items-center pl-[70px]"
        >
          <TabVisitNav
            canGoBack={canGoBack}
            canGoForward={canGoForward}
            onGoBack={onGoBack}
            onGoForward={onGoForward}
          />
        </div>
      ) : null}
      {/* Both the rail and the sidebar step aside without a project, so the
          title bar takes over the traffic lights and the rail toggle. */}
      {projectless && railClosed && !compactRail ? (
        <>
          <div className="w-[78px] shrink-0" />
          <div className="flex shrink-0 items-center px-1.5">
            <IconButton
              label={`Toggle Sidebar (${MOD}B)`}
              onClick={onToggleSidebar}
            >
              <PanelLeft className="size-3.5" strokeWidth={1.75} />
            </IconButton>
          </div>
        </>
      ) : null}
      {!sessionSidebarOpen && !projectless && onToggleSessionSidebar ? (
        <div className="flex shrink-0 items-center px-1.5">
          {IS_MAC && railClosed && !compactRail ? (
            <div className="w-[70px] shrink-0" />
          ) : null}
          <IconButton
            label={`Toggle Sidebar (${MOD}B)`}
            onClick={onToggleSessionSidebar}
          >
            <PanelLeft className="size-3.5" strokeWidth={1.75} />
          </IconButton>
        </div>
      ) : null}
      {railClosed ? (
        <div
          className="flex shrink-0 items-center px-1.5"
          data-new-session-action
        >
          <button
            type="button"
            title={`New session (${MOD}T)`}
            aria-label={`New session (${MOD}T)`}
            onClick={onNew}
            className="flex h-7 items-center gap-1.5 rounded-md px-2 text-xs text-content/70 hover:bg-content/8 hover:text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <Plus className="size-3.5" strokeWidth={1.75} />
            <span>New session</span>
          </button>
        </div>
      ) : null}
      {showProjectButton && onSelectProject ? (
        <CwdPicker
          cwd={cwd}
          recents={recents}
          placement="below"
          onCwdChange={onSelectProject}
          onNewTerminal={onNewTerminal}
          buttonClassName="flex h-full min-w-0 max-w-64 shrink items-center gap-2 px-6 text-left text-sm font-medium leading-tight"
        >
          <span className="min-w-0 truncate text-content/50">No project</span>
        </CwdPicker>
      ) : null}

      <div
        className={`flex min-w-0 flex-1 items-center${
          showProjectButton ? " border-l border-stroke" : ""
        }`}
      >
        {/* Sessions are navigated from the sidebar; the bar only names the
            one on screen. */}
        <div
          data-title-bar-title
          className="flex min-w-0 flex-1 items-baseline gap-2 px-3"
          title={activeCopy?.tooltip}
        >
          {activeCopy ? (
            <>
              <span className="min-w-0 truncate text-[13px] font-medium text-content/70">
                {activeCopy.headline}
              </span>
              {activeCopy.meta ? (
                <span className="min-w-0 shrink-[3] truncate text-[11px] text-content/40">
                  {activeCopy.meta}
                </span>
              ) : null}
            </>
          ) : null}
        </div>
        {showPanelToggle ? (
          <button
            id="workspace-panel-toggle"
            type="button"
            aria-label={
              workspacePanelOpen
                ? "Hide workspace tools"
                : "Show workspace tools"
            }
            title={
              workspacePanelOpen
                ? "Hide workspace tools"
                : "Show workspace tools"
            }
            aria-pressed={workspacePanelOpen}
            data-tauri-drag-region="false"
            onClick={onToggleWorkspacePanel}
            className="mx-1 grid size-7 shrink-0 place-items-center rounded-md text-content/65 hover:bg-content/8 focus-visible:outline-2 focus-visible:outline-accent"
          >
            <PanelRight className="size-3.5" />
          </button>
        ) : null}
        {trailingControls}
      </div>
    </header>
  );
}

export const TitleBar = memo(TitleBarComponent);
