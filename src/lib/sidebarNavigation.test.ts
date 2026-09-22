import { describe, expect, it } from "vitest";
import {
  newFileTab,
  newTab,
  newTerminalFile,
  newTerminalWorkspaceTab,
} from "./layout";
import { newSession } from "./session";
import { shouldPersistSession } from "./sessionStore";
import { sidebarOpenItems } from "./sidebarNavigation";

describe("headerless sidebar navigation", () => {
  it("keeps the last tab in each project protected when several groups are visible", () => {
    const one = newSession("codex", "/one");
    const two = newSession("codex", "/two");
    const tabs = [newTab(one.id), newTab(two.id)];
    expect(sidebarOpenItems(tabs, [one, two], [], "/one")[0]).toMatchObject({
      cwd: "/one",
      canCloseTab: false,
    });
    const another = newSession("codex", "/one");
    tabs.push(newTab(another.id));
    expect(
      sidebarOpenItems(tabs, [one, two, another], [], "/one").every(
        (item) => item.canCloseTab,
      ),
    ).toBe(true);
    expect(
      sidebarOpenItems(tabs, [one, two, another], [], "/two")[0].canCloseTab,
    ).toBe(false);
  });
  it("keeps every unsent session selectable without persisting it", () => {
    const first = newSession("codex", "/project");
    const second = newSession("codex", "/project");
    const tabs = [newTab(first.id), newTab(second.id)];
    const items = sidebarOpenItems(tabs, [first, second], [], "/project");
    expect(items.map((item) => item.sessionId)).toEqual([first.id, second.id]);
    expect(items.map((item) => item.title)).toEqual([
      "New session",
      "New session",
    ]);
    expect(shouldPersistSession(first)).toBe(false);
    expect(shouldPersistSession(second)).toBe(false);
  });
  it("does not duplicate real conversation rows or expose another project's drafts", () => {
    const saved = newSession("codex", "/project");
    saved.blocks = [{ id: "user", role: "user", text: "hello" }];
    const other = newSession("codex", "/other");
    expect(
      sidebarOpenItems(
        [newTab(saved.id), newTab(other.id)],
        [saved, other],
        [],
        "/project",
      ),
    ).toEqual([]);
  });
  it("retains navigation for restored file-only and terminal-only workspace tabs", () => {
    const file = newFileTab("/project/readme.md", "/project");
    const files = newTab("editor");
    files.editorPanes = [
      { id: "editor", files: [file], activeFileId: file.id },
    ];
    const terminal = newTerminalWorkspaceTab(
      newTerminalFile("/project", "Shell"),
    );
    const items = sidebarOpenItems([files, terminal], [], [], "/project");
    expect(items.map(({ title, kind }) => ({ title, kind }))).toEqual([
      { title: "readme.md", kind: "files" },
      { title: "Shell", kind: "terminal" },
    ]);
  });
});
