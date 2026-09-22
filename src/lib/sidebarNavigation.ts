import { leafIds, type WorkspaceTab } from "./layout";
import { sameProjectPath } from "./recents";
import {
  HARNESS_LABEL,
  sessionDisplayTitle,
  type HarnessId,
  type Session,
} from "./session";
import { shouldPersistSession, type SessionSummary } from "./sessionStore";
import { planWorkspaceTabClose, workspaceTabCwd } from "./workspaceTabGroups";

export type SidebarOpenItem = {
  id: string;
  tabId: string;
  cwd?: string;
  sessionId?: string;
  title: string;
  harness?: HarnessId;
  kind: "draft" | "files" | "terminal";
  canCloseTab?: boolean;
};

/** Navigation only: unsent sessions remain ephemeral and never enter saved history. */
export function sidebarOpenItems(
  tabs: WorkspaceTab[],
  sessions: Session[],
  history: SessionSummary[],
  cwd: string,
): SidebarOpenItem[] {
  const saved = new Set(history.map((row) => row.id));
  return tabs.flatMap<SidebarOpenItem>((tab) => {
    const project = workspaceTabCwd(tab, sessions);
    if (!project || !sameProjectPath(project, cwd)) return [];
    const canCloseTab =
      planWorkspaceTabClose({
        tabs,
        sessions,
        closingTabId: tab.id,
        scope: "project",
      }).action !== "keep";
    const ids = new Set(leafIds(tab.layout));
    const chats = sessions.filter((session) => ids.has(session.id));
    if (chats.length)
      return chats
        .filter(
          (session) => !saved.has(session.id) && !shouldPersistSession(session),
        )
        .map((session) => ({
          id: `draft:${session.id}`,
          tabId: tab.id,
          cwd: project,
          sessionId: session.id,
          title:
            session.title === HARNESS_LABEL[session.harness]
              ? "New session"
              : sessionDisplayTitle(session.title, session.harness),
          harness: session.harness,
          kind: "draft" as const,
          canCloseTab: chats.length === 1 && canCloseTab,
        }));
    const pane =
      [...tab.editorPanes, ...(tab.terminalPanes ?? [])].find(
        (entry) => entry.id === tab.focusedId,
      ) ??
      tab.editorPanes[0] ??
      tab.terminalPanes?.[0];
    const file =
      pane?.files.find((entry) => entry.id === pane.activeFileId) ??
      pane?.files[0];
    return file
      ? [
          {
            id: `tab:${tab.id}`,
            tabId: tab.id,
            cwd: project,
            canCloseTab,
            title: file.plan?.title ?? file.path.split("/").pop() ?? "Files",
            kind: file.terminal ? ("terminal" as const) : ("files" as const),
          },
        ]
      : [];
  });
}
