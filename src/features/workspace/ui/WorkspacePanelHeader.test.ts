// @vitest-environment happy-dom
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WorkspacePanel } from "./WorkspacePanel";

vi.mock("../../../app/shell/WindowControls", () => ({
  WindowControls: () => createElement("div", { "data-window-controls": "" }),
}));
vi.mock("../../files/ui/FilePane", () => ({ FilePane: () => null }));
vi.mock("../../files/ui/WorkspaceFiles", () => ({
  WorkspaceFiles: () => null,
}));
vi.mock("../../projects/ui/ProjectSearch", () => ({
  ProjectSearch: () => null,
}));
vi.mock("../../source-control/ui/SourceControl", () => ({
  SourceControl: () => null,
}));
vi.mock("../../source-control/hooks/useProjectDiffStats", () => ({
  useProjectDiffStats: () => null,
}));
vi.mock("../../source-control/hooks/useGitFileStatuses", () => ({
  useGitFileStatuses: () => new Map(),
}));

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function renderPanel(props: Record<string, unknown> = {}) {
  const noop = vi.fn();
  act(() =>
    root.render(
      createElement(WorkspacePanel, {
        cwd: "/project",
        open: true,
        active: true,
        activeTabId: "tab",
        tabs: [],
        renderEditors: true,
        request: null,
        onSelectionChange: noop,
        editorProps: {
          dirtyFileIds: new Set<string>(),
          fileErrorCounts: new Map<string, number>(),
          sessions: [],
          onSelectFile: noop,
          onCloseFile: noop,
        },
        terminalContent: () => null,
        terminalAvailable: false,
        onOpenFile: noop,
        onOpenDiff: noop,
        onOpenAllChanges: noop,
        onOpenCommit: noop,
        onOpenTerminal: noop,
        onShowTerminal: noop,
        onFileMoved: noop,
        onFileDeleted: noop,
        onFindInProject: noop,
        filesSearchOpen: false,
        onFilesSearchOpenChange: noop,
        searchFocusToken: 0,
        ...props,
      } as never),
    ),
  );
}

describe("workspace panel header", () => {
  it("titles the empty panel and keeps the tool launcher in the header", () => {
    renderPanel();
    const header = container.querySelector("header.workspace-panel-header")!;
    expect(header.textContent).toContain("Workspace");
    expect(
      header.querySelector('[aria-label="Add workspace tab"]'),
    ).not.toBeNull();
    expect(header.querySelector("#workspace-panel-toggle")).toBeNull();
  });

  it("hosts the panel toggle when it owns the top row", () => {
    const onTogglePanel = vi.fn();
    renderPanel({ chromeAtTop: true, onTogglePanel });
    const toggle = container.querySelector<HTMLButtonElement>(
      "#workspace-panel-toggle",
    );
    expect(toggle?.closest("header")).not.toBeNull();
    expect(toggle?.getAttribute("aria-label")).toBe("Hide workspace tools");
    act(() => toggle?.click());
    expect(onTogglePanel).toHaveBeenCalledOnce();
  });

  it("does not duplicate the toggle below a full-width title bar", () => {
    renderPanel({ chromeAtTop: false, onTogglePanel: vi.fn() });
    expect(container.querySelector("#workspace-panel-toggle")).toBeNull();
  });
});
