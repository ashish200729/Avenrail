// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import { chatPreservingMaxWidth } from "./chatResizeBounds";

afterEach(() => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

function layout(paneWidth: number, chatWidth: number) {
  const shell = document.createElement("div");
  shell.dataset.workspaceShell = "";
  const pane = document.createElement("aside");
  const chat = document.createElement("div");
  chat.dataset.workspaceChat = "";
  shell.append(pane, chat);
  document.body.append(shell);
  vi.spyOn(pane, "getBoundingClientRect").mockReturnValue({
    width: paneWidth,
  } as DOMRect);
  vi.spyOn(chat, "getBoundingClientRect").mockReturnValue({
    width: chatWidth,
  } as DOMRect);
  return { pane, chat };
}

describe("shared chat resize budget", () => {
  it("stops either sidebar when chat reaches 600px", () => {
    const { pane } = layout(260, 600);
    expect(chatPreservingMaxWidth(pane, 360)).toBe(260);
    vi.mocked(pane.getBoundingClientRect).mockReturnValue({
      width: 900,
    } as DOMRect);
    expect(chatPreservingMaxWidth(pane, 1400)).toBe(900);
  });

  it("releases space to the other sidebar when chat grows", () => {
    const { pane, chat } = layout(260, 640);
    expect(chatPreservingMaxWidth(pane, 360)).toBe(300);
    vi.mocked(chat.getBoundingClientRect).mockReturnValue({
      width: 800,
    } as DOMRect);
    expect(chatPreservingMaxWidth(pane, 360)).toBe(360);
  });

  it("keeps overlay, hidden and standalone panes independently resizable", () => {
    const { pane, chat } = layout(440, 560);
    pane.style.position = "absolute";
    expect(chatPreservingMaxWidth(pane, 800)).toBe(800);
    pane.style.position = "relative";
    vi.mocked(chat.getBoundingClientRect).mockReturnValue({
      width: 0,
    } as DOMRect);
    expect(chatPreservingMaxWidth(pane, 800)).toBe(800);
    expect(chatPreservingMaxWidth(null, 800)).toBe(800);
    expect(chatPreservingMaxWidth(document.createElement("aside"), 800)).toBe(
      800,
    );
  });
});
