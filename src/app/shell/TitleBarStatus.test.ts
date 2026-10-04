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
        onSelect: vi.fn(),
        onClose: vi.fn(),
        onCloseMany: vi.fn(),
        onReorder: vi.fn(),
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

describe("title tab response status", () => {
  it("shows a teal completion check until the response is seen", () => {
    render([tab("done", { doneHarnesses: ["codex"] }), tab("active")]);

    const doneTab = container.querySelector('[data-title-tab-id="done"]')!;
    expect(
      doneTab.querySelector('[data-harness-status="done"]'),
    ).not.toBeNull();
    expect(
      doneTab.querySelector("svg")?.classList.contains("text-teal-400"),
    ).toBe(true);
    expect(
      doneTab.querySelector("button")?.getAttribute("aria-label"),
    ).toContain("Response complete");

    render([tab("done"), tab("active")]);
    expect(
      container.querySelector(
        '[data-title-tab-id="done"] [data-harness-status="idle"]',
      ),
    ).not.toBeNull();
  });

  it("keeps the loading indicator ahead of completion for the same provider", () => {
    render([
      tab("working", {
        busyHarnesses: ["codex"],
        doneHarnesses: ["codex"],
      }),
      tab("active"),
    ]);

    expect(
      container.querySelector(
        '[data-title-tab-id="working"] [data-harness-status="busy"]',
      ),
    ).not.toBeNull();
  });
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
          onSelect: vi.fn(),
          onClose: vi.fn(),
          onCloseMany: vi.fn(),
          onReorder: vi.fn(),
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
        onSelect: vi.fn(),
        onClose: vi.fn(),
        onCloseMany: vi.fn(),
        onReorder: vi.fn(),
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
      container.querySelector("[data-title-tab-id]")!,
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
