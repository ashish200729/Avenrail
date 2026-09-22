import {
  Archive,
  ChevronRight,
  Folder,
  FolderOpen,
  ListTodo,
  MessageCirclePlus,
  MoreHorizontal,
  Pin,
  PinOff,
  NotebookTabs,
  Plus,
  SearchCode,
  Settings,
  Trash2,
} from "lucide-react";
import {
  Fragment,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";
import { useDragResize } from "../hooks/useDragResize";
import { useLockOverscroll } from "../hooks/useLockOverscroll";
import { useProjectDiffStats } from "../hooks/useProjectDiffStats";
import { useSortable } from "../hooks/useSortable";
import { useTabGroupLogos } from "../hooks/useTabGroupLogos";
import {
  loadProjectRailWidth,
  PROJECT_RAIL_WIDTH_DEFAULT,
  PROJECT_RAIL_WIDTH_MAX,
  PROJECT_RAIL_WIDTH_MIN,
  saveProjectRailWidth,
} from "../lib/appearance";
import { basename, revealPath, type GitDiffStats } from "../lib/fs";
import { IS_MAC, MOD } from "../lib/platform";
import { projectName } from "../lib/paths";
import {
  collectRailProjects,
  looksLikeProject,
  loadPinnedProjects,
  loadProjectRailOrder,
  projectRailSections,
  sameProjectPath,
  normalizeProjectPath,
  savePinnedProjects,
  saveProjectRailOrder,
  syncProjectRailOrder,
  type RecentProject,
} from "../lib/recents";
import {
  loadTabGroupColors,
  loadTabGroupCustomColors,
  loadTabGroupLabels,
  loadTabGroupMascots,
  resolveTabGroupColor,
  resolveTabGroupColorIndex,
  resolveTabGroupCustomColor,
  resolveTabGroupLabel,
  resolveTabGroupLogo,
  resolveTabGroupMascot,
  saveTabGroupColor,
  saveTabGroupCustomColor,
  saveTabGroupLabel,
  saveTabGroupMascot,
} from "../lib/tabGroups";
import { SessionFiltersMenu } from "./SessionFiltersMenu";
import {
  DEFAULT_SESSION_SIDEBAR_FILTERS,
  hasActiveSessionFilters,
  type SessionSidebarFilters,
} from "../lib/sessionFilters";
import type { HarnessId } from "../lib/session";
import {
  loadSidebarOrganization,
  saveSidebarOrganization,
  loadCollapsedSidebarProjects,
  saveCollapsedSidebarProjects,
} from "../lib/sidebarOrganization";
import { ProjectLogoIcon } from "./ProjectLogoIcon";
import { ProjectMascot } from "./ProjectMascot";
import { RailAction } from "./RailAction";
import { RemoveProjectDialog } from "./RemoveProjectDialog";
import { TabVisitNav } from "./TitleBar";
import { SidebarUpdate } from "./SidebarUpdate";
import { SettingsNav } from "./SettingsRail";
import { Shimmer } from "../surfaces/Shimmer";
import { TabGroupMenu, type TabGroupMenuExtraItem } from "./TabGroupMenu";
import type { SettingsSectionId } from "../lib/settings";

const REVEAL_LABEL = IS_MAC
  ? "Reveal in Finder"
  : typeof navigator !== "undefined" && /Win/.test(navigator.platform)
    ? "Reveal in File Explorer"
    : "Open Containing Folder";

function projectMenuExtraItems(
  pinned: boolean,
  canRemove: boolean,
): TabGroupMenuExtraItem[] {
  const items: TabGroupMenuExtraItem[] = [
    { id: "open", label: "Open project", icon: FolderOpen },
    pinned
      ? { id: "unpin", label: "Unpin project", icon: PinOff }
      : { id: "pin", label: "Pin project", icon: Pin },
    { id: "reveal", label: REVEAL_LABEL, icon: FolderOpen },
  ];
  if (canRemove) {
    items.push(
      { id: "archive", label: "Archive", icon: Archive, sepBefore: true },
      { id: "delete", label: "Delete", icon: Trash2, danger: true },
    );
  }
  return items;
}

type Props = {
  cwd: string;
  recents: RecentProject[];
  inboxUnseen?: boolean;
  busyPaths?: Iterable<string>;
  canGoBack?: boolean;
  canGoForward?: boolean;
  onGoBack?: () => void;
  onGoForward?: () => void;
  onSearch?: () => void;
  searchActive?: boolean;
  onOpenInbox?: () => void;
  inboxActive?: boolean;
  notesEnabled?: boolean;
  onOpenNotes?: () => void;
  notesActive?: boolean;
  onTogglePanel?: () => void;
  onSelectProject: (path: string) => void;
  onOpenProject: () => void;
  onRemoveProject?: (path: string, options: { purgeData: boolean }) => void;
  projectSessions?: (path: string) => ReactNode;
  sessionFilters?: SessionSidebarFilters;
  sessionHarnesses?: HarnessId[];
  onSessionFiltersChange?: (filters: SessionSidebarFilters) => void;
  allSessions?: ReactNode;
  activeSessionId?: string;
  onNewSession?: () => void;
  settingsOpen?: boolean;
  settingsSection?: SettingsSectionId;
  onOpenSettings?: () => void;
  onSelectSettingsSection?: (section: SettingsSectionId) => void;
  onCloseSettings?: () => void;
};

export function ProjectRail({
  cwd,
  recents,
  inboxUnseen = false,
  busyPaths,
  canGoBack = false,
  canGoForward = false,
  onGoBack,
  onGoForward,
  onSearch,
  searchActive = false,
  onOpenInbox,
  inboxActive = false,
  notesEnabled = true,
  onOpenNotes,
  notesActive = false,
  onTogglePanel,
  onSelectProject,
  onOpenProject,
  onRemoveProject,
  projectSessions,
  sessionFilters = DEFAULT_SESSION_SIDEBAR_FILTERS,
  sessionHarnesses = [],
  onSessionFiltersChange,
  allSessions,
  activeSessionId,
  onNewSession,
  settingsOpen = false,
  settingsSection = "general",
  onOpenSettings,
  onSelectSettingsSection,
  onCloseSettings,
}: Props) {
  const resize = useDragResize({
    min: PROJECT_RAIL_WIDTH_MIN,
    max: () =>
      Math.min(PROJECT_RAIL_WIDTH_MAX, Math.floor(window.innerWidth * 0.35)),
    defaultWidth: PROJECT_RAIL_WIDTH_DEFAULT,
    initial: loadProjectRailWidth(),
    onCommit: saveProjectRailWidth,
  });
  const [organization, setOrganization] = useState(loadSidebarOrganization);
  const [collapsedProjects, setCollapsedProjects] = useState(
    loadCollapsedSidebarProjects,
  );
  const [organizeMenu, setOrganizeMenu] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const organizeButton = useRef<HTMLButtonElement>(null);
  const previousContext = useRef({ cwd, activeSessionId });
  const [railOrder, setRailOrder] = useState(loadProjectRailOrder);
  const [pinnedPaths, setPinnedPaths] = useState(loadPinnedProjects);
  const [groupLabels, setGroupLabels] = useState(loadTabGroupLabels);
  const [groupColors, setGroupColors] = useState(loadTabGroupColors);
  const [groupMascots, setGroupMascots] = useState(loadTabGroupMascots);
  const [groupCustomColors, setGroupCustomColors] = useState(
    loadTabGroupCustomColors,
  );
  const [projectMenu, setProjectMenu] = useState<{
    x: number;
    y: number;
    path: string;
    projectKey: string;
  } | null>(null);
  const [removing, setRemoving] = useState<{
    path: string;
    name: string;
  } | null>(null);
  const lockOverscroll = useLockOverscroll<HTMLDivElement>();
  const scrollRef = useRef<HTMLDivElement>(null);
  const groupLogos = useTabGroupLogos();
  const allProjects = useMemo(
    () => collectRailProjects(recents, cwd),
    [cwd, recents],
  );
  const sections = useMemo(
    () => projectRailSections(recents, cwd, railOrder, pinnedPaths),
    [cwd, pinnedPaths, railOrder, recents],
  );
  const busy = useMemo(() => {
    const set = new Set<string>();
    for (const path of busyPaths ?? []) set.add(path);
    return set;
  }, [busyPaths]);

  useEffect(() => {
    setProjectMenu(null);
    setOrganizeMenu(null);
  }, [cwd, settingsOpen, searchActive, inboxActive, notesActive]);

  useEffect(() => {
    setRailOrder((prev) => {
      const synced = syncProjectRailOrder(prev, allProjects);
      if (synced.join("\0") === prev.join("\0")) return prev;
      saveProjectRailOrder(synced);
      return synced;
    });
  }, [allProjects]);

  useEffect(() => {
    setPinnedPaths((prev) => {
      const next = prev.filter((path) => allProjects.has(path));
      if (next.length === prev.length) return prev;
      savePinnedProjects(next);
      return next;
    });
  }, [allProjects]);

  useEffect(() => {
    if (!projectMenu && !organizeMenu) return;
    const onScroll = () => {
      setProjectMenu(null);
      setOrganizeMenu(null);
    };
    const scrollParent = scrollRef.current ?? window;
    scrollParent.addEventListener("scroll", onScroll, true);
    return () => scrollParent.removeEventListener("scroll", onScroll, true);
  }, [projectMenu, organizeMenu]);

  const openProjectMenu = (path: string, x: number, y: number) => {
    setProjectMenu({
      x,
      y,
      path,
      projectKey: projectName(path),
    });
  };

  const onProjectContextMenu = (
    path: string,
    event: MouseEvent<HTMLElement>,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    openProjectMenu(path, event.clientX, event.clientY);
  };

  const onProjectRename = (projectKey: string, label: string) => {
    saveTabGroupLabel(projectKey, label);
    setGroupLabels(loadTabGroupLabels());
  };

  const onProjectColorChange = (
    projectKey: string,
    colorIndex: number | null,
  ) => {
    saveTabGroupColor(projectKey, colorIndex);
    setGroupColors(loadTabGroupColors());
    setGroupCustomColors(loadTabGroupCustomColors());
  };

  const onProjectMascotChange = (projectKey: string, name: string | null) => {
    saveTabGroupMascot(projectKey, name);
    setGroupMascots(loadTabGroupMascots());
  };

  const onProjectCustomColorChange = (projectKey: string, color: string) => {
    saveTabGroupCustomColor(projectKey, color);
    setGroupColors(loadTabGroupColors());
    setGroupCustomColors(loadTabGroupCustomColors());
  };

  const reorderSubset = (
    fullOrder: string[],
    subsetOrder: string[],
    subsetPaths: Set<string>,
  ) => {
    const next: string[] = [];
    let subsetIndex = 0;
    for (const path of fullOrder) {
      if (!subsetPaths.has(path)) {
        next.push(path);
        continue;
      }
      if (subsetIndex < subsetOrder.length) {
        next.push(subsetOrder[subsetIndex++]);
      }
    }
    return next;
  };

  const onReorderPinned = (ids: string[]) => {
    const subset = new Set(sections.pinned.map((item) => item.path));
    const next = reorderSubset(railOrder, ids, subset);
    setRailOrder(next);
    saveProjectRailOrder(next);
  };

  const onReorderProjects = (ids: string[]) => {
    const subset = new Set(sections.projects.map((item) => item.path));
    const next = reorderSubset(railOrder, ids, subset);
    setRailOrder(next);
    saveProjectRailOrder(next);
  };

  const onTogglePin = (path: string) => {
    const isPinned = pinnedPaths.some((pinned) =>
      sameProjectPath(pinned, path),
    );
    const next = isPinned
      ? pinnedPaths.filter((pinned) => !sameProjectPath(pinned, path))
      : [...pinnedPaths, path];
    setPinnedPaths(next);
    savePinnedProjects(next);
  };

  const onProjectMenuPick = (action: string) => {
    if (!projectMenu) return;
    const { path, projectKey } = projectMenu;
    if (action === "open") selectProject(path);
    else if (action === "pin" || action === "unpin") onTogglePin(path);
    else if (action === "reveal") void revealPath(path);
    else if (action === "archive") {
      onRemoveProject?.(path, { purgeData: false });
    } else if (action === "delete") {
      setRemoving({
        path,
        name: resolveTabGroupLabel(projectKey, groupLabels, basename(path)),
      });
    }
  };

  const onConfirmDelete = () => {
    if (!removing) return;
    onRemoveProject?.(removing.path, { purgeData: true });
    setRemoving(null);
  };

  const updateCollapsed = (next: Set<string>) => {
    setCollapsedProjects(next);
    saveCollapsedSidebarProjects(next);
  };
  const toggleProject = (path: string) => {
    const next = new Set(collapsedProjects);
    if (next.has(path)) next.delete(path);
    else next.add(path);
    updateCollapsed(next);
  };
  const selectProject = (path: string) => {
    if (collapsedProjects.has(path)) {
      const next = new Set(collapsedProjects);
      next.delete(path);
      updateCollapsed(next);
    }
    onSelectProject(path);
  };
  useEffect(() => {
    const previous = previousContext.current;
    previousContext.current = { cwd, activeSessionId };
    if (previous.cwd === cwd && previous.activeSessionId === activeSessionId)
      return;
    setCollapsedProjects((current) => {
      const path = normalizeProjectPath(cwd);
      if (!current.has(path)) return current;
      const next = new Set(current);
      next.delete(path);
      saveCollapsedSidebarProjects(next);
      return next;
    });
  }, [cwd, activeSessionId]);
  const pickOrganization = (id: string) => {
    if (id === "project" || id === "list") {
      setOrganization(id);
      saveSidebarOrganization(id);
    } else if (id === "expand-all") updateCollapsed(new Set());
    else if (id === "collapse-all")
      updateCollapsed(new Set(allProjects.keys()));
    setOrganizeMenu(null);
    requestAnimationFrame(() => organizeButton.current?.focus());
  };
  const organizationActions = (
    <div className="flex items-center gap-0.5">
      <button
        ref={organizeButton}
        type="button"
        aria-label={
          hasActiveSessionFilters(sessionFilters)
            ? "Sidebar options, filters active"
            : "Sidebar options"
        }
        title="Sidebar options"
        aria-haspopup="menu"
        aria-expanded={!!organizeMenu}
        onClick={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          setOrganizeMenu(
            organizeMenu ? null : { x: rect.right - 228, y: rect.bottom + 4 },
          );
        }}
        className="relative grid size-6 place-items-center rounded-md text-content/55 hover:bg-content/8 hover:text-content focus-visible:outline-2 focus-visible:outline-accent"
      >
        <MoreHorizontal className="size-3.5" strokeWidth={1.75} />
        {hasActiveSessionFilters(sessionFilters) ? (
          <span
            aria-hidden="true"
            className="absolute right-0.5 top-0.5 size-1 rounded-full bg-accent"
          />
        ) : null}
      </button>
    </div>
  );

  const pinnedIds = sections.pinned.map((item) => item.path);
  const projectIds = sections.projects.map((item) => item.path);
  const pinnedSortable = useSortable(pinnedIds, onReorderPinned, {
    axis: "y",
    onActivate: selectProject,
  });
  const projectSortable = useSortable(projectIds, onReorderProjects, {
    axis: "y",
    onActivate: selectProject,
  });
  return (
    <nav
      ref={resize.setPaneRef}
      aria-label="Projects and sessions"
      className="sidebar-glass project-sidebar relative flex min-h-0 shrink-0 flex-col border-r border-content/10"
    >
      <div
        className="flex h-10 shrink-0 items-center pr-1.5"
        data-tauri-drag-region
      >
        {IS_MAC ? (
          <div className="w-[78px] shrink-0" data-tauri-drag-region />
        ) : null}
        <div className="min-w-0 flex-1" data-tauri-drag-region />
        <TabVisitNav
          canGoBack={canGoBack}
          canGoForward={canGoForward}
          onGoBack={onGoBack}
          onGoForward={onGoForward}
          onTogglePanel={settingsOpen ? undefined : onTogglePanel}
          panelActive
        />
      </div>

      {settingsOpen ? (
        <SettingsNav
          section={settingsSection}
          onSelect={(next) => onSelectSettingsSection?.(next)}
          onClose={() => onCloseSettings?.()}
        />
      ) : (
        <>
          <div className="flex shrink-0 flex-col gap-1 px-2 pb-3">
            <div className="flex min-w-0 items-center gap-1">
            {onNewSession ? (
              <div className="min-w-0 flex-1">
              <RailAction
                label="New session"
                icon={MessageCirclePlus}
                onClick={onNewSession}
                shortcut={`${MOD}T`}
                isNavButton
                prominent
              />
              </div>
            ) : null}
            <RailAction
              label="Search"
              icon={SearchCode}
              onClick={onSearch}
              active={searchActive}
              shortcut={`${MOD}K`}
              ariaLabel={`Search (${MOD}K)`}
              isNavButton
              iconOnly={!!onNewSession}
            />
            </div>
            <div className={`grid min-w-0 gap-1 ${notesEnabled ? "grid-cols-2" : "grid-cols-1"}`}>
            {notesEnabled ? (
              <RailAction
                label="Notes"
                icon={NotebookTabs}
                onClick={onOpenNotes}
                active={notesActive}
                ariaLabel="Notes"
                isNavButton
              />
            ) : null}
            <RailAction
              label="Inbox"
              icon={ListTodo}
              onClick={onOpenInbox}
              active={inboxActive}
              dot={inboxUnseen}
              ariaLabel={inboxUnseen ? "Inbox, new items" : "Inbox"}
              isNavButton
            />
            </div>
          </div>

          <div
            ref={(el) => {
              lockOverscroll(el);
              scrollRef.current = el;
            }}
            className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-none pb-2"
          >
            {organization === "project" ? (
              <>
                {sections.pinned.length > 0 ? (
                  <ProjectSection
                    label="Pinned"
                    items={sections.pinned}
                    cwd={cwd}
                    busy={busy}
                    sortable={pinnedSortable}
                    searchActive={searchActive || inboxActive || notesActive}
                    onContextMenu={onProjectContextMenu}
                    onOpenMenu={openProjectMenu}
                    groupLabels={groupLabels}
                    groupColors={groupColors}
                    groupCustomColors={groupCustomColors}
                    groupLogos={groupLogos}
                    groupMascots={groupMascots}
                    projectSessions={projectSessions}
                    collapsedProjects={collapsedProjects}
                    onToggleProject={toggleProject}
                  />
                ) : null}

                <ProjectSection
                  label="Projects"
                  items={sections.projects}
                  emptyLabel="No projects yet"
                  onAdd={onOpenProject}
                  actions={organizationActions}
                  cwd={cwd}
                  busy={busy}
                  sortable={projectSortable}
                  searchActive={searchActive || inboxActive || notesActive}
                  onContextMenu={onProjectContextMenu}
                  onOpenMenu={openProjectMenu}
                  groupLabels={groupLabels}
                  groupColors={groupColors}
                  groupCustomColors={groupCustomColors}
                  groupLogos={groupLogos}
                  groupMascots={groupMascots}
                  projectSessions={projectSessions}
                  collapsedProjects={collapsedProjects}
                  onToggleProject={toggleProject}
                />
                {!looksLikeProject(cwd) && projectSessions ? (
                  <div className="px-3">{projectSessions(cwd)}</div>
                ) : null}
              </>
            ) : (
              <section className="min-w-0 px-2">
                <div className="mb-1 flex items-center gap-1 px-2 pt-1">
                  <span className="min-w-0 flex-1 text-xs text-content/55">
                    Recents
                  </span>
                  {organizationActions}
                  <button
                    type="button"
                    aria-label="Open project"
                    title="Open project"
                    onClick={onOpenProject}
                    className="grid size-6 place-items-center rounded text-content/55 hover:bg-content/8 hover:text-content"
                  >
                    <Plus className="size-3.5" />
                  </button>
                </div>
                {allSessions}
              </section>
            )}
          </div>
          <div className="p-2 pb-1">
            <SidebarUpdate />
          </div>
          <div className="flex shrink-0 flex-col gap-px p-2 pt-0">
            <RailAction
              label="Settings"
              icon={Settings}
              onClick={onOpenSettings}
              shortcut={`${MOD},`}
              ariaLabel={`Settings (${MOD},)`}
              isNavButton
            />
          </div>
        </>
      )}
      {organizeMenu ? (
        <SessionFiltersMenu
          triggerRef={organizeButton}
          x={organizeMenu.x}
          y={organizeMenu.y}
          harnesses={sessionHarnesses}
          filters={sessionFilters}
          onChange={(next) => onSessionFiltersChange?.(next)}
          organization={{ value: organization, onPick: pickOrganization }}
          onClose={() => {
            setOrganizeMenu(null);
            organizeButton.current?.focus();
          }}
        />
      ) : null}
      {projectMenu ? (
        <TabGroupMenu
          x={projectMenu.x}
          y={projectMenu.y}
          groupId={projectMenu.projectKey}
          label={resolveTabGroupLabel(
            projectMenu.projectKey,
            groupLabels,
            basename(projectMenu.path),
          )}
          colorIndex={resolveTabGroupColorIndex(
            projectMenu.projectKey,
            groupColors,
            groupCustomColors,
          )}
          customColor={resolveTabGroupCustomColor(
            projectMenu.projectKey,
            groupCustomColors,
          )}
          currentColor={resolveTabGroupColor(
            projectMenu.projectKey,
            groupColors,
            groupCustomColors,
            projectMenu.projectKey,
          )}
          logoPath={resolveTabGroupLogo(projectMenu.projectKey, groupLogos)}
          logoProject={projectMenu.projectKey}
          mascotName={resolveTabGroupMascot(
            projectMenu.projectKey,
            groupMascots,
          )}
          mascotProject={projectMenu.projectKey}
          onRename={onProjectRename}
          onColorChange={onProjectColorChange}
          onCustomColorChange={onProjectCustomColorChange}
          onMascotChange={onProjectMascotChange}
          onLogoChange={() => {}}
          onPick={() => {}}
          onClose={() => setProjectMenu(null)}
          showActions={false}
          extraItems={projectMenuExtraItems(
            pinnedPaths.some((pinned) =>
              sameProjectPath(pinned, projectMenu.path),
            ),
            Boolean(onRemoveProject),
          )}
          onExtraPick={onProjectMenuPick}
        />
      ) : null}
      {removing ? (
        <RemoveProjectDialog
          name={removing.name}
          path={removing.path}
          onConfirm={onConfirmDelete}
          onCancel={() => setRemoving(null)}
        />
      ) : null}
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize project sidebar"
        aria-valuenow={resize.width}
        aria-valuemin={PROJECT_RAIL_WIDTH_MIN}
        aria-valuemax={PROJECT_RAIL_WIDTH_MAX}
        tabIndex={0}
        className={`absolute inset-y-0 -right-px z-10 w-1.5 cursor-col-resize touch-none ${
          resize.dragging ? "bg-content/15" : "hover:bg-content/10"
        }`}
        onPointerDown={resize.onPointerDown}
        onDoubleClick={resize.onDoubleClick}
        onKeyDown={resize.onKeyDown}
      />
    </nav>
  );
}

type SortableHandle = ReturnType<typeof useSortable>;

function ProjectSection({
  label,
  items,
  emptyLabel,
  onAdd,
  actions,
  cwd,
  busy,
  sortable,
  searchActive,
  onContextMenu,
  onOpenMenu,
  groupLabels,
  groupColors,
  groupCustomColors,
  groupLogos,
  groupMascots,
  projectSessions,
  collapsedProjects,
  onToggleProject,
}: {
  label: string;
  items: RecentProject[];
  emptyLabel?: string;
  onAdd?: () => void;
  actions?: ReactNode;
  cwd: string;
  busy: Set<string>;
  sortable: SortableHandle;
  searchActive: boolean;
  onContextMenu: (path: string, event: MouseEvent<HTMLElement>) => void;
  onOpenMenu: (path: string, x: number, y: number) => void;
  groupLabels: Record<string, string>;
  groupColors: Record<string, number>;
  groupCustomColors: Record<string, string>;
  groupLogos: ReturnType<typeof useTabGroupLogos>;
  groupMascots: Record<string, string>;
  projectSessions?: (path: string) => ReactNode;
  collapsedProjects: Set<string>;
  onToggleProject: (path: string) => void;
}) {
  return (
    <div className="mb-3 shrink-0">
      <div className="flex items-center gap-1 px-3 pb-1.5 pt-1">
        <span className="min-w-0 flex-1 truncate px-1 text-xs text-content/50">
          {label}
        </span>
        {actions}
        {onAdd ? (
          <button
            type="button"
            title="Open project"
            aria-label="Open project"
            onClick={onAdd}
            className="grid size-5 shrink-0 place-items-center rounded-md text-content/50 hover:bg-content/8 hover:text-content"
          >
            <Plus className="size-3.5" strokeWidth={1.75} />
          </button>
        ) : null}
      </div>
      {items.length === 0 && emptyLabel ? (
        <p className="px-4 pb-1 text-[11px] leading-tight text-content/40">
          {emptyLabel}
        </p>
      ) : null}
      <div className="flex flex-col gap-px px-2">
        {items.map((item, index) => (
          <Fragment key={item.path}>
            <ProjectCard
              item={item}
              expanded={!collapsedProjects.has(item.path)}
              onToggle={() => onToggleProject(item.path)}
              selected={!searchActive && sameProjectPath(item.path, cwd)}
              busy={isBusyPath(item.path, busy)}
              sortable={sortable}
              index={index}
              onContextMenu={onContextMenu}
              onOpenMenu={onOpenMenu}
              groupLabels={groupLabels}
              groupColors={groupColors}
              groupCustomColors={groupCustomColors}
              groupLogos={groupLogos}
              groupMascots={groupMascots}
            />
            {projectSessions ? (
              <div
                id={`sidebar-project-${encodeURIComponent(item.path)}`}
                hidden={collapsedProjects.has(item.path)}
                role="group"
                aria-label={`${resolveTabGroupLabel(projectName(item.path), groupLabels, basename(item.path))} sessions`}
                className={
                  collapsedProjects.has(item.path)
                    ? "hidden"
                    : "min-w-0 pb-2 pl-4"
                }
              >
                {!collapsedProjects.has(item.path)
                  ? projectSessions(item.path)
                  : null}
              </div>
            ) : null}
          </Fragment>
        ))}
      </div>
    </div>
  );
}

const nameClassName =
  "min-w-0 flex-1 truncate text-[13px] font-medium leading-tight";

function ProjectCard({
  item,
  expanded,
  onToggle,
  selected,
  busy,
  sortable,
  index,
  onContextMenu,
  onOpenMenu,
  groupLabels,
  groupColors,
  groupCustomColors,
  groupLogos,
  groupMascots,
}: {
  item: RecentProject;
  expanded: boolean;
  onToggle: () => void;
  selected: boolean;
  busy: boolean;
  sortable: SortableHandle;
  index: number;
  onContextMenu: (path: string, event: MouseEvent<HTMLElement>) => void;
  onOpenMenu: (path: string, x: number, y: number) => void;
  groupLabels: Record<string, string>;
  groupColors: Record<string, number>;
  groupCustomColors: Record<string, string>;
  groupLogos: ReturnType<typeof useTabGroupLogos>;
  groupMascots: Record<string, string>;
}) {
  const fallbackName = basename(item.path);
  const projectKey = projectName(item.path);
  const name = resolveTabGroupLabel(projectKey, groupLabels, fallbackName);
  const logoPath = resolveTabGroupLogo(projectKey, groupLogos);
  const color = resolveTabGroupColor(
    projectKey,
    groupColors,
    groupCustomColors,
    projectKey,
  );
  const dragging = sortable.draggingId === item.path;
  const showStart =
    sortable.draggingId &&
    sortable.toIndex === index &&
    sortable.fromIndex !== null &&
    sortable.toIndex < sortable.fromIndex;
  const showEnd =
    sortable.draggingId &&
    sortable.toIndex === index &&
    sortable.fromIndex !== null &&
    sortable.toIndex > sortable.fromIndex;
  const diffEnabled = Boolean(item.path) && item.path !== "~";
  const stats = useProjectDiffStats(item.path, diffEnabled);
  const cardTitle = projectCardTitle(item.path, name, stats, busy);
  const cardAriaLabel = projectCardAriaLabel(name, stats, busy);

  return (
    <div
      ref={(el) => sortable.setItemRef(item.path, el)}
      className={`group relative flex min-h-9 touch-none items-stretch rounded-lg px-2 py-1.5 ${
        selected
          ? "text-content"
          : "text-content/70 hover:bg-content/5 hover:text-content"
      } ${dragging ? "opacity-40" : ""} cursor-default`}
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        if ((event.target as HTMLElement | null)?.closest("[data-no-drag]")) {
          return;
        }
        sortable.onItemPointerDown(item.path, event);
      }}
      onClick={(event) => {
        if ((event.target as HTMLElement | null)?.closest("[data-no-drag]")) {
          return;
        }
        if (sortable.consumeClick()) return;
        onToggle();
      }}
      onContextMenu={(event) => onContextMenu(item.path, event)}
    >
      {showStart ? (
        <div className="pointer-events-none absolute inset-x-2 top-0 z-20 h-0.5 rounded-full bg-accent" />
      ) : null}
      {showEnd ? (
        <div className="pointer-events-none absolute inset-x-2 bottom-0 z-20 h-0.5 rounded-full bg-accent" />
      ) : null}
      <button
        type="button"
        title={`${expanded ? "Collapse" : "Expand"} project\n${cardTitle}`}
        aria-label={`${expanded ? "Collapse" : "Expand"} ${cardAriaLabel}`}
        aria-expanded={expanded}
        aria-controls={`sidebar-project-${encodeURIComponent(item.path)}`}
        aria-current={selected ? "true" : undefined}
        onKeyDown={(event) => {
          if (
            event.key === "Enter" ||
            event.key === " " ||
            (event.key === "ArrowLeft" && expanded) ||
            (event.key === "ArrowRight" && !expanded)
          ) {
            event.preventDefault();
            event.stopPropagation();
            onToggle();
          }
        }}
        className="group/heading flex min-w-0 flex-1 cursor-default items-center gap-2 rounded pr-7 text-left focus-visible:outline-2 focus-visible:outline-accent"
      >
        <span className="relative -ml-1 grid size-6 shrink-0 place-items-center text-content/65">
          <span className="grid place-items-center group-hover/heading:opacity-0 group-focus-visible/heading:opacity-0">
            {logoPath ? (
              <ProjectLogoIcon
                path={logoPath}
                className="size-4 rounded-sm"
                imageClassName="size-4"
              />
            ) : groupMascots[projectKey] ? (
              <ProjectMascot
                project={projectKey}
                color={color}
                name={resolveTabGroupMascot(projectKey, groupMascots)}
                className="size-3"
                active={busy}
              />
            ) : expanded ? (
              <FolderOpen className="size-4" strokeWidth={1.75} />
            ) : (
              <Folder className="size-4" strokeWidth={1.75} />
            )}
          </span>
          <ChevronRight
            className={`absolute size-3.5 opacity-0 group-hover/heading:opacity-100 group-focus-visible/heading:opacity-100 ${expanded ? "rotate-90" : ""}`}
            strokeWidth={1.75}
          />
        </span>
        {busy ? (
          <Shimmer as="span" duration={1.4} className={nameClassName}>
            {name}
          </Shimmer>
        ) : (
          <span className={nameClassName}>{name}</span>
        )}
      </button>
      <button
        type="button"
        data-no-drag
        title="Project options"
        aria-label="Project options"
        aria-haspopup="menu"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.stopPropagation();
          const rect = event.currentTarget.getBoundingClientRect();
          onOpenMenu(item.path, rect.right - 228, rect.bottom + 4);
        }}
        className="absolute right-1 top-1/2 hidden size-6 -translate-y-1/2 place-items-center rounded-md text-content/55 hover:bg-content/8 hover:text-content group-hover:grid group-focus-within:grid"
      >
        <MoreHorizontal className="size-4" strokeWidth={1.75} />
      </button>
    </div>
  );
}

function isBusyPath(path: string, busy: Set<string>): boolean {
  for (const other of busy) {
    if (sameProjectPath(path, other)) return true;
  }
  return false;
}

function projectCardTitle(
  path: string,
  name: string,
  stats: GitDiffStats | null,
  busy: boolean,
): string {
  const parts = [name, path];
  if (busy) parts.push("Working");
  const files = stats?.files ?? 0;
  const additions = stats?.additions ?? 0;
  const deletions = stats?.deletions ?? 0;
  if (files > 0 || additions > 0 || deletions > 0) {
    parts.push(
      [
        files > 0 ? `${files} ${files === 1 ? "file" : "files"} changed` : "",
        additions > 0 ? `+${additions}` : "",
        deletions > 0 ? `-${deletions}` : "",
      ]
        .filter(Boolean)
        .join(" "),
    );
  }
  return parts.join("\n");
}

function projectCardAriaLabel(
  name: string,
  stats: GitDiffStats | null,
  busy: boolean,
): string {
  const parts = [name];
  if (busy) parts.push("working");
  const files = stats?.files ?? 0;
  const additions = stats?.additions ?? 0;
  const deletions = stats?.deletions ?? 0;
  if (files > 0) {
    parts.push(`${files} ${files === 1 ? "file" : "files"} changed`);
  }
  if (additions > 0) parts.push(`+${additions}`);
  if (deletions > 0) parts.push(`-${deletions}`);
  return parts.join(", ");
}
