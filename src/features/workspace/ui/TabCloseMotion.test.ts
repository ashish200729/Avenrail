// @vitest-environment happy-dom
import { act, createElement, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SurfaceTabs } from "./SurfaceTabs";

let container: HTMLDivElement;
let root: Root;

function mockLocalStorage() {
  const data = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => data.set(key, value),
    removeItem: (key: string) => data.delete(key),
    clear: () => data.clear(),
    key: (index: number) => [...data.keys()][index] ?? null,
    get length() {
      return data.size;
    },
  });
}

function flushPaint() {
  act(() => {
    vi.advanceTimersToNextFrame();
    vi.advanceTimersToNextFrame();
  });
}

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  mockLocalStorage();
  localStorage.setItem("avenrail.tabAnimationsEnabled", "1");
  vi.useFakeTimers();
  document.documentElement.style.setProperty(
    "--motion-tab-close-duration",
    "180ms",
  );
  document.documentElement.style.setProperty(
    "--motion-ease-out",
    "cubic-bezier(0.22, 1, 0.36, 1)",
  );
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue(
    new DOMRect(0, 0, 140, 32),
  );
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  document.documentElement.removeAttribute("style");
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function closeTab(id: string, ids: string[], pointer = false) {
  function Tabs() {
    const [current, setCurrent] = useState(ids);
    const close = (tabId: string) =>
      setCurrent((entries) => entries.filter((entry) => entry !== tabId));
    return createElement(SurfaceTabs, {
      files: current.map((tabId) => ({
        id: tabId,
        path: tabId,
        cwd: "/project",
      })),
      activeFileId: current.includes("first") ? "first" : current[0],
      dirtyFileIds: new Set<string>(),
      fileErrorCounts: new Map<string, number>(),
      onSelectFile: vi.fn(),
      onCloseFile: close,
      onCloseOtherFiles: vi.fn(),
      onReorder: vi.fn(),
    });
  }

  act(() => root.render(createElement(Tabs)));
  const closeButton = container.querySelector(`[aria-label="Close ${id}"]`)!;
  act(() => {
    if (pointer) {
      closeButton.dispatchEvent(
        new PointerEvent("pointerdown", {
          bubbles: true,
          cancelable: true,
          button: 0,
        }),
      );
    }
    closeButton.dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true }),
    );
  });
}

describe("file tab close motion", () => {
  it("collapses the closed tab's width before removing it", () => {
    closeTab("second", ["first", "second", "third"]);
    const ghost = container.querySelector<HTMLElement>("[data-closing-tab]");
    expect(ghost).toBeInstanceOf(HTMLElement);
    expect(ghost!.style.getPropertyValue("--tab-slot-width")).toBe("140px");
    expect(ghost!.hasAttribute("data-collapsed")).toBe(false);
    expect(
      container.querySelector('[aria-label="Close first"]'),
    ).not.toBeNull();
    expect(
      container.querySelector('[aria-label="Close third"]'),
    ).not.toBeNull();

    flushPaint();
    expect(ghost!.hasAttribute("data-collapsed")).toBe(true);

    act(() => vi.advanceTimersByTime(180));
    expect(container.querySelector("[data-closing-tab]")).toBeNull();
    expect(
      Array.from(
        container.querySelectorAll('button[aria-label^="Close "]'),
        (button) => button.getAttribute("aria-label"),
      ),
    ).toEqual(["Close first", "Close third"]);
  });

  it("collapses the last tab in place", () => {
    closeTab("third", ["first", "second", "third"]);
    const ghost = container.querySelector<HTMLElement>("[data-closing-tab]");
    expect(ghost).toBeInstanceOf(HTMLElement);
    expect(ghost!.style.getPropertyValue("--tab-slot-width")).toBe("140px");
    flushPaint();
    expect(ghost!.hasAttribute("data-collapsed")).toBe(true);
    act(() => vi.advanceTimersByTime(180));
    expect(
      Array.from(
        container.querySelectorAll('button[aria-label^="Close "]'),
        (button) => button.getAttribute("aria-label"),
      ),
    ).toEqual(["Close first", "Close second"]);
  });

  it("still collapses when the tab's last width was not measured", () => {
    vi.mocked(HTMLElement.prototype.getBoundingClientRect).mockReturnValue(
      new DOMRect(0, 0, 0, 0),
    );
    closeTab("second", ["first", "second", "third"]);
    const ghost = container.querySelector<HTMLElement>("[data-closing-tab]");
    expect(ghost).toBeInstanceOf(HTMLElement);
    expect(ghost!.style.getPropertyValue("--tab-slot-width")).toBe("14rem");
    flushPaint();
    expect(ghost!.hasAttribute("data-collapsed")).toBe(true);
  });

  it("skips the collapse when the user prefers reduced motion", () => {
    vi.spyOn(window, "matchMedia").mockImplementation((query) => ({
      matches: String(query).includes("prefers-reduced-motion"),
      media: String(query),
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    closeTab("second", ["first", "second", "third"]);
    expect(container.querySelector("[data-closing-tab]")).toBeNull();
    expect(container.querySelector('[aria-label="Close second"]')).toBeNull();
  });

  it("skips the collapse when tab animations are disabled", () => {
    localStorage.setItem("avenrail.tabAnimationsEnabled", "0");
    closeTab("second", ["first", "second", "third"]);
    expect(container.querySelector("[data-closing-tab]")).toBeNull();
    expect(container.querySelector('[aria-label="Close second"]')).toBeNull();
  });

  it("does not stage a second resize after an X-button close", () => {
    closeTab("second", ["first", "second", "third"], true);

    expect(container.querySelector("[data-tab-close-mode]")).toBeNull();
    const liveSlots = Array.from(
      container.querySelectorAll<HTMLElement>("[data-tab-slot-id]"),
    );
    expect(liveSlots.map((slot) => slot.dataset.tabSlotId)).toEqual([
      "first",
      "third",
    ]);
    expect(liveSlots.every((slot) => slot.style.width === "")).toBe(true);
    expect(liveSlots.every((slot) => slot.style.flexShrink === "")).toBe(true);
    flushPaint();
    expect(
      container
        .querySelector("[data-closing-tab]")
        ?.hasAttribute("data-collapsed"),
    ).toBe(true);
  });
});

function addThird() {
  let add = () => {};
  function Tabs() {
    const [ids, setIds] = useState(["first", "second"]);
    add = () => setIds(["first", "second", "third"]);
    return createElement(SurfaceTabs, {
      files: ids.map((id) => ({ id, path: id, cwd: "/project" })),
      activeFileId: ids[ids.length - 1],
      dirtyFileIds: new Set<string>(),
      fileErrorCounts: new Map<string, number>(),
      onSelectFile: vi.fn(),
      onCloseFile: vi.fn(),
      onCloseOtherFiles: vi.fn(),
      onReorder: vi.fn(),
    });
  }

  act(() => root.render(createElement(Tabs)));
  expect(container.querySelector("[data-opening-tab]")).toBeNull();
  act(() => add());
}

describe("file tab open motion", () => {
  it("expands a new tab from zero width", () => {
    addThird();
    const incoming = container.querySelector<HTMLElement>("[data-opening-tab]");
    expect(incoming).toBeInstanceOf(HTMLElement);
    expect(incoming!.hasAttribute("data-collapsed")).toBe(true);
    expect(
      container.querySelector('[aria-label="Close third"]'),
    ).not.toBeNull();

    flushPaint();
    expect(incoming!.hasAttribute("data-collapsed")).toBe(false);

    act(() => vi.advanceTimersByTime(180));
    expect(container.querySelector("[data-opening-tab]")).toBeNull();
    expect(
      Array.from(
        container.querySelectorAll('button[aria-label^="Close "]'),
        (button) => button.getAttribute("aria-label"),
      ),
    ).toEqual(["Close first", "Close second", "Close third"]);
  });

  it("skips the expand when the user prefers reduced motion", () => {
    vi.spyOn(window, "matchMedia").mockImplementation((query) => ({
      matches: String(query).includes("prefers-reduced-motion"),
      media: String(query),
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    addThird();
    expect(container.querySelector("[data-opening-tab]")).toBeNull();
    expect(
      container.querySelector('[aria-label="Close third"]'),
    ).not.toBeNull();
  });

  it("skips the expand when tab animations are disabled", () => {
    localStorage.setItem("avenrail.tabAnimationsEnabled", "0");
    addThird();
    expect(container.querySelector("[data-opening-tab]")).toBeNull();
    expect(
      container.querySelector('[aria-label="Close third"]'),
    ).not.toBeNull();
  });
});
