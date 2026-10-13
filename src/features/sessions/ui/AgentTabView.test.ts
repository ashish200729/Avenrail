// @vitest-environment happy-dom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import { newSession } from "../model/session";
import { AgentTabView } from "./AgentTabView";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(async () => undefined),
}));

it("offers no note actions because Notes were retired", () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  localStorage.clear();
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  try {
    act(() =>
      root.render(
        createElement(AgentTabView, {
          title: "Worker",
          visible: true,
          session: {
            ...newSession("codex", "/project"),
            blocks: [{ id: "p", role: "user", text: "Keep me" }],
          },
        }),
      ),
    );
    expect(container.textContent).toContain("Keep me");
    expect(container.querySelector('[aria-label="Save as note"]')).toBeNull();
  } finally {
    act(() => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
  }
});
