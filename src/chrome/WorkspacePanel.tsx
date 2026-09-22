import {
  File,
  FolderOpen,
  GitCompare,
  Maximize2,
  Minimize2,
  PanelRight,
  PanelLeft,
  Plus,
  Terminal,
  X,
} from "lucide-react";
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import { useDragResize } from "../hooks/useDragResize";
import { useProjectDiffStats } from "../hooks/useProjectDiffStats";
import { useGitFileStatuses } from "../hooks/useGitFileStatuses";
import { useSortable } from "../hooks/useSortable";
import {
  loadWorkspacePanelWidth,
  saveWorkspacePanelWidth,
  WORKSPACE_PANEL_WIDTH_DEFAULT,
  WORKSPACE_PANEL_WIDTH_MAX,
  WORKSPACE_PANEL_WIDTH_MIN,
} from "../lib/appearance";
import { basename } from "../lib/fs";
import { displayPath } from "../lib/paths";
import { IS_MAC, MOD } from "../lib/platform";
import { WindowControls } from "./WindowControls";
import { looksLikeProject } from "../lib/recents";
import type { WorkspaceTab } from "../lib/layout";
import {
  closeWorkspaceView,
  openWorkspaceView,
  reconcileWorkspaceView,
  type WorkspaceRequest,
  type WorkspaceView,
} from "../lib/workspaceTools";
import { FilePane } from "../surfaces/FilePane";
import { ExplorerMenu } from "./ExplorerMenu";
import { FileTypeIcon } from "./FileTypeIcon";
import { SourceControl } from "./SourceControl";
import { ProjectSearch } from "./ProjectSearch";
import { WorkspaceFiles } from "./WorkspaceFiles";
import { IconButton } from "./TitleBar";

const EMPTY_VIEW: WorkspaceView = { order: [], activeId: null };
const TOOLS = [
  { id: "changes", label: "Review", icon: GitCompare },
  { id: "terminal", label: "Terminal", icon: Terminal },
  { id: "files", label: "Files", icon: FolderOpen },
] as const;

type Props = {
  cwd: string;
  open: boolean;
  sidebarOpen?: boolean;
  onShowSidebar?: () => void;
  onNewSession?: () => void;
  active: boolean;
  activeTabId: string;
  tabs: WorkspaceTab[];
  renderEditors: boolean;
  request: WorkspaceRequest | null;
  onSelectionChange: (id: string | null) => void;
  editorProps: Omit<
    ComponentProps<typeof FilePane>,
    "pane" | "focused" | "hideTabs"
  >;
  terminalContent: (visible: boolean) => ReactNode;
  terminalAvailable: boolean;
  onClose: () => void;
  onOpenFile: (path: string) => void;
  onOpenDiff: (path: string) => void;
  onOpenTerminal: (cwd: string) => void;
  onShowTerminal: () => void;
  onFileMoved: (from: string, to: string) => void;
  onFileDeleted: (path: string) => void;
  onFindInProject: () => void;
  selectedDiffPath?: string;
  textHarness?: ComponentProps<typeof SourceControl>["textHarness"];
  filesSearchOpen: boolean;
  onFilesSearchOpenChange: (open: boolean) => void;
  searchFocusToken: number;
};

/** A presentation of the existing editors and terminal; their ownership stays in App. */
export function WorkspacePanel({
  cwd,
  open,
  sidebarOpen = true,
  onShowSidebar,
  onNewSession,
  active,
  activeTabId,
  tabs,
  renderEditors,
  request,
  onSelectionChange,
  editorProps,
  terminalContent,
  terminalAvailable,
  onClose,
  onOpenFile,
  onOpenDiff,
  onOpenTerminal,
  onShowTerminal,
  onFileMoved,
  onFileDeleted,
  onFindInProject,
  selectedDiffPath,
  textHarness,
  filesSearchOpen,
  onFilesSearchOpenChange,
  searchFocusToken,
}: Props) {
  const resize = useDragResize({
    min: WORKSPACE_PANEL_WIDTH_MIN,
    max: () =>
      Math.min(WORKSPACE_PANEL_WIDTH_MAX, Math.floor(window.innerWidth * 0.75)),
    defaultWidth: WORKSPACE_PANEL_WIDTH_DEFAULT,
    initial: loadWorkspacePanelWidth(),
    onCommit: saveWorkspacePanelWidth,
    side: "right",
  });
  const [views, setViews] = useState<Record<string, WorkspaceView>>({});
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const [reviewToolbar, setReviewToolbar] = useState<HTMLDivElement | null>(
    null,
  );
  const reviewStats = useProjectDiffStats(cwd, active);
  const [treeOpen, setTreeOpen] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const buttonRefs = useRef(new Map<string, HTMLButtonElement>());
  const plusRef = useRef<HTMLButtonElement>(null);
  const current = tabs.find((tab) => tab.id === activeTabId);
  const entries = useMemo(
    () =>
      (current
        ? [...current.editorPanes, ...(current.terminalPanes ?? [])]
        : []
      ).flatMap((pane) => pane.files.map((file) => ({ file, pane }))),
    [current],
  );
  const available = entries
    .filter(({ file }) => !file.review)
    .map(({ file }) => `file:${file.id}`);
  const view = reconcileWorkspaceView(
    views[activeTabId] ?? EMPTY_VIEW,
    available,
  );
  const selected = entries.find(
    ({ file }) => `file:${file.id}` === view.activeId,
  );
  useEffect(
    () => onSelectionChange?.(view.activeId),
    [view.activeId, onSelectionChange],
  );
  const reviews = entries.filter(({ file }) => file.review);
  const reviewFile =
    reviews.find(({ file, pane }) => pane.activeFileId === file.id) ??
    reviews[reviews.length - 1];
  const displayed = view.activeId === "changes" ? reviewFile : selected;
  const showFiles =
    view.activeId === "files" || (selected && !selected.file.terminal);
  const showReview = view.activeId === "changes";
  const showTerminal = view.activeId === "terminal";
  const project = looksLikeProject(cwd);
  const gitStatuses = useGitFileStatuses(
    cwd,
    active && !!showFiles && treeOpen,
  );
  const setView = (update: (previous: WorkspaceView) => WorkspaceView) =>
    setViews((previous) => ({
      ...previous,
      [activeTabId]: update(
        reconcileWorkspaceView(previous[activeTabId] ?? EMPTY_VIEW, available),
      ),
    }));
  const activate = (id: string) => {
    setView((previous) => openWorkspaceView(previous, id));
    if (id === "files") setTreeOpen(true);
    if (id === "terminal") onShowTerminal();
    const entry = entries.find(({ file }) => `file:${file.id}` === id);
    if (entry) editorProps.onSelectFile(entry.pane.id, entry.file.id);
    if (id === "changes" && reviewFile)
      editorProps.onSelectFile(reviewFile.pane.id, reviewFile.file.id);
  };
  const openTool = (id: string) => {
    setMenu(null);
    activate(id);
  };
  const closeTab = (id: string) => {
    const entry = entries.find(({ file }) => `file:${file.id}` === id);
    if (entry) editorProps.onCloseFile(entry.pane.id, entry.file.id);
    else {
      const next = closeWorkspaceView(view, id);
      setView(() => next);
      if (view.activeId === id) {
        const fallback = entries.find(
          ({ file }) => `file:${file.id}` === next.activeId,
        );
        if (fallback)
          editorProps.onSelectFile(fallback.pane.id, fallback.file.id);
      }
    }
  };
  const sortable = useSortable(view.order, (order) =>
    setView((previous) => ({ ...previous, order })),
  );
  const focusedPane =
    current &&
    [...current.editorPanes, ...(current.terminalPanes ?? [])].find(
      (pane) => pane.id === current.focusedId,
    );
  const focusedFile = focusedPane?.files.find(
    (file) => file.id === focusedPane.activeFileId,
  );
  const focusSignature = focusedFile
    ? `${activeTabId}:${focusedFile.id}`
    : null;
  useEffect(() => {
    if (!focusedFile) return;
    // A closed Review view may still own a live editor buffer. Native fallback
    // focus must not reopen that tool unless the user explicitly asks for it.
    if (
      focusedFile.review &&
      views[activeTabId] &&
      !views[activeTabId].order.includes("changes")
    )
      return;
    setView((previous) =>
      openWorkspaceView(
        previous,
        focusedFile.review ? "changes" : `file:${focusedFile.id}`,
      ),
    );
    // Follow editor focus from native shortcuts or restored editor tabs, not session focus.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusSignature]);
  const processedRequest = useRef<number | null>(null);
  useEffect(() => {
    if (
      !request ||
      processedRequest.current === request.token ||
      (request.tabId && request.tabId !== activeTabId)
    )
      return;
    const entry =
      request.kind === "file"
        ? entries.find(({ file }) => !file.review && file.path === request.path)
        : null;
    if (request.kind === "file" && !entry) return;
    processedRequest.current = request.token;
    const id = entry ? `file:${entry.file.id}` : request.kind;
    setView((previous) => openWorkspaceView(previous, id));
    if (request.kind === "files" || request.kind === "file") setTreeOpen(true);
    // Requests are explicit UI navigation, including reopening an already active file.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request, entries]);
  useEffect(() => {
    if (!active) {
      setMenu(null);
      setExpanded(false);
    }
  }, [active]);
  useEffect(() => {
    setMenu(null);
  }, [activeTabId]);
  const previousActive = useRef(view.activeId);
  useLayoutEffect(() => {
    const old = previousActive.current;
    previousActive.current = view.activeId;
    if (view.activeId)
      buttonRefs.current
        .get(view.activeId)
        ?.scrollIntoView({ block: "nearest", inline: "nearest" });
    if (old && !view.order.includes(old))
      (view.activeId
        ? buttonRefs.current.get(view.activeId)
        : plusRef.current
      )?.focus();
  }, [view.activeId, view.order.join("\0")]);
  const paneVisible = (paneId: string, tabId: string) =>
    active && tabId === activeTabId && displayed?.pane.id === paneId;
  const dirty = (id: string) =>
    id === "changes"
      ? reviews.some(({ file }) => editorProps.dirtyFileIds.has(file.id))
      : editorProps.dirtyFileIds.has(id.slice(5));

  return (
    <aside
      ref={resize.setPaneRef}
      aria-label="Workspace tools"
      data-reserve-traffic-lights={(IS_MAC && !sidebarOpen) || undefined}
      aria-hidden={!open}
      inert={!open || undefined}
      className={`workspace-panel body-glass relative min-h-0 shrink-0 flex-col border-l border-content/10 ${open ? "flex" : "hidden"} ${expanded ? "workspace-panel-expanded" : ""}`}
      onKeyDown={(event) => {
        if (
          (event.metaKey || event.ctrlKey) &&
          event.key.toLowerCase() === "w" &&
          view.activeId
        ) {
          event.preventDefault();
          event.stopPropagation();
          closeTab(view.activeId);
        }
      }}
    >
      <header
        className="workspace-panel-header flex h-10 shrink-0 items-center gap-1 border-b border-content/10 px-2"
        data-tauri-drag-region
      >
        {!sidebarOpen && onShowSidebar ? (
          <IconButton label={`Show sidebar (${MOD}B)`} onClick={onShowSidebar}>
            <PanelLeft className="size-3.5" strokeWidth={1.75} />
          </IconButton>
        ) : null}
        {!sidebarOpen && onNewSession ? (
          <button
            type="button"
            title={`New session (${MOD}T)`}
            aria-label={`New session (${MOD}T)`}
            data-tauri-drag-region="false"
            onClick={onNewSession}
            className="mr-1 flex h-7 shrink-0 items-center gap-1.5 rounded-lg px-2 text-xs text-content/65 hover:bg-content/8 hover:text-content focus-visible:outline-2 focus-visible:outline-accent"
          >
            <Plus className="size-3.5" strokeWidth={1.75} />
            <span>New session</span>
          </button>
        ) : null}
        {view.order.length === 0 ? (
          <span
            className="min-w-0 truncate px-2 text-xs font-medium text-content/60"
            data-tauri-drag-region
          >
            Workspace
          </span>
        ) : null}
        <div
          role="tablist"
          aria-label="Workspace tabs"
          className="flex min-w-0 max-w-[calc(100%-100px)] shrink items-center gap-1 overflow-x-auto [scrollbar-width:none]"
        >
          {view.order.map((id, index) => {
            const entry = entries.find(({ file }) => `file:${file.id}` === id);
            const tool = TOOLS.find((item) => item.id === id);
            const label = entry
              ? (entry.file.plan?.title ?? basename(entry.file.path))
              : (tool?.label ?? "File");
            const Icon = tool?.icon ?? (entry?.file.terminal ? Terminal : File);
            return (
              <div
                key={id}
                ref={(el) => sortable.setItemRef(id, el)}
                className={`group flex min-w-24 max-w-44 shrink-0 items-center rounded-lg ${view.activeId === id ? "bg-content/8 text-content" : "text-content/60 hover:bg-content/4"} ${sortable.draggingId === id ? "opacity-40" : ""}`}
              >
                <button
                  ref={(el) => {
                    if (el) buttonRefs.current.set(id, el);
                    else buttonRefs.current.delete(id);
                  }}
                  type="button"
                  role="tab"
                  id={`workspace-tab-${id}`}
                  aria-selected={view.activeId === id}
                  aria-controls="workspace-content"
                  tabIndex={view.activeId === id ? 0 : -1}
                  title={entry?.file.path ?? label}
                  data-tauri-drag-region="false"
                  onPointerDown={(event) =>
                    sortable.onItemPointerDown(id, event)
                  }
                  onClick={() => {
                    if (!sortable.consumeClick()) activate(id);
                  }}
                  onKeyDown={(event) => {
                    const next =
                      event.key === "ArrowRight"
                        ? view.order[(index + 1) % view.order.length]
                        : event.key === "ArrowLeft"
                          ? view.order[
                              (index - 1 + view.order.length) %
                                view.order.length
                            ]
                          : event.key === "Home"
                            ? view.order[0]
                            : event.key === "End"
                              ? view.order[view.order.length - 1]
                              : null;
                    if (next) {
                      event.preventDefault();
                      activate(next);
                      buttonRefs.current.get(next)?.focus();
                    }
                    if (event.key === "Delete") {
                      event.preventDefault();
                      closeTab(id);
                    }
                  }}
                  className="flex h-7 min-w-0 flex-1 items-center gap-2 rounded-lg pl-2 pr-1 text-xs focus-visible:outline-2 focus-visible:outline-accent"
                >
                  {entry && !entry.file.terminal && !entry.file.plan ? (
                    <FileTypeIcon name={entry.file.path} isDir={false} />
                  ) : (
                    <Icon className="size-3.5 shrink-0" strokeWidth={1.75} />
                  )}
                  <span className="truncate">{label}</span>
                </button>
                <button
                  type="button"
                  aria-label={`Close ${label}`}
                  title={`Close ${label}`}
                  data-tauri-drag-region="false"
                  onClick={() => closeTab(id)}
                  className="mr-1 grid size-6 shrink-0 place-items-center rounded-md text-content/50 hover:bg-content/10 hover:text-content focus-visible:outline-2 focus-visible:outline-accent"
                >
                  {dirty(id) ? (
                    <span className="size-1.5 rounded-full bg-content/60" />
                  ) : (
                    <X className="size-3" />
                  )}
                </button>
              </div>
            );
          })}
        </div>
        <button
          ref={plusRef}
          type="button"
          aria-label="Add workspace tab"
          aria-haspopup="menu"
          aria-expanded={!!menu}
          data-tauri-drag-region="false"
          onClick={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            setMenu(menu ? null : { x: rect.left, y: rect.bottom + 4 });
          }}
          className="grid size-7 shrink-0 place-items-center rounded-lg text-content/60 hover:bg-content/8 hover:text-content focus-visible:outline-2 focus-visible:outline-accent"
        >
          <Plus className="size-4" />
        </button>
        <div className="min-w-1 flex-1" data-tauri-drag-region />
        <IconButton
          label={expanded ? "Restore workspace size" : "Expand workspace"}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <Minimize2 className="size-3.5" />
          ) : (
            <Maximize2 className="size-3.5" />
          )}
        </IconButton>
        <IconButton label="Close workspace panel" active onClick={onClose}>
          <PanelRight className="size-3.5" />
        </IconButton>
        {!IS_MAC ? <WindowControls /> : null}
      </header>
      <div
        id="workspace-content"
        role={view.activeId ? "tabpanel" : undefined}
        aria-labelledby={
          view.activeId ? `workspace-tab-${view.activeId}` : undefined
        }
        className="relative flex min-h-0 flex-1 flex-col"
      >
        {!view.activeId ? (
          <div className="flex min-h-0 flex-1 items-center justify-center px-8 pb-10">
            <div className="w-full max-w-lg space-y-1.5">
              {TOOLS.map(({ id, label, icon: Icon }) => (
                <button
                  type="button"
                  key={id}
                  disabled={!project}
                  onClick={() => openTool(id)}
                  className="flex h-10 w-full items-center gap-3 rounded-lg bg-content/4 px-3 text-left text-sm text-content/85 hover:bg-content/8 focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-40"
                >
                  <Icon className="size-4 text-content/60" strokeWidth={1.75} />
                  <span className="flex-1">{label}</span>
                  {id === "files" ? (
                    <span className="text-xs text-content/50">{MOD}P</span>
                  ) : null}
                </button>
              ))}
              {!project ? (
                <p className="pt-3 text-center text-xs text-content/60">
                  Open a project to use workspace tools.
                </p>
              ) : null}
            </div>
          </div>
        ) : !showTerminal && !displayed?.file.terminal ? (
          <div className="flex h-10 shrink-0 items-center gap-2 border-b border-content/10 px-3 text-xs">
            <span
              className="min-w-0 flex-1 truncate text-content/65"
              title={displayed?.file.path ?? cwd}
            >
              {showReview
                ? "Uncommitted changes"
                : displayed
                  ? displayPath(displayed.file.path, cwd)
                  : "/"}
            </span>
            {showReview && reviewStats ? (
              <span className="flex items-center gap-1.5 text-xs tabular-nums">
                <span className="text-emerald-500">
                  +{reviewStats.additions}
                </span>
                <span className="text-red-400">−{reviewStats.deletions}</span>
              </span>
            ) : null}
            <div
              ref={setReviewToolbar}
              className={showReview ? "ml-auto" : "hidden"}
            />
            {showFiles || showReview ? (
              <IconButton
                label={treeOpen ? "Hide files" : "Show files"}
                active={treeOpen}
                onClick={() => setTreeOpen(!treeOpen)}
              >
                <FolderOpen className="size-4" />
              </IconButton>
            ) : null}
          </div>
        ) : null}
        <div
          className={view.activeId ? "relative flex min-h-0 flex-1" : "hidden"}
          inert={!view.activeId || undefined}
        >
          <div className="relative min-h-0 min-w-0 flex-1">
            {tabs.flatMap((tab) =>
              [...tab.editorPanes, ...(tab.terminalPanes ?? [])].map((pane) => (
                <div
                  key={pane.id}
                  aria-hidden={!paneVisible(pane.id, tab.id)}
                  inert={!paneVisible(pane.id, tab.id) || undefined}
                  className={
                    paneVisible(pane.id, tab.id)
                      ? "absolute inset-0 flex min-h-0 flex-col"
                      : "hidden"
                  }
                >
                  <FilePane
                    {...editorProps}
                    hideTabs
                    present={renderEditors}
                    pane={
                      displayed?.pane.id === pane.id
                        ? { ...pane, activeFileId: displayed.file.id }
                        : pane
                    }
                    focused={paneVisible(pane.id, tab.id)}
                  />
                </div>
              )),
            )}
            {!displayed && (showFiles || showReview) ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
                <FolderOpen
                  className="size-8 text-content/45"
                  strokeWidth={1.5}
                />
                <p className="text-base font-medium">
                  {showReview ? "Review changes" : "Open file"}
                </p>
                <p className="text-xs text-content/60">
                  {showReview
                    ? "Select a changed file to review its diff"
                    : "Select a file from the workspace tree"}
                </p>
              </div>
            ) : null}
            <div
              className={
                showTerminal
                  ? "absolute inset-0 flex min-h-0 flex-col"
                  : "hidden"
              }
              inert={!showTerminal || undefined}
            >
              {terminalContent(active && showTerminal)}
              {!terminalAvailable ? (
                <button
                  type="button"
                  onClick={onShowTerminal}
                  className="m-auto rounded-lg bg-content/8 px-4 py-2 text-sm"
                >
                  Open terminal
                </button>
              ) : null}
            </div>
          </div>
          <div
            className={`workspace-file-rail min-h-0 shrink-0 border-l border-content/10 ${treeOpen && (showFiles || showReview) ? "flex flex-col" : "hidden"}`}
            inert={!(treeOpen && (showFiles || showReview)) || undefined}
          >
            <div
              className={showReview ? "flex min-h-0 flex-1 flex-col" : "hidden"}
              inert={!showReview || undefined}
            >
              <SourceControl
                toolbarTarget={reviewToolbar}
                key={cwd}
                cwd={cwd}
                enabled={active && showReview}
                textHarness={textHarness}
                selectedPath={selectedDiffPath}
                onOpenFile={onOpenDiff}
              />
            </div>
            <div
              className={showFiles ? "flex min-h-0 flex-1 flex-col" : "hidden"}
              inert={!showFiles || undefined}
            >
              {filesSearchOpen ? (
                <ProjectSearch
                  cwd={cwd}
                  focusToken={searchFocusToken}
                  onOpenFile={onOpenFile}
                  onClose={() => onFilesSearchOpenChange(false)}
                />
              ) : (
                <WorkspaceFiles
                  key={cwd}
                  cwd={cwd}
                  active={active && !!showFiles && treeOpen}
                  deckLayout
                  onOpenFile={onOpenFile}
                  onOpenTerminal={onOpenTerminal}
                  onFileMoved={onFileMoved}
                  onFileDeleted={onFileDeleted}
                  onSearch={onFindInProject}
                  gitStatuses={gitStatuses}
                />
              )}
            </div>
          </div>
        </div>
      </div>
      {active && menu ? (
        <ExplorerMenu
          x={menu.x}
          y={menu.y}
          ariaLabel="Add workspace tab"
          items={TOOLS.map(({ id, label }) => ({
            kind: "item",
            id,
            label,
            disabled: !project,
          }))}
          onPick={openTool}
          onClose={() => {
            setMenu(null);
            plusRef.current?.focus();
          }}
        />
      ) : null}
      <div
        role="separator"
        aria-label="Resize workspace panel"
        aria-orientation="vertical"
        aria-valuenow={resize.width}
        aria-valuemin={WORKSPACE_PANEL_WIDTH_MIN}
        aria-valuemax={WORKSPACE_PANEL_WIDTH_MAX}
        tabIndex={0}
        className={`absolute inset-y-0 -left-px z-10 w-1.5 cursor-col-resize touch-none focus-visible:bg-accent/40 ${resize.dragging ? "bg-content/15" : "hover:bg-content/10"}`}
        onPointerDown={resize.onPointerDown}
        onDoubleClick={resize.onDoubleClick}
        onKeyDown={resize.onKeyDown}
      />
    </aside>
  );
}
