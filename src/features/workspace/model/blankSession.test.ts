import { describe, expect, it } from "vitest";
import { newSession, type Session } from "../../sessions/model/session";
import {
  findReusableBlankSession,
  isPristineBlankSession,
} from "./blankSession";
import { newTab } from "./layout";

function blank(id: string, cwd = "/alpha"): Session {
  return { ...newSession("claude", cwd), id };
}

function started(id: string, cwd = "/alpha"): Session {
  return {
    ...blank(id, cwd),
    blocks: [{ id: `${id}-user`, role: "user", text: "hello" }],
  };
}

function workspace(sessions: Session[]) {
  return {
    sessions,
    tabs: sessions.map((session) => ({
      ...newTab(session.id),
      id: `tab-${session.id}`,
    })),
  };
}

describe("isPristineBlankSession", () => {
  it("accepts an untouched session", () => {
    expect(isPristineBlankSession(blank("a"))).toBe(true);
  });

  it("rejects started, busy and missing sessions", () => {
    expect(isPristineBlankSession(started("a"))).toBe(false);
    expect(isPristineBlankSession({ ...blank("a"), busy: true })).toBe(false);
    expect(isPristineBlankSession(undefined)).toBe(false);
  });

  it.each([
    ["an inbox ask", { inboxAsk: {} }],
    ["a worker", { orchestrationLeadId: "lead" }],
    ["an inbox card", { inboxCard: {} }],
    ["a note card", { noteCard: {} }],
    ["a linked work item", { linkedWorkItem: {} }],
    ["a composer seed", { composerSeed: "fix it" }],
    ["an automation", { automationId: "auto" }],
    ["a pending question", { pendingQuestion: {} }],
    ["queued follow-ups", { queuedMessages: [{}] }],
    ["a removed worktree", { worktreeRemoved: true }],
    [
      "a stray status block",
      { blocks: [{ id: "s", role: "status", text: "x" }] },
    ],
  ])("rejects a blank session carrying %s", (_, patch) => {
    expect(
      isPristineBlankSession({ ...blank("a"), ...patch } as unknown as Session),
    ).toBe(false);
  });
});

describe("findReusableBlankSession", () => {
  it("reuses the focused empty session instead of creating another", () => {
    const state = workspace([blank("a")]);
    expect(
      findReusableBlankSession({
        ...state,
        activeTabId: "tab-a",
        cwd: "/alpha",
      }),
    ).toEqual({ tabId: "tab-a", sessionId: "a" });
  });

  it("returns null when every open session was started", () => {
    const state = workspace([started("a"), started("b")]);
    expect(
      findReusableBlankSession({
        ...state,
        activeTabId: "tab-a",
        cwd: "/alpha",
      }),
    ).toBeNull();
  });

  it("finds an empty session in another tab, newest tab first", () => {
    const state = workspace([started("a"), blank("old"), blank("new")]);
    expect(
      findReusableBlankSession({
        ...state,
        activeTabId: "tab-a",
        cwd: "/alpha",
      }),
    ).toEqual({ tabId: "tab-new", sessionId: "new" });
  });

  it("prefers the active tab over other tabs", () => {
    const state = workspace([blank("other"), blank("here")]);
    expect(
      findReusableBlankSession({
        ...state,
        activeTabId: "tab-here",
        cwd: "/alpha",
      }),
    ).toEqual({ tabId: "tab-here", sessionId: "here" });
  });

  it("stays inside the requested project", () => {
    const state = workspace([blank("beta", "/beta"), started("a")]);
    expect(
      findReusableBlankSession({
        ...state,
        activeTabId: "tab-a",
        cwd: "/alpha",
      }),
    ).toBeNull();
    expect(
      findReusableBlankSession({
        ...state,
        activeTabId: "tab-a",
        cwd: "/beta",
      }),
    ).toEqual({ tabId: "tab-beta", sessionId: "beta" });
  });

  it("skips sessions the caller excludes", () => {
    const state = workspace([blank("remote")]);
    expect(
      findReusableBlankSession({
        ...state,
        activeTabId: "tab-remote",
        cwd: "/alpha",
        isExcluded: (id) => id === "remote",
      }),
    ).toBeNull();
  });

  it("ignores sessions that are not open in any tab", () => {
    const state = workspace([started("a")]);
    expect(
      findReusableBlankSession({
        tabs: state.tabs,
        sessions: [...state.sessions, blank("detached")],
        activeTabId: "tab-a",
        cwd: "/alpha",
      }),
    ).toBeNull();
  });
});
