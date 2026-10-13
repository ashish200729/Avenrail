import type { Session } from "../../sessions/model/session";
import { isBlankSession } from "../../projects/model/projectReturn";
import { sameProjectPath } from "../../projects/model/recents";
import { leafIds, type WorkspaceTab } from "./layout";

/**
 * A conversation nobody has started: no turns, and nothing attached that a
 * fresh session would not have (cards, seeds, links, queued follow-ups).
 * Showing it again instead of creating a twin loses nothing, because the
 * composer draft and model choice stay with the session.
 */
export function isPristineBlankSession(session: Session | undefined): boolean {
  if (!session || !isBlankSession(session)) return false;
  return (
    session.blocks.length === 0 &&
    !session.inboxAsk &&
    !session.orchestrationLeadId &&
    !session.inboxCard &&
    !session.noteCard &&
    !session.handoffCard &&
    !session.linkedWorkItem &&
    !session.linkedWorkItemUpdateCard &&
    !session.composerSeed &&
    !session.automationId &&
    !session.pendingQuestion &&
    !session.pendingSwitch &&
    !session.usageLimit &&
    !session.worktreePreparing &&
    !session.worktreeRemoved &&
    (session.queuedMessages?.length ?? 0) === 0
  );
}

export type ReusableBlankSession = { tabId: string; sessionId: string };

/**
 * The open empty conversation that "New session" should surface in `cwd`
 * instead of creating another one. The focused pane wins, then the rest of the
 * active tab, then other tabs from the most recently opened backwards.
 * `isExcluded` filters sessions that look blank locally but are not, such as
 * a remote conversation that has not synced yet.
 */
export function findReusableBlankSession({
  tabs,
  sessions,
  activeTabId,
  cwd,
  isExcluded = () => false,
}: {
  tabs: readonly WorkspaceTab[];
  sessions: readonly Session[];
  activeTabId: string;
  cwd: string;
  isExcluded?: (sessionId: string) => boolean;
}): ReusableBlankSession | null {
  const byId = new Map(sessions.map((session) => [session.id, session]));
  const reusable = (id: string) => {
    const session = byId.get(id);
    return (
      !!session &&
      sameProjectPath(session.cwd, cwd) &&
      isPristineBlankSession(session) &&
      !isExcluded(id)
    );
  };

  const active = tabs.find((tab) => tab.id === activeTabId);
  if (active) {
    const panes = leafIds(active.layout);
    const sessionId = [
      active.focusedId,
      ...panes.filter((id) => id !== active.focusedId),
    ].find((id) => panes.includes(id) && reusable(id));
    if (sessionId) return { tabId: active.id, sessionId };
  }

  for (const tab of [...tabs].reverse()) {
    if (tab.id === activeTabId) continue;
    const sessionId = leafIds(tab.layout).find(reusable);
    if (sessionId) return { tabId: tab.id, sessionId };
  }
  return null;
}
