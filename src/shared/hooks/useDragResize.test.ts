// @vitest-environment happy-dom
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useDragResize } from "./useDragResize";

let host: HTMLDivElement;
let root: Root;
let limit: number;
let notifyResize: ResizeObserverCallback;
const commit = vi.fn();
const disconnect = vi.fn();
const bounds = (pane: HTMLElement) => pane.parentElement;

function Pane({ direction = "right" }: { direction?: "left" | "right" }) {
  const resize = useDragResize({
    min: 240,
    max: () => limit,
    initial: 300,
    defaultWidth: 300,
    direction,
    observeBounds: bounds,
    onCommit: commit,
  });
  return createElement(
    "aside",
    { ref: resize.setPaneRef },
    createElement("div", {
      role: "separator",
      tabIndex: 0,
      "aria-valuenow": resize.width,
      onKeyDown: resize.onKeyDown,
      onDoubleClick: resize.onDoubleClick,
      onPointerDown: resize.onPointerDown,
    }),
  );
}

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(callback: ResizeObserverCallback) {
        notifyResize = callback;
      }
      observe() {}
      disconnect = disconnect;
    },
  );
  limit = 360;
  commit.mockClear();
  disconnect.mockClear();
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
const key = (value: string) =>
  act(() =>
    host
      .querySelector('[role="separator"]')!
      .dispatchEvent(
        new KeyboardEvent("keydown", { key: value, bubbles: true }),
      ),
  );

it("clamps keyboard resize and reset against the current chat budget", () => {
  act(() => root.render(createElement(Pane)));
  key("End");
  expect(host.querySelector("aside")!.style.width).toBe("360px");
  limit = 260;
  key("ArrowRight");
  expect(commit).toHaveBeenLastCalledWith(260);
  act(() =>
    host
      .querySelector('[role="separator"]')!
      .dispatchEvent(new MouseEvent("dblclick", { bubbles: true })),
  );
  expect(commit).toHaveBeenLastCalledWith(260);
  limit = 100;
  key("End");
  expect(commit).toHaveBeenLastCalledWith(240);
});

it("reclamps restored and live widths on container/window resize without rewriting preferences", () => {
  limit = 260;
  act(() => root.render(createElement(Pane)));
  expect(host.querySelector("aside")!.style.width).toBe("260px");
  limit = 250;
  act(() => notifyResize([], {} as ResizeObserver));
  expect(host.querySelector("aside")!.style.width).toBe("250px");
  limit = 240;
  act(() => window.dispatchEvent(new Event("resize")));
  expect(host.querySelector("aside")!.style.width).toBe("240px");
  expect(commit).not.toHaveBeenCalled();
});

it("starts dragging from the visible pane width and stops at the shared limit", () => {
  act(() => root.render(createElement(Pane, { direction: "left" })));
  const pane = host.querySelector("aside")!;
  vi.spyOn(pane, "getBoundingClientRect").mockReturnValue({
    width: 260,
  } as DOMRect);
  const handle = host.querySelector<HTMLElement>('[role="separator"]')!;
  handle.setPointerCapture = vi.fn();
  handle.releasePointerCapture = vi.fn();
  act(() =>
    handle.dispatchEvent(
      new PointerEvent("pointerdown", {
        button: 0,
        pointerId: 1,
        clientX: 500,
        bubbles: true,
      }),
    ),
  );
  act(() =>
    window.dispatchEvent(
      new PointerEvent("pointermove", { pointerId: 1, clientX: 480 }),
    ),
  );
  expect(pane.style.width).toBe("280px");
  limit = 290;
  act(() =>
    window.dispatchEvent(
      new PointerEvent("pointermove", { pointerId: 1, clientX: 0 }),
    ),
  );
  expect(pane.style.width).toBe("290px");
  act(() =>
    window.dispatchEvent(new PointerEvent("pointerup", { pointerId: 1 })),
  );
  expect(commit).toHaveBeenLastCalledWith(290);
  expect(document.documentElement.classList.contains("is-resizing")).toBe(
    false,
  );
});
