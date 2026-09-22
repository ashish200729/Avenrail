import { describe, expect, it } from "vitest";
import { newFileTab, newTab, openEditorTab, splitPane } from "./layout";
import {
  closeWorkspaceView,
  openWorkspaceView,
  reconcileWorkspaceView,
  sessionOnlyLayout,
  setSessionSplitRatio,
} from "./workspaceTools";

describe("workspace tool tabs", () => {
  it("consumes the placeholder after native editor state discovers the file", () => {
    const discovered = reconcileWorkspaceView(
      { order: ["files"], activeId: "files" },
      ["file:a"],
    );
    expect(openWorkspaceView(discovered, "file:a")).toEqual({
      order: ["file:a"],
      activeId: "file:a",
    });
  });
  it("replaces the empty file browser once, then keeps independently opened files", () => {
    let view = openWorkspaceView({ order: [], activeId: null }, "changes");
    view = openWorkspaceView(view, "files");
    view = openWorkspaceView(view, "file:one");
    view = openWorkspaceView(view, "file:two");
    expect(view.order).toEqual(["changes", "file:one", "file:two"]);
    expect(openWorkspaceView(view, "file:one")).toEqual({
      order: view.order,
      activeId: "file:one",
    });
  });
  it("focuses the next tab when a file closes and returns to the launcher after the last tool closes", () => {
    const view = { order: ["changes", "file:a", "file:b"], activeId: "file:a" };
    expect(closeWorkspaceView(view, "file:a").activeId).toBe("file:b");
    expect(
      closeWorkspaceView(
        { order: ["changes"], activeId: "changes" },
        "changes",
      ),
    ).toEqual({ order: [], activeId: null });
  });
  it("does not remove a file tab while the existing close/unsaved confirmation keeps it open", () => {
    const view = { order: ["file:a", "file:b"], activeId: "file:a" };
    expect(reconcileWorkspaceView(view, ["file:a", "file:b"])).toBe(view);
    expect(reconcileWorkspaceView(view, ["file:b"])).toEqual({
      order: ["file:b"],
      activeId: "file:b",
    });
  });
});

describe("session layout projection", () => {
  it("resizes visible chats without changing an editor between them", () => {
    const tab = newTab("first");
    tab.editorPanes = [{ id: "editor", files: [], activeFileId: "" }];
    tab.layout = {
      type: "split",
      id: "split",
      dir: "right",
      children: [
        { type: "leaf", id: "first" },
        { type: "leaf", id: "editor" },
        { type: "leaf", id: "second" },
      ],
      sizes: [0.25, 0.5, 0.25],
    };
    const resized = setSessionSplitRatio(tab, "split", 0, 0.7);
    expect(resized.type === "split" && resized.sizes).toEqual([
      0.35, 0.5, 0.15000000000000002,
    ]);
    expect(tab.layout.sizes).toEqual([0.25, 0.5, 0.25]);
  });
  it("keeps the stored editor layout intact while presenting only the chat", () => {
    const original = openEditorTab(
      newTab("chat"),
      newFileTab("/project/a.ts", "/project"),
    );
    const snapshot = JSON.stringify(original);
    expect(sessionOnlyLayout(original)).toEqual({ type: "leaf", id: "chat" });
    expect(JSON.stringify(original)).toBe(snapshot);
    expect(original.editorPanes[0].files).toHaveLength(1);
  });
  it("preserves multiple sessions and their relative proportions", () => {
    const tab = newTab("first");
    tab.layout = splitPane(tab.layout, "first", "down", "second");
    const withEditor = openEditorTab(
      tab,
      newFileTab("/project/a.ts", "/project"),
    );
    const projected = sessionOnlyLayout(withEditor);
    expect(projected).toEqual(tab.layout);
  });
  it("does not invent a session in a file-only tab", () => {
    const tab = newTab("file-pane");
    tab.editorPanes = [{ id: "file-pane", files: [], activeFileId: "" }];
    expect(sessionOnlyLayout(tab)).toBeNull();
  });
});
