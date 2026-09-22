import { describe, expect, it } from "vitest";
import {
  terminalScrollbarWidth,
  trackTerminalScrollback,
} from "./terminalLayout";

describe("terminalScrollbarWidth", () => {
  it("reserves the same compact gutter used by the shell scrollbar", () => {
    expect(terminalScrollbarWidth(undefined)).toBe(6);
    expect(terminalScrollbarWidth({})).toBe(6);
  });

  it("honors an explicit overview ruler width", () => {
    expect(terminalScrollbarWidth({ width: 1 })).toBe(1);
    expect(terminalScrollbarWidth({ width: 0 })).toBe(0);
  });
});

function scrollbackFixture() {
  const classes = new Set<string>();
  const listeners = new Map<string, Set<() => void>>();
  const event = (name: string) => (listener: () => void) => {
    const handlers = listeners.get(name) ?? new Set();
    handlers.add(listener);
    listeners.set(name, handlers);
    return { dispose: () => handlers.delete(listener) };
  };
  const buffer = {
    active: { type: "normal", baseY: 0 },
    onBufferChange: event("buffer"),
  };
  const terminal = {
    buffer,
    onWriteParsed: event("output"),
    onResize: event("resize"),
    onScroll: event("scroll"),
  } as unknown as Parameters<typeof trackTerminalScrollback>[0];
  const outer = {
    classList: {
      toggle: (name: string, enabled: boolean) =>
        enabled ? classes.add(name) : classes.delete(name),
      remove: (name: string) => classes.delete(name),
    },
  } as unknown as Parameters<typeof trackTerminalScrollback>[1];
  const stop = trackTerminalScrollback(terminal, outer);
  return {
    buffer,
    stop,
    listeners,
    emit: (name: string) =>
      listeners.get(name)?.forEach((listener) => listener()),
    visible: () => classes.has("avenrail-terminal--scrollback"),
  };
}

describe("terminal scrollbar visibility", () => {
  it("stays hidden for a fresh terminal and output that still fits", () => {
    const view = scrollbackFixture();
    expect(view.visible()).toBe(false);
    view.emit("output");
    view.emit("resize");
    view.emit("scroll");
    expect(view.visible()).toBe(false);
    view.stop();
  });

  it("appears for real history and disappears when that history is cleared", () => {
    const view = scrollbackFixture();
    view.buffer.active.baseY = 12;
    view.emit("output");
    expect(view.visible()).toBe(true);
    // Returning to the latest line must not hide scrollback that remains readable.
    view.emit("scroll");
    expect(view.visible()).toBe(true);
    view.buffer.active.baseY = 0;
    view.emit("output");
    expect(view.visible()).toBe(false);
    view.stop();
  });

  it("updates when resizing adds or removes scrollback", () => {
    const view = scrollbackFixture();
    view.buffer.active.baseY = 3;
    view.emit("resize");
    expect(view.visible()).toBe(true);
    view.buffer.active.baseY = 0;
    view.emit("resize");
    expect(view.visible()).toBe(false);
    view.stop();
  });

  it("hides in full-screen apps and restores the normal buffer's history", () => {
    const view = scrollbackFixture();
    const normal = { type: "normal", baseY: 20 };
    view.buffer.active = normal;
    view.emit("output");
    expect(view.visible()).toBe(true);
    view.buffer.active = { type: "alternate", baseY: 0 };
    view.emit("buffer");
    expect(view.visible()).toBe(false);
    view.buffer.active = normal;
    view.emit("buffer");
    expect(view.visible()).toBe(true);
    view.stop();
  });

  it("removes subscriptions and ignores queued notifications after unmount", () => {
    const view = scrollbackFixture();
    const queued = [...view.listeners.get("output")!];
    view.stop();
    expect(
      [...view.listeners.values()].every((listeners) => listeners.size === 0),
    ).toBe(true);
    view.buffer.active.baseY = 10;
    queued.forEach((listener) => listener());
    expect(view.visible()).toBe(false);
  });
});
