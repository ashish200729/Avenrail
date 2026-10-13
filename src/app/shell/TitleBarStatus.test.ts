// @vitest-environment happy-dom
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { writeFileSync } from "node:fs";
import { TitleBar, type Tab } from "./TitleBar";

vi.mock("./WindowControls", () => ({ WindowControls: () => null }));

let container: HTMLDivElement;
let root: Root;

function tab(id: string, overrides: Partial<Tab> = {}): Tab {
  return {
    id,
    project: "project",
    title: id,
    more: [],
    sessionCount: 1,
    harnesses: ["codex"],
    busyHarnesses: [],
    doneHarnesses: [],
    files: [],
    ...overrides,
  };
}

function render(tabs: Tab[]) {
  act(() =>
    root.render(
      createElement(TitleBar, {
        tabs,
        activeId: "active",
        cwd: "/project",
        onToggleSidebar: vi.fn(),
        onNew: vi.fn(),
      }),
    ),
  );
}

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

it.each([true, false])(
  "offers a toggle for the unified project sidebar when the rail is %s",
  (projectRailOpen) => {
    const onToggleSidebar = vi.fn();
    const onToggleSessionSidebar = vi.fn();
    act(() =>
      root.render(
        createElement(TitleBar, {
          tabs: [tab("active")],
          activeId: "active",
          cwd: "/project",
          projectRailOpen,
          sessionSidebarOpen: false,
          onToggleSidebar,
          onToggleSessionSidebar,
          onNew: vi.fn(),
        }),
      ),
    );

    const toggle = container.querySelector<HTMLButtonElement>(
      'button[aria-label^="Toggle Sidebar"]',
    );
    expect(toggle).not.toBeNull();
    act(() => toggle?.click());
    expect(onToggleSessionSidebar).toHaveBeenCalledOnce();
    expect(onToggleSidebar).not.toHaveBeenCalled();
  },
);

it.each([
  { projectRailOpen: true, compactRail: false, cwd: "/project" },
  { projectRailOpen: false, compactRail: false, cwd: "/project" },
  { projectRailOpen: false, compactRail: true, cwd: "/project" },
  { projectRailOpen: false, compactRail: false, cwd: "~" },
])("keeps New session with conversation navigation: %j", (state) => {
  const onNew = vi.fn();
  act(() =>
    root.render(
      createElement(TitleBar, {
        ...state,
        sessionSidebarOpen: state.projectRailOpen,
        tabs: [tab("active")],
        activeId: "active",
        onToggleSidebar: vi.fn(),
        onToggleSessionSidebar: vi.fn(),
        onNew,
      }),
    ),
  );
  const actions = container.querySelectorAll<HTMLButtonElement>(
    'button[aria-label^="New session"]',
  );
  expect(actions).toHaveLength(state.projectRailOpen ? 0 : 1);
  if (!state.projectRailOpen) {
    expect(actions[0].closest("[data-new-session-action]")).not.toBeNull();
    const position = actions[0].compareDocumentPosition(
      container.querySelector("[data-title-bar-title]")!,
    );
    expect(position & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    act(() => actions[0].click());
    expect(onNew).toHaveBeenCalledOnce();
  }
  const directory = process.env.AVENRAIL_COMPOSER_CAPTURE_DIR;
  if (directory) {
    writeFileSync(
      `${directory}/title-${state.projectRailOpen ? "open" : state.compactRail ? "compact" : state.cwd === "~" ? "projectless" : "hidden"}.html`,
      container.innerHTML,
    );
  }
});

describe("title bar without a tab strip", () => {
  function renderBar(props: Partial<Parameters<typeof TitleBar>[0]> = {}) {
    act(() =>
      root.render(
        createElement(TitleBar, {
          tabs: [
            tab("first", { title: "Fix the sidebar" }),
            tab("second", { title: "Other chat" }),
          ],
          activeId: "first",
          cwd: "/project",
          onToggleSidebar: vi.fn(),
          onNew: vi.fn(),
          ...props,
        }),
      ),
    );
  }

  it("names only the active session and never renders session tabs", () => {
    renderBar();
    expect(container.querySelector("[data-title-tab-strip]")).toBeNull();
    expect(container.querySelector("[data-title-tab-id]")).toBeNull();
    const title = container.querySelector("[data-title-bar-title]")!;
    expect(title.textContent).toContain("Fix the sidebar");
    expect(container.textContent).not.toContain("Other chat");
  });

  it("keeps the panel toggle in the bar until the panel owns the top row", () => {
    const onToggleWorkspacePanel = vi.fn();
    renderBar({ onToggleWorkspacePanel, workspacePanelOpen: false });
    const toggle = container.querySelector<HTMLButtonElement>(
      "#workspace-panel-toggle",
    );
    expect(toggle?.getAttribute("aria-label")).toBe("Show workspace tools");
    act(() => toggle?.click());
    expect(onToggleWorkspacePanel).toHaveBeenCalledOnce();

    renderBar({
      onToggleWorkspacePanel,
      workspacePanelOpen: true,
      workspacePanelAtTop: true,
    });
    expect(container.querySelector("#workspace-panel-toggle")).toBeNull();
  });

  it("joins compact navigation with the session title", () => {
    const onGoBack = vi.fn();
    renderBar({
      projectRailOpen: false,
      compactRail: true,
      canGoBack: true,
      canGoForward: true,
      onGoBack,
      onGoForward: vi.fn(),
    });
    const nav = container.querySelector<HTMLElement>(
      "[data-compact-title-nav]",
    )!;
    expect(nav.closest("header")?.className).toContain("body-glass");
    expect(nav.className).toContain("pl-[70px]");
    expect(
      Array.from(nav.querySelectorAll("button"), (button) =>
        button.getAttribute("aria-label")?.replace(/ \(.+\)$/, ""),
      ),
    ).toEqual(["Back", "Forward"]);
    expect(container.textContent).not.toContain("Development");
    act(() => nav.querySelector<HTMLButtonElement>("button")!.click());
    expect(onGoBack).toHaveBeenCalledOnce();
  });
});
