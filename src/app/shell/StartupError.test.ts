// @vitest-environment happy-dom
import { createElement, act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";
import {
  StartupBoundary,
  StartupError,
  startupErrorDetail,
} from "./StartupError";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
const roots: ReturnType<typeof createRoot>[] = [];
function mount(node: ReturnType<typeof createElement>) {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  roots.push(root);
  act(() => root.render(node));
  return host;
}

afterEach(() => {
  act(() => roots.splice(0).forEach((root) => root.unmount()));
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

it("turns a rejected boot or render into a recoverable screen", () => {
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  function BrokenApp() {
    throw new Error("Failed to load a workspace module");
  }
  const host = mount(
    createElement(StartupBoundary, { children: createElement(BrokenApp) }),
  );
  expect(host.textContent).toContain("Avenrail couldn't start");
  expect(host.textContent).toContain("Failed to load a workspace module");
  expect(host.querySelector("button")?.textContent).toBe("Reload app");
});

it("reloads on request and allows errors to be copied", async () => {
  const retry = vi.fn();
  const writeText = vi
    .spyOn(navigator.clipboard, "writeText")
    .mockResolvedValue();
  const host = mount(
    createElement(StartupError, {
      error: new Error("Database unavailable"),
      onRetry: retry,
    }),
  );
  const buttons = host.querySelectorAll("button");
  act(() => buttons[0].click());
  expect(retry).toHaveBeenCalledOnce();
  await act(async () => buttons[1].click());
  expect(writeText).toHaveBeenCalledWith("Database unavailable");
  expect(buttons[1].textContent).toBe("Copied");
});

it("also catches a thrown value without an error object", () => {
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  function BrokenApp() {
    throw null;
  }
  const host = mount(
    createElement(StartupBoundary, { children: createElement(BrokenApp) }),
  );
  expect(host.textContent).toContain("An unknown error interrupted startup.");
});

it("keeps details selectable when clipboard access fails", async () => {
  vi.spyOn(navigator.clipboard, "writeText").mockRejectedValue(
    new Error("Denied"),
  );
  const host = mount(
    createElement(StartupError, { error: "Cannot open the workspace" }),
  );
  await act(async () => host.querySelectorAll("button")[1].click());
  expect(host.querySelector('[role="status"]')?.textContent).toContain(
    "Select the text",
  );
  expect(host.querySelector("pre")?.textContent).toBe(
    "Cannot open the workspace",
  );
});

it("preserves structured IPC errors without showing an empty message", () => {
  expect(startupErrorDetail({ message: "Session read failed" })).toBe(
    "Session read failed",
  );
  expect(startupErrorDetail(null)).toBe(
    "An unknown error interrupted startup.",
  );
});
