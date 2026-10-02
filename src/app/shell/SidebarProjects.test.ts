// @vitest-environment happy-dom
import { act, createElement, type ComponentProps } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { writeFileSync } from "node:fs";
import { Sidebar } from "./Sidebar";
import { formatSessionTitle } from "../../features/sessions/model/session";

vi.mock("../../features/source-control/hooks/useProjectDiffStats", () => ({
  useProjectDiffStats: () => ({ files: 1, additions: 5, deletions: 2 }),
}));
vi.mock("../../features/source-control/hooks/useGitFileStatuses", () => ({
  useGitFileStatuses: () => ({ files: new Map(), dirs: new Map() }),
}));
vi.mock("./SidebarUpdate", () => ({ SidebarUpdateFooter: () => null }));
vi.mock("../../features/files/ui/FileTree", () => ({
  FileTree: () => createElement("div", { "data-duplicate-file-tree": true }),
}));

let host: HTMLDivElement;
let root: Root;
let props: ComponentProps<typeof Sidebar>;
const alpha = "/workspace/alpha";
const beta = "/workspace/beta";

const summary = (id: string, cwd: string) => ({
  id,
  cwd,
  harness: "codex" as const,
  model: "codex:gpt-5.4",
  runtimeMode: "supervised" as const,
  title: formatSessionTitle("codex", `${id} conversation`),
  createdAt: 1,
  updatedAt: 2,
});
const project = (path: string) =>
  host.querySelector<HTMLElement>(`[data-project-entry="${path}"]`)!;
const toggle = (path: string) =>
  project(path).querySelector<HTMLButtonElement>("button[aria-controls]")!;
const render = async () => {
  await act(async () => root.render(createElement(Sidebar, props)));
};
const click = async (button: HTMLElement) => {
  await act(async () => button.click());
};

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  localStorage.clear();
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  props = {
    cwd: alpha,
    open: true,
    projectRailOpen: true,
    compactProjectRail: false,
    recents: [
      { path: alpha, openedAt: 2 },
      { path: beta, openedAt: 1 },
    ],
    sessions: [summary("a", alpha)],
    allSessions: [summary("a", alpha), summary("b", beta)],
    loadedProjectPaths: new Set([alpha, beta]),
    failedProjectPaths: new Set(),
    busySessionIds: new Set(),
    approvalSessionIds: new Set(),
    activeSessionId: "a",
    status: "idle",
    pending: false,
    tab: "files",
    filesSearchOpen: false,
    onSelectProject: vi.fn(),
    onOpenProject: vi.fn(),
    onLoadProjectSessions: vi.fn(),
    onSelectSession: vi.fn(),
    onNew: vi.fn(),
    onNewProjectSession: vi.fn(),
    onPinSession: vi.fn(),
    onArchiveSession: vi.fn(),
    onRenameSession: vi.fn(),
    onOpenFile: vi.fn(),
    onTabChange: vi.fn(),
    onFilesSearchOpenChange: vi.fn(),
  };
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
  localStorage.clear();
  vi.unstubAllGlobals();
});

it("shows one project rail with nested sessions and no duplicate Workspace, Explorer, or Changes selectors", async () => {
  await render();
  expect(host.querySelectorAll('nav[aria-label="Projects"]')).toHaveLength(1);
  expect(
    project(alpha).querySelector('[data-session-card="a"]'),
  ).not.toBeNull();
  expect(project(beta).querySelector("[data-session-card]")).toBeNull();
  expect(
    host.querySelector('[role="tablist"][aria-label="Workspace"]'),
  ).toBeNull();
  expect(host.querySelector("[data-duplicate-file-tree]")).toBeNull();
  expect(host.textContent).not.toContain("Explorer");
  expect(host.textContent).not.toContain("+5");
  expect(host.querySelector('[aria-label="Resize sidebar"]')).toBeNull();
});

it("expands projects independently without navigating over the active conversation", async () => {
  await render();
  await click(toggle(beta));
  expect(
    project(alpha).querySelector('[data-session-card="a"]'),
  ).not.toBeNull();
  expect(project(beta).querySelector('[data-session-card="b"]')).not.toBeNull();
  expect(props.onSelectProject).not.toHaveBeenCalled();
  expect(props.onSelectSession).not.toHaveBeenCalled();
  if (process.env.AVENRAIL_SIDEBAR_CAPTURE) {
    writeFileSync(process.env.AVENRAIL_SIDEBAR_CAPTURE, host.innerHTML);
  }
  await click(
    project(beta).querySelector<HTMLElement>('[data-session-card="b"]')!,
  );
  expect(props.onSelectSession).toHaveBeenCalledWith("b");
  await click(toggle(beta));
  expect(toggle(beta).getAttribute("aria-expanded")).toBe("false");
  props = { ...props, cwd: beta, activeSessionId: "b" };
  await render();
  expect(toggle(beta).getAttribute("aria-expanded")).toBe("true");
});

it("loads a project on expansion without reloading histories on unrelated renders", async () => {
  await render();
  expect(props.onLoadProjectSessions).toHaveBeenCalledExactlyOnceWith(alpha);
  props = { ...props, busySessionIds: new Set(["a"]) };
  await render();
  expect(props.onLoadProjectSessions).toHaveBeenCalledTimes(1);
  await click(toggle(beta));
  expect(props.onLoadProjectSessions).toHaveBeenLastCalledWith(beta);
  expect(props.onLoadProjectSessions).toHaveBeenCalledTimes(2);
});

it("creates a session in the requested project and includes open unsaved sessions there", async () => {
  props = { ...props, openSessions: [summary("draft", beta)] };
  await render();
  await click(
    project(beta).querySelector<HTMLButtonElement>(
      'button[aria-label="New session in beta"]',
    )!,
  );
  expect(props.onNewProjectSession).toHaveBeenCalledWith(beta);
  expect(
    project(beta).querySelector('[data-session-card="draft"]'),
  ).not.toBeNull();
  expect(
    project(alpha).querySelector('[data-session-card="draft"]'),
  ).toBeNull();
});

it("keeps session actions bound to their owning project list", async () => {
  await render();
  await click(toggle(beta));
  await act(async () =>
    project(beta)
      .querySelector('[data-session-card="b"]')!
      .dispatchEvent(
        new MouseEvent("contextmenu", { bubbles: true, cancelable: true }),
      ),
  );
  const pin = Array.from(
    document.querySelectorAll<HTMLButtonElement>('[role="menuitem"]'),
  ).find((button) => button.textContent === "Pin")!;
  await click(pin);
  expect(props.onPinSession).toHaveBeenCalledWith("b", true);
  expect(
    project(alpha).querySelector('[data-session-card="a"]'),
  ).not.toBeNull();
});

it("scopes pending and error states to the corresponding project", async () => {
  props = {
    ...props,
    allSessions: [summary("a", alpha)],
    loadedProjectPaths: new Set([alpha]),
    failedProjectPaths: new Set([beta]),
  };
  await render();
  await click(toggle(beta));
  expect(project(beta).textContent).toContain("Couldn’t load sessions");
  expect(project(alpha).textContent).not.toContain("Couldn’t load sessions");
  expect(
    project(alpha).querySelector('[data-session-card="a"]'),
  ).not.toBeNull();
});
